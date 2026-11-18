// Self-test for scripts/validate-services.mjs and the services diff rules (scripts/lib/shop-agent-diff.mjs).
// Run: node scripts/test-services.mjs
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runCases } from "./lib/run-cases.mjs";
import { checkDiff } from "./lib/shop-agent-diff.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const main = JSON.parse(readFileSync(path.join(here, "../data/services.json"), "utf8"));
const clone = () => structuredClone(main);
const edit = (f) => {
  const d = clone();
  f(d);
  return d;
};
const row = (slug, duration_min) => (d) => d.services.find((r) => r.slug === slug && r.duration_min === duration_min);
const thai60 = row("thai-massage", 60);

runCases("validate-services.mjs", [
  ["the file on main", main, true],
  ["a price change", edit((d) => (thai60(d).price_gbp = 62)), true],
  ["pounds and pence", edit((d) => (thai60(d).price_gbp = 62.5)), true],
  ["a new length", edit((d) => d.services.splice(8, 0, { ...thai60(d), option: "2 hours", duration_min: 120, price_gbp: 99 })), true],
  ["a length removed", edit((d) => d.services.splice(2, 1)), true],
  ["three decimals", edit((d) => (thai60(d).price_gbp = 62.555)), false],
  ["price zero", edit((d) => (thai60(d).price_gbp = 0)), false],
  ["price as text", edit((d) => (thai60(d).price_gbp = "59")), false],
  ["option does not name its length", edit((d) => (thai60(d).option = "90 minutes")), false],
  ["option '1 hours'", edit((d) => (thai60(d).option = "1 hours")), false],
  ["two names for one slug", edit((d) => (thai60(d).name = "Thai Massage Deluxe")), false],
  ["two groups for one slug", edit((d) => (thai60(d).group = "Reflexology & Lymphatic Massages")), false],
  ["repeated length", edit((d) => d.services.push({ ...thai60(d) })), false],
  ["unknown row key", edit((d) => (thai60(d).note = "x")), false],
  ["unknown file key", edit((d) => (d.extra = 1)), false],
  ["bad read_at", edit((d) => (d.read_at = "yesterday")), false],
  ["currency changed", edit((d) => (d.currency = "EUR")), false],
  ["emoji in a name", edit((d) => d.services.filter((r) => r.slug === "thai-massage").forEach((r) => (r.name = "Thai Massage \u{2728}"))), false],
  ["link in a name", edit((d) => d.services.filter((r) => r.slug === "thai-massage").forEach((r) => (r.name = "Thai Massage www.x.com"))), false],
  ["markup in an option", edit((d) => (thai60(d).option = "*1 hour*")), false],
]);

// Diff rules: before = main, after = the pull request's file.
const diffCases = [
  ["price change within half", edit((d) => (thai60(d).price_gbp = 65)), true],
  ["several prices and read_at", edit((d) => { d.read_at = "2026-11-19T10:00:00+00:00"; d.services.forEach((r) => (r.price_gbp += 5)); }), true],
  ["a new length for an existing treatment", edit((d) => d.services.splice(8, 0, { ...thai60(d), option: "2 hours", duration_min: 120, price_gbp: 99 })), true],
  ["a new length appended at the end", edit((d) => d.services.push({ ...thai60(d), option: "2 hours", duration_min: 120, price_gbp: 99 })), true],
  ["a length removed (discontinued)", edit((d) => d.services.splice(2, 1)), true],
  ["a length changed (90 to 120 minutes)", edit((d) => Object.assign(row("hot-stone-massage", 90)(d), { duration_min: 120, option: "2 hours", price_gbp: 109 })), true],
  ["a treatment renamed everywhere", edit((d) => d.services.filter((r) => r.slug === "thai-massage").forEach((r) => (r.name = "Traditional Thai Massage"))), true],
  ["a treatment moved to another existing group", edit((d) => d.services.filter((r) => r.slug === "thai-foot-massage").forEach((r) => (r.group = "Reflexology & Lymphatic Massages"))), true],
  ["price typo (59 to 590)", edit((d) => (thai60(d).price_gbp = 590)), false],
  ["price cut to a quarter", edit((d) => (thai60(d).price_gbp = 15)), false],
  ["new length priced far off", edit((d) => d.services.push({ ...thai60(d), option: "2 hours", duration_min: 120, price_gbp: 500 })), false],
  ["a new treatment (new slug)", edit((d) => d.services.push({ ...thai60(d), slug: "reflexology", name: "Reflexology" })), false],
  ["a whole treatment removed", edit((d) => (d.services = d.services.filter((r) => r.slug !== "thai-foot-massage"))), false],
  ["treatments reordered", edit((d) => d.services.reverse()), false],
  ["lengths of a treatment swapped", edit((d) => { const i = d.services.findIndex((r) => r.slug === "hot-stone-massage"); [d.services[i], d.services[i + 1]] = [d.services[i + 1], d.services[i]]; }), false],
  ["a new group", edit((d) => d.services.filter((r) => r.slug === "thai-foot-massage").forEach((r) => (r.group = "Foot Treatments"))), false],
  ["_about changed", edit((d) => (d._about = "x")), false],
  ["source changed", edit((d) => (d.source = "x")), false],
  ["health word added to a name", edit((d) => d.services.filter((r) => r.slug === "thai-massage").forEach((r) => (r.name = "Thai Massage for Pain"))), false],
  ["the lymphatic name keeps its own words", edit((d) => d.services.filter((r) => r.slug === "lymphatic-drainage-massage").forEach((r) => (r.name = "Gentle Lymphatic Drainage Massage"))), true],
];
let failed = 0;
for (const [name, after, ok] of diffCases) {
  const errs = checkDiff("services", main, after);
  if ((errs.length === 0) !== ok) {
    failed++;
    console.error(`FAIL diff ${name}: expected ${ok ? "pass" : "fail"}, got ${errs.length ? errs.join("; ") : "pass"}`);
  } else console.log(`ok   diff ${name}${errs.length ? `  (${errs[0]})` : ""}`);
}
if (failed) process.exit(1);
console.log(`${diffCases.length} diff cases passed`);
