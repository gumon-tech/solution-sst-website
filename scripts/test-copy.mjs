// Self-test for scripts/validate-copy.mjs, scripts/validate-seo.mjs and their diff rules (values only, never keys).
// Run: node scripts/test-copy.mjs
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { currentText, loadSlots } from "./lib/copy-text.mjs";
import { runCases } from "./lib/run-cases.mjs";
import { checkDiff } from "./lib/shop-agent-diff.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const slots = loadSlots();
const empty = { updated_at: "2026-11-19T09:00:00Z", slots: Object.fromEntries(Object.keys(slots).map((k) => [k, null])) };
const copy = (o = {}, extra = {}) => ({ ...empty, slots: { ...empty.slots, ...o }, ...extra });
// What the site shows today, emphasis marks removed: the bot's starting point for an edit, so it must pass as it is.
const current = copy(Object.fromEntries(Object.entries(slots).map(([k, s]) => [k, currentText(s).replace(/\*([^*]+)\*/g, "$1")])));
const lead = (t) => copy({ "home.hero.lead": t });
const ok = "Trained at Wat Pho in Bangkok, our therapists bring traditional Thai massage to Greenwich, Cutty Sark. Book it in one WhatsApp message.";

runCases("validate-copy.mjs", [
  ["every slot null (the site is the markdown)", empty, true],
  ["every slot set to today's wording", current, true],
  ["a home lead edit", lead(ok), true],
  ["an eyebrow edit", copy({ "home.hero.eyebrow": "Greenwich, Cutty Sark · Since 2019" }), true],
  ["a treatment intro naming its own service", copy({ "treatment.lymphatic-drainage-massage.intro": "Lymphatic Drainage Massage is a gentle, rhythmic massage with light, flowing strokes." }), true],
  ["walking minutes are fine", copy({ "visit.getting-here.deptford-station": "Southeastern and Thameslink trains. About a 12-minute walk to us." }), true],
  ["external link", lead(`${ok} See https://example.com for more.`), false],
  ["www link", lead(`${ok} See www.example.com.`), false],
  ["email", lead(`${ok} Write to hello@example.com.`), false],
  ["phone number", lead(`${ok} Call 020 7946 0958.`), false],
  ["health claim", lead("Our Thai massage relieves back pain and stress after a long week at the desk."), false],
  ["health claim inside a service name sentence", copy({ "treatment.lymphatic-drainage-massage.intro": "Lymphatic Drainage Massage helps reduce swelling and boosts immunity." }), false],
  ["review claim", lead(`${ok} Rated 5 stars by our guests.`), false],
  ["Thai script", lead(`${ok} สวัสดี`), false],
  ["emoji", lead(`${ok} \u{1F33F}`), false],
  ["short shop name", lead("At Sri Siam we bring the art of Thai massage to Greenwich, Cutty Sark, in skilled hands."), false],
  ["Greenwich alone", lead("We bring the art of Thai massage to Greenwich, in skilled hands, booked in one message."), false],
  ["neighbouring business named", lead(`${ok} Find us inside Carnaby.`), false],
  ["a price", lead(`${ok} From £59.`), false],
  ["a percentage offer", lead(`${ok} 20% off this week.`), false],
  ["a treatment length", lead(`${ok} Choose 90 minutes of calm.`), false],
  ["opening hours typed", lead(`${ok} Open 11:00 to 19:00.`), false],
  ["a weekday", lead(`${ok} Closed on Mondays.`), false],
  ["deposit wording", lead(`${ok} No deposit needed.`), false],
  ["health-safety wording", lead(`${ok} Pregnant guests are welcome.`), false],
  ["a placeholder", lead(`${ok} {{deposit}}`), false],
  ["markdown emphasis", lead(`${ok} *Book now.*`), false],
  ["raw HTML", lead(`${ok} <script>alert(1)</script>`), false],
  ["markdown link", lead(`${ok} [Book](/visit/)`), false],
  ["button syntax", lead(`${ok} Book -> /visit/`), false],
  ["two paragraphs", lead(`${ok}\n\nA second paragraph of text here.`), false],
  ["too long", lead("A calm room. ".repeat(40).trim()), false],
  ["too short for a paragraph", lead("Book now."), false],
  ["leading space", lead(` ${ok}`), false],
  ["not a string", lead(42), false],
  ["unknown slot (a new key)", copy({ "home.hero.subtitle": "Hello there, welcome to the shop" }), false],
  ["slot missing", { ...empty, slots: Object.fromEntries(Object.entries(empty.slots).slice(1)) }, false],
  ["unknown file key", copy({}, { note: "x" }), false],
  ["bad updated_at", copy({}, { updated_at: "today" }), false],
]);

