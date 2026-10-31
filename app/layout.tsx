import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Figtree } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { RevealObserver } from "@/components/RevealObserver";
import { StickyBar } from "@/components/StickyBar";
import { ROBOTS } from "@/lib/seo";
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
  themeColor: "#362140",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
        <Header />
        <main id="main" className="overflow-x-clip">{children}</main>
        <Footer />
        <StickyBar />
        <RevealObserver />
      </body>
    </html>
  );
}
