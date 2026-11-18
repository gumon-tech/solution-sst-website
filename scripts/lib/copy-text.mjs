// The markdown wording behind each copy slot (scripts/lib/copy-slots.json): what the site shows while data/copy.json has null.
// A small port of the parts of lib/content.ts the slots point at (front matter, ## sections, Eyebrow/Lead lines, # h1,
// paragraphs and ### cards). Used by validate-copy.mjs (every slot must point at text that exists) and by the shop bot:
//   node scripts/lib/copy-text.mjs        prints {"<slot>": "<current markdown text>", ...}
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT } from "./public-text.mjs";

const SECTION_ID_RE = /^##\s+([a-z0-9]+(?:-[a-z0-9]+)*)(?:\s+\([^)]*\))?\s*$/;

function parseFrontMatter(src) {
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(src);
  if (!m) return { fm: {}, body: src };
  const fm = {};
  for (const line of m[1].split("\n")) {
    const kv = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line);
    if (!kv) continue;
    const v = kv[2].trim();
    fm[kv[1]] = v.startsWith("[") && v.endsWith("]") ? v : v.replace(/^"(.*)"$|^'(.*)'$/, "$1$2");
  }
  return { fm, body: src.slice(m[0].length) };
}

function parseBlock(lines) {
  const b = { paras: [], subs: [] };
  let sub = null;
  let buf = [];
  const flush = () => {
    const text = buf.join(" ").trim();
    buf = [];
    if (text) (sub ? sub.paras : b.paras).push(text);
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flush();
      continue;
    }
    let m;
    if (/^\[image:\s*([a-z0-9-]+)\]/.test(line)) flush();
    else if ((m = /^###\s+(.*)$/.exec(line))) {
      flush();
      sub = { h3: m[1].trim(), paras: [] };
      b.subs.push(sub);
    } else if (/^##\s+/.test(line)) flush();
    else if ((m = /^#\s+(.*)$/.exec(line))) {
      flush();
      b.h1 = m[1].trim();
    } else if ((m = /^(Eyebrow|Lead|Caption|Small line):\s*(.*)$/.exec(line))) {
      flush();
      if (m[1] === "Eyebrow") b.eyebrow = m[2].trim();
      if (m[1] === "Lead") b.lead = m[2].trim();
    } else if (line.startsWith("- ")) flush(); // a bullet or a button
    else buf.push(line.trim());
  }
  flush();
  return b;
}

const docs = new Map();
export function loadDoc(rel, root = ROOT) {
  const key = `${root}|${rel}`;
  if (docs.has(key)) return docs.get(key);
  const { fm, body } = parseFrontMatter(readFileSync(path.join(root, "content", rel), "utf8"));
  const sections = {};
  let cur = null;
  for (const line of body.split("\n")) {
    const m = SECTION_ID_RE.exec(line);
    if (m) sections[(cur = m[1])] = [];
    else if (cur) sections[cur].push(line);
  }
  const doc = { fm, sections: Object.fromEntries(Object.entries(sections).map(([id, l]) => [id, parseBlock(l)])) };
  docs.set(key, doc);
  return doc;
}

/** The markdown text a slot replaces, or undefined when its target does not exist. */
export function currentText(spec, root = ROOT) {
  const doc = loadDoc(spec.file, root);
  if (spec.field.startsWith("fm.")) return doc.fm[spec.field.slice(3)];
  const b = doc.sections[spec.section];
  if (!b) return undefined;
  const p = spec.field.split(".");
  if (p.length === 1 && ["eyebrow", "h1", "lead"].includes(p[0])) return b[p[0]];
  if (p.length === 2 && p[0] === "paras") return b.paras[Number(p[1])];
  if (p.length === 4 && p[0] === "subs" && p[2] === "paras") return b.subs[Number(p[1])]?.paras[Number(p[3])];
  return undefined;
}

export function loadSlots(root = ROOT) {
  return JSON.parse(readFileSync(path.join(root, "scripts/lib/copy-slots.json"), "utf8")).slots;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const slots = loadSlots();
  console.log(JSON.stringify(Object.fromEntries(Object.entries(slots).map(([k, s]) => [k, currentText(s) ?? null])), null, 2));
}
