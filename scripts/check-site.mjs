// Runs after `next build`. Fails the build (exit 1) on any problem in out/.
// Plain Node, no dependencies. Keep its route list independent of lib/routes.ts on purpose:
// a route dropped from the app by mistake should fail here, not vanish from both lists.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { consentVersion } from "./lib/consent-version.mjs";
import { findMetadata } from "./lib/image-metadata.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(root, "out");
const errors = [];
const fail = (msg) => errors.push(msg);

const read = (p) => readFileSync(p, "utf8");
const site = read(path.join(root, "lib/site.ts"));
const indexable = /indexable:\s*(true|false)/.exec(site)?.[1] === "true";
const deposit = Number(/depositGbp:\s*(\d+)/.exec(site)?.[1]);
const WA_NUMBER = "447903653786";
const SITE_URL = "https://srisiamthaitherapyandwellness.co.uk";

const data = JSON.parse(read(path.join(root, "data/services.json")));
const rows = data.services;
const slugs = [...new Set(rows.map((r) => r.slug))];
const fmt = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(2));
const article = (name) => (/^[aeiou]/i.test(name) ? "an" : "a");

if (!existsSync(OUT)) {
  console.error("out/ does not exist: run next build first");
  process.exit(1);
}

// ---- routes -----------------------------------------------------------------
const routes = ["/", "/treatments/", "/gift-vouchers/", "/about/", "/visit/", "/tour/", "/faq/", "/careers/", "/privacy/", "/terms/", ...slugs.map((s) => `/treatments/${s}/`)];
const fileFor = (route) => path.join(OUT, route, "index.html");
for (const r of routes) if (!existsSync(fileFor(r))) fail(`missing page: ${r}`);
for (const f of ["404.html", "robots.txt", "sitemap.xml"]) if (!existsSync(path.join(OUT, f))) fail(`missing out/${f}`);

// ---- Wix deposit links (the redirect script is added later by build-redirect-stubs.mjs) --
if (!/wixPaylinkBase:\s*"https:\/\/[^"]+\/_paylink"/.test(site)) fail("lib/site.ts: SITE.wixPaylinkBase missing or not an https .../_paylink URL");
{
  const nf404 = read(path.join(OUT, "404.html"));
  if (nf404.includes("sst-404-redirect") && !nf404.includes('indexOf("/_paylink/")===0')) fail("out/404.html lacks the /_paylink/ redirect");
}

// ---- CNAME ------------------------------------------------------------------
const cname = path.join(OUT, "CNAME");
if (!existsSync(cname)) fail("out/CNAME is missing");
else if (read(cname).trim() !== "srisiamthaitherapyandwellness.co.uk") fail(`out/CNAME is "${read(cname).trim()}", expected srisiamthaitherapyandwellness.co.uk`);

// ---- walk out/ --------------------------------------------------------------
const files = [];
(function walk(dir) {
  for (const n of readdirSync(dir)) {
    const p = path.join(dir, n);
    if (statSync(p).isDirectory()) walk(p);
    else files.push(p);
  }
})(OUT);

const TEXT = /\.(html|txt|xml|js|css|json|map|webmanifest|svg)$/;
for (const f of files) {
  if (!TEXT.test(f)) continue;
  const t = read(f);
  if (t.includes("07497") || t.includes("7497 493")) fail(`${path.relative(OUT, f)} contains the old phone number (7497)`);
  if (t.includes("room-wood-purple")) fail(`${path.relative(OUT, f)} references room-wood-purple (not the shop's room, removed 2026-11-05)`);
}

