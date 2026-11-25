// Reads the copy in content/*.md at build time (server components only) and
// fills {{placeholders}} from lib/site.ts and data/services.json. The markdown
// is the single source of customer-facing words; nothing is retyped in code.
// The shop system may replace a fixed list of pieces of it: text slots
// (data/copy.json, slot list scripts/lib/copy-slots.json) and page titles and
// descriptions (data/seo.json, pages scripts/lib/seo-pages.json). A null value
// keeps the markdown, so with every value null the site is the markdown alone.
import { readFileSync } from "node:fs";
import path from "node:path";
import { DEPOSIT_LABEL, SITE, hoursSentence } from "@/lib/site";
import { closuresForBuild } from "@/lib/closures-data";
import { closuresLine } from "@/lib/hours-text";
import { menuCheckedDate } from "@/lib/services";
import copyData from "@/data/copy.json";
import seoData from "@/data/seo.json";
import copySlotList from "@/scripts/lib/copy-slots.json";
import seoPageList from "@/scripts/lib/seo-pages.json";

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

interface CopySlot {
  file: string;
  section?: string;
  field: string;
}
const COPY_SLOTS = copySlotList.slots as Record<string, CopySlot>;
const COPY = copyData.slots as Record<string, string | null>;
const SEO_PAGES = seoPageList.pages as Record<string, string>;
const SEO = seoData.pages as Record<string, { title: string | null; description: string | null }>;

/**
 * Puts the non-null values of data/copy.json and data/seo.json into a parsed file. Every slot's target must exist even
 * when its value is null, so a slot list that no longer matches the markdown is a build error, not a silent no-op.
 */
function applyShopText(relPath: string, doc: Doc): void {
  for (const [key, slot] of Object.entries(COPY_SLOTS)) {
    if (slot.file !== relPath) continue;
    const value = COPY[key] ?? null;
    const where = `copy slot "${key}" (scripts/lib/copy-slots.json) -> ${relPath}`;
    const p = slot.field.split(".");
    if (p[0] === "fm" && p.length === 2) {
      if (typeof doc.fm[p[1]] !== "string") throw new Error(`${where}: front matter "${p[1]}" missing`);
      if (value !== null) doc.fm[p[1]] = value;
      continue;
    }
    const b = slot.section ? doc.sections[slot.section] : undefined;
    if (!b) throw new Error(`${where}: section "${slot.section}" missing`);
    if (p.length === 1 && (p[0] === "eyebrow" || p[0] === "h1" || p[0] === "lead")) {
      const f = p[0];
      if (b[f] === undefined) throw new Error(`${where}: ${f} missing`);
      if (value !== null) b[f] = value;
    } else if (p.length === 2 && p[0] === "paras") {
      const i = Number(p[1]);
      if (!(i < b.paras.length)) throw new Error(`${where}: paragraph ${i} missing`);
      if (value !== null) b.paras[i] = value;
    } else if (p.length === 4 && p[0] === "subs" && p[2] === "paras") {
      const sub = b.subs[Number(p[1])];
      const i = Number(p[3]);
      if (!sub || !(i < sub.paras.length)) throw new Error(`${where}: card ${p[1]} paragraph ${i} missing`);
      if (value !== null) sub.paras[i] = value;
    } else throw new Error(`${where}: unknown field "${slot.field}"`);
  }
  for (const [route, file] of Object.entries(SEO_PAGES)) {
    if (file !== relPath) continue;
    const o = SEO[route];
    if (!o) throw new Error(`data/seo.json: page ${route} missing`);
    for (const k of ["title", "description"] as const) {
      if (typeof doc.fm[k] !== "string") throw new Error(`seo page ${route} -> ${relPath}: front matter "${k}" missing`);
      if (o[k] !== null) doc.fm[k] = o[k];
    }
  }
}

// ------------------------------------------------------------- conditional copy

/**
 * Copy that depends on the site's configuration. In the body, a block between lines that are exactly
 * `{{#if <name>}}` and `{{/if}}`, with an optional `{{else}}`, is kept only when the condition holds
 * (no nesting). In the front matter, `<key>_if_<name>:` replaces `<key>` when the condition holds.
 * google_ads: SITE.googleAds.id is set (the Google Ads tag and cookie banner are on).
 * click_ref: google_ads and SITE.googleAds.clickEndpoint is set (the ad click reference is on, lib/clickref.ts).
 * google_ads_only: google_ads without click_ref.
 */
const CONDITIONS: Record<string, () => boolean> = {
  google_ads: () => SITE.googleAds.id !== "",
  click_ref: () => SITE.googleAds.id !== "" && SITE.googleAds.clickEndpoint !== "",
  google_ads_only: () => SITE.googleAds.id !== "" && SITE.googleAds.clickEndpoint === "",
};

function condition(relPath: string, name: string): boolean {
  const c = CONDITIONS[name];
  if (!c) throw new Error(`${relPath}: unknown condition "${name}"`);
  return c();
}

function applyConditions(relPath: string, fm: Doc["fm"], body: string): string {
  for (const key of Object.keys(fm)) {
    const m = /^(.+)_if_([a-z0-9_]+)$/.exec(key);
    if (!m) continue;
    if (condition(relPath, m[2])) fm[m[1]] = fm[key];
    delete fm[key];
  }
  const out: string[] = [];
  let state: { keep: boolean; inElse: boolean } | null = null;
  body.split("\n").forEach((line, i) => {
    const t = line.trim();
    const open = /^\{\{#if ([a-z0-9_]+)\}\}$/.exec(t);
    if (open) {
      if (state) throw new Error(`${relPath}:${i + 1}: nested {{#if}}`);
      state = { keep: condition(relPath, open[1]), inElse: false };
    } else if (t === "{{else}}") {
      if (!state || state.inElse) throw new Error(`${relPath}:${i + 1}: {{else}} without {{#if}}`);
      state = { keep: !state.keep, inElse: true };
    } else if (t === "{{/if}}") {
      if (!state) throw new Error(`${relPath}:${i + 1}: {{/if}} without {{#if}}`);
      state = null;
    } else if (!state || state.keep) out.push(line);
  });
  if (state) throw new Error(`${relPath}: {{#if}} without {{/if}}`);
  return out.join("\n");
}

export function loadDoc(relPath: string): Doc {
  const hit = cache.get(relPath);
  if (hit) return hit;
  const src = readFileSync(path.join(CONTENT_DIR, relPath), "utf8");
  const { fm, body: rawBody } = parseFrontMatter(src);
  const body = applyConditions(relPath, fm, rawBody);
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
  applyShopText(relPath, doc);
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
    "Marketing messages": "marketing",
  };
  for (const chunk of full.split(/^### /m).slice(1)) {
    const nl = chunk.indexOf("\n");
    const head = chunk.slice(0, nl).trim();
    const key = fullMap[head];
    if (!key) throw new Error(`_booking-terms.md: unexpected heading "${head}"`);
    out[`booking_terms_full.${key}`] = chunk.slice(nl).trim();
  }
  for (const l of part("marketing_notice").split("\n")) {
    const m = /^- (Sentence):\s*(.*)$/.exec(l);
    if (m) out[`marketing_notice.${m[1].toLowerCase()}`] = m[2].trim();
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
    case "closures_line":
      return closuresLine(closuresForBuild());
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
    case "click_retention":
      return SITE.googleAds.clickRetention;
    case "click_log_retention":
      return SITE.googleAds.clickLogRetention;
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
