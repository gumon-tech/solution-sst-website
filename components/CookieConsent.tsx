"use client";

import { lazy, Suspense, type ComponentProps, type ReactNode } from "react";

/**
 * Entry points for the cookie banner and the consent-gated Google Ads tag. Shop-neutral (reused on
 * other shop sites): the Ads id, the conversion label and every word come in as props.
 *
 * - <AdsConsent>: the banner, the gtag loader and the WhatsApp conversion hook. Code-split, so its code
 *   (components/AdsConsentBanner.tsx, lib/consent.ts) is fetched only where it is rendered; render it
 *   only when the shop has an Ads id.
 * - <CookieSettingsButton>: reopens the banner so a visitor can change their mind. Put one in the
 *   footer of every page and one on the privacy notice.
 */
const Banner = lazy(() => import("@/components/AdsConsentBanner").then((m) => ({ default: m.AdsConsentBanner })));

export function AdsConsent(props: ComponentProps<typeof Banner>) {
  return (
    <Suspense fallback={null}>
      <Banner {...props} />
    </Suspense>
  );
}

/** Fired on window to reopen the banner. detail: the control, so focus can go back to it. */
export const CONSENT_OPEN_EVENT = "ads-consent:open";

export function CookieSettingsButton({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <button
      type="button"
      data-cookie-settings=""
      className={className}
      onClick={(e) => window.dispatchEvent(new CustomEvent(CONSENT_OPEN_EVENT, { detail: e.currentTarget }))}
    >
      {children}
    </button>
  );
}
