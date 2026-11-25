"use client";

import { lazy, Suspense, type ComponentType, type ReactNode } from "react";
import type { AdsConsentProps } from "@/components/AdsConsentBanner";
import { openCookieSettings } from "@/lib/consent-open";

/**
 * Entry points for the cookie banner and the consent-gated Google Ads tag. Shop-neutral (reused on
 * other shop sites): the Ads id, the conversion label, the words and the button classes come in as props.
 *
 * process.env.NEXT_PUBLIC_GOOGLE_ADS_ID is set at build time by next.config.mjs from lib/site.ts
 * (SITE.googleAds.id). When it is "", the bundler drops both branches below that hold the banner, so
 * no banner code, gtag loader or consent CSS (AdsConsentBanner.module.css) is built at all.
 *
 * - <AdsConsent>: the banner, the gtag loader and the WhatsApp conversion hook, lazy-loaded.
 * - <CookieSettingsButton>: reopens the banner so a visitor can change their mind. One in the footer
 *   of every page and one on the privacy notice. A click before the banner has loaded is kept.
 */
const Banner = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID
  ? lazy(() => import("@/components/AdsConsentBanner").then((m) => ({ default: m.AdsConsentBanner })))
  : null;

export const AdsConsent: ComponentType<AdsConsentProps> = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID
  ? function AdsConsent(props: AdsConsentProps) {
      if (!Banner) return null;
      return (
        <Suspense fallback={null}>
          <Banner {...props} />
        </Suspense>
      );
    }
  : function AdsConsent() {
      return null;
    };

interface SettingsProps {
  className?: string;
  children: ReactNode;
}

export const CookieSettingsButton: ComponentType<SettingsProps> = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID
  ? function CookieSettingsButton({ className, children }: SettingsProps) {
      return (
        <button type="button" data-cookie-settings="" className={className} onClick={(e) => openCookieSettings(e.currentTarget)}>
          {children}
        </button>
      );
    }
  : function CookieSettingsButton() {
      return null;
    };
