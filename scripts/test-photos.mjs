// Self-test for scripts/validate-photos.mjs: builds real WebP files in a temp folder. Run: node scripts/test-photos.mjs
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = path.dirname(fileURLToPath(import.meta.url));
const slotIds = JSON.parse(readFileSync(path.join(here, "lib/photo-slots.json"), "utf8")).slots.map((s) => s.id);

const solid = (w, h, quality = 70) => sharp({ create: { width: w, height: h, channels: 3, background: { r: 120, g: 60, b: 140 } } }).webp({ quality }).toBuffer();
const noisy = async (w, h) => {
  const raw = Buffer.alloc(w * h * 3);
  for (let i = 0; i < raw.length; i++) raw[i] = Math.floor(Math.random() * 256);
  return sharp(raw, { raw: { width: w, height: h, channels: 3 } }).webp({ quality: 100 }).toBuffer();
};
/** Re-wrap a simple lossy WebP as VP8X with one extra metadata chunk (EXIF or XMP ), the way a camera export leaves them. */
function withChunk(buf, id, flag, payload) {
  const vp8 = buf.subarray(12); // the VP8 chunk
  const w = buf.readUInt16LE(26) & 0x3fff;
  const h = buf.readUInt16LE(28) & 0x3fff;
  const vp8x = Buffer.alloc(18);
  vp8x.write("VP8X", 0, "ascii");
  vp8x.writeUInt32LE(10, 4);
  vp8x[8] = flag;
  vp8x.writeUIntLE(w - 1, 12, 3);
  vp8x.writeUIntLE(h - 1, 15, 3);
  const body = Buffer.from(payload);
  const chunk = Buffer.alloc(8 + body.length + (body.length % 2));
  chunk.write(id, 0, "ascii");
  chunk.writeUInt32LE(body.length, 4);
  body.copy(chunk, 8);
  const inner = Buffer.concat([Buffer.from("WEBP"), vp8x, vp8, chunk]);
  const head = Buffer.alloc(8);
  head.write("RIFF", 0, "ascii");
  head.writeUInt32LE(inner.length, 4);
  return Buffer.concat([head, inner]);
}

const entry = (o = {}) => ({ key: "sp-front-room", alt: "A treatment bed with white towels and a candle", w: 1200, h: 1600, w800: 600, h800: 800, added: "2026-11-06", status: "live", ...o });
const slots = (o = {}) => ({ ...Object.fromEntries(slotIds.map((id) => [id, null])), ...o });
const file = (images, s = slots()) => ({ updated_at: "2026-11-06T09:00:00Z", images, slots: s });

const cases = [];
const add = (name, ok, body, files = {}) => cases.push({ name, ok, body, files });
const pair = async (key, w1600, h1600, w800, h800) => ({ [`${key}-1600.webp`]: await solid(w1600, h1600), [`${key}-800.webp`]: await solid(w800, h800) });
const good = await pair("sp-front-room", 1200, 1600, 600, 800);

add("no photos", true, file([]));
add("good portrait pair", true, file([entry()]), good);
add("good pair used in a slot", true, file([entry()], slots({ "home.hero": "sp-front-room" })), good);
add("retired photo keeps its files", true, file([entry({ status: "retired" })]), good);
add("16:7 landscape is the widest allowed", true, file([entry({ w: 1600, h: 700, w800: 800, h800: 350 })]), await pair("sp-front-room", 1600, 700, 800, 350));
add("3:4 portrait is the tallest allowed", true, file([entry()]), good);
add("alt may say therapist", true, file([entry({ alt: "A therapist preparing the room before a booking" })]), good);

