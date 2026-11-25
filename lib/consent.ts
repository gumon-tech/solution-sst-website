// Consent-gated Google Ads tag (gtag.js) with Google Consent Mode v2, basic
// implementation. Shop-neutral on purpose (reused on other shop sites): every
// shop-specific value (Ads id, conversion label, wording) comes from the caller.
//
// Rules this file enforces:
// - Nothing Google-related runs and nothing is requested from Google until
//   grant() is called (a visitor's Accept, now or stored from an earlier visit).
// - The first command ever pushed to dataLayer is the consent default (all
//   denied); gtag.js is requested only after the consent update to granted.
// - Accept means measurement only: ad_storage and ad_user_data are granted;
//   ad_personalization (remarketing) and analytics_storage stay denied.
// - deny() sets everything back to denied, stops conversion events and deletes
//   the Google Ads cookies (and _gcl_ storage) on this domain and its parents.
// - Every access to localStorage is wrapped: if storage fails, there is no
//   stored choice, and a choice that cannot be saved loads nothing.

export type Choice = "granted" | "denied";

/** Per-origin, so the same key is safe on every shop's own domain. Bump the version to ask everyone again. */
export const CONSENT_STORAGE_KEY = "ads-consent:v1";
/** How long a choice is remembered; after this the banner asks again. Keep the privacy notice in step. */
export const CONSENT_MAX_AGE_DAYS = 182;
/** Google Ads tag ids look like AW-123456789. The same rule is in next.config.mjs and scripts/check-site.mjs. */
export const ADS_ID = /^AW-\d+$/;
/** Ad click references Google adds to a landing address. */
const CLICK_IDS = ["gclid", "gbraid", "wbraid"];

const DAY_MS = 86_400_000;
const AD_KEY = /^(_gcl_|_gac_)/;

const DENIED = {
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  analytics_storage: "denied",
} as const;
// Measurement only (the banner and the privacy notice say so). For remarketing, ad_personalization would be
// "granted" here, and the banner text and the privacy notice would have to say that Google uses it for ads.
const GRANTED = {
  ad_storage: "granted",
  ad_user_data: "granted",
  ad_personalization: "denied",
  analytics_storage: "denied",
} as const;

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

// ---- stored choice ------------------------------------------------------------

export function readChoice(now: number = Date.now()): Choice | null {
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as { choice?: unknown; at?: unknown };
    if (s.choice !== "granted" && s.choice !== "denied") return null;
    if (typeof s.at !== "number" || !Number.isFinite(s.at)) return null;
    if (now - s.at > CONSENT_MAX_AGE_DAYS * DAY_MS || s.at - now > DAY_MS) return null;
    return s.choice;
  } catch {
    return null;
  }
}

/** true only if the choice was saved and reads back the same. */
export function writeChoice(choice: Choice): boolean {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ choice, at: Date.now() }));
  } catch {
    return false;
  }
  return readChoice() === choice;
}

// ---- gtag ------------------------------------------------------------------------

let started = false; // dataLayer exists and the consent default is in it
let loaded = false; // gtag.js was requested in this page
let granted = false; // the visitor's current answer in this page

// The standard gtag snippet: gtag.js reads `arguments` objects from dataLayer, not arrays.
function gtag(..._args: unknown[]): void {
  void _args;
  window.dataLayer = window.dataLayer || [];
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments);
}

function start(): void {
  if (started) return;
  started = true;
  gtag("consent", "default", DENIED);
}

export function isValidAdsId(id: string): boolean {
  return ADS_ID.test(id);
}

/**
 * Accept: consent update to granted, then (once per page) request gtag.js and configure the Ads account.
 * landingUrl: the address the visit opened on; passed as page_location when it carries an ad click
 * reference, so an Accept given after an in-site page change still links the ad click.
 */
export function grant(adsId: string, landingUrl?: string): void {
  if (!isValidAdsId(adsId)) return;
  start();
  gtag("consent", "update", GRANTED);
  granted = true;
  if (loaded) return;
  loaded = true;
  gtag("js", new Date());
  const page = landingUrl && hasClickId(landingUrl) ? landingUrl : null;
  if (page) gtag("config", adsId, { page_location: page });
  else gtag("config", adsId);
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(adsId)}`;
  document.head.appendChild(s);
}

/** Reject or withdraw: consent back to denied (if the tag ever started here), no more events, delete the Ads cookies. */
export function deny(): void {
  granted = false;
  if (started) gtag("consent", "update", DENIED);
  clearAdStorage();
}

function hasClickId(url: string): boolean {
  try {
    const p = new URL(url).searchParams;
    return CLICK_IDS.some((k) => p.has(k));
  } catch {
    return false;
  }
}

/** One conversion, only while the visitor has accepted. Never throws, never waits. */
export function sendConversion(sendTo: string, params: Record<string, string | number>): void {
  if (!granted || !loaded) return;
  try {
    gtag("event", "conversion", { ...params, send_to: sendTo, transport_type: "beacon" });
  } catch {
    // never let measurement get in the way of the click
  }
}

/** Deletes _gcl_* and _gac_* cookies on this host and every parent domain, and _gcl_* keys in web storage. */
export function clearAdStorage(): void {
  try {
    const names = document.cookie
      .split(";")
      .map((c) => c.split("=")[0].trim())
      .filter((n) => AD_KEY.test(n));
    if (names.length) {
      const parts = window.location.hostname.split(".");
      const domains = [""];
      for (let i = 0; i < parts.length - 1; i++) domains.push(parts.slice(i).join("."));
      for (const n of new Set(names)) {
        for (const d of domains) {
          document.cookie = `${n}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; path=/${d ? `; domain=${d}` : ""}`;
        }
      }
    }
  } catch {
    // cookies blocked: nothing to delete
  }
  for (const area of ["localStorage", "sessionStorage"] as const) {
    try {
      const store = window[area];
      const keys: string[] = [];
      for (let i = 0; i < store.length; i++) {
        const k = store.key(i);
        if (k && AD_KEY.test(k)) keys.push(k);
      }
      keys.forEach((k) => store.removeItem(k));
    } catch {
      // storage blocked: nothing to delete
    }
  }
}

/** The source tag of a wa.me link as it is now (after any rewrite): "" if it has none, null if it is not a WhatsApp link. */
export function whatsAppSourceTag(a: HTMLAnchorElement, tagAtEnd: RegExp): string | null {
  try {
    const u = new URL(a.href);
    if (u.hostname !== "wa.me") return null;
    return tagAtEnd.exec(u.searchParams.get("text") ?? "")?.[1] ?? "";
  } catch {
    return null;
  }
}
