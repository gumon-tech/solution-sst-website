// Derives public/logo/logo-96h.webp (the small header mark, ~6 KB) from logo-512.png.
// Run: node scripts/make-header-logo.mjs
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const info = await sharp(path.join(root, "public/logo/logo-512.png"))
  .trim()
  .resize({ height: 96 })
  .webp({ quality: 86 })
  .toFile(path.join(root, "public/logo/logo-96h.webp"));
console.log(`wrote public/logo/logo-96h.webp ${info.width}x${info.height}`);