// ---- robots.txt and sitemap -------------------------------------------------
if (existsSync(path.join(OUT, "robots.txt"))) {
  const r = read(path.join(OUT, "robots.txt"));
  if (!indexable) {
    if (!/^Disallow:\s*\/\s*$/m.test(r)) fail("robots.txt must Disallow: / while indexable=false");
    if (/^Allow:/m.test(r) || /^Sitemap:/im.test(r)) fail("robots.txt must not Allow or list a Sitemap while indexable=false");
  } else {
    if (!/^Allow:\s*\//m.test(r)) fail("robots.txt must Allow: / when indexable=true");
    if (!r.includes(`Sitemap: ${SITE_URL}/sitemap.xml`)) fail("robots.txt must reference the sitemap when indexable=true");
  }
}
if (existsSync(path.join(OUT, "sitemap.xml"))) {
  const s = read(path.join(OUT, "sitemap.xml"));
  for (const r of routes) if (!s.includes(`<loc>${SITE_URL}${r}</loc>`)) fail(`sitemap.xml lacks ${r}`);
}

// ---- per-page checks --------------------------------------------------------
const EMOJI = /\p{Extended_Pictographic}/u;
const decodeEntities = (s) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const stripTags = (s) => decodeEntities(s.replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const attr = (tag, name) => {
  const m = new RegExp(`\\s${name}="([^"]*)"`).exec(tag);
  return m ? decodeEntities(m[1]) : undefined;
};

const htmlFiles = files.filter((f) => f.endsWith(".html"));
const pageFiles = new Map(); // relative -> html
for (const f of htmlFiles) pageFiles.set(path.relative(OUT, f), read(f));

const internalExists = (ref) => {
  const clean = ref.split("#")[0].split("?")[0];
  if (!clean || clean === "/") return true;
  const p = path.join(OUT, clean);
  return existsSync(p) && (statSync(p).isFile() || existsSync(path.join(p, "index.html")));
};

for (const [rel, html] of pageFiles) {
  const is404 = rel === "404.html" || rel === path.join("404", "index.html");
  const where = rel;

  const title = /<title>([\s\S]*?)<\/title>/.exec(html)?.[1];
  if (!title || !title.trim()) fail(`${where}: no <title>`);
  const desc = /<meta name="description" content="([^"]*)"/.exec(html)?.[1];
  if (!is404 && (!desc || !desc.trim())) fail(`${where}: no meta description`);

  const robots = /<meta name="robots" content="([^"]*)"/.exec(html)?.[1] ?? "";
  if (!indexable || is404) {
    if (!/noindex/.test(robots)) fail(`${where}: robots meta lacks noindex (indexable=${indexable})`);
  } else if (/noindex/.test(robots)) fail(`${where}: robots meta says noindex but indexable=true`);
  if (!indexable && !is404 && !/nofollow/.test(robots)) fail(`${where}: robots meta lacks nofollow`);

  if (!is404) {
    const canon = /<link rel="canonical" href="([^"]*)"/.exec(html)?.[1];
    const expected = `${SITE_URL}${rel === "index.html" ? "/" : "/" + rel.replace(/index\.html$/, "")}`;
    if (canon !== expected) fail(`${where}: canonical is ${canon}, expected ${expected}`);
    for (const p of ["og:title", "og:description", "og:image", "og:url"]) {
      if (!html.includes(`property="${p}"`)) fail(`${where}: missing ${p}`);
    }
    if (!html.includes('name="twitter:card"')) fail(`${where}: missing twitter:card`);
  }

  const h1s = (html.match(/<h1[\s>]/g) ?? []).length;
  if (h1s !== 1) fail(`${where}: ${h1s} h1 elements, expected 1`);
  if (!/<main[\s>]/.test(html) || !/<header[\s>]/.test(html) || !/<footer[\s>]/.test(html)) fail(`${where}: missing a landmark (header/main/footer)`);
  if (!html.includes('class="skip-link"')) fail(`${where}: missing skip link`);

  const emoji = html.replace(/[©®™]/g, "").match(EMOJI);
  if (emoji) fail(`${where}: emoji character ${JSON.stringify(emoji[0])}`);

  // JSON-LD
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const j = JSON.parse(m[1]);
      const s = JSON.stringify(j);
      if (/aggregateRating|"review"/.test(s)) fail(`${where}: JSON-LD has aggregateRating or review`);
    } catch (e) {
      fail(`${where}: JSON-LD does not parse (${e.message})`);
    }
  }

  // images
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    const t = m[0];
    if (attr(t, "alt") === undefined) fail(`${where}: <img> without alt: ${t.slice(0, 80)}`);
    if (!attr(t, "width") || !attr(t, "height")) fail(`${where}: <img> without width/height: ${attr(t, "src")}`);
  }

  // internal references exist
  for (const m of html.matchAll(/\s(?:href|src)="(\/[^"]*)"/g)) {
    const ref = decodeEntities(m[1]);
    if (ref.startsWith("//") || ref.startsWith("/_next/")) continue;
    if (!internalExists(ref)) fail(`${where}: broken internal reference ${ref}`);
  }

  // WhatsApp links
  for (const m of html.matchAll(/<a\b[^>]*>/g)) {
    const tag = m[0];
    const href = attr(tag, "href");
    if (!href || !href.includes("wa.me")) continue;
    let u;
    try {
      u = new URL(href);
    } catch {
      fail(`${where}: unparsable wa.me link ${href}`);
      continue;
    }
    if (u.hostname !== "wa.me" || u.pathname !== `/${WA_NUMBER}`) fail(`${where}: wa.me link to wrong number: ${href}`);
    const text = u.searchParams.get("text") ?? "";
    if (!/ \[web-[A-Z]{1,2}\]$/.test(text)) fail(`${where}: wa.me text lacks a [web-X] tag: ${text}`);
    if (attr(tag, "target") !== "_blank" || !/noopener/.test(attr(tag, "rel") ?? "")) fail(`${where}: wa.me link without target=_blank rel=noopener`);
  }
  for (const m of html.matchAll(/(?:href|src)="(https?:\/\/[^"]+)"/g)) {
    const u = m[1];
    if (/google\.com\/maps\/embed|<iframe/.test(u)) fail(`${where}: external embed ${u}`);
  }
  if (/<iframe/.test(html)) fail(`${where}: contains an iframe`);
}

// ---- prices on the menu -----------------------------------------------------
function optionAnchors(html) {
  return [...html.matchAll(/<a\b[^>]*class="opt"[^>]*>([\s\S]*?)<\/a>/g)].map((m) => {
    const label = stripTags(m[1]);
    const href = attr(m[0], "href") ?? "";
    const text = new URL(href).searchParams.get("text") ?? "";
    const pm = /^(.*) · £(\d+(?:\.\d+)?)$/.exec(label);
    return { label, option: pm?.[1], price: pm?.[2], text };
  });
}

const menuHtml = pageFiles.get(path.join("treatments", "index.html"));
if (menuHtml) {
  const got = optionAnchors(menuHtml);
  if (got.length !== rows.length) fail(`/treatments/: ${got.length} option buttons, expected ${rows.length}`);
  rows.forEach((r, i) => {
    const g = got[i];
    if (!g) return;
    if (g.option !== r.option || g.price !== fmt(r.price_gbp)) fail(`/treatments/: row ${i} is "${g.label}", expected "${r.option} · £${fmt(r.price_gbp)}"`);
    const want = `Hi Sri Siam Thai Therapy & Wellness, I'd like to book ${article(r.name)} ${r.name} (${r.option}) please. [web-M]`;
    if (g.text !== want) fail(`/treatments/: row ${i} message is "${g.text}", expected "${want}"`);
  });
  const gotSet = new Set(got.map((g) => g.price));
  const wantSet = new Set(rows.map((r) => fmt(r.price_gbp)));
  if ([...gotSet].sort().join() !== [...wantSet].sort().join()) fail(`/treatments/: price set ${[...gotSet].sort()} differs from data ${[...wantSet].sort()}`);
  // Any other £ amount on the page must be the deposit.
  const visible = stripTags(menuHtml.replace(/<script[\s\S]*?<\/script>/g, ""));
  const optionPrices = new Set(got.map((g) => `£${g.price}`));
  for (const m of visible.matchAll(/£(\d+(?:\.\d+)?)/g)) {
    const val = m[1];
    if (Number(val) === deposit) continue;
    if (!optionPrices.has(`£${val}`)) fail(`/treatments/: stray price £${val} not in services.json`);
  }
}

