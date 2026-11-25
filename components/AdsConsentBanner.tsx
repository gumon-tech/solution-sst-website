"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CONSENT_STORAGE_KEY,
  clearAdStorage,
  deny,
  grant,
  readChoice,
  sendConversion,
  whatsAppSourceTag,
  writeChoice,
  type Choice,
} from "@/lib/consent";
import { onOpenCookieSettings } from "@/lib/consent-open";
import { landingUrl } from "@/lib/landing";
import { TAG_AT_END } from "@/lib/whatsapp";
import css from "./AdsConsentBanner.module.css";

/**
 * Cookie banner + consent-gated Google Ads tag + WhatsApp conversion hook, in one client island.
 * Shop-neutral: the Ads id, the conversion label, every word and the button/link classes come in
 * as props. Logic and storage rules: lib/consent.ts. Layout: AdsConsentBanner.module.css.
 * Use it through <AdsConsent> in components/CookieConsent.tsx (lazy, and not built at all while the
 * Ads id is empty); <CookieSettingsButton> from the same file reopens it.
 */
export interface AdsConsentText {
  /** Accessible name of the banner region. */
  label: string;
  /** One or two plain sentences. */
  body: string;
  privacyLabel: string;
  privacyHref: string;
  accept: string;
  reject: string;
  /** Shown when the banner is reopened after a choice. */
  nowAccepted: string;
  nowRejected: string;
}

export interface AdsConsentProps {
  adsId: string;
  conversionLabel: string;
  /** Optional value and ISO currency sent with each conversion. */
  conversionValue?: number;
  currency?: string;
  text: AdsConsentText;
  /** The site's own classes, so the banner looks like the rest of the site. Both buttons get the same one. */
  buttonClassName?: string;
  linkClassName?: string;
}

export function AdsConsentBanner({ adsId, conversionLabel, conversionValue, currency, text, buttonClassName = "", linkClassName = "" }: AdsConsentProps) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<Choice | null>(null);
  const [reopened, setReopened] = useState(false);
  const accepted = useRef(false);
  const opener = useRef<HTMLElement | null>(null);
  const region = useRef<HTMLElement | null>(null);

  // First load: a stored Accept loads the tag; anything else shows the banner (or stays quiet after a Reject).
  useEffect(() => {
    const c = readChoice();
    setCurrent(c);
    if (c === "granted") {
      accepted.current = true;
      grant(adsId, landingUrl());
    } else {
      clearAdStorage();
      if (c === null) setOpen(true);
    }
  }, [adsId]);

  // "Cookie settings" reopens the banner (also a click made before this chunk loaded) and moves focus to it.
  useEffect(
    () =>
      onOpenCookieSettings((el) => {
        opener.current = el;
        setCurrent(readChoice());
        setReopened(true);
        setOpen(true);
        requestAnimationFrame(() => region.current?.focus());
      }),
    [],
  );

  // A choice made in another tab of this site applies here too (withdrawal stops the tag at once).
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== CONSENT_STORAGE_KEY && e.key !== null) return;
      const c = readChoice();
      setCurrent(c);
      if (c === "granted") {
        accepted.current = true;
        grant(adsId, landingUrl());
        setOpen(false);
      } else {
        accepted.current = false;
        deny();
        if (c === "denied") setOpen(false);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [adsId]);

  // Conversion: a click on any wa.me link while accepted. Bubble phase on document, so it runs after
  // capture-phase rewrites of the link (components/AdSource.tsx) and reads the tag actually sent.
  // It never prevents or delays the navigation.
  useEffect(() => {
    if (!conversionLabel) return;
    const onActivate = (e: MouseEvent) => {
      if (!accepted.current) return;
      if (e.type === "auxclick" && e.button !== 1) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!(a instanceof HTMLAnchorElement)) return;
      const tag = whatsAppSourceTag(a, TAG_AT_END);
      if (tag === null) return;
      const params: Record<string, string | number> = {};
      if (conversionValue !== undefined && currency) {
        params.value = conversionValue;
        params.currency = currency;
      }
      if (tag) params.source_tag = tag;
      sendConversion(`${adsId}/${conversionLabel}`, params);
    };
    document.addEventListener("click", onActivate);
    document.addEventListener("auxclick", onActivate);
    return () => {
      document.removeEventListener("click", onActivate);
      document.removeEventListener("auxclick", onActivate);
    };
  }, [adsId, conversionLabel, conversionValue, currency]);

  // While open, keep focused elements clear of the banner (WCAG 2.4.11): scroll-padding-bottom makes the page
  // scroll a focused element above it, and the same space added under the page lets the last links get there.
  // Nothing above moves (the space is only added at the end), so there is no layout shift.
  useEffect(() => {
    if (!open) return;
    const el = region.current;
    const root = document.documentElement;
    const body = document.body;
    const update = () => {
      if (!el) return;
      // offsetTop of a fixed element is its place in the viewport, without the entry animation's transform.
      const px = `${Math.max(0, Math.ceil(window.innerHeight - el.offsetTop))}px`;
      root.style.scrollPaddingBottom = px;
      body.style.paddingBottom = px;
    };
    update();
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    if (el) ro?.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", update);
      root.style.scrollPaddingBottom = "";
      body.style.paddingBottom = "";
    };
  }, [open]);

  const close = useCallback(() => {
    setOpen(false);
    setReopened(false);
    const back = opener.current;
    opener.current = null;
    if (back?.isConnected) back.focus();
  }, []);

  const choose = useCallback(
    (c: Choice) => {
      const saved = writeChoice(c);
      if (c === "granted" && saved) {
        accepted.current = true;
        grant(adsId, landingUrl());
      } else {
        // Reject, or an Accept that could not be saved: nothing loads, nothing is sent.
        accepted.current = false;
        deny();
      }
      setCurrent(saved ? c : null);
      close();
    },
    [adsId, close],
  );

  // Escape closes the banner only when it was reopened (the earlier choice stands); a first visit must choose.
  useEffect(() => {
    if (!open || !reopened) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, reopened, close]);

  if (!open) return null;
  return (
    <section ref={region} role="region" aria-label={text.label} tabIndex={-1} className={css.banner}>
      <p className={css.body}>
        {text.body}{" "}
        <Link href={text.privacyHref} className={linkClassName}>
          {text.privacyLabel}
        </Link>
      </p>
      {reopened && current && <p className={css.now}>{current === "granted" ? text.nowAccepted : text.nowRejected}</p>}
      <div className={css.actions}>
        <button type="button" className={`${buttonClassName} ${css.choice}`} onClick={() => choose("granted")}>
          {text.accept}
        </button>
        <button type="button" className={`${buttonClassName} ${css.choice}`} onClick={() => choose("denied")}>
          {text.reject}
        </button>
      </div>
    </section>
  );
}
