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
  
  tagline: "Traditional Thai massage in Greenwich, Cutty Sark, London SE8.",

  streetAddress: "Unit 89 Corbridge Court, Glaisher Street",
  locality: "London",
  region: "Greater London",
  postalCode: "SE8 3ET",
  country: "GB",
  /** Rendered everywhere the address is shown in one line. */
  address: "Unit 89 Corbridge Court, Glaisher Street, London SE8 3ET",
  geo: { latitude: 51.48263, longitude: -0.01891 },

  phoneDisplay: "07903 653786",
  phoneE164: "+447903653786",
  /** wa.me wants digits only. */
  whatsappNumber: "447903653786",
  email: "srisiamthaitherapy@gmail.com",
  mapsUrl: "https://maps.google.com/?cid=11019503144234088145",

  /** Pounds. Rendered "£15" via depositLabel(). */
  depositGbp: 15,

  /**
   * Google Ads tag (gtag.js), behind the cookie banner (components/CookieConsent.tsx, lib/consent.ts).
   * id "" = off: no banner, no "Cookie settings" control, nothing from Google; the banner code is not
   * even built (next.config.mjs reads this id). id set (AW-<digits>, the shop's Google Ads tag id):
   * the banner asks first and gtag.js is requested only after Accept. conversionLabel "" = no
   * conversion event on WhatsApp clicks. The privacy notice switches with it ({{#if google_ads}}).
   */
  googleAds: {
    id: "AW-18595100523" as string,
    conversionLabel: "pffiCJ7Po78dEOvu6qJF" as string,
    /** Value sent with each WhatsApp-click conversion, as set on the Ads conversion action "WhatsApp chat start (web)" (KMKT, 25 Nov 2026). */
    conversionValue: 1,
    currency: "GBP",
    /**
     * Ad click reference ("option B", lib/clickref.ts). "" = off: nothing of it is built, messages from an ad
     * visit end [web-AD] and the privacy notice and banner keep today's words ({{#if click_ref}}). Set to this
     * shop's own bot address (https, write-only route that always answers 204) to turn it on: then, on a visit
     * that landed with gclid, gbraid or wbraid and only after Accept, WhatsApp messages end [web-AD-<8-char code>]
     * and a WhatsApp press posts the code and the click reference there (once per page load). Needs id set.
     * Never another shop's address. next.config.mjs reads it into NEXT_PUBLIC_CLICK_REF_ENDPOINT.
     */
    clickEndpoint: "https://sst-shop-agent.gumon.io/m/click" as string,
    /**
     * This shop's id, equal to the bot's SHOP_ID (shop-agent shop id; check-site pins it): sent as "site", mixed into
     * the code and the consent text version, and must appear in clickEndpoint's host or path. Up to 20 of a-z 0-9 -.
     */
    siteId: "sst",
    /**
     * When the bot deletes a click reference, completing the privacy-notice sentence "We delete the ad click
     * reference ...". Values from KBOT (25 Nov 2026); change them only together with the bot.
     * check-site fails while clickEndpoint is set and this is still "TBC".
     */
    clickRetention: "within 8 days if you do not message us, otherwise 90 days after your visit or sooner once it has been reported to Google" as string,
    /**
     * What happens to the IP address and browser details in the hosting's logs, completing the notice sentence
     * "It uses your IP address only briefly to prevent abuse and does not store it with the click reference; ...",
     * e.g. "the hosting service's request logs keep them for 14 days". From KBOT 25 Nov 2026: ingress access logs (IP, user-agent, time, path, status; no body) kept 365 days in Loki on rigel. check-site fails
     * while clickEndpoint is set and this is still "TBC".
     */
    clickLogRetention: "separately, its server security logs, which include IP address and browser type, are kept for 12 months" as string,
  },

  /** Date the privacy notice text last changed. */
  privacyUpdated: "25 November 2026",
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
