import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Figtree } from "next/font/google";
import "./globals.css";
import { AdSource } from "@/components/AdSource";
import { MarketingOptOutSync } from "@/components/MarketingNotice";
import { AdsConsent } from "@/components/CookieConsent";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { NoticeBand } from "@/components/NoticeBand";
import { RevealObserver } from "@/components/RevealObserver";
import { StickyBar } from "@/components/StickyBar";
import { noticeForBuild } from "@/lib/notice-data";
import { ROBOTS } from "@/lib/seo";
import { sharedCopy } from "@/lib/shared";
import { SITE } from "@/lib/site";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["600"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-display",
});

const body = Figtree({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

/** Bump when the icons change: browsers keep a cached favicon (or a cached miss) per URL. */
const ICON_VERSION = 2;

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: `${SITE.name}`,
  robots: ROBOTS,
  icons: {
    icon: [
      { url: `/favicon.ico?v=${ICON_VERSION}`, sizes: "48x48" },
      { url: `/icon-32.png?v=${ICON_VERSION}`, type: "image/png", sizes: "32x32" },
      { url: `/icon-192.png?v=${ICON_VERSION}`, type: "image/png", sizes: "192x192" },
    ],
    apple: `/apple-touch-icon.png?v=${ICON_VERSION}`,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#5B1E70",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { notice, buildDay } = noticeForBuild();
  const ads = SITE.googleAds;
  const cookies = sharedCopy().cookies;
  return (
    <html lang="en-GB" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        {/* Marks the page as script-capable so scroll-reveal content can start hidden. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {/* Off (renders nothing, loads nothing) while SITE.googleAds.id is empty. Early in the DOM so keyboard users meet it first. */}
        {ads.id && cookies ? (
          <AdsConsent adsId={ads.id} conversionLabel={ads.conversionLabel} conversionValue={ads.conversionValue} currency={ads.currency} text={cookies.banner} buttonClassName="btn btn-primary" linkClassName="link" />
        ) : null}
        <Header />
        <NoticeBand notice={notice} buildDay={buildDay} />
        <main id="main" className="overflow-x-clip">{children}</main>
        <Footer />
        <StickyBar />
        <RevealObserver />
        <AdSource />
        <MarketingOptOutSync />
      </body>
    </html>
  );
}
