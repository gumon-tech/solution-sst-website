// Fails the build when data/promotions.json is malformed or carries something the public site must not say.
// The file is written by the shop's WhatsApp system (pull requests from branches shop-agent/promotions-*),
// which the auto-merge workflow lets through only if this script passes. Plain Node, no dependencies.
// Schema = what the system writes (shop-agent app/website.py NEW_PROMO_FIELDS). Keep the two in step.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { ROOT as root, checkPublicText, dateLabel as label, isDate, loadFacts } from "./lib/public-text.mjs";

const errors = [];
const fail = (m) => errors.push(m);

// Optional argument: another file to check (scripts/test-promotions.mjs uses it).
const target = process.argv[2] ?? path.join(root, "data/promotions.json");
let data;
try {
  data = JSON.parse(readFileSync(target, "utf8"));
} catch (e) {
  console.error(`data/promotions.json is not valid JSON: ${e.message}`);
  process.exit(1);
}
const facts = loadFacts(root);

const FILE_KEYS = ["updated_at", "note", "promotions"];
const PROMO_KEYS = ["code", "title", "eyebrow", "detail", "points", "offer", "message", "image", "illustrative", "starts", "ends", "ends_label", "status"];
const LIMITS = { title: 80, eyebrow: 60, detail: 400, offer: 160, message: 200, ends_label: 40 };
const STATUSES = ["live", "ended", "draft"];
if (typeof data !== "object" || data === null || Array.isArray(data)) fail("file must be an object");
else {
  for (const k of Object.keys(data)) if (!FILE_KEYS.includes(k)) fail(`file: unknown key "${k}"`);
  if (typeof data.updated_at !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(data.updated_at)) fail("file: updated_at must be like 2026-10-31T09:00:00Z");
  if ("note" in data && typeof data.note !== "string") fail("file: note must be a string");
  if (!Array.isArray(data.promotions)) fail("file: promotions must be an array");
}

const codes = new Set();
for (const [i, p] of (Array.isArray(data?.promotions) ? data.promotions : []).entries()) {
  const at = `promotions[${i}]${p?.code ? ` (${p.code})` : ""}`;
  if (typeof p !== "object" || p === null || Array.isArray(p)) {
    fail(`${at}: must be an object`);
    continue;
  }
  for (const k of PROMO_KEYS) if (!(k in p)) fail(`${at}: missing "${k}"`);
  for (const k of Object.keys(p)) if (!PROMO_KEYS.includes(k)) fail(`${at}: unknown key "${k}"`);
  if (typeof p.code !== "string" || !/^P-[A-Z0-9]{2,20}$/.test(p.code)) fail(`${at}: code must look like P-AB12`);
  else if (codes.has(p.code)) fail(`${at}: code repeats`);
  else codes.add(p.code);
  for (const k of ["title", "detail", "message"]) if (typeof p[k] !== "string" || !p[k].trim()) fail(`${at}: ${k} must be a non-empty string`);
  for (const k of ["eyebrow", "offer"]) if (typeof p[k] !== "string") fail(`${at}: ${k} must be a string`);
  for (const [k, max] of Object.entries(LIMITS)) if (typeof p[k] === "string" && p[k].length > max) fail(`${at}: ${k} is ${p[k].length} characters, limit ${max}`);
  if (!Array.isArray(p.points) || p.points.length > 4 || p.points.some((x) => typeof x !== "string" || !x.trim() || x.length > 60)) fail(`${at}: points must be at most 4 short strings`);
  if (typeof p.illustrative !== "boolean") fail(`${at}: illustrative must be true or false`);
  if (p.image !== null && (typeof p.image !== "string" || !/^\/img\/[A-Za-z0-9._-]+$/.test(p.image) || !existsSync(path.join(root, "public", p.image)))) fail(`${at}: image must be null or an existing file under public/img/ (like /img/foot-massage-800.webp)`);
  if (!STATUSES.includes(p.status)) fail(`${at}: status must be one of ${STATUSES.join(", ")}`);
  if (!isDate(p.starts)) fail(`${at}: starts must be a date like 2026-11-01`);
  if (!isDate(p.ends)) fail(`${at}: ends must be a date like 2026-11-30`);
  if (isDate(p.starts) && isDate(p.ends)) {
    if (p.starts > p.ends) fail(`${at}: starts is after ends`);
    if (p.ends_label !== label(p.ends)) fail(`${at}: ends_label is "${p.ends_label}", expected "${label(p.ends)}"`);
  }

  // What the public may read. Every text field.
  const texts = [p.title, p.eyebrow, p.detail, p.offer, p.message, ...(Array.isArray(p.points) ? p.points : [])].filter((x) => typeof x === "string");
  for (const t of texts) for (const m of checkPublicText(t, facts)) fail(`${at}: ${m}`);
}

if (errors.length) {
  console.error("data/promotions.json has problems:\n- " + errors.join("\n- "));
  process.exit(1);
}
console.log(`promotions.json OK: ${data.promotions.length} offers`);
