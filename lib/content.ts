// Reads the copy in content/*.md at build time (server components only) and
// fills {{placeholders}} from lib/site.ts and data/services.json. The markdown
// is the single source of customer-facing words; nothing is retyped in code.
import { readFileSync } from "node:fs";
import path from "node:path";
import { DEPOSIT_LABEL, SITE, hoursSentence } from "@/lib/site";
import { menuCheckedDate } from "@/lib/services";

const CONTENT_DIR = path.join(process.cwd(), "content");

export interface Action {
  kind: "button" | "link";
  variant?: string; // primary | secondary | ghost | ghost on plum | icon
  tag?: string;
  label: string;
  href?: string;
}

export interface Sub {
  h3: string;
  paras: string[];
  bullets: string[];
  actions: Action[];
}

export interface Block {
  id: string;
  images: string[];
  eyebrow?: string;
  lead?: string;
  caption?: string;
  small?: string;
  h1?: string;
  h2?: string;
  paras: string[];
  bullets: string[];
  actions: Action[];
  subs: Sub[];
  /** Every non-empty source line, for the few places that need them verbatim. */
  lines: string[];
}

export interface Doc {
  fm: Record<string, string | string[]>;
  sections: Record<string, Block>;
  /** Content outside any `## id` section (privacy.md, not-found.md). */
  preamble: Block;
}

function unquote(v: string): string {
  const t = v.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) return t.slice(1, -1);
  return t;
}

function parseFrontMatter(src: string): { fm: Doc["fm"]; body: string } {
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(src);
  if (!m) return { fm: {}, body: src };
  const fm: Doc["fm"] = {};
  for (const line of m[1].split("\n")) {
    const kv = /^([A-Za-z0-9_]+):\s*(.*)$/.exec(line);
    if (!kv) continue;
    const v = kv[2].trim();
    if (v.startsWith("[") && v.endsWith("]")) {
      fm[kv[1]] = v
        .slice(1, -1)
        .split(",")
        .map((s) => unquote(s))
        .filter(Boolean);
    } else fm[kv[1]] = unquote(v);
  }
  return { fm, body: src.slice(m[0].length) };
}

const ACTION_RE = /^-\s+(Button|Link|Link under the cards|Icon button)(?:\s*\(([^)]*)\))?\s*:\s*(.*)$/;

function parseAction(line: string): Action | null {
  const m = ACTION_RE.exec(line);
  if (!m) return null;
  const [, type, paren = "", rest] = m;
  const tagM = /tag\s+([A-Z]{1,2})/.exec(paren);
  const variant = paren.replace(/,?\s*tag\s+[A-Z]{1,2}/, "").trim() || undefined;
  const [label, href] = rest.split(/\s+->\s+/);
  return {
    kind: type.startsWith("Link") ? "link" : "button",
    variant: type === "Icon button" ? "icon" : variant,
    tag: tagM?.[1],
    label: label.trim(),
    href: href?.trim(),
  };
}

function emptyBlock(id: string): Block {
  return { id, images: [], paras: [], bullets: [], actions: [], subs: [], lines: [] };
}