add("missing 800 file", false, file([entry()]), { "sp-front-room-1600.webp": good["sp-front-room-1600.webp"] });
add("missing 1600 file", false, file([entry()]), { "sp-front-room-800.webp": good["sp-front-room-800.webp"] });
add("stray sp- file without an entry", false, file([]), good);
add("1600 file long side too short", false, file([entry({ w: 750, h: 1000 })]), await pair("sp-front-room", 750, 1000, 600, 800));
add("800 file long side too short", false, file([entry({ w800: 375, h800: 500 })]), await pair("sp-front-room", 1200, 1600, 375, 500));
add("1600 file too long", false, file([entry({ w: 1500, h: 2000 })]), await pair("sp-front-room", 1500, 2000, 600, 800));
add("aspect ratios differ", false, file([entry({ w800: 700, h800: 800 })]), await pair("sp-front-room", 1200, 1600, 700, 800));
add("wider than 16:7", false, file([entry({ w: 1600, h: 600, w800: 800, h800: 300 })]), await pair("sp-front-room", 1600, 600, 800, 300));
add("taller than 3:4", false, file([entry({ w: 1000, h: 1600, w800: 500, h800: 800 })]), await pair("sp-front-room", 1000, 1600, 500, 800));
add("1600 file over 450 KB", false, file([entry()]), { "sp-front-room-1600.webp": await noisy(1200, 1600), "sp-front-room-800.webp": good["sp-front-room-800.webp"] });
add("800 file over 150 KB", false, file([entry()]), { "sp-front-room-1600.webp": good["sp-front-room-1600.webp"], "sp-front-room-800.webp": await noisy(600, 800) });
add("a PNG named .webp", false, file([entry()]), { "sp-front-room-1600.webp": await sharp({ create: { width: 1200, height: 1600, channels: 3, background: "#fff" } }).png().toBuffer(), "sp-front-room-800.webp": good["sp-front-room-800.webp"] });
add("EXIF chunk (GPS)", false, file([entry()]), { "sp-front-room-1600.webp": withChunk(good["sp-front-room-1600.webp"], "EXIF", 0x08, "Exif\0\0GPS"), "sp-front-room-800.webp": good["sp-front-room-800.webp"] });
add("EXIF chunk in the 800 file", false, file([entry()]), { "sp-front-room-1600.webp": good["sp-front-room-1600.webp"], "sp-front-room-800.webp": withChunk(good["sp-front-room-800.webp"], "EXIF", 0x08, "Exif\0\0GPS") });
add("XMP chunk", false, file([entry()]), { "sp-front-room-1600.webp": withChunk(good["sp-front-room-1600.webp"], "XMP ", 0x04, "<x:xmpmeta/>"), "sp-front-room-800.webp": good["sp-front-room-800.webp"] });
add("truncated file", false, file([entry()]), { "sp-front-room-1600.webp": good["sp-front-room-1600.webp"].subarray(0, 200), "sp-front-room-800.webp": good["sp-front-room-800.webp"] });
add("w/h do not match the file", false, file([entry({ w: 1100 })]), good);

add("slot points at a retired photo", false, file([entry({ status: "retired" })], slots({ "home.hero": "sp-front-room" })), good);
add("slot points at an unknown key", false, file([], slots({ "home.hero": "sp-nothing" })));
add("slot points at a built-in photo", false, file([], slots({ "home.hero": "room-pink-curtains" })));
add("slot points at the removed room-wood-purple", false, file([], slots({ "home.hero": "room-wood-purple" })));
add("slot missing", false, file([], (() => { const s = slots(); delete s["home.hero"]; return s; })()));
add("unknown slot", false, file([], slots({ "home.nowhere": null })));
add("alt too short", false, file([entry({ alt: "A room" })]), good);
add("alt too long", false, file([entry({ alt: "x".repeat(161) })]), good);
add("alt with emoji", false, file([entry({ alt: "A treatment bed \u{1F389} with white towels" })]), good);
add("alt with a link", false, file([entry({ alt: "A treatment bed, see www.example.com for more" })]), good);
add("alt with health wording", false, file([entry({ alt: "A bed that relieves back pain after work" })]), good);
add("alt with review wording", false, file([entry({ alt: "Our five star treatment room in Greenwich" })]), good);
add("key without sp- prefix", false, file([entry({ key: "front-room" })]), good);
add("key too short", false, file([entry({ key: "sp-ab" })]), good);
add("key with capitals", false, file([entry({ key: "sp-Front-Room" })]), good);
add("key over 40 characters", false, file([entry({ key: "sp-" + "a".repeat(41) })]), good);
add("duplicate key", false, file([entry(), entry()]), good);
add("bad status", false, file([entry({ status: "draft" })]), good);
add("unknown image key", false, file([entry({ extra: 1 })]), good);
add("unknown file key", false, { ...file([]), note: "x" });

let failed = 0;
for (const c of cases) {
  const dir = mkdtempSync(path.join(os.tmpdir(), "photos-"));
  for (const [name, buf] of Object.entries(c.files)) writeFileSync(path.join(dir, name), buf);
  writeFileSync(path.join(dir, "photos.json"), JSON.stringify(c.body));
  const r = spawnSync("node", [path.join(here, "validate-photos.mjs"), path.join(dir, "photos.json"), dir], { encoding: "utf8" });
  if ((r.status === 0) !== c.ok) {
    failed++;
    console.error(`FAIL ${c.name}: expected ${c.ok ? "pass" : "fail"}, got ${r.status === 0 ? "pass" : "fail"}\n${r.stderr}`);
  } else console.log(`ok   ${c.name}`);
}
if (failed) process.exit(1);
console.log(`${cases.length} cases passed`);
