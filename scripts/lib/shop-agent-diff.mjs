// What the shop system may change in a data file that already exists on main (see README, "Data the shop system writes").
// Pure functions: before and after are the parsed JSON of HEAD^1 and HEAD. Used by scripts/check-shop-agent-diff.mjs.
const LISTS = {
  promotions: { list: "promotions", id: "code", mayChange: ["status", "ends", "ends_label"] },
  closures: { list: "closures", id: "code", mayChange: ["status", "to"] },
  "faq-extra": { list: "questions", id: "code", mayChange: ["status"] },
  photos: { list: "images", id: "key", mayChange: ["status"] },
};
// hours (one object) and notice (one slot, replaced as a whole) have no list; the validators hold their rules.
export const CONCERNS = ["promotions", "hours", "closures", "notice", "faq-extra", "photos"];

export function checkDiff(concern, before, after) {
  const errors = [];
  if (!CONCERNS.includes(concern)) return [`unknown concern "${concern}"`];
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
