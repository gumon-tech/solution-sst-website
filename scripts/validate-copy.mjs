// Fails the build when data/copy.json is malformed. Written by the shop system (branch shop-agent/copy-*).
// {"updated_at": ..., "slots": {"<slot>": null | "<text>"}}: exactly the slots of scripts/lib/copy-slots.json, each null (the
// markdown in content/*.md stays) or plain text that replaces that one piece of copy. No rule depends on today's date.
// Optional argument: another file to check.
import { existsSync } from "node:fs";
import path from "node:path";
import { ROOT, isObject, isTimestamp, loadFacts, loadJsonOrExit, makeReporter } from "./lib/public-text.mjs";
import { checkSlotText, serviceNames } from "./lib/copy-rules.mjs";
import { currentText, loadSlots } from "./lib/copy-text.mjs";

const { fail, finish } = makeReporter("data/copy.json");
const data = loadJsonOrExit(process.argv[2] ?? path.join(ROOT, "data/copy.json"), "data/copy.json");
const facts = loadFacts();
const names = serviceNames();
const slots = loadSlots();
export const MIN = { line: 2, paragraph: 20 };

// The slot list itself (a human file): every slot points at markdown text that exists.
for (const [key, s] of Object.entries(slots)) {
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+){2}$/.test(key)) fail(`copy-slots.json: slot "${key}" must be <page>.<part>.<name>`);
  if (!["line", "paragraph"].includes(s.kind) || !Number.isInteger(s.max)) fail(`copy-slots.json: ${key} needs kind line|paragraph and an integer max`);
  if (!existsSync(path.join(ROOT, "content", s.file ?? ""))) fail(`copy-slots.json: ${key} file content/${s.file} missing`);
  else if (typeof currentText(s) !== "string") fail(`copy-slots.json: ${key} points at ${s.file} ${s.section ?? ""} ${s.field}, which does not exist`);
  else if (/^(privacy|_booking-terms|README)\.md$/.test(s.file)) fail(`copy-slots.json: ${key} points into ${s.file}, which the shop system never changes`);
  else if (/\{\{\s*(deposit|booking_terms)/.test(currentText(s))) fail(`copy-slots.json: ${key} holds booking-terms wording`);
}

if (!isObject(data)) fail("file must be an object");
else {
  for (const k of Object.keys(data)) if (!["updated_at", "slots"].includes(k)) fail(`file: unknown key "${k}"`);
  if (!isTimestamp(data.updated_at)) fail("file: updated_at must be like 2026-11-06T09:00:00Z");
  if (!isObject(data.slots)) fail("file: slots must be an object");
  else {
    for (const k of Object.keys(slots)) if (!(k in data.slots)) fail(`slots: "${k}" missing (every slot is present, null when unused)`);
    for (const [k, v] of Object.entries(data.slots)) {
      const s = slots[k];
      if (!s) {
        fail(`slots: unknown slot "${k}" (the list is scripts/lib/copy-slots.json, changed by a person)`);
        continue;
      }
      if (v === null) continue;
      for (const m of checkSlotText(v, facts, names, { min: MIN[s.kind] ?? 2, max: s.max })) fail(`slots.${k}: ${m}`);
    }
  }
}
finish("copy.json OK");