for (const slug of slugs) {
  const html = pageFiles.get(path.join("treatments", slug, "index.html"));
  if (!html) continue;
  const mine = rows.filter((r) => r.slug === slug);
  const got = optionAnchors(html);
  if (got.length !== mine.length) fail(`/treatments/${slug}/: ${got.length} option buttons, expected ${mine.length}`);
  mine.forEach((r, i) => {
    const g = got[i];
    if (!g) return;
    if (g.option !== r.option || g.price !== fmt(r.price_gbp)) fail(`/treatments/${slug}/: "${g.label}" differs from data`);
    if (!g.text.includes(`${r.name} (${r.option})`)) fail(`/treatments/${slug}/: option message lacks "${r.name} (${r.option})"`);
  });
  const tags = new Set(got.map((g) => /\[web-([A-Z]{1,2})\]$/.exec(g.text)?.[1]));
  if (tags.size !== 1) fail(`/treatments/${slug}/: option buttons use ${tags.size} different tags`);
  // JSON-LD offers match
  const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  const svc = ld.find((j) => j["@type"] === "Service");
  if (!svc) fail(`/treatments/${slug}/: no Service JSON-LD`);
  else {
    const prices = svc.offers.map((o) => o.price).join();
    const want = mine.map((r) => r.price_gbp.toFixed(2)).join();
    if (prices !== want) fail(`/treatments/${slug}/: JSON-LD prices ${prices} differ from data ${want}`);
  }
  if (!ld.some((j) => j["@type"] === "FAQPage")) fail(`/treatments/${slug}/: no FAQPage JSON-LD`);
  if (!ld.some((j) => j["@type"] === "BreadcrumbList")) fail(`/treatments/${slug}/: no BreadcrumbList JSON-LD`);
}

const faqHtml = pageFiles.get(path.join("faq", "index.html"));
if (faqHtml && !/"@type":"FAQPage"/.test(faqHtml)) fail("/faq/: no FAQPage JSON-LD");
const homeHtml = pageFiles.get("index.html");
if (homeHtml && !/"@type":"DaySpa"/.test(homeHtml)) fail("/: no DaySpa JSON-LD");

