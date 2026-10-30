// Reads data/services.json, the only source of treatment names, groups,
// lengths and prices. Row order in the file is the order on the site.
import data from "@/data/services.json";

export interface ServiceRow {
  group: string;
  slug: string;
  name: string;
  option: string;
  duration_min: number;
  price_gbp: number;
}

export interface Treatment {
  slug: string;
  name: string;
  group: string;
  rows: ServiceRow[];
  fromPrice: number;
}

export interface Group {
  name: string;
  anchor: string;
  treatments: Treatment[];
}

export const SERVICE_ROWS: ServiceRow[] = data.services as ServiceRow[];
export const MENU_READ_AT: string = data.read_at;

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** 59 -> "59", 39.5 -> "39.50". */
export function formatPrice(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

/** Distinct slugs in file order, each with its rows. */
export const TREATMENTS: Treatment[] = (() => {
  const bySlug = new Map<string, Treatment>();
  for (const r of SERVICE_ROWS) {
    let t = bySlug.get(r.slug);
    if (!t) {
      t = { slug: r.slug, name: r.name, group: r.group, rows: [], fromPrice: r.price_gbp };
      bySlug.set(r.slug, t);
    }
    t.rows.push(r);
    t.fromPrice = Math.min(t.fromPrice, r.price_gbp);
  }
  return [...bySlug.values()];
})();

/** Groups in file order, each with its treatments in file order. */
export const GROUPS: Group[] = (() => {
  const byName = new Map<string, Group>();
  for (const t of TREATMENTS) {
    let g = byName.get(t.group);
    if (!g) {
      g = { name: t.group, anchor: slugify(t.group), treatments: [] };
      byName.set(t.group, g);
    }
    g.treatments.push(t);
  }
  return [...byName.values()];
})();

export function getTreatment(slug: string): Treatment | undefined {
  return TREATMENTS.find((t) => t.slug === slug);
}

/** "30 October 2026" from the ISO timestamp, in London time. */
export function menuCheckedDate(): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/London",
  }).format(new Date(MENU_READ_AT));
}
