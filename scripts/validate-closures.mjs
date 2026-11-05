// Fails the build when data/closures.json is malformed. Written by the shop system (branch shop-agent/closures-*).
// Past closures stay as history; no rule depends on today's date (the site filters by date). Optional argument: another file.
import path from "node:path";
import { ROOT, checkPublicText, isDate, isObject, isTimestamp, loadFacts, loadJsonOrExit, makeReporter } from "./lib/public-text.mjs";

const { fail, finish } = makeReporter("data/closures.json");
const data = loadJsonOrExit(process.argv[2] ?? path.join(ROOT, "data/closures.json"), "data/closures.json");
const facts = loadFacts();
const KEYS = ["code", "label", "from", "to", "hours", "status"];
const TIME = /^([01]\d|2[0-3]):(00|15|30|45)$/;
const MAX_ENTRIES = 60;
const MAX_SPAN_DAYS = 31;
const days = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000) + 1;

if (!isObject(data)) fail("file must be an object");
else {
  for (const k of Object.keys(data)) if (!["updated_at", "closures"].includes(k)) fail(`file: unknown key "${k}"`);
  if (!isTimestamp(data.updated_at)) fail("file: updated_at must be like 2026-11-06T09:00:00Z");
  if (!Array.isArray(data.closures)) fail("file: closures must be an array");
  else {
    if (data.closures.length > MAX_ENTRIES) fail(`file: at most ${MAX_ENTRIES} closures (a person archives old ones)`);
    const codes = new Set();
    const live = [];
    for (const [i, c] of data.closures.entries()) {
      const at = `closures[${i}]${c?.code ? ` (${c.code})` : ""}`;
      if (!isObject(c)) {
        fail(`${at}: must be an object`);
        continue;
      }
      for (const k of KEYS) if (!(k in c)) fail(`${at}: missing "${k}"`);
      for (const k of Object.keys(c)) if (!KEYS.includes(k)) fail(`${at}: unknown key "${k}"`);
      if (typeof c.code !== "string" || !/^C-[A-Z0-9]{2,20}$/.test(c.code)) fail(`${at}: code must look like C-XM26`);
      else if (codes.has(c.code)) fail(`${at}: code repeats`);
      else codes.add(c.code);
      if (typeof c.label !== "string" || !c.label.trim() || c.label.length > 40) fail(`${at}: label must be 1 to 40 characters`);
      else for (const m of checkPublicText(c.label, facts, { money: "none" })) fail(`${at}: label: ${m}`);
      if (!isDate(c.from)) fail(`${at}: from must be a date like 2026-12-24`);
      if (!isDate(c.to)) fail(`${at}: to must be a date like 2026-12-26`);
      if (isDate(c.from) && isDate(c.to)) {
        if (c.from > c.to) fail(`${at}: from is after to`);
        else if (days(c.from, c.to) > MAX_SPAN_DAYS) fail(`${at}: spans more than ${MAX_SPAN_DAYS} days`);
      }
      if (c.hours !== null) {
        if (!isObject(c.hours)) fail(`${at}: hours must be null (closed all day) or { opens, closes }`);
        else {
          for (const k of Object.keys(c.hours)) if (!["opens", "closes"].includes(k)) fail(`${at}: hours: unknown key "${k}"`);
          if (typeof c.hours.opens !== "string" || !TIME.test(c.hours.opens) || typeof c.hours.closes !== "string" || !TIME.test(c.hours.closes)) fail(`${at}: hours must be HH:MM, minutes 00, 15, 30 or 45`);
          else if (c.hours.opens >= c.hours.closes) fail(`${at}: hours: opens must be before closes`);
          else if (c.hours.opens < "06:00" || c.hours.closes > "23:00") fail(`${at}: hours must be within 06:00 to 23:00`);
        }
      }
      if (!["live", "withdrawn"].includes(c.status)) fail(`${at}: status must be live or withdrawn`);
      else if (c.status === "live" && isDate(c.from) && isDate(c.to)) {
        for (const o of live) if (c.from <= o.to && o.from <= c.to) fail(`${at}: overlaps live closure ${o.code}`);
        live.push(c);
      }
    }
  }
}
finish(`closures.json OK: ${Array.isArray(data?.closures) ? data.closures.length : 0} entries`);
