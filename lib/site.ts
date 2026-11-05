// The one place the shop's facts live. Everything on the site that states an
// address, a phone number, opening hours or the deposit reads it from here.
import hoursFile from "@/data/hours.json";
import { DAYS, hoursCompactLines, hoursText, type Day, type WeekHours } from "@/lib/hours-text";

export const SITE = {
  /**
   * ONE switch. false: every page carries noindex, nofollow and robots.txt
   * disallows everything. true: pages are indexable, robots.txt allows
   * crawling and points at the sitemap. sitemap.xml is generated either way.
   */
  indexable: true,

  url: "https://srisiamthaitherapyandwellness.co.uk",
  /** Wix Payment Links for the £15 deposit; switch to https://pay.<domain>/_paylink once pay. is connected to the Wix site. */
  wixPaylinkBase: "https://srisiamthaitherapy.wixsite.com/sri-siam-thai-therap/_paylink",
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
  /** builtBy in the footer links here. */
  builtByUrl: "https://gumon.io",
} as const;

export const DEPOSIT_LABEL = `£${SITE.depositGbp}`;

export { DAYS };
export type { Day };

/** Open/close per day; null means closed. From data/hours.json (written by the shop system, validated by scripts/validate-hours.mjs). */
export const HOURS: WeekHours = (hoursFile as { hours: WeekHours }).hours;

/** "Open Tuesday to Sunday, 11:00 to 19:00. Closed on Mondays." Rules and examples: README, "The sentences". */
export function hoursSentence(): string {
  return hoursText(HOURS);
}

/** Footer lines: "Mon Closed", "Tue–Sun 11:00–19:00". */
export function hoursCompact(): string[] {
  return hoursCompactLines(HOURS);
}

export function absoluteUrl(path: string): string {
  return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}
