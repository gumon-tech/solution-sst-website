// next.config.mjs
// Served from the custom domain srisiamthaitherapyandwellness.co.uk, so basePath and assetPrefix stay empty.
import { readFileSync } from "node:fs";

// The Google Ads tag id (lib/site.ts SITE.googleAds.id), inlined into client code at build time so that,
// while it is "", the cookie banner and gtag loader are dropped from the build (components/CookieConsent.tsx).
const site = readFileSync(new URL("./lib/site.ts", import.meta.url), "utf8");
const adsId = /googleAds:\s*\{\s*id:\s*"([^"]*)"/.exec(site)?.[1];
if (adsId === undefined) throw new Error("next.config.mjs: googleAds.id not found in lib/site.ts");
if (adsId && !/^AW-\d+$/.test(adsId)) throw new Error(`next.config.mjs: googleAds.id "${adsId}" is not AW-<digits>`);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  distDir: process.env.NEXT_DIST_DIR || ".next",
  trailingSlash: true,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_GOOGLE_ADS_ID: adsId },
};

export default nextConfig;
