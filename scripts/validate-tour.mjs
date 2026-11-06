// Fails the build when data/tour.json (the /tour/ page: crop recipes and every caption and alt) breaks a rule.
// Human-edited file (not written by the shop system). Photos themselves are made by scripts/make-tour-images.mjs.
import { existsSync } from "node:fs";
import path from "node:path";
import { ROOT, checkPublicText, isObject, loadFacts, loadJsonOrExit, makeReporter } from "./lib/public-text.mjs";

const { fail, finish } = makeReporter("data/tour.json");
const data = loadJsonOrExit(path.join(ROOT, "data/tour.json"), "data/tour.json");
const sizes = loadJsonOrExit(path.join(ROOT, "data/tour-sizes.json"), "data/tour-sizes.json");
const facts = loadFacts();
const KEY = /^[a-z0-9-]{3,30}$/;
// Never named in copy or alt: the shop has not confirmed how it wants the neighbouring business described.
const NEVER = /carnaby/i;

const published = new Map();
const seen = new Set();
if (!Array.isArray(data.photos) || !Array.isArray(data.zones)) fail("needs photos[] and zones[]");
for (const p of data.photos ?? []) {
  if (!isObject(p) || !KEY.test(p.key ?? "")) {
    fail(`photo key ${JSON.stringify(p?.key)} is not [a-z0-9-]{3,30}`);
    continue;
  }
  if (seen.has(p.key)) fail(`duplicate photo key ${p.key}`);
  seen.add(p.key);
  // Originals are not in git (public repo): they live in Gumon's OneDrive, and a local copy sits in the
  // gitignored assets/photos/original/. Check the file only where that copy exists (not in CI).
  if (!/^\d{4}-\d{2}-\d{2}\/[a-z0-9-]+\.jpg$/.test(p.source ?? "")) fail(`${p.key}: source must be <date>/<name>.jpg`);
  else if (existsSync(path.join(ROOT, "assets/photos/original", p.source.split("/")[0])) && !existsSync(path.join(ROOT, "assets/photos/original", p.source))) fail(`${p.key}: source ${p.source} not found in assets/photos/original/`);
  if (!Array.isArray(p.crop) || p.crop.length !== 4 || p.crop.some((n) => !Number.isInteger(n))) fail(`${p.key}: crop must be [x, y, w, h] in whole pixels`);
  if (typeof p.edits !== "string" || p.edits.length < 10) fail(`${p.key}: edits needs a one-line description of what was changed`);
  if (p.publish === true) {
    published.set(p.key, p);
    const s = sizes[p.key];
    if (!s) fail(`${p.key}: no entry in data/tour-sizes.json (run node scripts/make-tour-images.mjs)`);
    else for (const w of Object.keys(s)) for (const ext of ["avif", "webp", "jpg"]) if (!existsSync(path.join(ROOT, `public/img/tour/${p.key}-${w}.${ext}`))) fail(`${p.key}: public/img/tour/${p.key}-${w}.${ext} is missing`);
  }
}

const used = new Set();
const check = (what, t, { min = 1, max = 400 } = {}) => {
  if (typeof t !== "string" || t.length < min || t.length > max) return fail(`${what}: needs ${min} to ${max} characters`);
  if (/\n/.test(t)) fail(`${what}: one line only`);
  if (NEVER.test(t)) fail(`${what}: names the neighbouring business`);
  for (const m of checkPublicText(t, facts, { allowTherapist: true, money: "none" })) fail(`${what}: ${m}`);
};
const ids = new Set();
for (const z of data.zones ?? []) {
  if (!/^[a-z0-9-]{3,30}$/.test(z.id ?? "") || ids.has(z.id)) fail(`zone id ${JSON.stringify(z.id)} is missing, malformed or repeated`);
  ids.add(z.id);
  check(`zone ${z.id} kicker`, z.kicker, { max: 40 });
  check(`zone ${z.id} title`, z.title, { max: 60 });
  check(`zone ${z.id} intro`, z.intro, { min: 20, max: 300 });
  if (!Array.isArray(z.shots) || z.shots.length === 0) fail(`zone ${z.id}: no shots`);
  for (const s of z.shots ?? []) {
    if (!published.has(s.photo)) fail(`zone ${z.id}: photo ${s.photo} is not a published photo`);
    if (used.has(s.photo)) fail(`photo ${s.photo} appears twice`);
    used.add(s.photo);
    check(`${s.photo} caption`, s.caption, { min: 10, max: 120 });
    check(`${s.photo} alt`, s.alt, { min: 10, max: 160 });
    if (s.alt === s.caption) fail(`${s.photo}: alt must differ from the caption`);
  }
}
for (const k of published.keys()) if (!used.has(k)) fail(`published photo ${k} is in no zone`);
finish(`data/tour.json OK: ${published.size} photos in ${ids.size} zones`);
