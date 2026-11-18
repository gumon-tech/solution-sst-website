// What the shop system may change in a data file that already exists on main (see README, "Data the shop system writes").
// Pure functions: before and after are the parsed JSON of HEAD^1 and HEAD. Used by scripts/check-shop-agent-diff.mjs.
import { HEALTH } from "./public-text.mjs";

const LISTS = {
  promotions: { list: "promotions", id: "code", mayChange: ["status", "ends", "ends_label"] },
  closures: { list: "closures", id: "code", mayChange: ["status", "to"] },
  "faq-extra": { list: "questions", id: "code", mayChange: ["status"] },
  photos: { list: "images", id: "key", mayChange: ["status"] },
};
// hours (one object) and notice (one slot, replaced as a whole) have no list; the validators hold their rules.
// services, copy and seo have their own rules below.
export const CONCERNS = ["promotions", "hours", "closures", "notice", "faq-extra", "photos", "services", "copy", "seo"];

/** The data file of a concern (every concern is exactly one JSON file under data/). */
export const fileOf = (concern) => `data/${concern}.json`;

export function checkDiff(concern, before, after) {
  const errors = [];
  if (!CONCERNS.includes(concern)) return [`unknown concern "${concern}"`];
  if (concern === "services") return checkServices(before, after);
  if (concern === "copy") return sameKeys("slots", before?.slots, after?.slots);
  if (concern === "seo") {
    const errs = sameKeys("pages", before?.pages, after?.pages);
    for (const r of Object.keys(before?.pages ?? {})) if (after?.pages?.[r]) errs.push(...sameKeys(`pages.${r}`, before.pages[r], after.pages[r]));
    return errs;
  }
  const spec = LISTS[concern];
  if (!spec) return errors;
  const was = before?.[spec.list];
  const now = after?.[spec.list];
  if (!Array.isArray(was) || !Array.isArray(now)) return [`${spec.list} must be an array before and after`];
  const nowById = new Map(now.map((e) => [e?.[spec.id], e]));
  for (const [i, old] of was.entries()) {
    const id = old?.[spec.id];
    const cur = nowById.get(id);
    if (!cur) {
      errors.push(`${spec.list}: entry ${id} was removed (set its status instead; entries are never deleted)`);
      continue;
    }
    if (now[i]?.[spec.id] !== id) errors.push(`${spec.list}: entry ${id} moved (new entries go at the end)`);
    for (const k of new Set([...Object.keys(old), ...Object.keys(cur)])) {
      if (spec.mayChange.includes(k)) continue;
      if (JSON.stringify(old[k]) !== JSON.stringify(cur[k])) errors.push(`${spec.list}: ${id}.${k} was changed (only ${spec.mayChange.join(", ")} may change on an existing entry)`);
    }
  }
  const oldIds = new Set(was.map((e) => e?.[spec.id]));
  // Anything not in the old file must come after every old entry.
  let seenNew = false;
  for (const e of now) {
    if (!oldIds.has(e?.[spec.id])) seenNew = true;
    else if (seenNew) errors.push(`${spec.list}: new entries must be appended at the end (${e?.[spec.id]} comes after a new one)`);
  }
  return errors;
}

const isObj = (x) => typeof x === "object" && x !== null && !Array.isArray(x);

/** copy and seo: the shop system changes values only; the keys (the slot and page lists) are a person's change. */
function sameKeys(what, before, after) {
  if (!isObj(before) || !isObj(after)) return [`${what} must be an object before and after`];
  const errors = [];
  for (const k of Object.keys(before)) if (!(k in after)) errors.push(`${what}: "${k}" was removed (set it to null instead)`);
  for (const k of Object.keys(after)) if (!(k in before)) errors.push(`${what}: "${k}" was added (new slots and pages are added by a person)`);
  return errors;
}