// ---- promotions (data/promotions.json, written by the shop's WhatsApp system) ----
// What the home page shows must be exactly the offers that are live today in London: nothing ended,
// nothing that has not started, and no #promotions section at all when there are none.
{
  const file = JSON.parse(read(path.join(root, "data/promotions.json")));
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const shown = file.promotions.filter((p) => p.status === "live" && p.starts <= today && today <= p.ends);
  const htmlCodes = homeHtml ? [...homeHtml.matchAll(/data-promo="([^"]+)"/g)].map((m) => m[1]) : [];
  const want = shown.map((p) => p.code).sort().join();
  if (htmlCodes.slice().sort().join() !== want) fail(`/: offers in the page [${htmlCodes.sort()}] differ from the offers live on ${today} [${want}]`);
  const hasSection = homeHtml ? /<section[^>]*\sid="promotions"/.test(homeHtml) : false;
  if (shown.length && !hasSection) fail('/: offers are live but the page has no id="promotions" section');
  if (!shown.length && hasSection) fail('/: id="promotions" section present while no offer is live');
  for (const [rel, html] of pageFiles) {
    if (rel !== "index.html" && /data-promo="|id="promotions"/.test(html)) fail(`${rel}: offer markup outside the home page`);
  }
  for (const p of shown) {
    const from = (homeHtml ?? "").indexOf(`data-promo="${p.code}"`);
    const rest = from < 0 ? "" : homeHtml.slice(from + 12);
    const nextCard = rest.indexOf('data-promo="');
    const card = rest.slice(0, nextCard >= 0 ? nextCard : Math.max(rest.indexOf("</section>"), 0));
    const href = attr(/<a\b[^>]*wa\.me[^>]*>/.exec(card)?.[0] ?? "", "href");
    const text = href ? new URL(href).searchParams.get("text") : null;
    if (text !== `${p.message.trim()} [web-PR]`) fail(`/: offer ${p.code} button message is ${JSON.stringify(text)}, expected its message plus [web-PR]`);
    if (!card.includes(p.ends_label)) fail(`/: offer ${p.code} does not show its end date "${p.ends_label}"`);
  }
}

// ---- hours, closures, notice, extra FAQ, photos (written by the shop system; design: README "Data the shop system writes") ----
{
  const londonToday = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const addDays = (day, n) => {
    const d = new Date(`${day}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  };
  const jsonOf = (name) => JSON.parse(read(path.join(root, "data", `${name}.json`)));
  const ldOf = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // hours: the /visit/ table and the DaySpa JSON-LD say what data/hours.json says.
  const hours = jsonOf("hours").hours;
  const visitHtml = pageFiles.get(path.join("visit", "index.html")) ?? "";
  const rows = [...visitHtml.matchAll(/<tr[^>]*><th[^>]*>([^<]*)<\/th><td[^>]*>([^<]*)<\/td><\/tr>/g)].map((m) => [decodeEntities(m[1]).trim(), decodeEntities(m[2]).trim()]);
  const wantRows = DAYS.map((d) => [d, hours[d] ? `${hours[d].opens}–${hours[d].closes}` : "Closed"]);
  if (JSON.stringify(rows) !== JSON.stringify(wantRows)) fail(`/visit/: hours table ${JSON.stringify(rows)} differs from data/hours.json ${JSON.stringify(wantRows)}`);
  if (homeHtml) {
    const biz = ldOf(homeHtml).find((j) => j["@type"] === "DaySpa");
    const got = {};
    for (const spec of biz?.openingHoursSpecification ?? []) for (const d of spec.dayOfWeek) got[d] = `${spec.opens}-${spec.closes}`;
    const want = Object.fromEntries(DAYS.filter((d) => hours[d]).map((d) => [d, `${hours[d].opens}-${hours[d].closes}`]));
    if (JSON.stringify(got) !== JSON.stringify(want)) fail(`/: DaySpa openingHoursSpecification ${JSON.stringify(got)} differs from data/hours.json`);
  }

  // closures: live, not over, starting within 60 days: in the footer of every page and under the /visit/ table; every live one not over in JSON-LD.
  const closures = jsonOf("closures").closures.filter((c) => c.status === "live" && c.to >= londonToday);
  const shownCodes = closures.filter((c) => c.from <= addDays(londonToday, 60)).map((c) => c.code).sort().join();
  const specWant = closures.map((c) => `${c.from}|${c.to}|${c.hours ? c.hours.opens : "00:00"}|${c.hours ? c.hours.closes : "00:00"}`).sort().join();
  for (const [rel, html] of pageFiles) {
    if (rel === "404.html" || rel === path.join("404", "index.html")) continue;
    const foot = [...html.matchAll(/data-closure-foot="([^"]+)"/g)].map((m) => m[1]).sort().join();
    if (foot !== shownCodes) fail(`${rel}: footer closures [${foot}] differ from the live closures [${shownCodes}]`);
    const rowsHere = [...html.matchAll(/data-closure-row="([^"]+)"/g)].map((m) => m[1]).sort().join();
    if (rel === path.join("visit", "index.html")) {
      if (rowsHere !== shownCodes) fail(`/visit/: closures under the table [${rowsHere}] differ from the live closures [${shownCodes}]`);
      if (shownCodes && !/id="closures"/.test(html)) fail('/visit/: closures are live but there is no id="closures" list');
      if (!shownCodes && /id="closures"/.test(html)) fail('/visit/: id="closures" present while no closure is live');
    } else if (rowsHere) fail(`${rel}: closure rows outside /visit/`);
    for (const j of ldOf(html)) {
      if (j["@type"] !== "DaySpa") continue;
      const got = (j.specialOpeningHoursSpecification ?? []).map((x) => `${x.validFrom}|${x.validThrough}|${x.opens}|${x.closes}`).sort().join();
      if (got !== specWant) fail(`${rel}: specialOpeningHoursSpecification [${got}] differs from the live closures [${specWant}]`);
    }
  }
  const faqHtmlC = pageFiles.get(path.join("faq", "index.html")) ?? "";
  const hoursAnswer = /What are your opening hours\?[\s\S]*?<\/p>/.exec(faqHtmlC)?.[0] ?? "";
  if (closures.some((c) => c.from <= addDays(londonToday, 60)) !== /Please note:/.test(hoursAnswer)) fail('/faq/: the hours answer carries "Please note:" iff a closure is upcoming');

  // notice: id="notice" on every page iff a notice is live today, with its exact text.
  const notice = jsonOf("notice").notice;
  const noticeLive = notice && notice.status === "live" && notice.starts <= londonToday && londonToday <= notice.ends;
  for (const [rel, html] of pageFiles) {
    const has = /id="notice"/.test(html);
    if (noticeLive && !has) fail(`${rel}: a notice is live but the page has no id="notice" band`);
    if (!noticeLive && has) fail(`${rel}: id="notice" band present while no notice is live`);
    if (noticeLive && has) {
      const band = /<div id="notice"[\s\S]*?<\/p><\/div>/.exec(html)?.[0] ?? "";
      if (!stripTags(band).includes(notice.text)) fail(`${rel}: notice band does not carry the text of ${notice.code}`);
    }
  }

  // extra FAQ: every live question in the page and in the FAQPage JSON-LD; nothing hidden anywhere.
  const faq = jsonOf("faq-extra").questions;
  if (faqHtmlC) {
    const faqLd = ldOf(faqHtmlC).find((j) => j["@type"] === "FAQPage");
    const asked = new Set((faqLd?.mainEntity ?? []).map((q) => q.name));
    const text = stripTags(faqHtmlC.replace(/<script[\s\S]*?<\/script>/g, ""));
    for (const q of faq) {
      const live = q.status === "live";
      if (live && !(asked.has(q.question) && text.includes(q.question) && text.includes(q.answer))) fail(`/faq/: live question ${q.code} missing from the page or the FAQPage JSON-LD`);
      if (!live && (asked.has(q.question) || text.includes(q.answer))) fail(`/faq/: hidden question ${q.code} is shown`);
    }
    if (faq.some((q) => q.status === "live") !== /id="more-questions"/.test(faqHtmlC)) fail('/faq/: id="more-questions" group present iff an extra question is live');
  }

  // photos: a slot's photo is on the site; a retired photo is nowhere in it.
  const photos = jsonOf("photos");
  const allHtml = [...pageFiles.values()].join("\n");
  for (const im of photos.images) {
    const used = Object.values(photos.slots).includes(im.key);
    const shown = allHtml.includes(`/img/${im.key}-800.webp`);
    if (used && !shown) fail(`photo ${im.key} is set in a slot but no page shows it`);
    if (!used && shown) fail(`photo ${im.key} is shown but no slot uses it`);
  }

  // build.json: the deploy marker (scripts/write-build-json.mjs), not in the sitemap.
  const bj = path.join(OUT, "build.json");
  if (!existsSync(bj)) fail("out/build.json is missing: run node scripts/write-build-json.mjs after next build");
  else {
    try {
      const b = JSON.parse(read(bj));
      if (typeof b.sha !== "string" || !b.sha || typeof b.built_at !== "string" || Number.isNaN(Date.parse(b.built_at))) fail("out/build.json needs sha and built_at");
      for (const c of ["promotions", "hours", "closures", "notice", "faq-extra", "photos", "services", "copy", "seo"]) if (!/^[0-9a-f]{64}$/.test(b.data?.[c] ?? "")) fail(`out/build.json: data.${c} is not a sha256`);
    } catch (e) {
      fail(`out/build.json does not parse (${e.message})`);
    }
    if (existsSync(path.join(OUT, "sitemap.xml")) && read(path.join(OUT, "sitemap.xml")).includes("build.json")) fail("sitemap.xml lists build.json");
  }
}

// ---- "Greenwich" is never shown alone: always "Greenwich, Cutty Sark" (owner's rule, 6 Nov 2026) --
// Allowed as-is: the station name "Greenwich station" and "Royal Borough of Greenwich"
// (no address exception: the postal address no longer contains Greenwich). JSON-LD and other
// script blocks are not checked.
{
  const ALLOWED = /Greenwich station|Royal Borough of Greenwich/g;
  const alone = (text) => text.replace(ALLOWED, "").match(/Greenwich(?!, Cutty Sark)/g)?.length ?? 0;
  for (const [rel, html] of pageFiles) {
    const noScripts = html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "");
    const parts = {
      "visible text": stripTags(noScripts),
      "<title>": /<title>([\s\S]*?)<\/title>/.exec(html)?.[1] ?? "",
      "meta description": /<meta name="description" content="([^"]*)"/.exec(html)?.[1] ?? "",
      "og:title": /<meta property="og:title" content="([^"]*)"/.exec(html)?.[1] ?? "",
      "og:description": /<meta property="og:description" content="([^"]*)"/.exec(html)?.[1] ?? "",
      "alt/aria text": [...noScripts.matchAll(/\b(?:alt|aria-label)="([^"]*)"/g)].map((m) => m[1]).join(" | "),
    };
    for (const [what, text] of Object.entries(parts)) {
      if (alone(decodeEntities(text)) > 0) fail(`${rel}: ${what} shows "Greenwich" without ", Cutty Sark"`);
    }
  }
}

// ---- the shop's name is always the full "Sri Siam Thai Therapy & Wellness" (owner's rule, 6 Nov 2026) --
// Rule (README "The shop's name"): in every built page's visible text, <title>, meta description, og:title,
// og:site_name, og:description, alt/aria-label text, wa.me links' text= parameter and JSON-LD "name" values,
// "Sri Siam" must be followed by " Thai Therapy & Wellness" (HTML-escaped &amp; also accepted), and "SriSiam" never appears.
// Email addresses and the domain are lowercase srisiam..., so the case-sensitive match leaves them alone.
{
  const BAD = /Sri Siam(?! Thai Therapy (?:&|&amp;) Wellness)|SriSiam/g;
  const metaContent = (html, key, val) => new RegExp(`<meta ${key}="${val}" content="([^"]*)"`).exec(html)?.[1] ?? "";
  for (const [rel, html] of pageFiles) {
    const noScripts = html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "");
    const waTexts = [...html.matchAll(/href="(https:\/\/wa\.me\/[^"]*)"/g)].map((m) => {
      try {
        return new URL(decodeEntities(m[1])).searchParams.get("text") ?? "";
      } catch {
        return "";
      }
    });
    const ldNames = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap((m) => {
      const names = [];
      try {
        JSON.parse(decodeEntities(m[1]).replace(/\\u0026/g, "&"), (k, v) => (k === "name" && typeof v === "string" && names.push(v), v));
      } catch {
        names.push(m[1]);
      }
      return names;
    });
    const parts = {
      "visible text": stripTags(noScripts),
      "<title>": /<title>([\s\S]*?)<\/title>/.exec(html)?.[1] ?? "",
      "meta description": metaContent(html, "name", "description"),
      "og:title": metaContent(html, "property", "og:title"),
      "og:site_name": metaContent(html, "property", "og:site_name"),
      "og:description": metaContent(html, "property", "og:description"),
      "alt/aria text": [...noScripts.matchAll(/\b(?:alt|aria-label)="([^"]*)"/g)].map((m) => m[1]).join(" | "),
      "wa.me text=": waTexts.join(" | "),
      "JSON-LD name": ldNames.join(" | "),
    };
    for (const [what, text] of Object.entries(parts)) {
      const bad = decodeEntities(text).match(BAD);
      if (bad) fail(`${rel}: ${what} names the shop without the full "Sri Siam Thai Therapy & Wellness" (${bad.length}x)`);
    }
  }
}

