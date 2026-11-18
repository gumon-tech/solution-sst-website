// Fails the build when data/seo.json is malformed. Written by the shop system (branch shop-agent/seo-*).
// {"updated_at": ..., "pages": {"<route>": {"title": null | "...", "description": null | "..."}}}: exactly the routes of
// scripts/lib/seo-pages.json; null keeps the page's front matter. No rule depends on today's date. Optional argument: another file.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { ROOT, isObject, isTimestamp, loadFacts, loadJsonOrExit, makeReporter } from "./lib/public-text.mjs";
import { checkSlotText, serviceNames } from "./lib/copy-rules.mjs";

const { fail, finish } = makeReporter("data/seo.json");
const data = loadJsonOrExit(process.argv[2] ?? path.join(ROOT, "data/seo.json"), "data/seo.json");
const facts = loadFacts();
const names = serviceNames();
const pages = JSON.parse(readFileSync(path.join(ROOT, "scripts/lib/seo-pages.json"), "utf8")).pages;
// Google shows about 60 characters of a title and 155 of a description.
export const LIMITS = { title: { min: 10, max: 60, title: true }, description: { min: 50, max: 155 } };

for (const [route, file] of Object.entries(pages)) {
  const f = path.join(ROOT, "content", file);
  if (!existsSync(f)) fail(`seo-pages.json: ${route} -> content/${file} missing`);
  else if (!/^title:/m.test(readFileSync(f, "utf8")) || !/^description:/m.test(readFileSync(f, "utf8"))) fail(`seo-pages.json: content/${file} has no title or description front matter`);
  if (/privacy|_booking-terms|README/.test(file)) fail(`seo-pages.json: ${file} is never changed by the shop system`);
}

if (!isObject(data)) fail("file must be an object");
else {
  for (const k of Object.keys(data)) if (!["updated_at", "pages"].includes(k)) fail(`file: unknown key "${k}"`);
  if (!isTimestamp(data.updated_at)) fail("file: updated_at must be like 2026-11-06T09:00:00Z");
  if (!isObject(data.pages)) fail("file: pages must be an object");
  else {
    for (const r of Object.keys(pages)) if (!(r in data.pages)) fail(`pages: "${r}" missing (every page is present, with null values when unused)`);
    for (const [r, o] of Object.entries(data.pages)) {
      if (!(r in pages)) {
        fail(`pages: unknown page "${r}" (the list is scripts/lib/seo-pages.json, changed by a person)`);
        continue;
      }
      if (!isObject(o)) {
        fail(`pages.${r}: must be {"title": ..., "description": ...}`);
        continue;
      }
      for (const k of Object.keys(o)) if (!(k in LIMITS)) fail(`pages.${r}: unknown key "${k}"`);
      for (const [k, lim] of Object.entries(LIMITS)) {
        if (!(k in o)) fail(`pages.${r}: "${k}" missing (null keeps the page's own)`);
        else if (o[k] !== null) for (const m of checkSlotText(o[k], facts, names, lim)) fail(`pages.${r}.${k}: ${m}`);
      }
    }
  }
}
finish("seo.json OK");
