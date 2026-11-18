// Fails the build when data/services.json is malformed, so a bad edit never reaches the live site. Edited by a person or by the
// shop system (branch shop-agent/services-*; what it may change: scripts/lib/shop-agent-diff.mjs). Optional argument: another file.
import path from "node:path";
import { ROOT, checkPublicText, isObject, loadFacts, loadJsonOrExit, makeReporter } from "./lib/public-text.mjs";

const { fail, finish } = makeReporter("data/services.json");
const data = loadJsonOrExit(process.argv[2] ?? path.join(ROOT, "data/services.json"), "data/services.json");
const facts = loadFacts();
const FILE_KEYS = ["_about", "source", "read_at", "currency", "services"];
const ROW_KEYS = ["group", "slug", "name", "option", "duration_min", "price_gbp"];
const MAX = { group: 60, name: 60, option: 30 };

/** "30 minutes", "1 hour", "2 hours", "1 hour 30 minutes" for a length in minutes: the option must name its own length. */
function optionMinutes(o) {
  const m = /^(?:(\d+) hours?)?(?: ?(\d+) minutes)?$/.exec(o);
  if (!m || (!m[1] && !m[2])) return null;
  if (m[1] && Number(m[1]) === 1 && / hours/.test(o)) return null;
  if (m[1] && Number(m[1]) > 1 && !/ hours/.test(o)) return null;
  return Number(m[1] ?? 0) * 60 + Number(m[2] ?? 0);
}

if (!isObject(data)) fail("file must be an object");
else {
  for (const k of Object.keys(data)) if (!FILE_KEYS.includes(k)) fail(`file: unknown key "${k}"`);
  if (data.currency !== "GBP") fail('file: currency must be "GBP"');
  if (typeof data.read_at !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(data.read_at) || Number.isNaN(Date.parse(data.read_at))) fail("file: read_at must be an ISO timestamp like 2026-10-30T19:07:05+00:00 (shown as \"Menu checked\")");
  if (!Array.isArray(data.services) || data.services.length === 0) fail("services must be a non-empty array");
}
const rows = Array.isArray(data?.services) ? data.services : [];
const seen = new Set();
for (const [i, s] of rows.entries()) {
  const at = `services[${i}]`;
  if (!isObject(s)) {
    fail(`${at} must be an object`);
    continue;
  }
  for (const k of Object.keys(s)) if (!ROW_KEYS.includes(k)) fail(`${at}: unknown key "${k}"`);
  for (const k of ["group", "slug", "name", "option"]) {
    if (typeof s[k] !== "string" || !s[k].trim()) fail(`${at}.${k} must be a non-empty string`);
    else if (k !== "slug") {
      if (s[k].length > MAX[k] || s[k] !== s[k].trim() || /[\r\n*{}<>[\]`#|]/.test(s[k])) fail(`${at}.${k} must be plain text on one line, at most ${MAX[k]} characters`);
      // The menu's own names may hold words the health list blocks ("Lymphatic Drainage"); the diff rules stop the shop system adding new ones.
      for (const m of checkPublicText(s[k], facts, { money: "none" })) if (!m.startsWith("health-result")) fail(`${at}.${k}: ${m}`);
    }
  }
  if (s.slug && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.slug)) fail(`${at}.slug "${s.slug}" must be lower-case words joined by hyphens`);
  if (!Number.isInteger(s.duration_min) || s.duration_min < 10 || s.duration_min > 240) fail(`${at}.duration_min must be whole minutes between 10 and 240`);
  if (typeof s.price_gbp !== "number" || !(s.price_gbp > 0) || s.price_gbp > 1000) fail(`${at}.price_gbp must be a number of pounds above 0`);
  else if (Math.abs(s.price_gbp * 100 - Math.round(s.price_gbp * 100)) > 1e-6) fail(`${at}.price_gbp must be pounds and pence (at most two decimals)`);
  if (typeof s.option === "string" && Number.isInteger(s.duration_min) && optionMinutes(s.option) !== s.duration_min) fail(`${at}.option "${s.option}" must name its length (${s.duration_min} min: e.g. "30 minutes", "1 hour", "90 minutes", "2 hours")`);
  const key = `${s.slug}|${s.duration_min}`;
  if (seen.has(key)) fail(`${at} repeats ${s.name} at ${s.duration_min} minutes`);
  seen.add(key);
}
const nameBySlug = new Map();
const groupBySlug = new Map();
for (const s of rows) {
  if (nameBySlug.has(s.slug) && nameBySlug.get(s.slug) !== s.name) fail(`slug ${s.slug} is used for two names`);
  if (groupBySlug.has(s.slug) && groupBySlug.get(s.slug) !== s.group) fail(`slug ${s.slug} is in two groups`);
  nameBySlug.set(s.slug, s.name);
  groupBySlug.set(s.slug, s.group);
}
finish(`services.json OK: ${rows.length} rows, ${nameBySlug.size} treatments`);
