// Fails the build when data/promotions.json is malformed or carries something the public site must not say.
// The file is written by the shop's WhatsApp system (pull requests from branches shop-agent/promotions-*),
// which the auto-merge workflow lets through only if this script passes. Plain Node, no dependencies.
// Schema = what the system writes (shop-agent app/website.py NEW_PROMO_FIELDS). Keep the two in step.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
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
const services = JSON.parse(readFileSync(path.join(root, "data/services.json"), "utf8")).services;
const site = readFileSync(path.join(root, "lib/site.ts"), "utf8");
const deposit = Number(/depositGbp:\s*(\d+)/.exec(site)?.[1]);
// The shop's exact display name may use a word the list blocks (Therapy); the same exemption as the shop system.
const shopName = /\bname:\s*"([^"]+)"/.exec(site)?.[1] ?? "";
const scrubName = (t) => (shopName ? t.split(new RegExp(shopName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")).join(" ") : t);
const servicePrices = new Set(services.map((s) => s.price_gbp));

const FILE_KEYS = ["updated_at", "note", "promotions"];
const PROMO_KEYS = ["code", "title", "eyebrow", "detail", "points", "offer", "message", "image", "illustrative", "starts", "ends", "ends_label", "status"];
const LIMITS = { title: 80, eyebrow: 60, detail: 400, offer: 160, message: 200, ends_label: 40 };
const STATUSES = ["live", "ended", "draft"];
const EMOJI = /\p{Extended_Pictographic}/u;
// Same list as HEALTH_CLAIMS in the shop system (website.py): the health and medical claims the UK ASA / CAP code
// covers for massage (pain, sleep, immunity, tension, recovery, conditions, treatment of illness). The site makes none (HANDOFF rules).
const HEALTH = /\b(detox\w*|toxins?|circulation|pain\w*|ache\w*|headache\w*|stress\w*|swell\w*|immun\w*|inflammation|cure\w*|heal\w*|relie\w*|tension|sleep\w*|therap\w*|recover\w*|muscle\w*|well-?being|anxiety|depression|insomnia|arthritis|sciatica|migraines?|fatigue|injur\w*|rehab\w*|alleviat\w*|remed\w*|rheumat\w*|fibromyalgia|eczema|asthma|diabet\w*|cancer|covid|stiff\w*|sore\w*|cramp\w*|spasm\w*|chronic|symptom\w*|diagnos\w*|illness|disease|medical|clinical|physio\w*|chiropract\w*|osteo\w*|blood pressure|joints|posture|knot\w*|back problem\w*|lymph\w*|drainage|weight|slim\w*|digest\w*|energ\w*|hormon\w*|breath\w*|nerve\w*|tight\w*)\b/i;
// The public text of this shop is English; the shop system refuses Thai script too.
const THAI = /[\u0E00-\u0E7F]/;

const isDate = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && new Date(`${s}T00:00:00Z`).toISOString().startsWith(s);
const label = (s) => {
  const d = new Date(`${s}T00:00:00Z`);
  const f = (o) => new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", ...o }).format(d);
  return `${f({ weekday: "long" })} ${d.getUTCDate()} ${f({ month: "long" })} ${d.getUTCFullYear()}`;
};

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
  if (p.image !== null && (typeof p.image !== "string" || !p.image.startsWith("/images/") || !existsSync(path.join(root, "public", p.image)))) fail(`${at}: image must be null or an existing file under public/images/`);
  if (!STATUSES.includes(p.status)) fail(`${at}: status must be one of ${STATUSES.join(", ")}`);
  if (!isDate(p.starts)) fail(`${at}: starts must be a date like 2026-11-01`);
  if (!isDate(p.ends)) fail(`${at}: ends must be a date like 2026-11-30`);
  if (isDate(p.starts) && isDate(p.ends)) {
    if (p.starts > p.ends) fail(`${at}: starts is after ends`);
    if (p.ends_label !== label(p.ends)) fail(`${at}: ends_label is "${p.ends_label}", expected "${label(p.ends)}"`);
  }

  // What the public may read. Every text field.
  const texts = [p.title, p.eyebrow, p.detail, p.offer, p.message, ...(Array.isArray(p.points) ? p.points : [])].filter((x) => typeof x === "string");
  for (const t of texts) {
    if (EMOJI.test(t)) fail(`${at}: emoji in "${t.slice(0, 30)}"`);
    if (/https?:\/\/|www\./i.test(t)) fail(`${at}: link in "${t.slice(0, 30)}" (the only link on a card is the shop's own WhatsApp button)`);
    if (/[\w.+-]+@[\w-]+\.[\w.-]+/.test(t)) fail(`${at}: email address in "${t.slice(0, 30)}"`);
    if (/(?<![\w])\+?\d[\d\s().-]{7,}\d/.test(t) && t.replace(/\D/g, "").length >= 9) fail(`${at}: phone-like number in "${t.slice(0, 30)}"`);
    if (t.includes("07497") || t.includes("7497 493")) fail(`${at}: the old private phone number`);
    if (/\[web-/i.test(t)) fail(`${at}: the [web-X] tag is added by the site, not written in the text`);
    if (THAI.test(t)) fail(`${at}: Thai script in "${t.slice(0, 30)}" (the public text is English)`);
    if (HEALTH.test(scrubName(t))) fail(`${at}: health-result wording in "${t.slice(0, 40)}" (the site makes no health claims)`);
    // Service prices come only from data/services.json. A discount amount ("£5 off") is fine.
    for (const m of t.matchAll(/£(\d+(?:\.\d+)?)/g)) {
      const v = Number(m[1]);
      const after = t.slice(m.index + m[0].length, m.index + m[0].length + 24).toLowerCase();
      const before = t.slice(Math.max(0, m.index - 12), m.index).toLowerCase();
      const isDiscount = /^\s*(off|discount|gift voucher|voucher|credit|saving)/.test(after) || /(save|off|take|extra)\s*$/.test(before);
      if (!isDiscount && v !== deposit && !servicePrices.has(v)) fail(`${at}: £${m[1]} is neither a discount, the deposit nor a price in services.json`);
    }
  }
}

if (errors.length) {
  console.error("data/promotions.json has problems:\n- " + errors.join("\n- "));
  process.exit(1);
}
console.log(`promotions.json OK: ${data.promotions.length} offers`);
