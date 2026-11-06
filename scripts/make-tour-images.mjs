// Builds the shop-tour photos for /tour/ from the untouched originals.
//   node scripts/make-tour-images.mjs [--sheet <out.jpg>]     (--sheet also writes a contact sheet of the 960 files to look at)
//
// Reads data/tour.json ("photos"), and for each photo with publish: true: applies the EXIF orientation, an optional fine
// rotation (straightening), the crop box (source pixels, in the frame of the rotated image centred on the original), gentle
// tone (per-channel white balance, levels, gamma, brightness, saturation) and a light sharpen, then writes
// public/img/tour/<key>-<w>.{avif,webp,jpg} at 480 and 960 wide (never above the crop's own width: no upscaling).
// Natural edits only: nothing is added, removed, blurred or generated, and the originals in assets/photos/original/ are never touched.
// sharp drops all metadata unless asked to keep it; the check at the end (and scripts/check-site.mjs) fails if any EXIF, XMP or GPS is found.
// It also writes data/tour-sizes.json (the pixel sizes the page needs so nothing shifts while loading).
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { findMetadata } from "./lib/image-metadata.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC_DIR = path.join(root, "assets/photos/original");
// The originals are not in git (this repository is public). Copy them from Gumon's OneDrive,
// 10-Work/SST-Sri-Siam-Thai-Therapy/originals/, into assets/photos/original/ (gitignored) first.
if (!existsSync(path.join(SRC_DIR, "2026-11-06"))) {
  console.error("make-tour-images: originals not found in assets/photos/original/. Copy them from OneDrive 10-Work/SST-Sri-Siam-Thai-Therapy/originals/ first (see assets/photos/original/README.md).");
  process.exit(1);
}
const OUT_DIR = path.join(root, "public/img/tour");
const WIDTHS = [480, 960];
const MAX_JPG_960 = 250 * 1024;
const manifest = JSON.parse(readFileSync(path.join(root, "data/tour.json"), "utf8"));
const sheetAt = process.argv.includes("--sheet") ? process.argv[process.argv.indexOf("--sheet") + 1] : null;

const problems = [];
mkdirSync(OUT_DIR, { recursive: true });

/** True when the crop rectangle (in the centred frame) lies inside the source rectangle rotated by `deg`. */
function cropInsideRotated(w, h, crop, deg) {
  const [x, y, cw, ch] = crop;
  const a = (-deg * Math.PI) / 180;
  const cx = w / 2;
  const cy = h / 2;
  return [[x, y], [x + cw, y], [x, y + ch], [x + cw, y + ch]].every(([px, py]) => {
    const dx = px - cx;
    const dy = py - cy;
    const sx = dx * Math.cos(a) - dy * Math.sin(a) + cx;
    const sy = dx * Math.sin(a) + dy * Math.cos(a) + cy;
    return sx >= -0.5 && sx <= w + 0.5 && sy >= -0.5 && sy <= h + 0.5;
  });
}

const sizes = {};
const keep = new Set();
const made = [];

/** Orientation, fine rotation, crop and tone for one entry; returns the corrected picture at the crop's own size. */
async function prepare(p) {
  const file = path.join(SRC_DIR, p.source);
  if (!existsSync(file)) {
    problems.push(`${p.key}: source ${p.source} is missing`);
    return null;
  }
  const oriented = await sharp(file).rotate().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = oriented.info;
  const deg = p.rotate ?? 0;
  const [x, y, cw, ch] = p.crop ?? [0, 0, W, H];
  if (!cropInsideRotated(W, H, [x, y, cw, ch], deg)) {
    problems.push(`${p.key}: the crop ${JSON.stringify(p.crop)} reaches outside the source after rotating ${deg} degrees`);
    return null;
  }
  let img = sharp(oriented.data);
  let canvasW = W;
  let canvasH = H;
  if (deg) {
    const r = await sharp(oriented.data).rotate(deg, { background: "#ffffff" }).toBuffer({ resolveWithObject: true });
    canvasW = r.info.width;
    canvasH = r.info.height;
    img = sharp(r.data);
  }
  const left = Math.round(canvasW / 2 - W / 2 + x);
  const top = Math.round(canvasH / 2 - H / 2 + y);
  img = img.extract({ left, top, width: cw, height: ch });
  const t = p.tone ?? {};
  if (t.wb && t.wb.some((v) => v !== 1)) img = img.linear(t.wb, [0, 0, 0]);
  if (t.normalise) img = img.normalise({ lower: t.normalise[0], upper: t.normalise[1] });
  if (t.gamma && t.gamma !== 1) img = img.gamma(t.gamma);
  if (t.brightness !== undefined || t.saturation !== undefined) img = img.modulate({ brightness: t.brightness ?? 1, saturation: t.saturation ?? 1 });
  let base = await img.toBuffer();
  // `redact`: [x, y, w, h] boxes in the cropped picture's pixels, pixelated so the text cannot be read (a phone number
  // or name printed on something in the photo). The only change that hides anything; record why in `edits`.
  for (const [rx, ry, rw, rh] of p.redact ?? []) {
    const tiny = await sharp(base).extract({ left: rx, top: ry, width: rw, height: rh }).resize({ width: Math.max(1, Math.round(rw / 12)), height: Math.max(1, Math.round(rh / 12)), kernel: "cubic" }).toBuffer();
    const block = await sharp(tiny).resize({ width: rw, height: rh, kernel: "nearest" }).toBuffer();
    base = await sharp(base).composite([{ input: block, left: rx, top: ry }]).toBuffer();
  }
  return { base, cw, ch };
}

