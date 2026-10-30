// Fails the build when data/services.json is malformed, so a bad edit never reaches the live site.
import { readFileSync } from "node:fs";

const path = new URL("../data/services.json", import.meta.url);
let data;
try {
  data = JSON.parse(readFileSync(path, "utf8"));
} catch (e) {
  console.error(`data/services.json is not valid JSON: ${e.message}`);
  process.exit(1);
}

const errors = [];
if (!Array.isArray(data.services) || data.services.length === 0) errors.push("services must be a non-empty array");
const seen = new Set();
for (const [i, s] of (data.services || []).entries()) {
  const at = `services[${i}]`;
  for (const k of ["group", "slug", "name", "option"]) {
    if (typeof s[k] !== "string" || !s[k].trim()) errors.push(`${at}.${k} must be a non-empty string`);
  }
  if (s.slug && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.slug)) errors.push(`${at}.slug "${s.slug}" must be lower-case words joined by hyphens`);
  if (!Number.isInteger(s.duration_min) || s.duration_min < 10 || s.duration_min > 240) errors.push(`${at}.duration_min must be whole minutes between 10 and 240`);
  if (typeof s.price_gbp !== "number" || !(s.price_gbp > 0) || s.price_gbp > 1000) errors.push(`${at}.price_gbp must be a number of pounds above 0`);
  const key = `${s.slug}|${s.duration_min}`;
  if (seen.has(key)) errors.push(`${at} repeats ${s.name} at ${s.duration_min} minutes`);
  seen.add(key);
}
const nameBySlug = new Map();
for (const s of data.services || []) {
  if (nameBySlug.has(s.slug) && nameBySlug.get(s.slug) !== s.name) errors.push(`slug ${s.slug} is used for two names`);
  nameBySlug.set(s.slug, s.name);
}

if (errors.length) {
  console.error("data/services.json has problems:\n- " + errors.join("\n- "));
  process.exit(1);
}
console.log(`services.json OK: ${data.services.length} rows, ${nameBySlug.size} treatments`);
