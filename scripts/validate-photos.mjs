// Fails the build when data/photos.json is malformed or a photo the shop system added breaks the rules.
// Written by the shop system (branch shop-agent/photos-*: one M data/photos.json plus new public/img/sp-<slug>-800.webp and -1600.webp).
//   node scripts/validate-photos.mjs [photos.json] [image directory]     (both optional; the test uses them)
// sharp is a dev dependency already (scripts/make-og.mjs). Plain Node otherwise. No rule depends on today's date.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { ROOT, checkPublicText, isDate, isObject, isTimestamp, loadFacts, loadJsonOrExit, makeReporter } from "./lib/public-text.mjs";

const { fail, finish } = makeReporter("data/photos.json");
const data = loadJsonOrExit(process.argv[2] ?? path.join(ROOT, "data/photos.json"), "data/photos.json");
const imgDir = process.argv[3] ?? path.join(ROOT, "public/img");
const slotIds = JSON.parse(readFileSync(path.join(ROOT, "scripts/lib/photo-slots.json"), "utf8")).slots.map((s) => s.id);
const facts = loadFacts();

const KEYS = ["key", "alt", "w", "h", "w800", "h800", "added", "status"];
const KEY_RE = /^sp-[a-z0-9-]{3,40}$/;
const MAX_IMAGES = 60;
const LIMITS = { long1600: [1200, 1600], long800: [600, 800], bytes1600: 450 * 1024, bytes800: 150 * 1024, minRatio: 3 / 4, maxRatio: 16 / 7, aspectTolerance: 0.01 };
// Chunks that carry metadata (GPS in EXIF) or animation. ICCP (colour profile) is harmless and allowed.
const REJECT_CHUNKS = ["EXIF", "XMP ", "ANIM", "ANMF"];
const isInt = (n) => Number.isInteger(n) && n > 0;

