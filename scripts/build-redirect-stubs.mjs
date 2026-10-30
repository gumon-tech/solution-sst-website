#!/usr/bin/env node
// Old Wix URLs keep working once the shop's own domain points here (KWS, 31 Oct 2026).
//
// GitHub Pages cannot send 301s, so each old path gets out/<path>/index.html with a
// 0-second meta refresh, an absolute canonical, noindex and a plain visible link (the
// pattern of our PEL site). Runs AFTER `next build` and check-site, straight into out/, so
// the stubs never enter Next's route tree or the sitemap.
//
// Wix Bookings pages (/service-page/<slug>, /booking-calendar/<slug>) have slugs we cannot
// list, so out/404.html gets a small script that sends those to the matching treatment by
// keyword, and every other unknown path to the home page.
//
// Usage: node scripts/build-redirect-stubs.mjs [out-dir]   (default "out")

import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";

const STUB_MARKER = "<!-- sst-redirect-stub -->";
const SCRIPT_MARKER = "sst-404-redirect";

// Old path → new path. Every page in the Wix sitemap, plus the Wix system pages linked from its menu.
export const REDIRECTS = {
  "/services/": "/treatments/",
  "/book-online/": "/treatments/",
  "/contact/": "/visit/",
  "/about-us/": "/about/",
  "/gallery/": "/about/",
  "/pricing-plans/plans-pricing/": "/treatments/",
  "/payment-request-page/": "/",
  "/my-addresses/": "/",
  "/my-subscriptions/": "/",
};

// Keyword → treatment page, checked in order, for /service-page/* and /booking-calendar/*.
const KEYWORDS = [
  ["voucher", "/gift-vouchers/"],
  ["gift", "/gift-vouchers/"],
  ["foot", "/treatments/thai-foot-massage/"],
  ["neck", "/treatments/back-neck-shoulders-massage/"],
  ["shoulder", "/treatments/back-neck-shoulders-massage/"],
  ["back", "/treatments/back-neck-shoulders-massage/"],
  ["stone", "/treatments/hot-stone-massage/"],
  ["lymph", "/treatments/lymphatic-drainage-massage/"],
  ["detox", "/treatments/lymphatic-drainage-massage/"],
  ["aroma", "/treatments/aromatherapy-massage/"],
  ["swedish", "/treatments/aromatherapy-massage/"],
  ["thai", "/treatments/thai-massage/"],
  ["combination", "/treatments/thai-massage/"],
];

function siteOrigin() {
  const m = readFileSync("lib/site.ts", "utf8").match(/url:\s*"(https:\/\/[^"]+)"/);
  if (!m) throw new Error("lib/site.ts: SITE.url not found");
  return m[1].replace(/\/+$/, "");
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function stubHtml(target, origin) {
  const t = esc(target);
  const abs = esc(origin + target);
  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
${STUB_MARKER}
<title>Page Moved | Sri Siam Thai Therapy &amp; Wellness</title>
<meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0; url=${t}">
<link rel="canonical" href="${abs}">
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
<p>This page has moved to <a href="${t}">${abs}</a>.</p>
</body>
</html>
`;
}

function notFoundScript() {
  const kw = JSON.stringify(KEYWORDS);
  const map = JSON.stringify(REDIRECTS);
  return `<script id="${SCRIPT_MARKER}">(function(){var p=location.pathname.toLowerCase(),m=${map},k=${kw},t="/";var q=p.replace(/\\/?$/,"/");if(m[q]){t=m[q]}else if(/^\\/(service-page|booking-calendar)\\//.test(p)){t="/treatments/";for(var i=0;i<k.length;i++){if(p.indexOf(k[i][0])>-1){t=k[i][1];break}}}location.replace(t)})();</script>`;
}

function main() {
  const outDir = process.argv[2] ?? "out";
  const origin = siteOrigin();
  const problems = [];

  for (const [from, to] of Object.entries(REDIRECTS)) {
    if (REDIRECTS[to]) problems.push(`${from} → ${to} is a double hop`);
    const target = path.join(outDir, to, "index.html");
    if (!existsSync(target)) problems.push(`${from} → ${to}: target page is not in ${outDir}/`);
    const file = path.join(outDir, from, "index.html");
    if (existsSync(file) && !readFileSync(file, "utf8").includes(STUB_MARKER)) problems.push(`${file} is a real page; refusing to overwrite`);
  }
  for (const [, to] of KEYWORDS) {
    if (!existsSync(path.join(outDir, to, "index.html"))) problems.push(`keyword target ${to} is not in ${outDir}/`);
  }
  const nf = path.join(outDir, "404.html");
  if (!existsSync(nf)) problems.push(`${nf} missing`);
  if (problems.length) {
    console.error("redirect stubs not written:\n- " + problems.join("\n- "));
    process.exit(1);
  }

  for (const [from, to] of Object.entries(REDIRECTS)) {
    const dir = path.join(outDir, from);
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, "index.html"), stubHtml(to, origin));
  }
  let html = readFileSync(nf, "utf8");
  if (!html.includes(SCRIPT_MARKER)) {
    html = html.replace(/<head>/, `<head>${notFoundScript()}`);
    if (!html.includes(SCRIPT_MARKER)) {
      console.error(`${nf}: no <head> to put the redirect script in`);
      process.exit(1);
    }
    writeFileSync(nf, html);
  }
  // trailingSlash also exports /404/ as a page that answers 200 with a canonical to itself;
  // GitHub Pages only needs 404.html.
  rmSync(path.join(outDir, "404"), { recursive: true, force: true });
  console.log(`redirect stubs OK: ${Object.keys(REDIRECTS).length} old Wix paths, 404 script in ${nf}`);
}

main();