// ---- the shop tour (/tour/, data/tour.json, scripts/make-tour-images.mjs) --------------------------------
// No EXIF, XMP or GPS in any published tour photo; every srcset file exists; the page shows every published shot with a button
// that opens it; the home teaser links to it; the neighbouring business is never named.
{
  const tourDir = path.join(OUT, "img", "tour");
  const srcDir = path.join(root, "public", "img", "tour");
  const shipped = [...(existsSync(srcDir) ? readdirSync(srcDir).map((n) => path.join(srcDir, n)) : []), ...["room-daylight-800.webp", "room-daylight-1600.webp"].map((n) => path.join(root, "public", "img", n))];
  for (const f of shipped) {
    if (!existsSync(f)) {
      fail(`missing photo ${path.relative(root, f)}`);
      continue;
    }
    for (const m of findMetadata(readFileSync(f))) fail(`${path.relative(root, f)} carries metadata (${m}): strip it, the camera's location must not be published`);
    if (f.endsWith("-960.jpg") && statSync(f).size > 250 * 1024) fail(`${path.relative(root, f)} is over 250 KB`);
  }
  if (existsSync(srcDir) && !existsSync(tourDir)) fail("out/img/tour is missing");
  const tourHtml = pageFiles.get(path.join("tour", "index.html")) ?? "";
  const tour = JSON.parse(read(path.join(root, "data/tour.json")));
  const want = tour.zones.flatMap((z) => z.shots);
  const buttons = [...tourHtml.matchAll(/<button\b[^>]*aria-label="(Open [^"]+ full screen)"/g)].length;
  if (buttons !== want.length) fail(`/tour/: ${buttons} "Open ... full screen" buttons, expected ${want.length}`);
  for (const z of tour.zones) if (!new RegExp(`<section[^>]*aria-labelledby="zone-${z.id}"`).test(tourHtml)) fail(`/tour/: zone ${z.id} has no labelled section`);
  for (const s of want) if (!tourHtml.includes(`/img/tour/${s.photo}-`)) fail(`/tour/: photo ${s.photo} is not on the page`);
  if (!/<picture>/.test(tourHtml) || !/type="image\/avif"/.test(tourHtml) || !/type="image\/webp"/.test(tourHtml)) fail("/tour/: pictures lack AVIF and WebP sources");
  if (homeHtml && !/<a\b[^>]*href="\/tour\/"/.test(homeHtml)) fail("/: no link to /tour/ (the home teaser)");
  for (const [rel, html] of pageFiles) {
    for (const m of html.matchAll(/srcSet="([^"]+)"|srcset="([^"]+)"/g)) {
      for (const part of (m[1] ?? m[2]).split(",")) {
        const u = part.trim().split(/\s+/)[0];
        if (u.startsWith("/img/") && !internalExists(u)) fail(`${rel}: srcset file ${u} does not exist`);
      }
    }
    if (/carnaby/i.test(stripTags(html.replace(/<script[\s\S]*?<\/script>/g, "")) + " " + [...html.matchAll(/\balt="([^"]*)"/g)].map((x) => x[1]).join(" "))) fail(`${rel}: names the neighbouring business in text or alt`);
  }
}

// ---- copy and seo (data/copy.json, data/seo.json, written by the shop system; README "copy" and "seo") ---------------------
// Every set text slot is on its page and every set title/description is the page's; no page carries Thai script.
{
  const seoPages = JSON.parse(read(path.join(root, "scripts/lib/seo-pages.json"))).pages;
  const routeOf = Object.fromEntries(Object.entries(seoPages).map(([r, f]) => [f, r]));
  const pageOf = (route) => pageFiles.get(route === "/" ? "index.html" : path.join(route.slice(1), "index.html"));
  const visible = (html) => stripTags(html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, ""));
  const slots = JSON.parse(read(path.join(root, "scripts/lib/copy-slots.json"))).slots;
  const copy = JSON.parse(read(path.join(root, "data/copy.json"))).slots;
  for (const [key, value] of Object.entries(copy)) {
    if (value === null) continue;
    const route = routeOf[slots[key]?.file];
    const html = route && pageOf(route);
    if (!html) fail(`copy slot ${key}: no page for ${slots[key]?.file}`);
    else if (!visible(html).includes(value)) fail(`copy slot ${key}: its text is not on ${route}`);
  }
  const seo = JSON.parse(read(path.join(root, "data/seo.json"))).pages;
  for (const [route, o] of Object.entries(seo)) {
    const html = pageOf(route);
    if (!html) {
      fail(`seo: no page ${route}`);
      continue;
    }
    const title = decodeEntities(/<title>([\s\S]*?)<\/title>/.exec(html)?.[1] ?? "");
    const desc = decodeEntities(/<meta name="description" content="([^"]*)"/.exec(html)?.[1] ?? "");
    if (o.title !== null && title !== o.title) fail(`seo ${route}: <title> is "${title}", data/seo.json says "${o.title}"`);
    if (o.description !== null && desc !== o.description) fail(`seo ${route}: meta description differs from data/seo.json`);
  }
  for (const [rel, html] of pageFiles) {
    const text = visible(html) + " " + (/<title>([\s\S]*?)<\/title>/.exec(html)?.[1] ?? "") + " " + [...html.matchAll(/<meta [^>]*content="([^"]*)"/g)].map((m) => m[1]).join(" ");
    if (/[\u0E00-\u0E7F]/.test(text)) fail(`${rel}: Thai script on the page (the public text is English)`);
  }
}

