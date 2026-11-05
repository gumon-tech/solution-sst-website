// Runs after `next build`. Fails the build (exit 1) on any problem in out/.
// Plain Node, no dependencies. Keep its route list independent of lib/routes.ts on purpose:
// a route dropped from the app by mistake should fail here, not vanish from both lists.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
const routes = ["/", "/treatments/", "/gift-vouchers/", "/about/", "/visit/", "/faq/", "/careers/", "/privacy/", ...slugs.map((s) => `/treatments/${s}/`)];
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
    const want = `Hi Sri Siam, I'd like to book ${article(r.name)} ${r.name} (${r.option}) please. [web-M]`;
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
      for (const c of ["promotions", "hours", "closures", "notice", "faq-extra", "photos"]) if (!/^[0-9a-f]{64}$/.test(b.data?.[c] ?? "")) fail(`out/build.json: data.${c} is not a sha256`);
    } catch (e) {
      fail(`out/build.json does not parse (${e.message})`);
    }
    if (existsSync(path.join(OUT, "sitemap.xml")) && read(path.join(OUT, "sitemap.xml")).includes("build.json")) fail("sitemap.xml lists build.json");
  }
}

// ---- "Greenwich" is never shown alone: always "Greenwich, Cutty Sark" (owner's rule, 6 Nov 2026) --
// Allowed as-is: the station name "Greenwich station", "Royal Borough of Greenwich", and the
// postal address line (SITE.address, "Glaisher Street, Greenwich, London SE8 3ET"). JSON-LD and other
// script blocks are not checked.
{
  const ALLOWED = /Greenwich station|Royal Borough of Greenwich|Glaisher Street, Greenwich, London SE8 3ET/g;
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

// ---- result -----------------------------------------------------------------
if (errors.length) {
  console.error(`check-site: ${errors.length} problem(s)\n- ` + errors.join("\n- "));
  process.exit(1);
}
console.log(`check-site OK: ${pageFiles.size} html files, ${routes.length} routes, indexable=${indexable}`);
