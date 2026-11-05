// Fails the build when data/faq-extra.json is malformed. Written by the shop system (branch shop-agent/faq-extra-*).
// Extra questions only; the core FAQ in content/faq.md is never edited by the system. No rule depends on today's date.
import { readFileSync } from "node:fs";
import path from "node:path";
import { ROOT, checkPublicText, isObject, isTimestamp, loadFacts, loadJsonOrExit, makeReporter } from "./lib/public-text.mjs";

const { fail, finish } = makeReporter("data/faq-extra.json");
const data = loadJsonOrExit(process.argv[2] ?? path.join(ROOT, "data/faq-extra.json"), "data/faq-extra.json");
const facts = loadFacts();
const KEYS = ["code", "question", "answer", "status"];
const MAX_LIVE = 8;
const MAX_TOTAL = 40;
// On top of the shared list: the topics whose wording is legal exposure and lives only in content/*.md.
const BLOCKED = /\b(pregnan\w*|doctor\w*|medic\w*|condition\w*|deposit\w*|cancel\w*|refund\w*|voucher\w*|prices?|pricing|cost\w*)\b/i;
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const coreQuestions = new Set(
  readFileSync(path.join(ROOT, "content/faq.md"), "utf8")
    .split("\n")
    .filter((l) => l.startsWith("### "))
    .map((l) => norm(l.slice(4))),
);

if (!isObject(data)) fail("file must be an object");
else {
  for (const k of Object.keys(data)) if (!["updated_at", "questions"].includes(k)) fail(`file: unknown key "${k}"`);
  if (!isTimestamp(data.updated_at)) fail("file: updated_at must be like 2026-11-06T09:00:00Z");
  if (!Array.isArray(data.questions)) fail("file: questions must be an array");
  else {
    if (data.questions.length > MAX_TOTAL) fail(`file: at most ${MAX_TOTAL} questions`);
    if (data.questions.filter((q) => q?.status === "live").length > MAX_LIVE) fail(`file: at most ${MAX_LIVE} live questions`);
    const codes = new Set();
    const seen = new Set();
    for (const [i, q] of data.questions.entries()) {
      const at = `questions[${i}]${q?.code ? ` (${q.code})` : ""}`;
      if (!isObject(q)) {
        fail(`${at}: must be an object`);
        continue;
      }
      for (const k of KEYS) if (!(k in q)) fail(`${at}: missing "${k}"`);
      for (const k of Object.keys(q)) if (!KEYS.includes(k)) fail(`${at}: unknown key "${k}"`);
      if (typeof q.code !== "string" || !/^Q-[A-Z0-9]{2,20}$/.test(q.code)) fail(`${at}: code must look like Q-2BX9`);
      else if (codes.has(q.code)) fail(`${at}: code repeats`);
      else codes.add(q.code);
      if (typeof q.question !== "string" || q.question.length < 10 || q.question.length > 100 || !q.question.endsWith("?") || /[\r\n]/.test(q.question)) fail(`${at}: question must be one line of 10 to 100 characters ending in ?`);
      else {
        const nq = norm(q.question);
        if (coreQuestions.has(nq)) fail(`${at}: question repeats one in content/faq.md`);
        if (seen.has(nq)) fail(`${at}: question repeats another extra question`);
        seen.add(nq);
      }
      if (typeof q.answer !== "string" || q.answer.length < 20 || q.answer.length > 400) fail(`${at}: answer must be 20 to 400 characters`);
      else if (/[\r\n]/.test(q.answer)) fail(`${at}: answer must be one paragraph`);
      if (!["live", "hidden"].includes(q.status)) fail(`${at}: status must be live or hidden`);
      for (const t of [q.question, q.answer].filter((x) => typeof x === "string")) {
        if (t.includes("{{")) fail(`${at}: no {{placeholders}}`);
        if (t.includes("*")) fail(`${at}: no * (no formatting)`);
        if (BLOCKED.test(t)) fail(`${at}: "${t.match(BLOCKED)[0]}" belongs to the booking terms or the services, which the system may not write about`);
        for (const m of checkPublicText(t, facts, { money: "none" })) fail(`${at}: ${m}`);
      }
    }
  }
}
finish(`faq-extra.json OK: ${Array.isArray(data?.questions) ? data.questions.length : 0} questions`);
