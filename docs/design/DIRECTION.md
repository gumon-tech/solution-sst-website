# Sri Siam Thai Therapy & Wellness — design direction and content spec

Written 2026-10-31 by the design/content executor for the KSSW build. The Sonnet executor builds from this file and from `content/*.md`; nothing in either is a suggestion to be improved on silently. Where a fact is not settled it is marked **OPEN** and listed again at the end.

Sources of truth, in order: the lead's brief and corrections (2026-10-31) → `data/services.json` (Treatwell read, the only place names, durations and prices live) → this file → `content/*.md`.

---

## 1. Research summary (what we are building towards, and why)

Ten searches and a dozen page reads, 2026-10-31. Each finding below is used somewhere in sections 2–12.

### 1.1 Booking friction: one route, one tap

- WhatsApp click-to-chat links (`https://wa.me/<E.164 digits>?text=<url-encoded>`) open a chat with the text pre-filled and editable; nothing is sent until the visitor presses send, and the link gives the business no click data. Omit `+`, zeros, brackets, dashes from the number. Source: WhatsApp Help Center as summarised by Unipile, https://www.unipile.com/nl/?p=275019 (the official page is https://faq.whatsapp.com/5913398998672934).
- Our two sister sites (Taitam-D, `~/dev/solutions-taitamd-shop-website`; PEL, `~/dev/solution-pure-essentials-london-website`) both converged on: a pre-filled WhatsApp button as the only primary action, one sticky bottom bar on phones, and a source tag at the end of every message so the room answering WhatsApp can count where enquiries came from. We keep that pattern and that tag grammar (`[web-X]`, one or two capital letters, read from the end of the message by the shop-agent `store.py`).
- Competitor pattern (Opulence Thai Spa, Covent Garden, https://opulencethaispa.co.uk/thai-massage-in-central-london): many repeated "Book Now" buttons to a third-party booking app, plus a contact form and a phone/WhatsApp line per location. The repeated CTA cadence works; the split between three booking routes does not. We offer one route and repeat it.

### 1.2 Trust signals that are legal in the UK

- The Digital Markets, Competition and Consumers Act 2024 banned fake and misleading consumer reviews from 6 April 2025; the CMA's guidance CMA208 (4 April 2025) covers publishing or commissioning fake reviews and concealing incentivised ones, with fines up to 10% of turnover. Sources: CMA208 PDF https://assets.publishing.service.gov.uk/media/67eeb64fe9c76fa33048c790/CMA208_-_Fake_reviews_guidance.pdf; Osborne Clarke https://www.osborneclarke.com/insights/cma-puts-fake-reviews-and-endorsements-uk-under-spotlight; Lewis Silkin https://www.lewissilkin.com/insights/2025/07/28/cma-sweeps-websites-for-compliance-with-new-law-on-consumer-reviews-102kxwk.
- Decision: the site quotes no review, shows no star count or review number, and does not use `aggregateRating`/`review` in structured data (Google's own LocalBusiness guidance says those are for sites that review *other* businesses: https://developers.google.com/search/docs/appearance/structured-data/local-business). The one trust link is "Read our reviews on Google" to the Maps listing. Trust is carried instead by verifiable facts: Wat Pho training, the real address, real photographs of the rooms and treatments, clear money terms.
- The draft at `clients/sst/website-redesign/index.html` has a "What guests say" block with three unnamed quotes. It is dropped.

### 1.3 Mobile-first and speed

- Local searches are mostly made on phones (estimates range 57–84% depending on the study; all agree the majority is mobile): https://onthemap.com/blog/local-seo-stats/, https://seoprofy.com/blog/local-seo-statistics. Every layout below is specified at 390px first.
- LCP: the hero image must not start at opacity 0. The browser cannot record LCP until the image paints at non-zero opacity, and fade-in heroes commonly cost 650–900 ms of LCP; `fetchpriority="high"` does not rescue a hidden image. Source: Shopify performance docs https://shopify.dev/docs/storefronts/themes/best-practices/performance/dont-hide-lcp-image-behind-animations; Chrome docs https://developer.chrome.com/docs/modern-web-guidance/guides/performance/optimize-image-priority. Spec: the hero `<img>` gets `fetchpriority="high"`, no `loading="lazy"`, explicit width/height, and no opacity or transform animation. Only one image per page gets high priority.

### 1.4 Accessibility (WCAG 2.2 AA plus reduced motion)

- 2.5.8 Target Size (Minimum) is new at AA in 2.2: pointer targets at least 24×24 CSS px or spaced; we use 44px minimum for every button and 48px for the sticky bar. Source: W3C "What's new in WCAG 2.2" https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/; Deque https://dequeuniversity.com/resources/wcag-2.2.
- 2.3.3 Animation from Interactions is AAA, not AA, but the recommended technique (`prefers-reduced-motion`, C39/SCR40) is cheap and we apply it to every animation on the site, not only interaction-triggered ones. Source: https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html.
- Contrast: every text/background pair in the token table (section 3) was computed on 2026-10-31 and is ≥ 4.5:1 for body text and ≥ 3:1 for large text and UI borders. The brand gold #C5A059 is 2.38:1 on cream, so it is **never** used for text on light backgrounds; small gold text on cream uses Gold 700 #7A5F2A (5.82:1).

### 1.5 Local SEO and AEO

- Google: use the most specific `LocalBusiness` subtype; `DaySpa` is named as an example. Required: `name`, `address`. Recommended: `geo` (5 decimals), `openingHoursSpecification`, `telephone`, `url`, `priceRange`. Source: https://developers.google.com/search/docs/appearance/structured-data/local-business. schema.org hierarchy: `LocalBusiness > HealthAndBeautyBusiness > DaySpa`, with `hasOfferCatalog`, `hasMap`, `email`, `paymentAccepted` available: https://schema.org/DaySpa.
- FAQPage rich results were restricted to government/health sites in August 2023 (https://developers.google.com/search/blog/2023/08/howto-faq-changes) and Google's documentation now says the feature no longer appears in Search from 7 May 2026 (https://developers.google.com/search/docs/appearance/structured-data/faqpage). We still emit `FAQPage` JSON-LD on `/faq/` and the treatment pages: it costs nothing, Google says unused structured data does no harm, and answer engines read it. The on-page pattern matters more than the markup.
- AEO pattern, consistent across sources (https://www.3l3c.ai/blog/smb-content-marketing-united-states/aeo-page-structure-smbs, https://conducemedia.com.au/answer-engine-optimisation/): question-shaped headings; the direct answer in the first sentence under each; a compact "answer-first" block near the top of priority pages; facts an engine can verify (address, hours, how to book). Every treatment page in `content/treatments/` opens with a one-sentence definition, and every FAQ answer gives the answer in its first sentence.
- NAP consistency (name, address, phone identical everywhere) is the single most repeated local-SEO rule; the old Wix site has the address written three ways and two phone numbers. On this site the address string and the phone string come from one constant each (`lib/site.ts`) and are rendered, never retyped.

### 1.6 What well-regarded London Thai massage sites do (patterns, not copies)

Read via https://secretldn.com/thai-massage-in-london/ (Thai Square Spa, Thai Kosai, Thai Massage Central, Asiatic, Thai Sense Spa and others) and the Opulence page above:

- Pattern worth keeping: a short menu of named treatments with durations; a therapist-training line (Wat Pho, VTCT) as the main credential; room photography; an FAQ that answers "what is Thai massage / what do I wear / does it hurt".
- Pattern to avoid: "Best Thai massage in London" superlatives repeated as keywords (Opulence); mixed Islington/Covent Garden location signals on the same page; unsupported "clients frequently comment" lines. Our copy uses the place names Greenwich, Deptford, SE8 and SE10 only where a sentence would naturally say them.

### 1.7 Transport facts for /visit/ (verified; straight-line distances computed from the shop's geo 51.4826268, -0.0189136 and Wikipedia station coordinates on 2026-10-31)

| Station | Services | Zone | Straight-line distance | Source |
|---|---|---|---|---|
| Cutty Sark for Maritime Greenwich DLR | DLR, Lewisham branch; in Greenwich town centre | 2/3 | 609 m | https://en.wikipedia.org/wiki/Cutty_Sark_DLR_station |
| Greenwich | DLR (Bank/Stratford–Lewisham); Southeastern (Cannon Street–Slade Green); Thameslink (Luton–Rainham) | 2/3 | 608 m | https://en.wikipedia.org/wiki/Greenwich_station |
| Deptford | Southeastern and Thameslink; London's oldest station still in use (1836) | 2 | 676 m | https://en.wikipedia.org/wiki/Deptford_railway_station |
| Deptford Bridge DLR | DLR | 2/3 | 948 m | https://en.wikipedia.org/wiki/Deptford_Bridge_DLR_station |
| Greenwich Pier | river pier | — | 675 m | Wikipedia coordinates only; boat services **not verified**, not mentioned in copy |

Copy rule: name Cutty Sark DLR, Greenwich and Deptford stations and their lines; say "a short walk" and give no minutes. **OPEN**: lead to measure walking minutes in Google Maps if we want them (600–700 m as the crow flies is typically 8–12 minutes on foot). Buses, parking and step-free access: no verified facts, not mentioned.

---

## 2. Chosen direction: "Lantern light"

A small, calm Thai therapy room in Greenwich, seen in the evening: deep plum walls, warm gold ornament, cream linen, candlelight. The site reads as a quiet, confident shop, not a chain spa and not a clinic.

Why this and not the alternatives:

- **Keeps the brand** the shop already prints on its voucher cards and door (purple and gold "S" with two hands). Customers who found the shop on Google or Treatwell see the same identity.
- **Differs from both sister sites.** Taitam-D is forest green and gold with a busy multi-category catalogue; PEL is cream, sand and oak with arches. Plum-and-candlelight is a different register, and the hero frame, ornament and menu UI below are new.
- **Mobile reading first.** Pages are cream (light) for legibility in daylight on a phone; plum is reserved for four "lantern" moments where the page darkens: the hero overlay strip, the "How booking works" band, the closing call-to-action band, and the footer. That rhythm (light / dark / light / dark) gives each page one obvious place to tap "Book".
- **Delight without cost.** Motion is limited to things that never block paint: an ornament line that draws itself under headings, soft rises on scroll, a hover lift on buttons, a slow candle-glow behind the hero on desktop. All of it is off under `prefers-reduced-motion`.

Tone of voice: warm, plain, unhurried. Short sentences. We say what a treatment uses, what it focuses on and how it feels; we never say what it fixes. "You" and "we". No exclamation marks. UK spelling.

---

## 3. Design tokens

Put these in `tailwind.config.ts` under `theme.extend.colors` (names as given) and in `app/globals.css` as CSS variables for the few places Tailwind classes cannot reach (ornament SVG stroke, motion variables).

### 3.1 Colour

| Token | Hex | Use | Contrast notes (computed 2026-10-31) |
|---|---|---|---|
| `cream` | #FDFCF0 | page background | — |
| `sand` | #F5F2DF | alternate section background, card fill | ink-2 on sand 7.87:1 |
| `stone` | #DCD7C0 | hairlines, card borders, dividers | 3:1 class not needed (decorative) |
| `ink` | #2C2C2C | body text on cream/sand | 13.54:1 on cream |
| `ink-2` | #4A4A4A | secondary text on cream/sand | 8.59:1 on cream |
| `plum` | #362140 | brand plum: buttons, headings, dark bands | cream on plum 14.06:1 |
| `plum-deep` | #2D1B36 | footer, hero overlay, pressed state | cream on plum-deep 15.4:1 |
| `plum-mid` | #5A3A6B | link hover on cream, focus ring | 9.04:1 on cream |
| `plum-tint` | #EEE6F1 | soft tint behind option chips, FAQ open row | — |
| `gold` | #C5A059 | ornament lines, icons on plum, large display text on plum | 5.9:1 on plum. **Never body text on cream** (2.38:1) |
| `gold-pale` | #E8D4A2 | eyebrow text and hairlines on plum, hover of gold | 9.92:1 on plum |
| `gold-deep` | #7A5F2A | small gold-coloured text on cream (eyebrows, prices' "from") | 5.82:1 on cream |
| `whatsapp` | #25D366 | the WhatsApp glyph only, inside buttons on plum or in the sticky bar; never as a button fill (white text on it is 1.9:1) | — |

Gradients: hero overlay on mobile `linear-gradient(180deg, rgba(45,27,54,0) 40%, rgba(45,27,54,.85) 100%)`; candle glow (desktop only) `radial-gradient(600px 400px at 70% 30%, rgba(232,212,162,.35), transparent 70%)`.

### 3.2 Type (Google Fonts, loaded with `next/font/google`, `display: swap`, subsets latin)

| Role | Family | Weights | Notes |
|---|---|---|---|
| Display / headings | **Cormorant Garamond** | 500, 600, 600 italic | Italic used for one emphasised word in the hero and section headings ("*Greenwich*"). Letter-spacing -0.01em at ≥ 40px. |
| Body / UI | **Figtree** | 400, 500, 600 | Buttons and nav at 500/600. Figtree has a wide x-height and reads well at 16px on phones. |

Scale (mobile / desktop), line-height:

| Step | 390px | 1280px | lh |
|---|---|---|---|
| display (hero h1) | 38px | 64px | 1.05 |
| h2 | 30px | 44px | 1.1 |
| h3 | 22px | 26px | 1.2 |
| lead | 18px | 20px | 1.5 |
| body | 16px | 17px | 1.6 |
| small / eyebrow | 13px, uppercase, tracking .18em | 13px | 1.4 |

Eyebrow lines (the small uppercase label above headings) are `gold-deep` on cream and `gold-pale` on plum.

### 3.3 Spacing, radii, shadows

- Container: max-width 1200px, padding 16px (390) / 32px (≥768) / 48px (≥1280). Section padding-block: 56px (390) / 96px (1280).
- Grid gap: 16px (390) / 24px (1280).
- Radii: `r-sm` 8px (chips, inputs), `r-md` 16px (cards), `r-pill` 999px (buttons), `r-frame` 24px (image frames). No arches (PEL owns that shape).
- Shadows: `shadow-card` `0 1px 2px rgba(45,27,54,.06), 0 12px 32px -12px rgba(45,27,54,.18)`; `shadow-lift` (hover) `0 18px 40px -16px rgba(45,27,54,.28)`; `shadow-bar` (sticky) `0 -8px 24px rgba(45,27,54,.14)`.
- Buttons: min-height 44px, padding 12px 22px, pill. Primary: plum fill, cream text, WhatsApp glyph at left in `gold-pale`. Secondary: cream fill, plum text, 1.5px `plum` border. Ghost (on plum bands): transparent, `gold-pale` border and text. Focus: 2px `plum-mid` ring with 2px cream offset (on plum bands, ring is `gold-pale`).

### 3.4 Ornament

One drawn ornament, reused: a horizontal "lotus hairline" — a 1.5px gold line 64px wide with a small three-petal mark at its centre, drawn in SVG (stroke only). It sits under every h2 eyebrow and as the divider in the footer. It is the only decorative element besides photographs. Build it as `components/Ornament.tsx` with a `tone` prop (`gold` on cream, `gold-pale` on plum).

### 3.5 Logo usage

- Source: `public/logo/logo-512.png` (purple and gold "S" with two hands, transparent, ~0.71:1 portrait); `logo-160h.png` and `logo-320h.webp` for the header.
- Header: logo mark at 40px tall (390) / 48px (1280) at left, followed by the wordmark set in Cormorant Garamond 600 22px "Sri Siam" over Figtree 500 11px uppercase tracking .2em "Thai Therapy & Wellness". The mark is never recoloured; on the plum footer it sits on a 56px cream circle so the purple reads.
- Minimum clear space around the mark: half its height. Minimum rendered height: 32px.
- Favicon/app icon: the lead has already placed `favicon.ico` and `apple-touch-icon.png`.
- Social/OG image (`public/img/og-1200x630.jpg`, lead to generate): `purple-stones-candles` cropped 1200×630 with the plum gradient at left and the logo + wordmark in cream. **OPEN**: generate.

---

## 4. Page map

Static export; every route has a trailing slash (`trailingSlash: true`).

| URL | Purpose | `<title>` (≤ 60) | Meta description (≤ 155) |
|---|---|---|---|
| `/` | Home | Thai Massage in Greenwich \| Sri Siam Thai Therapy (49) | Traditional Thai massage, hot stone, aromatherapy and more in Greenwich SE8. Therapists trained at Wat Pho, Bangkok. Book in a WhatsApp message. (144) |
| `/treatments/` | Full menu from `services.json` | Massage Menu & Prices in Greenwich \| Sri Siam (45) | Every treatment we offer in Greenwich with durations and prices, exactly as on our booking calendar. Tap any option to book it on WhatsApp. (139) |
| `/treatments/thai-massage/` | Treatment page | Thai Massage in Greenwich \| Sri Siam Thai Therapy (49) | Traditional Thai massage in Greenwich SE8: firm pressure and yoga-style stretches in loose clothing, by therapists trained at Wat Pho. Book on WhatsApp. (152) |
| `/treatments/aromatherapy-massage/` | Treatment page | Aromatherapy Massage in Greenwich \| Sri Siam (44) | A gentle full-body oil massage in Greenwich: Swedish techniques with essential oils and long, flowing strokes. Choose your length and book on WhatsApp. (151) |
| `/treatments/hot-stone-massage/` | Treatment page | Hot Stone Massage in Greenwich \| Sri Siam (41) | Hot stone massage in Greenwich SE8: gently warmed basalt stones placed along the back and glided over the body. Choose your length and book on WhatsApp. (152) |
| `/treatments/lymphatic-drainage-massage/` | Treatment page | Lymphatic Drainage Massage in Greenwich \| Sri Siam (50) | Lymphatic drainage massage in Greenwich: light, slow, rhythmic strokes with gentle, precise pressure. A quiet, unhurried treatment. Book on WhatsApp. (149) |
| `/treatments/thai-foot-massage/` | Treatment page | Thai Foot Massage in Greenwich \| Sri Siam (41) | A short Thai foot massage in Greenwich SE8, working the feet and lower legs with reflexology-style pressure. Easy to fit into a day. Book on WhatsApp. (150) |
| `/treatments/back-neck-shoulders-massage/` | Treatment page | Back, Neck & Shoulders Massage Greenwich \| Sri Siam (51) | A short, focused massage for the back, neck and shoulders in Greenwich SE8. Firm, steady work where you hold tension. Book it on WhatsApp. (138) |
| `/gift-vouchers/` | Vouchers by WhatsApp | Massage Gift Vouchers in Greenwich \| Sri Siam (45) | Give someone an hour to themselves at Sri Siam in Greenwich. Message us on WhatsApp with the treatment or amount in mind and we arrange the voucher. (148) |
| `/about/` | Wat Pho roots, the space | About Sri Siam Thai Therapy & Wellness, Greenwich (49) | A small Thai massage room in Greenwich SE8, run by Thai therapists trained at Wat Pho in Bangkok, the temple school of traditional Thai massage. (144) |
| `/visit/` | Address, hours, map, stations, calling | Find Us in Greenwich SE8 \| Sri Siam Thai Therapy (48) | Sri Siam is at Unit 89 Corbridge Court, Glaisher Street, Greenwich SE8 3ET, a short walk from Cutty Sark DLR, Greenwich and Deptford stations. Hours, map. (154) |
| `/faq/` | Questions and answers | Questions & Answers \| Sri Siam Thai Therapy (43) | How to book, the deposit, paying on the day, moving a booking, what to wear and who should check with a doctor first. Ask us anything else on WhatsApp. (151) |
| `/privacy/` | Short privacy notice | Privacy Notice \| Sri Siam Thai Therapy (38) | How Sri Siam Thai Therapy & Wellness handles the details you send us on WhatsApp and when you book. No cookies, no tracking on this website. (140) |
| `/404` (`not-found.tsx`) | Not found | Page Not Found \| Sri Siam Thai Therapy (38) | — (noindex) |

Also: `robots.ts` (noindex for now: `Disallow: /` **and** `<meta name="robots" content="noindex">` on every page until the lead flips one constant `SITE.indexable`), `sitemap.ts` (generated now, served when indexable), `/llms.txt` optional (**OPEN**, not required).

Header nav (all pages): Treatments · About · Gift Vouchers · Visit · FAQ · [Book on WhatsApp]. On 390px the nav collapses into a full-screen menu (plum) opened by a 44px "Menu" button; the Book button stays visible in the header beside it.

Footer (all pages, plum-deep): logo on cream circle, name, address (one constant), hours block, WhatsApp number (linked, tag F) with the line "Call it as a normal phone call, or message us on WhatsApp", email, "Read our reviews on Google" (Maps link), "Directions" (Maps link), nav links, Privacy. Legal line: "© {year} Sri Siam Thai Therapy & Wellness. Website by Gumon Technology." (the README says the site is built and hosted by Gumon Technology; keep it to that one line).

---

## 5. Section-by-section layout

Notation: **390** = phone (single column, 16px gutters); **1280** = desktop. Every section states its image key and its WhatsApp tag where it has one. Copy is in `content/*.md`; only structure is here.

### 5.1 Home `/`  (`content/home.md`)

1. **Header** — as section 4.
2. **Hero** — 390: image `hands-back-b` full-bleed, aspect 4:5, with the plum gradient overlay; eyebrow, h1, lead and two buttons sit *over the lower third* of the image on the gradient (cream text, AA on plum-deep). Primary "Book on WhatsApp" (tag **O**), secondary ghost "See the menu" → `/treatments/`. Below the image, a facts strip of 3 pills on sand: location, hours (from data), Wat Pho. 1280: two columns 7/5. Left: eyebrow, h1 (64px), lead, buttons, facts strip. Right: `hands-back-b` in a 24px-radius frame, with a second, offset 1.5px gold hairline frame 14px down-right (the "lantern frame"), and the candle-glow gradient behind. The image is the LCP element on both sizes: `fetchpriority="high"`, `sizes="(min-width:1280px) 480px, 100vw"`, no animation.
3. **How booking works** — plum band, background texture `purple-stones-still` at 12% opacity under a plum overlay (decorative, `aria-hidden`). Three numbered steps in a row (1280) / stacked (390). Ends with one primary button on plum (ghost style, tag **O**) and the booking-terms sentence rendered from `content/_booking-terms.md` → `{{booking_terms_short}}`.
4. **Treatments preview** — cream. Eyebrow + h2 + ornament. Cards: one per *distinct slug* in `services.json`, in file order (so the two groups appear in Treatwell order). 390: horizontal snap-scroll row of cards 78vw wide (so the second card peeks, inviting a swipe) with a "See all" link; 1280: 3×2 grid. Card: image (per-slug map in section 7), h3 name, one-line description (from `content/treatments/<slug>.md` → `card`), chips with the row's `option` labels, "from £{{from_price}}" in `gold-deep`, and two actions: "Details" → `/treatments/<slug>/`, "Book" (tag **H**, message names the service, no duration). Hover: image scales 1.03, card lifts.
5. **Our roots** — sand. 390: image `herbal-compress` square above text; 1280: image left 5/12, text right. Short Wat Pho paragraph, link "More about us" → `/about/`. Image caption text in the content file; alt must not imply herbal compress is on the menu.
6. **Gift vouchers strip** — plum-tint panel inside the cream page, 1280 two columns: text + button "Buy a voucher on WhatsApp" (tag **G**) left, image `purple-stones-candles` right in frame. 390 stacked.
7. **Visit** — cream. Address (constant), hours block (data), "Directions" (Maps) and "Read our reviews on Google" (Maps) links, map image is *not* embedded (no third-party scripts); instead `room-pink-curtains` wide image with the address card overlapping its bottom-left corner on 1280.
8. **Closing band** — plum-deep, ornament, h2, one primary ghost button (tag **T**), the "call as a normal phone call" line with the number as `tel:` link.
9. **Footer.**
10. **Sticky bar** (phones only, all pages): fixed bottom, cream, `shadow-bar`, one full-width primary button "Book on WhatsApp" (tag **SB**) with the WhatsApp glyph in `whatsapp` green inside a small cream circle, plus a 48px secondary "Menu" icon button → `/treatments/`. A spacer div of the same height sits at the end of `<main>` so nothing is hidden and nothing shifts. Hidden ≥ 768px.

### 5.2 Treatments menu `/treatments/`  (`content/treatments.md` + `services.json`)

1. **Page hero (compact)** — cream, no image: eyebrow, h1, lead, the "exactly as on our booking calendar" line with `read_at` date rendered as "Menu checked {{menu_checked_date}}".
2. **Group jump chips** (390 and 1280): one chip per `group` in file order; anchors `#classic-massages`, `#reflexology-lymphatic-massages` (slugified group names).
3. **Menu** — for each group: h2 (group name) + ornament; then for each distinct slug in the group a **menu row**: 1280: 3 columns — image (per-slug, 160px square, r-md) · name (h3, link to detail page) + one-line `card` description · **option buttons** stacked at right. 390: image 88px square at left of name; options full-width below. Each option is its own primary-styled button, label `{{option}} · £{{price}}` (e.g. "1 hour · £59"), tag **M**, message `Hi Sri Siam, I'd like to book a {{name}} ({{option}}) please. [web-M]`. Button min-height 48px. Under the options a small text link "About this treatment →".
4. **Good to know** — sand band, three short cards: how booking works (one line + `{{booking_terms_short}}`), paying on the day, tell us about health conditions. Each links to the FAQ.
5. **Closing band** (tag **T**), footer, sticky bar.

Structured data on this page: one `DaySpa` with `hasOfferCatalog` → one `OfferCatalog` per group → `Offer` per row (`name` = "{{name}} ({{option}})", `price`, `priceCurrency` GBP). Prices come from the JSON only.

### 5.3 Treatment detail `/treatments/<slug>/`  (`content/treatments/<slug>.md`)

Six pages, one template:

1. **Hero** — 390: image per slug 4:5 with gradient; eyebrow "Treatments · {{group}}", h1 "{{name}} in Greenwich", one-sentence definition (the AEO answer) in the lead. 1280: 7/5 split as home, image right in lantern frame. LCP rules as home.
2. **Choose your length** — directly under the hero, before any long copy (a phone visitor who already knows what they want books in two taps): the option buttons for this slug (same component as the menu), tag **P?** per page (section 8), plus `{{booking_terms_short}}`.
3. **What to expect** — h2 + two or three short paragraphs from the content file.
4. **What it focuses on / Good to know** — two-column (1280) "focus" list and "good to know" list (clothing, oil, who should tell us first).
5. **A moment of the room** — secondary image (per slug, section 7), full-width on 390, 1280 in a 16:7 frame; alt in content.
6. **Questions about {{name}}** — three Q/A pairs from the content file, accordion; `FAQPage` JSON-LD from these.
7. **You might also like** — two cards linking to the two slugs named in the content file.
8. **Closing band** (tag **T**), footer, sticky bar.

### 5.4 Gift vouchers `/gift-vouchers/`  (`content/gift-vouchers.md`)

1. Hero 390: `purple-stones-candles` 16:9 above text; 1280 split with text left. h1, lead, primary button (tag **G**).
2. "How it works" three steps (message · we arrange it · they book).
3. "Good to know" short list (what to tell us; the team confirms how to pay and how the recipient books; no prices or terms stated).
4. Closing band (tag **T**), footer, sticky bar.

### 5.5 About `/about/`  (`content/about.md`)

1. Hero 390: `room-wood-purple` 4:5; 1280 split, image right. h1 "A small Thai therapy room in Greenwich".
2. "Trained at Wat Pho" — text + `herbal-compress` image (1280 image left).
3. "The space" — two images side by side (`room-pink-curtains` wide over `compress-oils` portrait on 1280 as a 2/1 pair; stacked on 390) with short text.
4. "How we work" — three short cards: we listen first; tell us about health conditions; one route to book.
5. Primary button (tag **A**), closing band (tag **T**), footer, sticky bar.

### 5.6 Visit `/visit/`  (`content/visit.md`)

1. Compact hero on cream: h1, address as an `<address>` block with "Directions" button (Maps link) and "Book on WhatsApp" primary (tag **C**).
2. Two-column (1280): **Opening hours** table from data (`{{hours_table}}`) · **Contact** card: WhatsApp number (link, tag **C**), the "call as a normal phone call" line with `tel:`, email `mailto:`, "Read our reviews on Google".
3. **Getting here** — three station cards (Cutty Sark DLR, Greenwich, Deptford) with the verified line names; no minutes.
4. **The room** — `room-pink-curtains` wide image.
5. "Before you come" — three lines: arrive a few minutes early; tell us about health conditions; running late → message us.
6. Closing band (tag **T**), footer, sticky bar.

`DaySpa` JSON-LD with `geo`, `openingHoursSpecification`, `hasMap`, `telephone`, `email`, `address` is rendered on `/` and `/visit/`.

### 5.7 FAQ `/faq/`  (`content/faq.md`)

1. Compact hero: h1, lead, "Ask on WhatsApp" primary (tag **Q**).
2. Grouped accordions: Booking and paying · Your visit · Treatments · Vouchers and contact. Each item: question as `<h3>` inside a `<button aria-expanded>`, answer panel. First item of each group open by default on 1280, all closed on 390.
3. Aside image `orchid-stones` on 1280 only (sticky in the right column).
4. "Still have a question?" band with the Q button; closing band (tag **T**); footer; sticky bar.
`FAQPage` JSON-LD from every pair on the page.

### 5.8 Privacy `/privacy/`  (`content/privacy.md`)

Plain prose page, max-width 720px, h1 and h2s from the file. No images. Footer, sticky bar.

### 5.9 Not found (`content/not-found.md`)

`purple-stones-still` as a soft background on 1280 (right 40%), h1, one line, buttons: "Back to home", "See the menu", "Book on WhatsApp" (tag **E**). `noindex`.

---

## 6. Motion spec

Library: framer-motion with `<MotionConfig reducedMotion="user">` at the root, plus a global CSS rule:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important; scroll-behavior: auto !important; }
}
```

Under reduced motion every element is rendered in its final state immediately (framer `initial={false}` when `useReducedMotion()` is true). Nothing below changes layout: all motion is `opacity` and `transform` only, and anything that reveals on scroll reserves its final box.

| What | Trigger | Motion | Duration / easing | Notes |
|---|---|---|---|---|
| Hero image, h1, primary button | — | **none** | — | LCP candidates. Never opacity < 1. |
| Hero eyebrow, lead, facts strip | mount | rise 12px → 0, opacity 0 → 1, staggered 60ms | 420ms, cubic-bezier(.2,.7,.2,1) | Starts after first paint (CSS animation, not JS-gated). |
| Candle glow behind hero (1280 only) | mount | opacity .6 ↔ 1 "breathing" | 9s, ease-in-out, infinite | `aria-hidden`; off under reduced motion; not rendered at < 1024px. |
| Section eyebrow + ornament | scroll into view (once, `margin: -10% 0px`) | ornament draws (`stroke-dashoffset` 1 → 0), eyebrow fades in | 600ms, ease-out | |
| Headings, paragraphs, cards | scroll into view (once) | rise 16px → 0, opacity 0 → 1; cards stagger 70ms, max 6 | 480ms, cubic-bezier(.2,.7,.2,1) | `Reveal` wrapper component, same as the sister sites' pattern but written fresh. |
| Buttons | hover (`@media (hover:hover)`) | translateY(-2px) + `shadow-lift`; glyph nudges 2px right | 160ms ease-out | Press: scale .98, 90ms. |
| Card image | hover | scale 1.03 | 600ms ease-out | `overflow:hidden` frame. |
| Option button (menu) | hover | background plum → plum-mid, price slides 2px | 160ms | Focus ring visible always. |
| Accordion (FAQ) | click | height auto via framer `AnimatePresence`, chevron rotates 180° | 240ms ease-in-out | `aria-expanded` toggles immediately. |
| Sticky bar (phones) | mount | slides up from translateY(100%) | 320ms ease-out, delay 400ms | `position: fixed` and a spacer, so zero layout shift. |
| Mobile menu overlay | open/close | fades, links stagger 40ms | 240ms | Focus trapped; `Esc` closes. |
| Page transition | route change | none | — | Static site; no `template.tsx` fade (it would delay every page's LCP). |

Performance guardrails: total JS for motion ≤ 40kB gz (import `motion` from `framer-motion` client components only where used; home and menu are mostly server components with small client islands). Lighthouse mobile targets: Performance ≥ 90, Accessibility 100, CLS 0, LCP < 2.5s on simulated 4G.

---

## 7. Image assignment and alt text

> **Lead update 2026-10-31 (after review):** the `herbal-compress` and `compress-oils` photos were removed from the site (the compress is not a Treatwell menu item). Home "Our roots" uses `room-wood-purple`; `/about/` "Trained at Wat Pho" uses `hands-back-b`; `/about/` "the space" uses `room-wood-purple`; `/treatments/aromatherapy-massage/` secondary is `room-wood-purple`; `/treatments/back-neck-shoulders-massage/` secondary is `purple-stones-candles`. Section 7 below is kept as written for history. The Treatwell group "Reflexology & Lymphatic Massages" is shown as "Lymphatic Massage" (lib/services.ts GROUP_DISPLAY).


Files already converted by the lead: `/img/<key>-800.webp` and `/img/<key>-1600.webp`. Use `<picture>`/`srcSet` with both. Decorative uses get `alt=""` and `aria-hidden`. Alt text below is final copy.

| Key | Where | Alt |
|---|---|---|
| hands-back-b | Home hero; `/treatments/back-neck-shoulders-massage/` hero (cropped to shoulders); `/treatments/lymphatic-drainage-massage/` secondary | "A therapist in white pressing slowly along a client's back on the treatment bed at Sri Siam, Greenwich" / BNS: "A therapist's hands working across a client's upper back and shoulders" / Lymphatic: "A therapist's hands resting lightly on a client's upper back" |
| hands-back-a | `/treatments/thai-massage/` hero; menu row thumbnail for thai-massage; home card | "Close-up of a therapist's hands pressing along a client's back during a Thai massage" |
| therapist-hot-stone | `/treatments/hot-stone-massage/` hero; menu thumbnail; home card | "A therapist in a beige uniform placing warm stones along a client's back, with candles lit beside the bed" |
| hot-stones-spine-a | `/treatments/hot-stone-massage/` secondary; `/treatments/back-neck-shoulders-massage/` secondary | "A line of warm basalt stones resting down a client's spine, white orchids beside them" |
| hot-stones-spine-b | `/about/` "the space" alternative if `compress-oils` is too dark on the device (lead's call); otherwise unused | "Warm stones placed down a client's back, candlelight in the background" |
| oils-stones | `/treatments/aromatherapy-massage/` hero; menu thumbnail; home card | "Amber bottles of massage oil, smooth grey stones and white orchids on a wooden table" |
| compress-oils | `/about/` "the space"; `/treatments/aromatherapy-massage/` secondary | "A Thai herbal compress, oil bottles, black stones and frangipani flowers laid out before a treatment" |
| herbal-compress | Home "Our roots"; `/about/` "Trained at Wat Pho" | "A therapist in white with gold trim pressing a warm Thai herbal compress to a client's back" — caption in content must say this is a traditional Thai technique, **not** a menu item |
| foot-massage | `/treatments/thai-foot-massage/` hero; menu thumbnail; home card | "A therapist massaging a client's foot with both thumbs, orchids on the table" |
| orchid-stones | `/treatments/lymphatic-drainage-massage/` hero (portrait); menu thumbnail; home card; `/faq/` aside | "Pink orchids, a stack of smooth black stones and a lit candle beside a bowl of water" |
| purple-stones-still | "How booking works" band texture (decorative, `alt=""`); 404 background (decorative); closing band texture (decorative) | "" |
| purple-stones-candles | `/gift-vouchers/` hero; home vouchers strip; OG image source | "Black stones, tealights and purple orchids on purple silk" |
| room-wood-purple | `/about/` hero; home "Visit" alternative on 390 | "The treatment room at Sri Siam: wood-panelled walls with carved Thai ornaments, two beds with rolled towels and orchid petals, lit in soft purple" |
| room-pink-curtains | Home "Visit"; `/visit/` "The room"; `/about/` "the space" | "A treatment bed between pink and lilac curtains in the Sri Siam room" |

Reflexology: the Treatwell group is "Reflexology & Lymphatic Massages" but only lymphatic drainage sits in it today. If a reflexology row appears in the JSON later, use `foot-massage` for it until the shop supplies a photo (**OPEN**).

---

## 8. WhatsApp button inventory and source-tag register

Link shape: `https://wa.me/447903653786?text=` + `encodeURIComponent(message)`. Every message ends with one space and the tag. Straight apostrophe in "I'd" (so the encoded text stays short and the tag parser is never confused by a curly quote). `target="_blank" rel="noopener"`. Build all links through one helper `lib/whatsapp.ts` (`buildWhatsAppLink(message, tag)`), never by hand.

The register is independent of Taitam-D's (different shop, different counts). The parser accepts one or two capital letters. Reserved and not used on the site: **QS** (printed QR in the shop, later).

| Tag | Surface | Message (before encoding) |
|---|---|---|
| **O** | Home hero primary; home "How booking works" button | `Hi Sri Siam, I'd like to book a massage please. [web-O]` |
| **N** | Header "Book on WhatsApp" (every page, desktop and mobile header) | `Hi Sri Siam, I'd like to book a massage please. [web-N]` |
| **H** | Home treatments-preview card "Book" | `Hi Sri Siam, I'd like to book a {{name}} please. [web-H]` |
| **M** | `/treatments/` option buttons | `Hi Sri Siam, I'd like to book a {{name}} ({{option}}) please. [web-M]` e.g. `…book a Thai Massage (1 hour) please. [web-M]` |
| **PT** | `/treatments/thai-massage/` option buttons | `Hi Sri Siam, I'd like to book a Thai Massage ({{option}}) please. [web-PT]` |
| **PA** | `/treatments/aromatherapy-massage/` options | `…book an Aromatherapy Massage ({{option}}) please. [web-PA]` |
| **PH** | `/treatments/hot-stone-massage/` options | `…book a Hot Stone Massage ({{option}}) please. [web-PH]` |
| **PL** | `/treatments/lymphatic-drainage-massage/` options | `…book a Lymphatic Drainage Massage ({{option}}) please. [web-PL]` |
| **PF** | `/treatments/thai-foot-massage/` options | `…book a Thai Foot Massage ({{option}}) please. [web-PF]` |
| **PB** | `/treatments/back-neck-shoulders-massage/` options | `…book a Back, Neck & Shoulders Massage ({{option}}) please. [web-PB]` |
| **Q** | `/faq/` hero and "Still have a question?"; treatment pages "Ask about this treatment" link | FAQ: `Hi Sri Siam, I have a question please. [web-Q]` · Treatment page: `Hi Sri Siam, I have a question about {{name}} please. [web-Q]` |
| **G** | `/gift-vouchers/` primary; home vouchers strip; footer "Gift vouchers" link stays a page link (no tag) | `Hi Sri Siam, I'd like to buy a gift voucher please. [web-G]` |
| **C** | `/visit/` primary and the WhatsApp number link on `/visit/` | `Hi Sri Siam, I'd like to book a massage please. [web-C]` |
| **A** | `/about/` primary | `Hi Sri Siam, I'd like to book a massage please. [web-A]` |
| **SB** | Sticky mobile bar (every page) | `Hi Sri Siam, I'd like to book a massage please. [web-SB]` |
| **T** | Closing call-to-action band (every page that has one) | `Hi Sri Siam, I'd like to book a massage please. [web-T]` |
| **F** | Footer WhatsApp number link (every page) | `Hi Sri Siam, I'd like to book a massage please. [web-F]` |
| **E** | 404 page button | `Hi Sri Siam, I'd like to book a massage please. [web-E]` |
| **PR** | Book button on an offer card in the home-page offers section (`#promotions`, only when an offer is live; text is the offer's own `message` from `data/promotions.json`) | `<offer message> [web-PR]` e.g. `Hi Sri Siam, I'd like to book with the Autumn offer. [web-PR]` |

Article rule for `{{name}}`: "an" before Aromatherapy Massage, "a" before everything else; implement as a tiny helper (`/^[aeiou]/i`) so a renamed row stays grammatical.

The phone number is also offered for voice: `tel:+447903653786`, displayed as "07903 653786", always with the line "call it as a normal phone call; WhatsApp voice and video calls do not connect on this number". The number 07497 493585 must not appear anywhere (grep the build output for `7497` in CI; `scripts/validate-services.mjs` is a good place to add that check).

---

## 9. Data-driven blocks and placeholders

The content files use double-brace placeholders. The code fills them; the copy never hard-codes them.

| Placeholder | Source | Rendered as |
|---|---|---|
| `{{hours_sentence}}` | `lib/site.ts` `HOURS` (confirmed 2026-10-31: Monday closed; Tuesday to Sunday 11:00–19:00) | "Open Tuesday to Sunday, 11:00 to 19:00. Closed on Mondays." |
| `{{hours_table}}` | same | 7-row table, Monday first, "Closed" on Monday |
| `{{address}}` | `SITE.address` | "Unit 89 Corbridge Court, Glaisher Street, Greenwich, London SE8 3ET" |
| `{{phone_display}}` / `{{phone_tel}}` | `SITE` | "07903 653786" / `tel:+447903653786` |
| `{{email}}` | `SITE.email` | srisiamthaitherapy@gmail.com |
| `{{maps_url}}` | `SITE.mapsUrl` | https://maps.google.com/?cid=11019503144234088145 |
| `{{deposit}}` | `SITE.depositGbp` constant | "£15" |
| `{{booking_terms_short}}` | `content/_booking-terms.md` → `booking_terms_short` | one sentence |
| `{{booking_terms_full.deposit}}`, `.paying`, `.moving`, `.cancelling` | same file → `booking_terms_full` sub-headings | one paragraph each |
| `{{booking_terms_lines.deposit}}`, `.paying`, `.changes` | same file → `booking_terms_lines` | one line each |
| `{{privacy_updated_date}}` | constant in `lib/site.ts`, set when the notice text last changed | "31 October 2026" |
| `{{from_price}}` | min `price_gbp` for the slug | "59" |
| `{{options}}` | all rows for the slug | option buttons |
| `{{option}}`, `{{name}}`, `{{price}}`, `{{group}}` | the row | as in JSON |
| `{{menu_checked_date}}` | `read_at` in `services.json` | "30 October 2026" |
| `{{year}}` | build time | "2026" |

Rule: a duration or a price never appears in prose. If a sentence needs one, it uses `{{options}}` or `{{from_price}}`.

---

## 10. FAQ list (final questions; answers in `content/faq.md`)

Booking and paying: How do I book? · Do I need to pay a deposit? · How do I pay the rest? · Can I move or cancel my booking? · What if I'm running late? · Can I just walk in?
Your visit: Where are you and how do I get there? · What are your opening hours? · What should I wear? · Should I arrive early?
Treatments: Which massage should I choose? · What is the difference between Thai massage and an oil massage? · Is massage suitable if I'm pregnant or have a health condition? · Do you offer couples massage, packages or add-ons?
Vouchers and contact: Do you sell gift vouchers? · Can I phone you? · Where can I read your reviews?

Each treatment page carries three more, specific to it, in its own file.

---

## 11. Structured data summary

- `/`, `/visit/`: `DaySpa` (`@id` `https://sst.gumon.io/#business`) with `name`, `url`, `logo`, `image`, `telephone` "+447903653786", `email`, `address` (PostalAddress: streetAddress "Unit 89 Corbridge Court, Glaisher Street", addressLocality "London", addressRegion "Greater London" optional, postalCode "SE8 3ET", addressCountry "GB"), `geo` (51.48263, -0.01891), `hasMap` (Maps URL), `openingHoursSpecification` from `HOURS`, `priceRange` "££", `paymentAccepted` "Cash, Credit Card, Debit Card", `currenciesAccepted` "GBP", `sameAs` [Maps URL]. No `aggregateRating`, no `review`.
- `/treatments/`: `DaySpa` + `hasOfferCatalog` as section 5.2.
- `/treatments/<slug>/`: `Service` (`serviceType` = name, `provider` → `#business`, `areaServed` "Greenwich, London", `offers` from the rows) + `FAQPage` + `BreadcrumbList`.
- `/faq/`: `FAQPage`.
- `/gift-vouchers/`, `/about/`: `BreadcrumbList` only.

---

## 12. Open questions for the lead

1. **Walking minutes** from Glaisher Street to Cutty Sark DLR / Greenwich / Deptford: copy says "a short walk"; add minutes only if measured in Google Maps.
2. **Parking, buses, step-free access**: no verified facts; nothing written. Confirm with the shop if wanted.
3. **Cancellation with less than 24 hours' notice**: unsettled; `content/_booking-terms.md` says only "message us as early as you can and the team will help". Replace that one sentence when settled.
4. **Automated WhatsApp replies**: `content/privacy.md` has one flagged sentence saying some replies are sent automatically by the booking system and that the team reads every conversation. Confirm it is true or delete it (no "AI" wording anywhere).
5. **Payment provider name** for the deposit link: privacy notice says "our payment provider" without naming it. Name it if the shop wants.
6. **Facebook page** (https://www.facebook.com/profile.php?id=61589658520761 per the survey): not added to the footer because its ownership was not verified by me. Add to `sameAs` and footer if confirmed.
7. **OG image**: generate `public/img/og-1200x630.jpg` from `purple-stones-candles` + logo.
8. **Reflexology**: group name promises it; no row exists. Fine as is (we render whatever the JSON holds).
9. **Hosting logs sentence** in the privacy notice (GitHub Pages keeps technical server logs): confirm wording or trim.