// services (data/services.json): see README, "services". A row is one length of one treatment (slug).
// May: change a row's price, length, option label or name; add a length to an existing treatment; remove a length;
// move a treatment to another existing group. May not: add or remove a whole treatment (its page, copy and photo slots are
// a person's work), rename a slug, reorder, change the file's other keys, add health wording to a name, or move a price by
// more than PRICE_STEP in one pull request (a typo guard: a bigger change is real but needs a person).
export const PRICE_STEP = 0.5;
const SERVICE_FILE_KEYS = ["_about", "source", "currency"];

function checkServices(before, after) {
  const errors = [];
  const was = before?.services;
  const now = after?.services;
  if (!Array.isArray(was) || !Array.isArray(now)) return ["services must be an array before and after"];
  for (const k of SERVICE_FILE_KEYS) {
    if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) errors.push(`${k} was changed (only read_at and services may change)`);
  }
  for (const k of Object.keys(after)) if (![...SERVICE_FILE_KEYS, "read_at", "services"].includes(k)) errors.push(`unknown file key "${k}"`);
  const order = (rows) => [...new Set(rows.map((r) => r?.slug))];
  const oldSlugs = order(was);
  const newSlugs = order(now);
  for (const s of newSlugs) if (!oldSlugs.includes(s)) errors.push(`treatment "${s}" is new: a new treatment needs its page, copy and photo slots, so a person adds it`);
  for (const s of oldSlugs) if (!newSlugs.includes(s)) errors.push(`treatment "${s}" lost its last length: removing a whole treatment removes its page and links, so a person does it`);
  const common = (list, other) => list.filter((s) => other.includes(s));
  if (common(oldSlugs, newSlugs).join() !== common(newSlugs, oldSlugs).join()) errors.push(`treatments were reordered (${common(newSlugs, oldSlugs).join(", ")}): the order is the menu's, a person changes it`);
  const groups = new Set(was.map((r) => r?.group));
  for (const r of now) if (!groups.has(r?.group)) errors.push(`${r?.slug}: group "${r?.group}" is not on the menu yet (a new group is a new menu section, a person adds it)`);
  const id = (r) => `${r?.slug}|${r?.duration_min}`;
  const oldById = new Map(was.map((r) => [id(r), r]));
  const kept = now.filter((r) => oldById.has(id(r))).map(id);
  const keptInOldOrder = was.map(id).filter((k) => kept.includes(k));
  if (kept.join() !== keptInOldOrder.join()) errors.push("lengths that stay were reordered (new lengths may go anywhere, existing ones keep their order)");
  const healthWords = (name) => new Set([...String(name ?? "").matchAll(new RegExp(HEALTH.source, "gi"))].map((m) => m[0].toLowerCase()));
  for (const r of now) {
    const old = oldById.get(id(r));
    const siblings = was.filter((o) => o?.slug === r?.slug);
    if (!siblings.length) continue; // reported above as a new treatment
    const oldWords = healthWords(siblings[0].name);
    for (const w of healthWords(r.name)) if (!oldWords.has(w)) errors.push(`${r.slug}: name "${r.name}" adds "${w}" (health wording only stays where the menu already had it)`);
    const p = r?.price_gbp;
    if (typeof p !== "number") continue;
    if (old) {
      if (p < old.price_gbp * (1 - PRICE_STEP) || p > old.price_gbp * (1 + PRICE_STEP)) errors.push(`${r.slug} ${r.duration_min} min: £${old.price_gbp} -> £${p} moves more than ${PRICE_STEP * 100}% (check for a typo; a person merges a change that big)`);
    } else {
      const lo = Math.min(...siblings.map((o) => o.price_gbp));
      const hi = Math.max(...siblings.map((o) => o.price_gbp));
      if (p < lo * (1 - PRICE_STEP) || p > hi * 2) errors.push(`${r.slug} ${r.duration_min} min (new length): £${p} is far from its other lengths (£${lo} to £${hi})`);
    }
  }
  return errors;
}
