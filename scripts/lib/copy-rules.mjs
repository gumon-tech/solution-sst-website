// Rules for the words the shop system puts on the site in place of the markdown: data/copy.json slot values and
// data/seo.json titles and descriptions (README, "copy" and "seo"). On top of the shared public-text rules:
// plain text only (no markdown, placeholders or HTML), nothing that belongs to another source of truth (prices and lengths:
// data/services.json; hours: data/hours.json; deposit, paying and cancelling: content/_booking-terms.md; health-safety
// wording: the core copy), and the Greenwich and neighbouring-business rules check-site applies to the built pages.
import { readFileSync } from "node:fs";
import path from "node:path";
import { ROOT, checkPublicText } from "./public-text.mjs";

// Markdown, placeholders, HTML and the content files' button syntax. "|" is allowed only in a page title.
const MARKUP = /[*_`#<>[\]{}~\\]|->/;
const TIME = /\b\d{1,2}[:.]\d{2}\b|\b\d{1,2}\s?(?:am|pm)\b/i;
const WEEKDAY = /\b(?:mon|tues|wednes|thurs|fri|satur|sun)days?\b/i;
// A typed treatment length. Walking times ("a 9-minute walk", "11 minutes away") are fine.
const HOURS_LENGTH = /\b\d+\s*-?\s*(?:hours?|hrs?)\b/i;
const MINUTES_LENGTH = /\b\d+\s*-?\s*(?:minutes?|mins?)\b(?!\s+(?:walk|on foot|away|from))/i;
// Words like "prices" are fine; an amount, a currency or an offer is not.
const MONEY = /%|€|\$|\b\d+(?:\.\d+)?\s*(?:pounds?|gbp|quid)\b|\b(?:cheap\w*|discount\w*|half price|free of charge)\b/i;
// Wording that lives only in content/_booking-terms.md, the privacy notice or the core health-safety lines.
const RESERVED = /\b(?:deposit\w*|refund\w*|cancel\w*|payments?|pay|paid|paying|terms|privacy|personal data|gdpr|consent|guarantee\w*|pregnan\w*|doctor\w*|conditions?|operations?|contraindicat\w*)\b/i;
const GREENWICH_OK = /Greenwich station|Royal Borough of Greenwich/g;
const GREENWICH_ALONE = /Greenwich(?!, Cutty Sark)/;

/** Service names from data/services.json: the menu's own words, removed before the health test ("Lymphatic Drainage Massage"). */
export function serviceNames(root = ROOT) {
  return [...new Set(JSON.parse(readFileSync(path.join(root, "data/services.json"), "utf8")).services.map((s) => s.name))];
}

/**
 * Problems in one value, as short messages. Empty array = fine.
 * opts: { min, max, title: true for a page title (allows "|"), careers: true for /careers/ text (may say "therapists": a role) }
 */
export function checkSlotText(t, facts, names, { min, max, title = false, careers = false }) {
  if (typeof t !== "string") return ["must be a string or null"];
  const out = [];
  if (t !== t.trim()) out.push("no spaces at the start or end");
  if (/[\r\n\t]/.test(t)) out.push("one line, one paragraph (no line breaks or tabs)");
  if (/ {2}/.test(t)) out.push("no double spaces");
  if (t.length < min || t.length > max) out.push(`is ${t.length} characters, must be ${min} to ${max}`);
  if (MARKUP.test(t) || (!title && t.includes("|"))) out.push("plain text only: no markdown (* _ # ` [ ]), no {{placeholders}}, no HTML (< >), no -> and no |" + (title ? " (except | in a title)" : ""));
  if (TIME.test(t) || WEEKDAY.test(t)) out.push("no opening times or weekdays: hours come only from data/hours.json");
  if (HOURS_LENGTH.test(t) || MINUTES_LENGTH.test(t)) out.push("no treatment lengths: they come only from data/services.json (walking minutes are fine)");
  if (MONEY.test(t)) out.push("no prices, money or discounts: prices come only from data/services.json, offers from data/promotions.json");
  if (RESERVED.test(t)) out.push("no deposit, paying, cancelling, privacy or health-safety wording (those stay in the core copy, changed by a person)");
  if (GREENWICH_ALONE.test(t.replace(GREENWICH_OK, ""))) out.push('"Greenwich" is always "Greenwich, Cutty Sark" (except "Greenwich station")');
  if (/carnaby/i.test(t)) out.push("the neighbouring business is never named");
  if (!careers && /\btherapists\b/i.test(t)) out.push('"therapists": unconfirmed claim, one therapist takes bookings (only /careers/ may say it)');
  // The shared rules (emoji, Thai, links, emails, phone numbers, the [web-] tag, the short name, health and review words, any £).
  // "therapist" is a job, and a service's own name is the menu's wording: both are removed before the health test only.
  let healthSafe = t;
  for (const n of names) healthSafe = healthSafe.split(new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")).join("the treatment");
  const shared = checkPublicText(t, facts, { money: "none", allowTherapist: true });
  const healthOnly = checkPublicText(healthSafe, facts, { money: "none", allowTherapist: true });
  for (const m of shared) {
    if (m.startsWith("health-result wording") && !healthOnly.some((x) => x.startsWith("health-result wording"))) continue;
    out.push(m);
  }
  return out;
}