// ---- unconfirmed claims (25 Nov 2026) ------------------------------------------
// No certificate is on file for Wat Pho training, and one therapist takes bookings. Checked in the whole page
// (visible text, title, meta, alt, JSON-LD). /careers/ may say "therapists" (a role you apply for), not "Wat Pho".
for (const [rel, html] of pageFiles) {
  const text = stripTags(html.replace(/<style[\s\S]*?<\/style>/g, "")) + " " + [...html.matchAll(/\b(?:alt|content|aria-label)="([^"]*)"/g)].map((m) => decodeEntities(m[1])).join(" ");
  if (/\bwat pho\b/i.test(text)) fail(`${rel}: unconfirmed claim "Wat Pho": remove until a certificate is on file`);
  const careers = rel === path.join("careers", "index.html");
  if (!careers && /\btherapists\b/i.test(text)) fail(`${rel}: unconfirmed claim "therapists": one therapist takes bookings`);
}

// ---- Google Ads tag and cookie banner (lib/site.ts googleAds, components/CookieConsent.tsx, AdsConsentBanner.tsx, lib/consent.ts) ----
// id empty: no file in out/ carries any trace of it (no loader, no consent code, no banner CSS) and the privacy
// notice says no cookies. id set: no page asks Google for anything before consent (the loader lives only in a
// lazy client chunk), the consent default is pushed before the update and the config, Accept is measurement
// only, "Cookie settings" is in every footer and in the notice, and the notice describes the tag.
{
  const adsId = /googleAds:\s*\{\s*id:\s*"([^"]*)"/.exec(site)?.[1];
  const adsLabel = /googleAds:\s*\{[^}]*conversionLabel:\s*"([^"]*)"/.exec(site)?.[1];
  const privHtml = pageFiles.get(path.join("privacy", "index.html")) ?? "";
  const privText = stripTags(privHtml.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, ""));
  const assets = files.filter((f) => /\.(html|js|css)$/.test(f)).map((f) => [path.relative(OUT, f), read(f)]);
  if (adsId === undefined || adsLabel === undefined) fail("lib/site.ts: googleAds { id, conversionLabel } not found");
  else if (!adsId) {
    // Case-sensitive on purpose: Next's own runtime has "gTag" in it.
    const TRACE = /[Gg]oogle[Tt]ag[Mm]anager|gtag|ads-consent|AdsConsentBanner|data-cookie-settings|"consent","(?:default|update)"|banner-rise|cookie_settings_button|\{\{#if|\{\{\/if\}\}|\{\{else\}\}/;
    for (const [rel, t] of assets) {
      const m = TRACE.exec(t);
      if (m) fail(`${rel}: contains "${m[0]}" while googleAds.id is empty (the banner and loader must not be built)`);
    }
    for (const w of ["Google Ads tag", "Cookie settings"]) if (privText.includes(w)) fail(`/privacy/: says "${w}" while googleAds.id is empty`);
    if (!privText.includes("This website does not use cookies, analytics or any other tracking.")) fail("/privacy/: lacks the no-cookies sentence while googleAds.id is empty");
  } else {
    if (!/^AW-\d+$/.test(adsId)) fail(`lib/site.ts: googleAds.id "${adsId}" is not AW-<digits>`);
    for (const [rel, html] of pageFiles) {
      if (/googletagmanager|googleadservices|doubleclick\.net|google-analytics/i.test(html)) fail(`${rel}: the built HTML references a Google tag host (it may load only after Accept, from client JS)`);
      for (const m of html.matchAll(/<script\b[^>]*\bsrc="([^"]*)"/g)) {
        if (!m[1].startsWith("/_next/")) fail(`${rel}: script from ${m[1]} (only the site's own /_next/ scripts may be in the HTML)`);
      }
      const foot = /<footer[\s\S]*?<\/footer>/.exec(html)?.[0] ?? "";
      if (!foot.includes("data-cookie-settings")) fail(`${rel}: footer has no Cookie settings control`);
    }
    if (privHtml.replace(/<footer[\s\S]*?<\/footer>/, "").split("data-cookie-settings").length < 2) fail("/privacy/: no Cookie settings control in the notice itself");
    for (const w of ["Google Ads tag", "Cookie settings", "only with your consent"]) if (!privText.includes(w)) fail(`/privacy/: lacks "${w}" while googleAds.id is set`);
    if (privText.includes("does not use cookies")) fail("/privacy/: still says the site does not use cookies while googleAds.id is set");
    if (/cookie_settings_button|\{\{#if|\{\{\/if\}\}|\{\{else\}\}/.test(privHtml)) fail("/privacy/: a conditional-copy marker leaked into the page");
    // With the ad click reference on, lib/clickref.ts reads the stored choice through lib/consent.ts, so its lazy
    // chunk carries a copy of that module (one instance at run time); it is checked in the click-reference block.
    const clickRefChunk = (rel, t) => rel.endsWith(".js") && t.includes("clickref-v1|");
    const loaders = assets.filter(([rel, t]) => rel.endsWith(".js") && t.includes("googletagmanager.com/gtag/js") && !clickRefChunk(rel, t));
    if (loaders.length !== 1) fail(`expected the gtag.js loader in exactly one JS file, found ${loaders.length}`);
    for (const [rel, t] of loaders) {
      const def = t.indexOf('"consent","default"');
      const upd = t.indexOf('"consent","update"');
      const cfg = t.indexOf('"config"');
      const load = t.indexOf("googletagmanager.com/gtag/js");
      if (def < 0 || upd < 0 || cfg < 0) fail(`${rel}: consent default, consent update or config call not found`);
      else if (!(def < upd && upd < cfg && cfg < load)) fail(`${rel}: expected consent default, then consent update, then config, then the gtag.js request`);
      if (!/ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied",analytics_storage:"denied"/.test(t)) fail(`${rel}: consent default is not all four denied`);
      if (!/ad_storage:"granted",ad_user_data:"granted",ad_personalization:"denied",analytics_storage:"denied"/.test(t)) fail(`${rel}: Accept must grant ad_storage and ad_user_data only (measurement, no remarketing, no analytics)`);
      if (/ad_personalization:"granted"|analytics_storage:"granted"/.test(t)) fail(`${rel}: grants ad_personalization or analytics_storage`);
    }
    for (const [rel, t] of assets) {
      if (rel.endsWith(".html") || loaders.some(([l]) => l === rel) || clickRefChunk(rel, t)) continue;
      if (t.includes("googletagmanager")) fail(`${rel}: mentions googletagmanager outside the lazy loader chunk`);
    }
  }
}

// ---- ad click reference (lib/site.ts googleAds.clickEndpoint, lib/clickref.ts, components/AdSource.tsx) ----
// endpoint "": nothing of it is built (no code derivation, no click-reference chunk, no data-wa-tag, no consent
// text version in the consent key) and the privacy notice and the banner keep today's words.
// endpoint set: https only (http://localhost builds are for local tests and fail here), the Ads id is set, the
// retention is filled in (not TBC), the endpoint is in client JS only (never in HTML), the code and the POST live
// only in a lazy chunk, the consent key carries the text version, and the notice describes it all.
{
  const endpoint = /clickEndpoint:\s*"([^"]*)"/.exec(site)?.[1];
  const siteId = /siteId:\s*"([^"]*)"/.exec(site)?.[1];
  const retention = /clickRetention:\s*"([^"]*)"/.exec(site)?.[1];
  const logRetention = /clickLogRetention:\s*"([^"]*)"/.exec(site)?.[1];
  // This shop's id everywhere: the shop bot's SHOP_ID (shop-agent, k8s namespace shop-sst), named in README and in
  // .github/workflows/auto-merge-shop-agent.yml. The click reference must use it and only this shop's endpoint.
  const SHOP_ID = "sst";
  // Endpoints of the other shops' bots (design section 4): this site must never post to them.
  const OTHER_SHOP_HOSTS = ["pel-bot.gumon.io", "shop-agent.taitam-d.com", "taitam-d.com"];
  const adsId = /googleAds:\s*\{\s*id:\s*"([^"]*)"/.exec(site)?.[1];
  const privHtml = pageFiles.get(path.join("privacy", "index.html")) ?? "";
  const privText = stripTags(privHtml.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, ""));
  const assets = files.filter((f) => /\.(html|js|css)$/.test(f)).map((f) => [path.relative(OUT, f), read(f)]);
  const SECTION = "Linking a booking to one of our ads";
  if (endpoint === undefined || siteId === undefined || retention === undefined || logRetention === undefined) fail("lib/site.ts: googleAds { clickEndpoint, siteId, clickRetention, clickLogRetention } not found");
  else if (!endpoint) {
    const TRACE = /clickref|CLICK_REF|23456789BCDFGHJKMNPQRSTVWXZ|2-9BCDFGHJKMNPQRSTVWXZ|waTag|wa-tag|ads-consent:change|click_retention|click_log_retention|click_ref|google_ads_only|booking system|Linking a booking/;
    for (const [rel, t] of assets) {
      const m = TRACE.exec(t);
      if (m) fail(`${rel}: contains "${m[0]}" while googleAds.clickEndpoint is empty (the click reference must not be built)`);
    }
    if (adsId && !assets.some(([rel, t]) => rel.endsWith(".js") && t.includes('"ads-consent:v1"'))) fail('consent key "ads-consent:v1" not found in the client JS while googleAds.clickEndpoint is empty');
  } else {
    let cv = "";
    try {
      cv = consentVersion(root, siteId, retention, logRetention);
    } catch (e) {
      fail(String(e.message ?? e));
    }
    if (!adsId) fail("lib/site.ts: googleAds.clickEndpoint is set but googleAds.id is empty (the click reference needs the consent banner)");
    if (!/^https:\/\/[A-Za-z0-9.-]+(:\d+)?\/[A-Za-z0-9._~\/-]*$/.test(endpoint)) fail(`lib/site.ts: googleAds.clickEndpoint "${endpoint}" is not an https URL with a path (http://localhost is for local tests only)`);
    if (siteId !== SHOP_ID) fail(`lib/site.ts: googleAds.siteId "${siteId}" is not this shop's id "${SHOP_ID}"`);
    const workflow = read(path.join(root, ".github/workflows/auto-merge-shop-agent.yml"));
    if (!workflow.includes(`shop id ${SHOP_ID}`)) fail(`auto-merge-shop-agent.yml no longer names shop id ${SHOP_ID}: check SHOP_ID in check-site`);
    let host = "";
    let where = "";
    try {
      const u = new URL(endpoint);
      host = u.hostname.toLowerCase();
      where = `${host}${u.pathname}`;
    } catch {
      // reported by the https rule
    }
    if (!new RegExp(`(^|[./-])${SHOP_ID}([./-]|$)`).test(where)) fail(`lib/site.ts: googleAds.clickEndpoint "${endpoint}" does not name this shop ("${SHOP_ID}" in its host or path)`);
    for (const h of OTHER_SHOP_HOSTS) if (host === h || host.endsWith(`.${h}`)) fail(`lib/site.ts: googleAds.clickEndpoint "${endpoint}" belongs to another shop (${h})`);
    for (const [name, v] of [["clickRetention", retention], ["clickLogRetention", logRetention]]) {
      if (!v.trim() || /\bTBC\b/i.test(v)) fail(`lib/site.ts: googleAds.${name} is "${v}": set the real value (from KBOT) before turning the click reference on`);
    }
    if (!/^[A-Za-z0-9._-]{1,32}$/.test(cv)) fail(`consent text version "${cv}" is not [A-Za-z0-9._-]{1,32}`);
    // The banner (rendered in the browser from the props in every page) must say what is shared and with whom.
    for (const [rel, html] of pageFiles) {
      for (const w of ["booking system", "click reference"]) if (!html.includes(w)) fail(`${rel}: the cookie banner text lacks "${w}" while the click reference is on`);
    }
    for (const [rel, html] of pageFiles) if (html.includes(endpoint)) fail(`${rel}: the HTML contains the click-reference endpoint (it belongs in client JS only)`);
    if (!assets.some(([rel, t]) => rel.endsWith(".js") && t.includes(endpoint))) fail("the click-reference endpoint is not in the client JS");
    const chunks = assets.filter(([rel, t]) => rel.endsWith(".js") && t.includes("clickref-v1|"));
    if (chunks.length !== 1) fail(`expected the code derivation in exactly one JS file, found ${chunks.length}`);
    for (const [rel, t] of chunks) {
      const base = path.basename(rel);
      for (const [prel, html] of pageFiles) if (html.includes(base)) fail(`${prel}: loads ${base} directly (the click-reference chunk must be lazy)`);
      for (const want of ['credentials:"omit"', "keepalive:!0", '"text/plain"', 'ad_user_data:"granted"', 'ad_personalization:"denied"', "23456789BCDFGHJKMNPQRSTVWXZ"]) {
        if (!t.includes(want)) fail(`${rel}: click-reference chunk lacks ${want}`);
      }
      if (/ad_personalization:"granted"/.test(t)) fail(`${rel}: click-reference chunk says ad_personalization granted`);
    }
    if (cv && !assets.some(([rel, t]) => rel.endsWith(".js") && t.includes(cv))) fail(`consent text version "${cv}" not found in the client JS`);
    if (assets.some(([rel, t]) => rel.endsWith(".js") && t.includes('"ads-consent:v1"'))) fail('consent key is still "ads-consent:v1" while the click reference is on (it must carry the text version)');
    for (const w of [SECTION, "our booking system", "Gumon Technology", "only with your consent", "Cookie settings", "IP address", "before it is reported to Google", retention, logRetention]) if (!privText.includes(w)) fail(`/privacy/: lacks "${w}" while googleAds.clickEndpoint is set`);
    if (/click_retention|click_log_retention|\bTBC\b/.test(privText)) fail("/privacy/: has an unfilled click-reference retention");
  }
}

