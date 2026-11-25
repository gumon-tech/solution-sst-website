// Ad click reference ("option B" of the full-loop design, Appendix A). On a visit that landed from a Google ad
// with gclid, gbraid or wbraid, and only while the visitor has accepted on the cookie banner, every WhatsApp
// message ends [web-AD-<code>] instead of [web-AD], and a WhatsApp press posts the code and Google's click
// reference to this shop's own bot, which uses them to report bookings from the ad to Google Ads.
//
// Shop-neutral (copied to the other shop sites): the endpoint, the site id, the consent text version and the ad
// tag come from the caller (components/AdSource.tsx, from lib/site.ts and content/_shared.md through
// next.config.mjs). Loaded only by AdSource, only on an ad visit, and built only while
// lib/site.ts googleAds.clickEndpoint is set.
//
// Rules this file enforces:
// - No code is shown and nothing is sent unless consent holds (the stored choice is Accept, read fresh through
//   lib/consent.ts under the key for the current banner text version; Accept is measurement only) and the
//   landing address carried a click reference matching [A-Za-z0-9_-]{20,256}.
// - The click reference and the code live only in this module's memory: no cookie, no web storage.
// - Reject or withdrawal: the code is dropped, every button goes back to [web-AD] at once, nothing more is sent.
// - At most one POST per code per page load, on a WhatsApp press, to the one configured endpoint. It never
//   delays, blocks or waits for anything, and the response is not read.

import { CONSENT_STORAGE_KEY, readChoice } from "@/lib/consent";
import { landingUrl } from "@/lib/landing";

export interface ClickRefConfig {
  /** This shop's own bot route (lib/site.ts googleAds.clickEndpoint). */
  endpoint: string;
  /** This shop's id, equal to the bot's SHOP_ID: sent as "site" and mixed into the code. */
  site: string;
  /** Version of the cookie banner text the visitor accepted ("- Text version:" in content/_shared.md). */
  cv: string;
  /** The tag every button gets on an ad visit ("AD"). */
  adTag: string;
}

/** 27 characters: no vowels, no 0 1 I L O. The bot's parser: [2-9BCDFGHJKMNPQRSTVWXZ]{8}. */
export const CODE_ALPHABET = "23456789BCDFGHJKMNPQRSTVWXZ";
const CODE_LENGTH = 8;
const CLICK_ID = /^[A-Za-z0-9_-]{20,256}$/;
const SURFACE = /^[A-Z]{1,2}$/;
const MAX_BODY_BYTES = 768;
/** If the landing address has several, Google's own priority decides. */
const KINDS = ["gclid", "wbraid", "gbraid"] as const;
type Kind = (typeof KINDS)[number];
/** The source tag at the end of a message, with or without a code: " [web-X]" or " [web-X-<code>]", X in group 1. */
const TAG_END = new RegExp(` \\[web-([A-Z]{1,2})(?:-[${CODE_ALPHABET}]{${CODE_LENGTH}})?\\]$`);
/**
 * What Accept grants for advertising user data (lib/consent.ts GRANTED: measurement only, no remarketing).
 * Sent with each click reference so the bot can pass it on with the upload.
 */
const CONSENT = { ad_user_data: "granted", ad_personalization: "denied" } as const;

/**
 * The code for one ad click: SHA-256 of "clickref-v1|<site>|<kind>|<id>" (UTF-8); character i (0..7) is
 * CODE_ALPHABET[digest byte i mod 27]. Same click, same code, in every tab and on every press.
 */
export async function deriveCode(site: string, kind: string, id: string): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`clickref-v1|${site}|${kind}|${id}`)));
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) code += CODE_ALPHABET[digest[i] % CODE_ALPHABET.length];
  return code;
}

/**
 * Consent holds while the stored choice is Accept: the same test the banner uses to load the tag
 * (components/AdsConsentBanner.tsx), so lib/consent.ts needs no change. An Accept that could not be saved
 * loads nothing there and counts as no consent here. Read fresh every time it matters.
 */
function consented(): boolean {
  return readChoice() === "granted";
}

let cfg: ClickRefConfig | null = null;
/** The click reference of this visit; undefined until read, null if there is none (or it is not valid). */
let click: { kind: Kind; id: string } | null | undefined;
/** Set only while consent holds and the code is ready. */
let code: string | null = null;
/** Codes already posted in this page load. */
const sent = new Set<string>();

function readClick(): { kind: Kind; id: string } | null {
  if (click !== undefined) return click;
  click = null;
  try {
    const p = new URL(landingUrl()).searchParams;
    for (const kind of KINDS) {
      const id = p.get(kind);
      if (id === null) continue;
      if (CLICK_ID.test(id)) click = { kind, id };
      break;
    }
  } catch {
    // no readable landing address: no click reference
  }
  return click;
}

function setCode(next: string | null): void {
  if (next === code) return;
  code = next;
  retagAll();
}

