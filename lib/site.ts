// The one place the shop's facts live. Everything on the site that states an
// address, a phone number, opening hours or the deposit reads it from here.

export const SITE = {
  /**
   * ONE switch. false: every page carries noindex, nofollow and robots.txt
   * disallows everything. true: pages are indexable, robots.txt allows
   * crawling and points at the sitemap. sitemap.xml is generated either way.
   */
  indexable: false,

  url: "https://sst.gumon.io",
  name: "Sri Siam Thai Therapy & Wellness",
  shortName: "Sri Siam",
  tagline: "Traditional Thai massage in Greenwich, London SE8.",

  streetAddress: "Unit 89 Corbridge Court, Glaisher Street",
  locality: "London",
  region: "Greater London",
  postalCode: "SE8 3ET",
  country: "GB",
  /** Rendered everywhere the address is shown in one line. */
  address: "Unit 89 Corbridge Court, Glaisher Street, Greenwich, London SE8 3ET",
  geo: { latitude: 51.48263, longitude: -0.01891 },

  phoneDisplay: "07903 653786",
  phoneE164: "+447903653786",
  /** wa.me wants digits only. */
  whatsappNumber: "447903653786",
  email: "srisiamthaitherapy@gmail.com",
  mapsUrl: "https://maps.google.com/?cid=11019503144234088145",

  /** Pounds. Rendered "£15" via depositLabel(). */
  depositGbp: 15,

  /** Date the privacy notice text last changed. */
  privacyUpdated: "31 October 2026",
  /** Shown in the footer legal line. */
  builtBy: "Gumon Technology",
} as const;

export const DEPOSIT_LABEL = `£${SITE.depositGbp}`;

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
export type Day = (typeof DAYS)[number];

/** Open/close per day; null means closed. Confirmed 2026-10-31. */
export const HOURS: Record<Day, { opens: string; closes: string } | null> = {
  Monday: null,
  Tuesday: { opens: "11:00", closes: "19:00" },
  Wednesday: { opens: "11:00", closes: "19:00" },
  Thursday: { opens: "11:00", closes: "19:00" },
  Friday: { opens: "11:00", closes: "19:00" },
  Saturday: { opens: "11:00", closes: "19:00" },
  Sunday: { opens: "11:00", closes: "19:00" },
};

/** "Open Tuesday to Sunday, 11:00 to 19:00. Closed on Mondays." built from HOURS. */
export function hoursSentence(): string {
  const open = DAYS.filter((d) => HOURS[d]);
  const closed = DAYS.filter((d) => !HOURS[d]);
  const same = open.every((d) => HOURS[d]!.opens === HOURS[open[0]]!.opens && HOURS[d]!.closes === HOURS[open[0]]!.closes);
  const first = HOURS[open[0]]!;
  const range = open.length > 1 ? `${open[0]} to ${open[open.length - 1]}` : open[0];
  const hours = same ? `${first.opens} to ${first.closes}` : "see the table";
  const closedText = closed.length ? ` Closed on ${closed.map((d) => `${d}s`).join(" and ")}.` : "";
  return `Open ${range}, ${hours}.${closedText}`;
}

/** Compact one-liner for the footer: "Mon Closed · Tue–Sun 11:00–19:00". */
export function hoursCompact(): string[] {
  const short = (d: string) => d.slice(0, 3);
  const open = DAYS.filter((d) => HOURS[d]);
  const closed = DAYS.filter((d) => !HOURS[d]);
  const parts: string[] = [];
  if (closed.length) parts.push(`${closed.map(short).join(", ")} Closed`);
  if (open.length) {
    const h = HOURS[open[0]]!;
    parts.push(`${short(open[0])}–${short(open[open.length - 1])} ${h.opens}–${h.closes}`);
  }
  return parts;
}

export function absoluteUrl(path: string): string {
  return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}
