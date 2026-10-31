// Self-test for scripts/validate-promotions.mjs: one good file must pass, each bad one must fail for its reason.
// Run: node scripts/test-promotions.mjs
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = mkdtempSync(path.join(os.tmpdir(), "promos-"));
const good = {
  code: "P-AB12", title: "Second hour half price", eyebrow: "Autumn offer", detail: "Book a one-hour Thai massage and add 30 minutes for £10 off.",
  points: ["Thai massage", "Greenwich"], offer: "Mention this offer on WhatsApp or when you arrive", message: "Hi Sri Siam, I'd like to book with the Autumn offer.",
  image: null, illustrative: false, starts: "2026-11-01", ends: "2026-11-30", ends_label: "Monday 30 November 2026", status: "live",
};
const file = (promotions, extra = {}) => ({ updated_at: "2026-10-31T09:00:00Z", promotions, ...extra });
const cases = [
  ["empty file", file([]), true],
  ["good offer", file([good]), true],
  ["ended offer kept as history", file([{ ...good, status: "ended" }]), true],
  ["expired but still live is not a build error (the page hides it)", file([{ ...good, starts: "2025-01-01", ends: "2025-01-31", ends_label: "Friday 31 January 2025" }]), true],
  ["unknown key", file([{ ...good, extra: 1 }]), false],
  ["missing key", file([{ ...good, points: undefined }]), false],
  ["duplicate code", file([good, good]), false],
  ["bad date", file([{ ...good, ends: "2026-11-31" }]), false],
  ["label does not match date", file([{ ...good, ends_label: "Tuesday 1 December 2026" }]), false],
  ["starts after ends", file([{ ...good, starts: "2026-12-01" }]), false],
  ["health claim", file([{ ...good, detail: "Relieves pain and stress." }]), false],
  ["health claim: sleep", file([{ ...good, detail: "Improves sleep after a long week." }]), false],
  ["health claim: immunity", file([{ ...good, offer: "Boosts immunity" }]), false],
  ["health claim: relief", file([{ ...good, title: "Relieves back pain" }]), false],
  ["health claim: recovery", file([{ ...good, points: ["Faster recovery"] }]), false],
  ["health claim: therapy", file([{ ...good, eyebrow: "Therapeutic" }]), false],
  ["health claim: posture", file([{ ...good, detail: "Better posture for desk workers" }]), false],
  ["health claim: knots", file([{ ...good, detail: "Works out knots" }]), false],
  ["health claim: lymph", file([{ ...good, title: "Lymphatic drainage hour" }]), false],
  ["health claim: weight", file([{ ...good, offer: "Weight loss massage" }]), false],
  ["health claim: energy", file([{ ...good, detail: "More energy all week" }]), false],
  ["health claim: breathing", file([{ ...good, detail: "Easier breathing" }]), false],
  ["health claim: tight", file([{ ...good, detail: "Loosens tight shoulders" }]), false],
  ["joint booking is ordinary English", file([{ ...good, detail: "A joint booking for two, side by side" }]), true],
  ["the shop's exact name passes", file([{ ...good, eyebrow: "At Sri Siam Thai Therapy & Wellness" }]), true],
  ["therapy outside the shop name does not", file([{ ...good, eyebrow: "Thai therapy session" }]), false],
  ["Thai script", file([{ ...good, detail: "นวดไทยลดพิเศษ" }]), false],
  ["emoji", file([{ ...good, title: "Offer \u{1F389}" }]), false],
  ["link", file([{ ...good, detail: "See https://example.com" }]), false],
  ["email", file([{ ...good, detail: "Write to a@b.co" }]), false],
  ["phone number", file([{ ...good, detail: "Ring 020 7946 0958 now" }]), false],
  ["old private number", file([{ ...good, detail: "Call 07497 493585" }]), false],
  ["tag typed into the text", file([{ ...good, message: "Hi [web-X]" }]), false],
  ["invented service price", file([{ ...good, detail: "Thai massage only £29 this month" }]), false],
  ["missing image file", file([{ ...good, image: "/images/nope.jpg" }]), false],
  ["unknown file key", file([good], { secret: "x" }), false],
];
let failed = 0;
cases.forEach(([name, body, ok], i) => {
  const f = path.join(dir, `${i}.json`);
  writeFileSync(f, JSON.stringify(body));
  const r = spawnSync("node", [path.join(here, "validate-promotions.mjs"), f], { encoding: "utf8" });
  const passed = r.status === 0;
  if (passed !== ok) {
    failed++;
    console.error(`FAIL ${name}: expected ${ok ? "pass" : "fail"}, got ${passed ? "pass" : "fail"}\n${r.stderr}`);
  } else console.log(`ok   ${name}`);
});
if (failed) process.exit(1);
console.log(`${cases.length} cases passed`);
