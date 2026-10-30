// Generates public/img/og-1200x630.jpg: purple-stones-candles cropped to 1200x630,
// a plum gradient at the left, and the logo and wordmark in cream.
// Run: node scripts/make-og.mjs   (sharp is a dev dependency)
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const W = 1200;
const H = 630;

const base = await sharp(path.join(root, "public/img/purple-stones-candles-1600.webp"))
  .resize(W, H, { fit: "cover", position: "centre" })
  .toBuffer();

const logoSize = 150;
const logo = await sharp(path.join(root, "public/logo/logo-512.png"))
  .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();

const circle = Buffer.from(
  `<svg width="190" height="190" xmlns="http://www.w3.org/2000/svg"><circle cx="95" cy="95" r="95" fill="#FDFCF0"/></svg>`,
);

const overlay = Buffer.from(`
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#2D1B36" stop-opacity="0.95"/>
      <stop offset="0.5" stop-color="#2D1B36" stop-opacity="0.82"/>
      <stop offset="1" stop-color="#2D1B36" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <text x="80" y="372" font-family="Cormorant Garamond, Georgia, 'Times New Roman', serif" font-size="104" font-weight="600" fill="#FDFCF0">Sri Siam</text>
  <text x="84" y="428" font-family="Helvetica Neue, Arial, sans-serif" font-size="25" font-weight="500" letter-spacing="5" fill="#E8D4A2">THAI THERAPY &amp; WELLNESS</text>
  <line x1="84" y1="462" x2="212" y2="462" stroke="#C5A059" stroke-width="2"/>
  <text x="84" y="510" font-family="Helvetica Neue, Arial, sans-serif" font-size="28" fill="#FDFCF0">Traditional Thai massage in Greenwich, London SE8</text>
</svg>`);

await sharp(base)
  .composite([
    { input: overlay, top: 0, left: 0 },
    { input: circle, top: 70, left: 80 },
    { input: logo, top: 70 + (190 - logoSize) / 2, left: 80 + (190 - logoSize) / 2 },
  ])
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile(path.join(root, "public/img/og-1200x630.jpg"));

console.log("wrote public/img/og-1200x630.jpg");