/** Problems with one WebP file: magic, chunk layout, metadata chunks. Returns a list of messages. */
export function inspectWebp(buf) {
  const out = [];
  if (buf.length < 30 || buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WEBP") return ["not a WebP file (no RIFF/WEBP header)"];
  if (buf.readUInt32LE(4) + 8 !== buf.length) out.push("RIFF size does not match the file (truncated or padded)");
  let pos = 12;
  const found = [];
  while (pos + 8 <= buf.length) {
    const id = buf.toString("ascii", pos, pos + 4);
    const size = buf.readUInt32LE(pos + 4);
    found.push(id);
    pos += 8 + size + (size % 2);
  }
  if (!found.some((c) => ["VP8 ", "VP8L", "VP8X"].includes(c))) out.push("no image data chunk");
  for (const c of REJECT_CHUNKS) if (found.includes(c)) out.push(`contains a ${c.trim()} chunk (metadata or animation; strip it, GPS must not be published)`);
  return out;
}

async function readPhoto(file, label, maxBytes, longRange) {
  if (!existsSync(file)) {
    fail(`${label}: file is missing (${path.basename(file)})`);
    return null;
  }
  const buf = readFileSync(file);
  if (buf.length > maxBytes) fail(`${label}: ${path.basename(file)} is ${Math.round(buf.length / 1024)} KB, limit ${Math.round(maxBytes / 1024)} KB`);
  const bad = inspectWebp(buf);
  for (const m of bad) fail(`${label}: ${path.basename(file)} ${m}`);
  if (bad.length) return null;
  let meta;
  try {
    meta = await sharp(buf).metadata();
  } catch (e) {
    fail(`${label}: ${path.basename(file)} cannot be decoded (${e.message})`);
    return null;
  }
  if (meta.format !== "webp") fail(`${label}: ${path.basename(file)} is ${meta.format}, not webp`);
  if ((meta.pages ?? 1) > 1) fail(`${label}: ${path.basename(file)} is animated`);
  const long = Math.max(meta.width, meta.height);
  if (long < longRange[0] || long > longRange[1]) fail(`${label}: ${path.basename(file)} is ${meta.width}x${meta.height}, long side must be ${longRange[0]} to ${longRange[1]}`);
  return { w: meta.width, h: meta.height };
}

const known = new Map();
if (!isObject(data)) fail("file must be an object");
else {
  for (const k of Object.keys(data)) if (!["updated_at", "images", "slots"].includes(k)) fail(`file: unknown key "${k}"`);
  if (!isTimestamp(data.updated_at)) fail("file: updated_at must be like 2026-11-06T09:00:00Z");
  if (!Array.isArray(data.images)) fail("file: images must be an array");
  else {
    if (data.images.length > MAX_IMAGES) fail(`file: at most ${MAX_IMAGES} images (a person archives old ones)`);
    for (const [i, im] of data.images.entries()) {
      const at = `images[${i}]${im?.key ? ` (${im.key})` : ""}`;
      if (!isObject(im)) {
        fail(`${at}: must be an object`);
        continue;
      }
      for (const k of KEYS) if (!(k in im)) fail(`${at}: missing "${k}"`);
      for (const k of Object.keys(im)) if (!KEYS.includes(k)) fail(`${at}: unknown key "${k}"`);
      const keyOk = typeof im.key === "string" && KEY_RE.test(im.key);
      if (!keyOk) fail(`${at}: key must look like sp-front-room (sp- then 3 to 40 of a-z 0-9 -)`);
      else if (known.has(im.key)) fail(`${at}: key repeats`);
      if (typeof im.alt !== "string" || im.alt.length < 10 || im.alt.length > 160 || /[\r\n]/.test(im.alt)) fail(`${at}: alt must be one line of 10 to 160 characters`);
      else for (const m of checkPublicText(im.alt, facts, { money: "none", allowTherapist: true })) fail(`${at}: alt: ${m}`);
      for (const k of ["w", "h", "w800", "h800"]) if (!isInt(im[k])) fail(`${at}: ${k} must be a whole number of pixels`);
      if (!isDate(im.added)) fail(`${at}: added must be a date like 2026-11-06`);
      if (!["live", "retired"].includes(im.status)) fail(`${at}: status must be live or retired`);
      if (!keyOk) continue;
      known.set(im.key, im);

      // The files. Both always exist, for retired photos too (files stay).
      const f1600 = await readPhoto(path.join(imgDir, `${im.key}-1600.webp`), at, LIMITS.bytes1600, LIMITS.long1600);
      const f800 = await readPhoto(path.join(imgDir, `${im.key}-800.webp`), at, LIMITS.bytes800, LIMITS.long800);
      if (f1600 && (f1600.w !== im.w || f1600.h !== im.h)) fail(`${at}: w/h say ${im.w}x${im.h} but the 1600 file is ${f1600.w}x${f1600.h}`);
      if (f800 && (f800.w !== im.w800 || f800.h !== im.h800)) fail(`${at}: w800/h800 say ${im.w800}x${im.h800} but the 800 file is ${f800.w}x${f800.h}`);
      if (f1600) {
        const r = f1600.w / f1600.h;
        if (r < LIMITS.minRatio - 0.005 || r > LIMITS.maxRatio + 0.005) fail(`${at}: ratio ${r.toFixed(2)} is outside 3:4 portrait to 16:7 landscape`);
        if (f800 && Math.abs(f800.w / f800.h - r) / r > LIMITS.aspectTolerance) fail(`${at}: the 800 and 1600 files have different aspect ratios`);
      }
    }
  }
  if (!isObject(data.slots)) fail("file: slots must be an object");
  else {
    for (const id of slotIds) if (!(id in data.slots)) fail(`slots: missing "${id}" (null for the default photo)`);
    for (const [id, key] of Object.entries(data.slots)) {
      if (!slotIds.includes(id)) {
        fail(`slots: unknown slot "${id}" (scripts/lib/photo-slots.json)`);
        continue;
      }
      if (key === null) continue;
      const im = typeof key === "string" ? known.get(key) : undefined;
      if (!im) fail(`slots.${id}: "${key}" is not an image in this file (built-in photos cannot be named here)`);
      else if (im.status !== "live") fail(`slots.${id}: "${key}" is retired`);
    }
  }
}

// Every sp- file in the image folder belongs to an entry (no stray uploads).
if (existsSync(imgDir) && statSync(imgDir).isDirectory()) {
  for (const f of readdirSync(imgDir)) {
    const m = /^(sp-.+)-(800|1600)\.webp$/.exec(f);
    if (m && !known.has(m[1])) fail(`${f}: not listed in images (an uploaded photo needs its entry)`);
    else if (f.startsWith("sp-") && !m) fail(`${f}: sp- files must be named sp-<slug>-800.webp or -1600.webp`);
  }
}
finish(`photos.json OK: ${Array.isArray(data?.images) ? data.images.length : 0} images`);