// ---- marketing notice (UK soft opt-in, PECR reg 22) and /terms/ -------------
{
  const terms = read(path.join(root, "content/_booking-terms.md"));
  const sentence = /^- Sentence:\s*(.+)$/m.exec(terms)?.[1]?.trim();
  const marketing = /^### Marketing messages\n+(.+)$/m.exec(terms)?.[1]?.trim();
  if (!sentence || !marketing) fail("content/_booking-terms.md: marketing_notice sentence or Marketing messages section missing");
  else {
    const NOTICE = "By booking, you agree that Sri Siam Thai Therapy & Wellness may send you occasional news and offers about our treatments by email and WhatsApp.";
    if (sentence !== NOTICE) fail("content/_booking-terms.md: the marketing notice sentence is not the agreed wording");
    const needNotice = ["index.html", path.join("treatments", "index.html"), ...slugs.map((sl) => path.join("treatments", sl, "index.html"))];
    for (const rel of needNotice) {
      const html = pageFiles.get(rel);
      if (!html) continue;
      if (!stripTags(html).includes(NOTICE)) fail(`${rel}: the marketing notice sentence is missing`);
    }
    // No tickbox anywhere: customers opt out with STOP or the unsubscribe link.
    for (const [rel, html] of pageFiles) {
      if (/<input\b[^>]*type="checkbox"/.test(html)) fail(`${rel}: contains a checkbox input (the marketing opt-out box was removed)`);
      if (/don't send me news and offers/i.test(stripTags(html)) || /don&#x27;t send me news and offers/i.test(html)) fail(`${rel}: still mentions the removed opt-out box`);
    }
    const termsHtml = pageFiles.get(path.join("terms", "index.html"));
    if (termsHtml) {
      if (!/id="marketing"/.test(termsHtml)) fail('/terms/: no id="marketing" section');
      const text = stripTags(termsHtml);
      if (!text.includes(marketing.replace(/\*\*/g, "").replace(/\s+/g, " "))) fail("/terms/: the Marketing messages text is missing or changed");
      for (const w of ["Deposit", "Paying the rest", "Moving your booking", "Cancelling"]) if (!text.includes(w)) fail(`/terms/: lacks "${w}"`);
    }
  }
}

// ---- result -----------------------------------------------------------------
if (errors.length) {
  console.error(`check-site: ${errors.length} problem(s)\n- ` + errors.join("\n- "));
  process.exit(1);
}
console.log(`check-site OK: ${pageFiles.size} html files, ${routes.length} routes, indexable=${indexable}`);