/** On start and on every consent change: code on while consent holds, off at once otherwise. */
function update(): void {
  const c = readClick();
  if (!cfg || !c || !consented()) {
    setCode(null);
    return;
  }
  if (code) return;
  deriveCode(cfg.site, c.kind, c.id)
    .then((v) => {
      if (consented()) setCode(v);
    })
    .catch(() => {
      // no Web Crypto (not a secure context): the buttons stay [web-AD] and nothing is sent
    });
}

function waText(a: HTMLAnchorElement): { u: URL; text: string } | null {
  try {
    const u = new URL(a.href);
    if (u.hostname !== "wa.me") return null;
    const text = u.searchParams.get("text");
    return text ? { u, text } : null;
  } catch {
    return null;
  }
}

/** [web-X] or [web-AD] or [web-AD-<old code>] -> [web-AD-<code>] while consent holds, [web-AD] otherwise. */
function retag(a: HTMLAnchorElement): void {
  if (!cfg) return;
  const w = waText(a);
  const m = w && TAG_END.exec(w.text);
  if (!w || !m) return;
  // The button's own tag, sent as "surface". components/AdSource.tsx normally records it first.
  if (!a.dataset.waTag && m[1] !== cfg.adTag) a.dataset.waTag = m[1];
  const next = w.text.replace(TAG_END, ` [web-${code ? `${cfg.adTag}-${code}` : cfg.adTag}]`);
  if (next === w.text) return;
  // Same encoding as buildWhatsAppLink (encodeURIComponent, not form encoding).
  a.href = `https://wa.me${w.u.pathname}?text=${encodeURIComponent(next)}`;
}

function retagAll(): void {
  document.querySelectorAll<HTMLAnchorElement>('a[href^="https://wa.me/"]').forEach(retag);
}

/** Epoch ms of this visit's first page load (in-site page changes keep the document, so this does not move). */
function landedAt(): number {
  const t = typeof performance !== "undefined" ? performance.timeOrigin : NaN;
  return Number.isFinite(t) ? Math.round(t) : Date.now();
}

/** A press on a WhatsApp button whose message carries the current code: one POST per code per page load. */
function send(a: HTMLAnchorElement): void {
  const c = click;
  const k = code;
  if (!cfg || !c || !k || sent.has(k) || !consented()) return;
  const w = waText(a);
  if (!w || !w.text.endsWith(` [web-${cfg.adTag}-${k}]`)) return;
  const own = a.dataset.waTag ?? "";
  const surface = SURFACE.test(own) ? own : cfg.adTag;
  const body = JSON.stringify({ v: 1, site: cfg.site, code: k, kind: c.kind, id: c.id, surface, landed: landedAt(), consent: CONSENT, cv: cfg.cv });
  if (new TextEncoder().encode(body).length > MAX_BODY_BYTES) return;
  sent.add(k);
  try {
    // text/plain keeps it a simple request (no preflight); keepalive lets it finish after the jump to WhatsApp.
    void fetch(cfg.endpoint, { method: "POST", keepalive: true, credentials: "omit", headers: { "Content-Type": "text/plain" }, body }).catch(() => {});
  } catch {
    // never let this get in the way of the click
  }
}

// Capture phase, registered after AdSource's own listener, so it sees the [web-AD] rewrite and adds the code
// before the browser follows the link. Buttons that appear later (menus, dialogs) are caught here.
function onActivateCapture(e: Event): void {
  const a = (e.target as Element | null)?.closest?.("a");
  if (a instanceof HTMLAnchorElement) retag(a);
}

// Bubble phase, after every rewrite: reads the tag actually sent. Never prevents or delays the navigation.
function onPress(e: MouseEvent): void {
  if (e.type === "auxclick" && e.button !== 1) return;
  const a = (e.target as Element | null)?.closest?.("a");
  if (a instanceof HTMLAnchorElement) send(a);
}

// A choice on the banner (Accept, Reject, or a change through Cookie settings) is a click: look again once its
// handlers have run. A choice made in another tab arrives as a storage event.
function onAnyClick(): void {
  setTimeout(update, 0);
}

function onStorage(e: StorageEvent): void {
  if (e.key === CONSENT_STORAGE_KEY || e.key === null) update();
}

/**
 * Called by AdSource on every page of an ad visit, after its own [web-AD] rewrite. The first call starts the
 * listeners (only if the visit has a valid click reference); every call rewrites the buttons on the page.
 */
export function startClickRef(config: ClickRefConfig): void {
  if (!cfg) {
    if (!config.endpoint || !config.site || !config.cv || !readClick()) return;
    cfg = config;
    document.addEventListener("click", onActivateCapture, true);
    document.addEventListener("auxclick", onActivateCapture, true);
    document.addEventListener("contextmenu", onActivateCapture, true);
    document.addEventListener("click", onPress);
    document.addEventListener("auxclick", onPress);
    document.addEventListener("click", onAnyClick);
    window.addEventListener("storage", onStorage);
    update();
  }
  retagAll();
}
