// Fails the build when data/hours.json is malformed. Written by the shop system (branch shop-agent/hours-*).
// No rule here depends on today's date. Plain Node, no dependencies. Optional argument: another file to check.
import path from "node:path";
import { ROOT, isObject, isTimestamp, loadJsonOrExit, makeReporter } from "./lib/public-text.mjs";

const { fail, finish } = makeReporter("data/hours.json");
const data = loadJsonOrExit(process.argv[2] ?? path.join(ROOT, "data/hours.json"), "data/hours.json");
export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIME = /^([01]\d|2[0-3]):(00|15|30|45)$/;

if (!isObject(data)) fail("file must be an object");
else {
  for (const k of Object.keys(data)) if (!["updated_at", "hours"].includes(k)) fail(`file: unknown key "${k}"`);
  if (!isTimestamp(data.updated_at)) fail("file: updated_at must be like 2026-11-06T09:00:00Z");
  if (!isObject(data.hours)) fail("file: hours must be an object with the seven days");
  else {
    for (const k of Object.keys(data.hours)) if (!DAYS.includes(k)) fail(`hours: unknown day "${k}"`);
    let open = 0;
    for (const d of DAYS) {
      if (!(d in data.hours)) {
        fail(`hours: missing ${d}`);
        continue;
      }
      const h = data.hours[d];
      if (h === null) continue;
      if (!isObject(h)) {
        fail(`hours.${d}: must be null (closed) or { opens, closes }`);
        continue;
      }
      for (const k of Object.keys(h)) if (!["opens", "closes"].includes(k)) fail(`hours.${d}: unknown key "${k}"`);
      if (typeof h.opens !== "string" || !TIME.test(h.opens)) fail(`hours.${d}.opens must be HH:MM, minutes 00, 15, 30 or 45`);
      if (typeof h.closes !== "string" || !TIME.test(h.closes)) fail(`hours.${d}.closes must be HH:MM, minutes 00, 15, 30 or 45`);
      if (TIME.test(h.opens) && TIME.test(h.closes)) {
        if (h.opens >= h.closes) fail(`hours.${d}: opens must be before closes`);
        if (h.opens < "06:00" || h.closes > "23:00") fail(`hours.${d}: must be within 06:00 to 23:00`);
        open++;
      }
    }
    if (open === 0) fail("hours: at least one day must be open");
  }
}
finish("hours.json OK");
