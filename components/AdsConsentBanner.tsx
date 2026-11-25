"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CONSENT_OPEN_EVENT } from "@/components/CookieConsent";
import {
  clearAdStorage,
  deny,
  grant,
  readChoice,
  sendConversion,
  whatsAppSourceTag,
  writeChoice,
  type Choice,
} from "@/lib/consent";

/**
 * Cookie banner + consent-gated Google Ads tag + WhatsApp conversion hook, in one
 * client island. Shop-neutral: the Ads id, the conversion label and every word
 * come in as props (rendered only when the shop has an Ads id configured).
 * Logic and storage rules: lib/consent.ts. Styles: .consent-* in app/globals.css.
 * Use it through <AdsConsent> in components/CookieConsent.tsx (code-split); reopened by
 * <CookieSettingsButton> from the same file.
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

export function AdsConsentBanner({ adsId, conversionLabel, text }: { adsId: string; conversionLabel: string; text: AdsConsentText }) {
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
      grant(adsId);
    } else {
      clearAdStorage();
      if (c === null) setOpen(true);
    }
  }, [adsId]);

  // "Cookie settings" anywhere on the page reopens the banner and moves focus to it.
  useEffect(() => {
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent<unknown>).detail;
      opener.current = d instanceof HTMLElement ? d : null;
      setCurrent(readChoice());
      setReopened(true);
      setOpen(true);
      requestAnimationFrame(() => region.current?.focus());
    };
    window.addEventListener(CONSENT_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, onOpen);
  }, []);

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
      const tag = whatsAppSourceTag(a);
      if (tag === null) return;
      sendConversion(`${adsId}/${conversionLabel}`, tag ? { source_tag: tag } : {});
    };
    document.addEventListener("click", onActivate);
    document.addEventListener("auxclick", onActivate);
    return () => {
      document.removeEventListener("click", onActivate);
      document.removeEventListener("auxclick", onActivate);
    };
  }, [adsId, conversionLabel]);

  const choose = useCallback(
    (c: Choice) => {
      const saved = writeChoice(c);
      if (c === "granted" && saved) {
        accepted.current = true;
        grant(adsId);
      } else {
        // Reject, or an Accept that could not be saved: nothing loads, nothing is sent.
        accepted.current = false;
        deny();
      }
      setCurrent(saved ? c : null);
      setOpen(false);
      setReopened(false);
      const back = opener.current;
      opener.current = null;
      if (back?.isConnected) back.focus();
    },
    [adsId],
  );

  if (!open) return null;
  return (
    <section ref={region} role="region" aria-label={text.label} tabIndex={-1} className="consent-banner">
      <p className="consent-body">
        {text.body}{" "}
        <Link href={text.privacyHref} className="consent-link">
          {text.privacyLabel}
        </Link>
      </p>
      {reopened && current && <p className="consent-now">{current === "granted" ? text.nowAccepted : text.nowRejected}</p>}
      <div className="consent-actions">
        <button type="button" className="consent-btn" onClick={() => choose("granted")}>
          {text.accept}
        </button>
        <button type="button" className="consent-btn" onClick={() => choose("denied")}>
          {text.reject}
        </button>
      </div>
    </section>
  );
}
