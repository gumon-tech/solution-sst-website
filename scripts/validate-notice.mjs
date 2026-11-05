// Fails the build when data/notice.json is malformed. Written by the shop system (branch shop-agent/notice-*).
// One notice at a time. No rule depends on today's date. Optional argument: another file to check.
import path from "node:path";
import { ROOT, checkPublicText, isDate, isObject, isTimestamp, loadFacts, loadJsonOrExit, makeReporter } from "./lib/public-text.mjs";

const { fail, finish } = makeReporter("data/notice.json");
const data = loadJsonOrExit(process.argv[2] ?? path.join(ROOT, "data/notice.json"), "data/notice.json");
const facts = loadFacts();
const KEYS = ["code", "text", "starts", "ends", "link", "status"];
// The site's own pages (README, "notice"). A new page needs a person to add it here.
export const LINKS = ["/visit/", "/treatments/", "/gift-vouchers/", "/faq/", "/about/", "/careers/"];
const days = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000) + 1;

if (!isObject(data)) fail("file must be an object");
else {
  for (const k of Object.keys(data)) if (!["updated_at", "notice"].includes(k)) fail(`file: unknown key "${k}"`);
  if (!isTimestamp(data.updated_at)) fail("file: updated_at must be like 2026-11-06T09:00:00Z");
  if (!("notice" in data)) fail("file: notice is missing (null when there is none)");
  else if (data.notice !== null) {
    const n = data.notice;
    if (!isObject(n)) fail("notice: must be null or an object");
    else {
      for (const k of KEYS) if (!(k in n)) fail(`notice: missing "${k}"`);
      for (const k of Object.keys(n)) if (!KEYS.includes(k)) fail(`notice: unknown key "${k}"`);
      if (typeof n.code !== "string" || !/^N-[A-Z0-9]{2,20}$/.test(n.code)) fail("notice: code must look like N-7K2Q");
      if (typeof n.text !== "string") fail("notice: text must be a string");
      else {
        if (n.text.length < 20 || n.text.length > 140) fail(`notice: text is ${n.text.length} characters, must be 20 to 140`);
        if (/[\r\n]/.test(n.text)) fail("notice: text must be one line");
        if (n.text.includes("*")) fail("notice: no * (no formatting)");
        // The site is rebuilt nightly, so it cannot carry a same-day message; the bot answers those on WhatsApp.
        if (/\b(today|now|tonight|tomorrow)\b/i.test(n.text)) fail("notice: no today, now, tonight or tomorrow (the site is rebuilt nightly; use dates)");
        for (const m of checkPublicText(n.text, facts, { money: "none" })) fail(`notice: ${m}`);
      }
      if (!isDate(n.starts)) fail("notice: starts must be a date like 2026-12-01");
      if (!isDate(n.ends)) fail("notice: ends must be a date like 2026-12-26");
      if (isDate(n.starts) && isDate(n.ends)) {
        if (n.starts > n.ends) fail("notice: starts is after ends");
        else if (days(n.starts, n.ends) > 62) fail("notice: shown for more than 62 days");
      }
      if (n.link !== null && !LINKS.includes(n.link)) fail(`notice: link must be null or one of ${LINKS.join(" ")}`);
      if (!["live", "ended"].includes(n.status)) fail("notice: status must be live or ended");
    }
  }
}
finish("notice.json OK");