function parseBlock(id: string, lines: string[]): Block {
  const b = emptyBlock(id);
  let sub: Sub | null = null;
  let buf: string[] = [];
  const flush = () => {
    if (!buf.length) return;
    const text = buf.join(" ").trim();
    buf = [];
    if (!text) return;
    (sub ? sub.paras : b.paras).push(text);
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flush();
      continue;
    }
    b.lines.push(line);
    let m: RegExpExecArray | null;
    if ((m = /^\[image:\s*([a-z0-9-]+)\]/.exec(line))) {
      flush();
      b.images.push(m[1]);
    } else if ((m = /^###\s+(.*)$/.exec(line))) {
      flush();
      sub = { h3: m[1].trim(), paras: [], bullets: [], actions: [] };
      b.subs.push(sub);
    } else if ((m = /^##\s+(.*)$/.exec(line))) {
      flush();
      b.h2 = m[1].trim();
    } else if ((m = /^#\s+(.*)$/.exec(line))) {
      flush();
      b.h1 = m[1].trim();
    } else if ((m = /^Eyebrow:\s*(.*)$/.exec(line))) {
      flush();
      b.eyebrow = m[1].trim();
    } else if ((m = /^Lead:\s*(.*)$/.exec(line))) {
      flush();
      b.lead = m[1].trim();
    } else if ((m = /^Caption:\s*(.*)$/.exec(line))) {
      flush();
      b.caption = m[1].trim();
    } else if ((m = /^Small line:\s*(.*)$/.exec(line))) {
      flush();
      b.small = m[1].trim();
    } else if (line.startsWith("- ")) {
      flush();
      const a = parseAction(line);
      if (a) (sub ?? b).actions.push(a);
      else (sub ?? b).bullets.push(line.slice(2).trim());
    } else {
      buf.push(line.trim());
    }
  }
  flush();
  return b;
}

// `## hero`, or `## sticky-bar (phones only)`; real headings have capitals or spaces.
const SECTION_ID_RE = /^##\s+([a-z0-9]+(?:-[a-z0-9]+)*)(?:\s+\([^)]*\))?\s*$/;

const cache = new Map<string, Doc>();

export function loadDoc(relPath: string): Doc {
  const hit = cache.get(relPath);
  if (hit) return hit;
  const src = readFileSync(path.join(CONTENT_DIR, relPath), "utf8");
  const { fm, body } = parseFrontMatter(src);
  const sections: Record<string, Block> = {};
  const pre: string[] = [];
  let cur: { id: string; lines: string[] } | null = null;
  const done = () => {
    if (cur) sections[cur.id] = parseBlock(cur.id, cur.lines);
  };
  for (const line of body.split("\n")) {
    const m = SECTION_ID_RE.exec(line);
    if (m) {
      done();
      cur = { id: m[1], lines: [] };
    } else if (cur) cur.lines.push(line);
    else pre.push(line);
  }
  done();
  const doc: Doc = { fm, sections, preamble: parseBlock("preamble", pre) };
  cache.set(relPath, doc);
  return doc;
}

/**
 * Actions that close a section. A button written after the last `###` block
 * belongs to the section, not to that block, so they are read from both places.
 */
export function trailingActions(block: Block): Action[] {
  return [...block.actions, ...(block.subs[block.subs.length - 1]?.actions ?? [])];
}

export function fmString(doc: Doc, key: string): string {
  const v = doc.fm[key];
  if (typeof v !== "string") throw new Error(`front matter "${key}" missing`);
  return v;
}

export function section(doc: Doc, id: string): Block {
  const s = doc.sections[id];
  if (!s) throw new Error(`content section "${id}" missing`);
  return s;
}

// ---------------------------------------------------------------- shared files

/** Sections of _booking-terms.md: `## id`-style headings use underscores, so parse by hand. */
function loadTerms() {
  const src = readFileSync(path.join(CONTENT_DIR, "_booking-terms.md"), "utf8");
  const out: Record<string, string> = {};
  const part = (name: string) => {
    const re = new RegExp(`^## ${name}\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, "m");
    const m = re.exec(src);
    if (!m) throw new Error(`_booking-terms.md: ${name} missing`);
    return m[1];
  };
  // short: the last paragraph under booking_terms_short
  const shortParas = part("booking_terms_short")
    .split(/\n\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  out["booking_terms_short"] = shortParas[shortParas.length - 1];
  const full = part("booking_terms_full");
  const fullMap: Record<string, string> = {
    Deposit: "deposit",
    "Paying the rest": "paying",
    "Moving your booking": "moving",
    "Cancelling, or changes at short notice": "cancelling",
  };
  for (const chunk of full.split(/^### /m).slice(1)) {
    const nl = chunk.indexOf("\n");
    const head = chunk.slice(0, nl).trim();
    const key = fullMap[head];
    if (!key) throw new Error(`_booking-terms.md: unexpected heading "${head}"`);
    out[`booking_terms_full.${key}`] = chunk.slice(nl).trim();
  }
  const linesMap: Record<string, string> = { Deposit: "deposit", Paying: "paying", Changes: "changes" };
  for (const l of part("booking_terms_lines").split("\n")) {
    const m = /^- (\w+):\s*(.*)$/.exec(l);
    if (m && linesMap[m[1]]) out[`booking_terms_lines.${linesMap[m[1]]}`] = m[2].trim();
  }
  return out;
}

let termsCache: Record<string, string> | null = null;
export function terms(): Record<string, string> {
  return (termsCache ??= loadTerms());
}

// ------------------------------------------------------------- placeholders

export type Ctx = Record<string, string>;

function resolve(key: string, ctx: Ctx): string {
  if (key in ctx) return ctx[key];
  const t = terms();
  if (key in t) return t[key];
  switch (key) {
    case "hours_sentence":
      return hoursSentence();
    case "address":
      return SITE.address;
    case "phone_display":
      return SITE.phoneDisplay;
    case "phone_tel":
      return `tel:${SITE.phoneE164}`;
    case "email":
      return SITE.email;
    case "maps_url":
      return SITE.mapsUrl;
    case "deposit":
      return DEPOSIT_LABEL;
    case "privacy_updated_date":
      return SITE.privacyUpdated;
    case "menu_checked_date":
      return menuCheckedDate();
    case "year":
      return String(new Date().getFullYear());
  }
  throw new Error(`Unknown placeholder {{${key}}}`);
}

/** Fill every {{placeholder}} (twice, because terms contain {{deposit}}). */
export function fill(text: string, ctx: Ctx = {}): string {
  let out = text;
  for (let i = 0; i < 3 && out.includes("{{"); i++) {
    out = out.replace(/\{\{([a-z0-9_.]+)\}\}/gi, (_m, k: string) => resolve(k, ctx));
  }
  return out;
}

/** Plain text for meta tags and JSON-LD: placeholders filled, *emphasis* marks removed. */
export function plain(text: string, ctx: Ctx = {}): string {
  return fill(text, ctx).replace(/\*([^*]+)\*/g, "$1");
}