for (const p of manifest.photos) {
  if (!p.publish) {
    console.log(`skip ${p.key} (publish: false)`);
    continue;
  }
  const prepared = await prepare(p);
  if (!prepared) continue;
  const { base, cw, ch } = prepared;

  const widths = [...new Set(WIDTHS.map((w) => Math.min(w, cw)))];
  sizes[p.key] = {};
  for (const w of widths) {
    const h = Math.round((w * ch) / cw);
    sizes[p.key][w] = { w, h };
    const resized = () => sharp(base).resize({ width: w, height: h, fit: "fill", kernel: "lanczos3" }).sharpen({ sigma: 0.6 });
    const outs = {
      avif: () => resized().avif({ quality: 50, effort: 4 }).toBuffer(),
      webp: () => resized().webp({ quality: 78, effort: 5 }).toBuffer(),
      jpg: () => resized().jpeg({ quality: p.jpegQuality ?? 80, mozjpeg: true, progressive: true }).toBuffer(),
    };
    for (const [ext, make] of Object.entries(outs)) {
      const name = `${p.key}-${w}.${ext}`;
      const buf = await make();
      writeFileSync(path.join(OUT_DIR, name), buf);
      keep.add(name);
      if (w === widths[widths.length - 1] && ext === "jpg" && buf.length > MAX_JPG_960) problems.push(`${name} is ${Math.round(buf.length / 1024)} KB, over ${MAX_JPG_960 / 1024} KB (lower jpegQuality for ${p.key})`);
      made.push({ name, bytes: buf.length });
    }
  }
}

// Site photos: real room photos for the built-in picture slots of lib/images.ts, as the <key>-800.webp and <key>-1600.webp pair the
// site's Img component expects. The "1600" file is the largest the source allows (never enlarged), its real width is in lib/images.ts.
const siteDone = [];
for (const p of manifest.siteImages ?? []) {
  const prepared = await prepare(p);
  if (!prepared) continue;
  const { base, cw, ch } = prepared;
  const big = Math.min(1600, cw);
  for (const [label, w] of [["800", 800], ["1600", big]]) {
    const h = Math.round((w * ch) / cw);
    const buf = await sharp(base).resize({ width: w, height: h, fit: "fill", kernel: "lanczos3" }).sharpen({ sigma: 0.6 }).webp({ quality: 78, effort: 5 }).toBuffer();
    const file = path.join(root, "public/img", `${p.key}-${label}.webp`);
    writeFileSync(file, buf);
    siteDone.push(file);
    console.log(`${`${p.key}-${label}.webp`.padEnd(34)} ${String(Math.round(buf.length / 1024)).padStart(4)} KB  ${w}x${h}`);
  }
}

// Remove files of photos that are no longer published, so nothing stale ships.
for (const n of readdirSync(OUT_DIR)) if (!keep.has(n)) rmSync(path.join(OUT_DIR, n));

// Metadata check on everything that will ship.
for (const n of readdirSync(OUT_DIR)) {
  const found = findMetadata(readFileSync(path.join(OUT_DIR, n)));
  if (found.length) problems.push(`${n} carries metadata: ${found.join(", ")}`);
}

for (const f of siteDone) {
  const found = findMetadata(readFileSync(f));
  if (found.length) problems.push(`${path.basename(f)} carries metadata: ${found.join(", ")}`);
}

writeFileSync(path.join(root, "data/tour-sizes.json"), JSON.stringify(sizes, null, 2) + "\n");

if (sheetAt) {
  const { default: sharpMod } = await import("sharp");
  const tiles = [];
  for (const p of manifest.photos.filter((q) => q.publish)) {
    const f = path.join(OUT_DIR, `${p.key}-960.jpg`);
    const alt = path.join(OUT_DIR, `${p.key}-${Object.keys(sizes[p.key]).pop()}.jpg`);
    tiles.push({ key: p.key, buf: await sharpMod(existsSync(f) ? f : alt).resize({ height: 420, width: 420, fit: "inside" }).toBuffer() });
  }
  const cols = 4;
  const rows = Math.ceil(tiles.length / cols);
  await sharpMod({ create: { width: cols * 430, height: rows * 430, channels: 3, background: "#888" } })
    .composite(tiles.map((t, i) => ({ input: t.buf, left: (i % cols) * 430 + 5, top: Math.floor(i / cols) * 430 + 5 })))
    .jpeg({ quality: 85 })
    .toFile(sheetAt);
}

for (const m of made.filter((m) => m.name.includes("-960") || !made.some((o) => o.name.startsWith(m.name.split("-").slice(0, -1).join("-") + "-960")))) {
  console.log(`${m.name.padEnd(34)} ${String(Math.round(m.bytes / 1024)).padStart(4)} KB`);
}
if (problems.length) {
  console.error("make-tour-images: problems\n- " + problems.join("\n- "));
  process.exit(1);
}
console.log(`make-tour-images OK: ${Object.keys(sizes).length} photos, ${made.length} files, no metadata`);