const pages = JSON.parse(readFileSync(path.join(here, "lib/seo-pages.json"), "utf8")).pages;
const seoEmpty = { updated_at: "2026-11-19T09:00:00Z", pages: Object.fromEntries(Object.keys(pages).map((r) => [r, { title: null, description: null }])) };
const seo = (route, o) => ({ ...seoEmpty, pages: { ...seoEmpty.pages, [route]: { ...seoEmpty.pages[route], ...o } } });
const desc = "Traditional Thai massage in Greenwich, Cutty Sark, by therapists trained at Wat Pho. Book on WhatsApp.";
runCases("validate-seo.mjs", [
  ["every page null (front matter)", seoEmpty, true],
  ["a title and a description", seo("/", { title: "Thai Massage | Sri Siam Thai Therapy & Wellness", description: desc }), true],
  ["title only", seo("/tour/", { title: "Tour the Shop | Sri Siam Thai Therapy & Wellness" }), true],
  ["title over 60", seo("/", { title: "Thai Massage in Greenwich, Cutty Sark | Sri Siam Thai Therapy & Wellness" }), false],
  ["description over 155", seo("/", { description: `${desc} ${desc}` }), false],
  ["| outside a title", seo("/", { description: `${desc} | More` }), false],
  ["health claim in a title", seo("/", { title: "Pain Relief Massage | Sri Siam Thai Therapy & Wellness" }), false],
  ["price in a description", seo("/", { description: `${desc} From £39.` }), false],
  ["unknown page", { ...seoEmpty, pages: { ...seoEmpty.pages, "/privacy/": { title: null, description: null } } }, false],
  ["page missing", { ...seoEmpty, pages: Object.fromEntries(Object.entries(seoEmpty.pages).slice(1)) }, false],
  ["unknown key on a page", seo("/", { h1: "x" }), false],
  ["description key missing", { ...seoEmpty, pages: { ...seoEmpty.pages, "/": { title: null } } }, false],
]);

// Diff rules: values change, keys never do.
const diffCases = [
  ["copy: a value set", "copy", empty, lead(ok), true],
  ["copy: a value back to null", "copy", lead(ok), empty, true],
  ["copy: a key added", "copy", empty, copy({ "home.hero.subtitle": null }), false],
  ["copy: a key removed", "copy", empty, { ...empty, slots: Object.fromEntries(Object.entries(empty.slots).slice(1)) }, false],
  ["seo: a value set", "seo", seoEmpty, seo("/", { title: "Thai Massage | Sri Siam Thai Therapy & Wellness" }), true],
  ["seo: a page added", "seo", seoEmpty, { ...seoEmpty, pages: { ...seoEmpty.pages, "/privacy/": { title: null, description: null } } }, false],
  ["seo: a key added to a page", "seo", seoEmpty, seo("/", { h1: null }), false],
];
let failed = 0;
for (const [name, concern, before, after, want] of diffCases) {
  const errs = checkDiff(concern, before, after);
  if ((errs.length === 0) !== want) {
    failed++;
    console.error(`FAIL diff ${name}: expected ${want ? "pass" : "fail"}, got ${errs.length ? errs.join("; ") : "pass"}`);
  } else console.log(`ok   diff ${name}`);
}
if (failed) process.exit(1);
console.log(`${diffCases.length} diff cases passed`);
