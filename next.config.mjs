// next.config.mjs
// Served from the custom domain srisiamthaitherapyandwellness.co.uk, so basePath and assetPrefix stay empty.
import { readFileSync } from "node:fs";

// The Google Ads tag id (lib/site.ts SITE.googleAds.id), inlined into client code at build time so that,
// while it is "", the cookie banner and gtag loader are dropped from the build (components/CookieConsent.tsx).
const site = readFileSync(new URL("./lib/site.ts", import.meta.url), "utf8");
const adsId = /googleAds:\s*\{\s*id:\s*"([^"]*)"/.exec(site)?.[1];
if (adsId === undefined) throw new Error("next.config.mjs: googleAds.id not found in lib/site.ts");
if (adsId && !/^AW-\d+$/.test(adsId)) throw new Error(`next.config.mjs: googleAds.id "${adsId}" is not AW-<digits>`);

// Ad click reference (lib/site.ts googleAds.clickEndpoint, lib/clickref.ts). While the endpoint is "", all three
// values below are "" and every branch that uses them is dropped from the build (nothing of it ships).
// The consent text version ("- Text version:" in content/_shared.md, section cookie-banner) is sent with
// each click reference and names the browser's consent key, so a new version asks everyone again.
const clickEndpoint = /clickEndpoint:\s*"([^"]*)"/.exec(site)?.[1];
const siteId = /siteId:\s*"([^"]*)"/.exec(site)?.[1];
if (clickEndpoint === undefined || siteId === undefined) throw new Error("next.config.mjs: googleAds.clickEndpoint or siteId not found in lib/site.ts");
let consentVersion = "";
if (clickEndpoint) {
  if (!adsId) throw new Error("next.config.mjs: googleAds.clickEndpoint needs googleAds.id (the consent banner) to be set");
  // https only; plain http only for a receiver on this machine (local tests; check-site refuses it).
  if (!/^https:\/\/[A-Za-z0-9.-]+(:\d+)?\/[A-Za-z0-9._~\/-]*$/.test(clickEndpoint) && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/[A-Za-z0-9._~\/-]*$/.test(clickEndpoint)) {
    throw new Error(`next.config.mjs: googleAds.clickEndpoint "${clickEndpoint}" is not an https URL with a path`);
  }
  if (!/^[a-z0-9-]{1,32}$/.test(siteId)) throw new Error(`next.config.mjs: googleAds.siteId "${siteId}" is not [a-z0-9-]{1,32}`);
  const shared = readFileSync(new URL("./content/_shared.md", import.meta.url), "utf8");
  const versions = [...shared.matchAll(/^- Text version:\s*(.*?)\s*$/gm)].map((m) => m[1]);
  if (versions.length !== 1) throw new Error(`next.config.mjs: content/_shared.md must have exactly one "- Text version:" line, found ${versions.length}`);
  consentVersion = versions[0];
  if (!/^[A-Za-z0-9._-]{1,32}$/.test(consentVersion)) throw new Error(`next.config.mjs: consent text version "${consentVersion}" is not [A-Za-z0-9._-]{1,32}`);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  distDir: process.env.NEXT_DIST_DIR || ".next",
  trailingSlash: true,
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_GOOGLE_ADS_ID: adsId,
    NEXT_PUBLIC_CLICK_REF_ENDPOINT: clickEndpoint,
    NEXT_PUBLIC_CLICK_REF_SITE: clickEndpoint ? siteId : "",
    NEXT_PUBLIC_CONSENT_VERSION: consentVersion,
  },
};

export default nextConfig;
