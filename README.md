# solution-sst-website

Website for Sri Siam Thai Therapy & Wellness (Thai massage, Greenwich, London), built and hosted by Gumon Technology.

- Live: https://srisiamthaitherapyandwellness.co.uk (GitHub Pages, custom domain; DNS on Cloudflare in Gumon's account: apex A to the GitHub Pages IPs 185.199.108-111.153 and `www` CNAME `gumon-tech.github.io`, DNS only; HTTPS enforced). The Wix site was detached from the domain on 5 Nov 2026.
- Public repository: never commit customer data, staff personal data or secrets.
- Handover, open items and how to change things: [HANDOFF.md](HANDOFF.md)

## Stack

Next.js 15 (App Router) + React 19 + TypeScript + Tailwind 3, static export to `out/`. No cookies, analytics or third-party scripts unless the Google Ads tag is configured (below); fonts are self-hosted by `next/font`. Motion is CSS plus one IntersectionObserver and is off under `prefers-reduced-motion`.

## Where things live

```
data/services.json          every service, length and price, copied from Treatwell (venue 528970); the only source (a person or the shop system)
data/promotions.json        live offers, written only by the shop's WhatsApp system (see "Data the shop system writes")
data/hours.json             weekly opening hours (same system)
data/closures.json          closed days and changed-hours days (same system)
data/notice.json            one site-wide notice (same system)
data/faq-extra.json         extra FAQ questions (same system)
data/photos.json            photos the system added and which slot shows them (same system)
data/copy.json              text that replaces named pieces of content/*.md, null = the markdown (same system)
data/seo.json               page titles and meta descriptions, null = the front matter (same system)
scripts/lib/copy-slots.json the fixed list of copy slots and where each one points (human-edited)
scripts/lib/seo-pages.json  the pages data/seo.json may retitle (human-edited)
content/*.md                every word of customer-facing copy, read at build time (never edited by the shop system)
content/_booking-terms.md   the only place deposit, paying and changes are worded
lib/site.ts                 name, address, phone, deposit, Maps link, the indexable switch; hours come from data/hours.json via lib/hours-text.ts
lib/whatsapp.ts             wa.me links and the [web-X] source tags (register in docs/design/DIRECTION.md section 8)
lib/consent.ts              consent-gated Google Ads tag (gtag.js, Consent Mode v2); shop-neutral, with components/CookieConsent.tsx and AdsConsentBanner.tsx
lib/structured-data.ts      DaySpa, Service/Offer, FAQPage, BreadcrumbList JSON-LD
docs/design/DIRECTION.md    research, design tokens, layouts, motion, WhatsApp register
public/img/                 the shop's own photos from its Wix site, WebP 800 and 1600 wide
public/img/tour/            the /tour/ photos, made from assets/photos/original/ (AVIF, WebP, JPEG at 480 and 960 wide)
assets/photos/original/     README only in git; the owner's originals live in OneDrive (see its README)
data/tour.json              /tour/ zones, captions, alt text and the crop/tone recipe per photo (human-edited)
scripts/make-tour-images.mjs  rebuilds public/img/tour/ and data/tour-sizes.json from the originals (npm run tour-images)
```

## Google Ads tag and cookie banner

Off while `SITE.googleAds.id` in `lib/site.ts` is `""`: no banner, no "Cookie settings" control, nothing from Google, and the banner, loader and banner CSS are not built at all (`next.config.mjs` reads the id from `lib/site.ts` into `NEXT_PUBLIC_GOOGLE_ADS_ID`, and `components/CookieConsent.tsx` keeps them behind it). What is left is two empty stubs named `AdsConsent` and `CookieSettingsButton` in the layout chunk. `check-site` fails if any `.html`, `.js` or `.css` in `out/` has a trace of the tag or banner. To turn it on, set `id` (`AW-<digits>`) and `conversionLabel` in one person's pull request; nothing else changes by hand.

The privacy notice follows the id by itself: `content/privacy.md` keeps both wordings, in `{{#if google_ads}} ... {{else}} ... {{/if}}` blocks (lines on their own, no nesting; `lib/content.ts`), and `description_if_google_ads` replaces `description` when the id is set. A paragraph that is exactly `{{cookie_settings_button}}` renders the Cookie settings button there. `check-site` fails if `/privacy/` says "Google Ads tag" or "Cookie settings" while the id is empty, or lacks them (or the consent basis) while it is set.

In Google Ads, set the WhatsApp conversion action to count "One" per click (the site sends one event per tap, and one visitor may tap several buttons).

When set: `components/CookieConsent.tsx` lazy-loads the banner (`AdsConsentBanner.tsx`, words from `content/_shared.md` section `cookie-banner`). Accept and Reject are the same size and style; the choice is kept in `localStorage` key `ads-consent:v1` for 182 days (storage that fails means no choice and nothing loads). Nothing is requested from Google before Accept. On Accept, `lib/consent.ts` pushes the consent default (all four denied), the update granting `ad_storage` and `ad_user_data` only (measurement: `ad_personalization` and `analytics_storage` stay denied, so no remarketing and no Google Analytics), then `js` and `config`, then requests `gtag.js`; a stored Accept does the same on page load. For remarketing, the owner would change `ad_personalization` to `"granted"` in `GRANTED` in `lib/consent.ts`, and the banner text (`content/_shared.md`) and the privacy notice would first have to say that Google uses the data for ads (check-site refuses it as is). If the visit landed with `gclid`, `gbraid` or `wbraid` and Accept comes after an in-site page change, `config` gets `page_location` = the landing address (`lib/landing.ts`, shared with AdSource): Google then sends the click reference with conversions in that page (tested: `gclaw` on the conversion request), but does not write the `_gcl_aw` cookie, so a conversion after a full reload is not linked to that click. A choice made in another tab applies at once (storage event). On Reject or withdrawal: consent update to denied, no more events, and `_gcl_*`/`_gac_*` cookies (this host and parent domains) and `_gcl_*` storage keys are deleted. A click on any wa.me link while accepted sends `conversion` to `<id>/<conversionLabel>` with `source_tag` (the `[web-X]` after the AdSource rewrite) and `transport_type: beacon`, never delaying WhatsApp. "Cookie settings" sits in the footer of every page and on `/privacy/` right after the paragraph that names it; a click before the banner's chunk has loaded is kept (`lib/consent-open.ts`). A reopened banner closes with Escape; while it is open the page gets bottom scroll padding and space equal to the banner, so a focused element is never hidden behind it. Shop-neutral files, meant to be copied to the other shop sites: `components/CookieConsent.tsx`, `components/AdsConsentBanner.tsx` (+ `.module.css`, colours from the Tailwind tokens), `lib/consent.ts`, `lib/consent-open.ts`, `lib/landing.ts`; per shop: `lib/site.ts`, `next.config.mjs` env line, the copy, the button/link classes passed in `app/layout.tsx`, and `TAG_AT_END` in `lib/whatsapp.ts`.

### Ad click reference (option B, dark until `clickEndpoint` is set)

Off while `SITE.googleAds.clickEndpoint` in `lib/site.ts` is `""`: the build is byte-for-byte what it was without it (checked by diffing `out/` with the random build id normalised), `check-site` fails on any trace of it in `out/` (`clickref`, the code alphabet, `data-wa-tag`, the new notice section), and the notice and banner keep their words. `next.config.mjs` reads the endpoint, `siteId` and the consent text version into `NEXT_PUBLIC_CLICK_REF_ENDPOINT`, `NEXT_PUBLIC_CLICK_REF_SITE` and `NEXT_PUBLIC_CONSENT_VERSION` (all `""` while off), and every branch on them is dropped at build time.

To turn it on, in one pull request: set `clickEndpoint` (this shop's own bot route, https; never another shop's), check `siteId` equals the bot's `SHOP_ID`, set `clickRetention` (the end of the notice sentence "We delete the ad click reference ...", from KBOT; `check-site` fails while it is `TBC`), and update `privacyUpdated`. The notice (`{{#if click_ref}}` / `{{#if google_ads_only}}` blocks in `content/privacy.md`, `{{click_retention}}`) and the banner text (`content/_shared.md`, section `cookie-banner`) switch by themselves. The banner's `- Text version:` line sits next to the text it versions: change it whenever any wording in that section changes while the click reference is on. It is sent as `cv` and names the consent key (`ads-consent:<version>` instead of `ads-consent:v1`), so turning the feature on, and every later version, asks everyone again.

When on: a visit whose landing address has `gclid`, `gbraid` or `wbraid` is an ad visit (`[web-AD]`, `components/AdSource.tsx`, which also keeps each button's own tag in `data-wa-tag`). AdSource then lazy-loads `lib/clickref.ts`, which does nothing unless the click id (gclid first, then wbraid, then gbraid) matches `[A-Za-z0-9_-]{20,256}`. While the stored choice is Accept (read fresh through `lib/consent.ts`; re-checked after every click and on storage events from other tabs), every WhatsApp message ends `[web-AD-<code>]`; on Reject or withdrawal it goes back to `[web-AD]` at once. Code: `SHA-256("clickref-v1|" + siteId + "|" + kind + "|" + id)`, character i (0..7) = `"23456789BCDFGHJKMNPQRSTVWXZ"[digest[i] % 27]`. On a WhatsApp press whose message carries the code, one POST per code per page load: `fetch(endpoint, {method: "POST", keepalive: true, credentials: "omit", headers: {"Content-Type": "text/plain"}, body})`, response not read, navigation never delayed; body (at most 768 bytes) `{"v":1,"site","code","kind","id","surface" (the button's own tag),"landed" (performance.timeOrigin, epoch ms),"consent":{"ad_user_data":"granted","ad_personalization":"denied"},"cv"}`. The click id and code stay in page memory only. The WhatsApp-click conversion keeps `source_tag` "AD" for coded tags. Shop-neutral: `lib/clickref.ts`; per shop: the three `lib/site.ts` values, the banner text and version, the notice wording.

## Data the shop system writes

The shop manager confirms a change in WhatsApp chat; the shop system (shop-agent, shop id `sst`) then keeps at most one open pull request per concern from a branch `shop-agent/<concern>-<id>`, rebuilt from main plus every confirmed change (or closed if they were withdrawn before it merged). `.github/workflows/auto-merge-shop-agent.yml` merges it by itself when the branch, the file rule, `npm run check` and the diff rules all hold, then starts `pages.yml` (a merge by `GITHUB_TOKEN` does not trigger it). Anything else stays open for a person. Who may ask for what (management or shop manager) is enforced by the bot, not the site.

One concern = one data file = one branch prefix = one validator. The shop system never edits `content/*.md`, code, styles, the slot lists or any other file: managers change the site's words, prices, hours and photos only through the data files below.

| Concern | Branch | Files the pull request may change | Validator and test |
|---|---|---|---|
| promotions | `shop-agent/promotions-<id>` | `M data/promotions.json` only | `validate-promotions.mjs`, `test-promotions.mjs` |
| hours | `shop-agent/hours-<id>` | `M data/hours.json` only | `validate-hours.mjs`, `test-hours.mjs` |
| closures | `shop-agent/closures-<id>` | `M data/closures.json` only | `validate-closures.mjs`, `test-closures.mjs` |
| notice | `shop-agent/notice-<id>` | `M data/notice.json` only | `validate-notice.mjs`, `test-notice.mjs` |
| faq-extra | `shop-agent/faq-extra-<id>` | `M data/faq-extra.json` only | `validate-faq-extra.mjs`, `test-faq-extra.mjs` |
| services | `shop-agent/services-<id>` | `M data/services.json` only | `validate-services.mjs`, `test-services.mjs` |
| copy | `shop-agent/copy-<id>` | `M data/copy.json` only | `validate-copy.mjs`, `test-copy.mjs` |
| seo | `shop-agent/seo-<id>` | `M data/seo.json` only | `validate-seo.mjs`, `test-copy.mjs` |
| photos | `shop-agent/photos-<id>` | exactly one `M data/photos.json`, plus new files `A public/img/sp-<slug>-800.webp` and `A public/img/sp-<slug>-1600.webp` (no D, no R, no M of a photo file, nothing else) | `validate-photos.mjs`, `test-photos.mjs` |

Files must exist on main first (a person creates them), so `A data/<concern>.json` is never valid. `<id>` is `[A-Za-z0-9._-]+`. An unknown concern stays open. `scripts/test-workflow-rules.mjs` (in `npm run check`) runs rules 1 and 2 straight from the workflow file, and rule 4, against real merge commits in a throwaway repository.

### Workflow

A `check` job (check run name `site-check`) with no token (checkout without stored credentials, `fetch-depth: 2`, `npm ci`, `npm run check`), then a separate `merge` job that never runs npm (`gh pr merge --squash --delete-branch --match-head-commit`, then `gh workflow run pages.yml`). Rule order in `check`: concern known, file rule (before any npm, so the scripts that run are always main's), head sha equals the reviewed one, `npm run check`, then `node scripts/check-shop-agent-diff.mjs <concern>`.

Failure marker, last line of the comment the workflow posts on the pull request (the bot parses it):

```
shop-agent-merge-failed stage=<check|merge|publish> concern=<promotions|hours|closures|notice|faq-extra|photos|services|copy|seo|unknown> sha=<pull request head sha> run=<url of the workflow run>
```

`stage=check`: unknown concern, wrong files, a validator, the build, check-site or a diff rule failed (the run log says which). `stage=merge`: GitHub refused the merge (the pull request stays open). `stage=publish`: merged, but starting `pages.yml` failed (the site updates at the next nightly rebuild). A run replaced by a newer commit on the branch stays silent. `concern=unknown` appears when the branch name has no known concern.

Confirming "live": `pages.yml` writes `out/build.json` (below). The bot tells the manager "live" when `https://srisiamthaitherapyandwellness.co.uk/build.json` has `sha` equal to the merge commit (or any later commit on main), or when `data.<concern>` equals the sha256 of its file on main.

### build.json

`scripts/write-build-json.mjs` runs after `next build` (in `npm run check` and in `pages.yml`) and writes `out/build.json`: `{"sha": <GITHUB_SHA or git rev-parse HEAD>, "built_at": <UTC ISO>, "data": {"promotions": <sha256 of data/promotions.json>, "hours": ..., "closures": ..., "notice": ..., "faq-extra": ..., "photos": ..., "services": ..., "copy": ..., "seo": ...}}`. No secrets; not in the sitemap; `check-site.mjs` fails if it is missing or does not parse. A test with no visible change: merge a promotion with `status: "draft"` (or a future `starts`) through the whole pipeline, then read `build.json`.

### Shared text rules

`scripts/lib/public-text.mjs` holds the rules every text field passes: no emoji, no Thai script, no links, no emails, no phone-like numbers, not the old private number, no `[web-`, no health or medical claims (the UK ASA/CAP list for massage), no review wording (review, reviews, rated, rating, stars, the star symbol, "5 star", testimonial, Trustpilot, Google reviews: no review claims, DMCC 2024), not "Wat Pho" (unconfirmed claim: no certificate on file, 25 Nov 2026), no `£` amount that is not a discount, the deposit or a price in `data/services.json` (notice, closures labels, extra FAQ and photo alt allow no `£` at all), and the shop's exact display name is exempt from the health list. Photo alt text may say "therapist". The same lists are in `scripts/lib/public-text.json`, written by `node scripts/lib/export-public-text.mjs` for the bot; `node scripts/lib/export-public-text.mjs --check` (run by `scripts/test-public-text.mjs`, so by `npm run check`) fails if the JSON is stale. The regexes are JavaScript flavour; `\p{Extended_Pictographic}` needs the `regex` module in Python.

No validator rule depends on today's date (the nightly rebuild must never fail because time passed). Filtering by date is the site's job.

### Diff rules (`scripts/check-shop-agent-diff.mjs <concern>`, rules in `scripts/lib/shop-agent-diff.mjs`)

Compares `data/<concern>.json` at `HEAD^1` (main) with `HEAD` (the merge result). Entries are never removed or reordered; new entries go at the end; on an existing entry only these fields may change:

- promotions: `status`, `ends`, `ends_label`
- closures: `status`, `to`
- faq-extra: `status`
- photos `images`: `status` (the `slots` map is free)
- hours and notice have no list: the whole object may be replaced (the validator holds the rules)
- services: see "services" below
- copy and seo: values only. Every key of `slots` (copy) and every page and its `title`/`description` keys (seo) stay exactly as on main: no key added or removed (the lists are a person's change)

### promotions (`data/promotions.json`)

- The home page shows an offers section, anchor `#promotions`, only for offers with `status: "live"` and today (London) between `starts` and `ends`. No live offer means no section. Ended offers are not written into the HTML; the browser also hides an offer whose last day has passed since the build, and `pages.yml` rebuilds every night just after midnight London.
- Schema (one object per offer, no other keys): `code` (`P-AB12`), `title` (80), `eyebrow` (60), `detail` (400), `points[]` (4 x 60), `offer` (160), `message` (200), `image` (`null`, or an existing `/img/...` file), `illustrative`, `starts`, `ends` (YYYY-MM-DD), `ends_label` (e.g. `Monday 30 November 2026`), `status` (`live`, `ended`, `draft`). File level: `updated_at`, optional `note`. The Book button is `message` plus the tag `[web-PR]`, added by `lib/whatsapp.ts`.
- `check-site.mjs` checks the home page shows exactly the offers live today.

### hours (`data/hours.json`)

`{"updated_at": "2026-11-06T09:00:00Z", "hours": {"Monday": null, "Tuesday": {"opens": "11:00", "closes": "19:00"}, ...}}`. All seven days, each `null` (closed) or `{opens, closes}` as `HH:MM` 24 h with minutes 00/15/30/45, opens before closes, within 06:00 to 23:00; at least one open day. Read by `lib/site.ts` (static import) for the sentence, the footer, the table, the mobile menu and the DaySpa JSON-LD. `check-site` compares the `/visit/` table and the JSON-LD with the file.

### closures (`data/closures.json`)

`{"updated_at": ..., "closures": [{"code": "C-XM26", "label": "Christmas", "from": "2026-12-24", "to": "2027-01-04", "hours": null, "status": "live"}]}`. `code` `C-[A-Z0-9]{2,20}` unique; `label` 1 to 40 characters; `from` <= `to`, at most 31 days; `hours` `null` (closed all day) or `{opens, closes}` (changed hours on every day from..to), same limits as a day in hours.json; `status` `live` or `withdrawn`; no two live entries overlap; at most 60 entries (a person archives old ones). Past entries stay as history; the site ignores any whose `to` is before the build day. Shown: under the hours table on `/visit/` (`id="closures"`, "Upcoming changes"), one line per closure in the footer of every page, in the FAQ answer "What are your opening hours?" through `{{closures_line}}`, and as `specialOpeningHoursSpecification` in the DaySpa JSON-LD (a closed day is `opens` 00:00 `closes` 00:00). The page text shows live closures that have not finished and start within 60 days; the JSON-LD lists every live one not finished. The nightly rebuild removes a closure the day after its last day.

### notice (`data/notice.json`)

`{"updated_at": ..., "notice": null}` or `"notice": {"code": "N-7K2Q", "text": "...", "starts": "2026-12-01", "ends": "2026-12-26", "link": "/visit/", "status": "live"}`. `text` 20 to 140 characters, one line, no `*`, no `£`, not the words today, now, tonight or tomorrow (a static site rebuilt nightly cannot carry same-day messages; the bot answers those in chat); `starts` <= `ends`, at most 62 days; `link` `null` or one of `/visit/ /treatments/ /gift-vouchers/ /faq/ /about/ /careers/`; `status` `live` or `ended`; `code` `N-[A-Z0-9]{2,20}`. One notice at a time; the bot replaces the object. Rendered as `NoticeBand` (`id="notice"`, `role="status"`) under the header on every page, only when live on the build day; the browser hides it once its last day has passed. `check-site` requires the band on every page iff a notice is live today.

### faq-extra (`data/faq-extra.json`)

`{"updated_at": ..., "questions": [{"code": "Q-2BX9", "question": "Do you have parking nearby?", "answer": "...", "status": "live"}]}`. `question` one line, 10 to 100 characters ending in `?`, not a question already in `content/faq.md`, not a repeat; `answer` 20 to 400 characters, one paragraph; no `{{`, no `*`; extra blocked words: pregnancy, doctor, medical, condition, deposit, cancel, refund, voucher, price, cost (those live only in `content/*.md`); no `£`; `status` `live` or `hidden`; at most 8 live and 40 in all. Rendered as a group "More questions" (`id="more-questions"`) at the end of `/faq/` and in the FAQPage JSON-LD; empty means nothing is rendered. The core FAQ is never edited by the system.

### photos (`data/photos.json`)

Branch `shop-agent/photos-<id>`; the pull request modifies `data/photos.json` once and adds new files only: `public/img/sp-<slug>-800.webp` and `public/img/sp-<slug>-1600.webp`. The `sp-` prefix means the bot can never overwrite or delete the shop's own photos; there is no D, no R, and no M of any image. Photos are published without a human review step (decided 6 Nov 2026), so the checks below are all there is.

```json
{
  "updated_at": "2026-11-06T09:00:00Z",
  "images": [
    {"key": "sp-front-room", "alt": "A treatment bed between pink curtains", "w": 1600, "h": 700, "w800": 800, "h800": 350, "added": "2026-11-06", "status": "live"}
  ],
  "slots": {"home.hero": null, "visit.room": "sp-front-room", "...": null}
}
```

- `images`: entries added by the system. `key` `sp-[a-z0-9-]{3,40}` unique (the files are `<key>-800.webp` and `<key>-1600.webp`); `alt` one line of 10 to 160 characters passing the shared text rules; `w`,`h` the 1600 file's size, `w800`,`h800` the 800 file's size; `added` a date; `status` `live` or `retired`. At most 60. Retiring a photo = `status: "retired"` and every slot that used it set back to `null`; the files stay.
- `slots`: every slot id of `scripts/lib/photo-slots.json` must be present, each `null` (the built-in photo) or the key of a live image from this file (built-in photos cannot be named; a removed key such as `room-wood-purple` is never valid). Unknown slots are rejected.
- Both files of every entry (retired ones too) must exist; every `sp-` file in `public/img` must belong to an entry.
- Each file: a real WebP (RIFF/WEBP header, RIFF size equals the file size, not animated); no EXIF, XMP or animation chunk (GPS must be stripped; `sharp(...).webp()` strips metadata by default, ICC colour profiles are allowed). 1600 file: long side 1200 to 1600 px, at most 450 KB. 800 file: long side 600 to 800 px, at most 150 KB. The two have the same aspect ratio within 1%, and the ratio is between 3:4 portrait and 16:7 landscape. Size fields in the entry must equal the real size.
- The site: `lib/images.ts` merges the built-in `IMAGES` with the live entries; a component that renders a slot passes `slot="<id>"` to `Img` (or the helper `applySlot`), and the slot's photo and alt replace the default when set. A slot id that is not in `photo-slots.json` is a build error. `check-site` fails if a slotted photo appears on no page, or a photo is on a page but in no slot.

Slots (`scripts/lib/photo-slots.json`; adding one is a human change):

```
home.hero  home.our-roots  home.gift  home.visit
about.hero  about.wat-pho  about.space-1  about.space-2
gift-vouchers.hero  visit.room
treatment.<slug>.card  treatment.<slug>.hero  treatment.<slug>.secondary
   for thai-massage, aromatherapy-massage, hot-stone-massage, lymphatic-drainage-massage, thai-foot-massage, back-neck-shoulders-massage
```

`treatment.<slug>.card` is the picture on the home cards, the menu rows and "You might also like". Decorative backgrounds (alt empty) are not slots.

To make the two files by hand: `sharp(src).rotate().resize({width: 1600, height: 1600, fit: "inside", withoutEnlargement: true}).webp({quality: 80}).toFile("public/img/sp-<slug>-1600.webp")`, then the same at 800.

### The sentences

The bot reads the same sentence back to the manager before it opens a pull request; `scripts/test-hours-text.mjs` pins every example below (code: `lib/hours-text.ts`).

`hoursSentence()` (hours.json to text; `{{hours_sentence}}`, the home page, the FAQ, the mobile menu):

1. All open days share one set of hours: `Open <first open day> to <last open day>, <opens> to <closes>.`; one open day is `Open <day>, <opens> to <closes>.`
2. Otherwise: days with identical hours are grouped in Monday-first order, each group `<days>, <opens> to <closes>`, joined with `; `: `Open <group>; <group>.` A group of three or more consecutive days reads `A to B`; otherwise a list `A, B and C`.
3. Then, if any day is closed: ` Closed on <the closed days, plural, listed as "A, B and C">.` Closed days are all of them, inside the range or not. No open day reads `Closed every day.` (the validator prevents it).
4. Times are `HH:MM`, 24 h.

| Input | Output |
|---|---|
| today's hours (Mon closed, Tue to Sun 11:00 to 19:00) | `Open Tuesday to Sunday, 11:00 to 19:00. Closed on Mondays.` |
| every day 11:00 to 19:00 | `Open Monday to Sunday, 11:00 to 19:00.` |
| Mon and Sun closed | `Open Tuesday to Saturday, 11:00 to 19:00. Closed on Mondays and Sundays.` |
| Mon and Thu closed | `Open Tuesday to Sunday, 11:00 to 19:00. Closed on Mondays and Thursdays.` |
| as today, Sunday 12:00 to 17:00 | `Open Tuesday to Saturday, 11:00 to 19:00; Sunday, 12:00 to 17:00. Closed on Mondays.` |
| only Sunday open | `Open Sunday, 11:00 to 19:00. Closed on Mondays, Tuesdays, Wednesdays, Thursdays, Fridays and Saturdays.` |

Footer lines (`hoursCompact()`): closed days first (`Mon, Thu Closed`), then one line per run of consecutive days with the same hours (`Tue–Sun 11:00–19:00`).

`closureLabel(closure)` (the date phrase; the label is shown next to it as `Christmas: Closed Thursday 24 to Saturday 26 December`). No year; weekday names in full; the month is written once when both ends are in the same month:

| Input | Output |
|---|---|
| closed 2026-12-25 | `Closed Friday 25 December` |
| closed 2026-12-24 to 2026-12-26 | `Closed Thursday 24 to Saturday 26 December` |
| closed 2026-12-24 to 2027-01-04 | `Closed Thursday 24 December to Monday 4 January` |
| 2027-01-01, hours 13:00 to 18:00 | `Open 13:00 to 18:00 on Friday 1 January` |
| 2026-12-28 to 2026-12-30, hours 13:00 to 18:00 | `Open 13:00 to 18:00 from Monday 28 to Wednesday 30 December` |
| 2026-12-31 to 2027-01-02, hours 13:00 to 18:00 | `Open 13:00 to 18:00 from Thursday 31 December to Saturday 2 January` |

`{{closures_line}}` (FAQ hours answer): empty when there is no upcoming closure, otherwise ` Please note: <closureLabel>; <closureLabel>.` with a leading space, e.g. ` Please note: Closed Thursday 24 December to Monday 4 January.` Upcoming = live, not finished on the build day (London), starting within 60 days, earliest first.

### services (`data/services.json`)

The menu: one row per length of a treatment, `{"group", "slug", "name", "option", "duration_min", "price_gbp"}` and no other key; file keys `_about`, `source`, `read_at` (shown as "Menu checked <date>" on `/treatments/`), `currency` (`"GBP"`), `services`. Row order is the order on the site. The bot should change Treatwell first and then this file, the same day, so the two agree.

Validator (every edit, a person's too): `option` names its own length (`30 minutes`, `1 hour`, `90 minutes`, `2 hours`, `1 hour 30 minutes`); `duration_min` 10 to 240; `price_gbp` above 0, at most 1000, pounds and pence (two decimals at most); a slug has one name and one group; no repeated slug+length; `name`, `group`, `option` plain one-line text (60, 60, 30 characters) passing the shared rules except the health list (the menu's own names include "Lymphatic Drainage").

Diff rules for the shop system (`checkServices` in `scripts/lib/shop-agent-diff.mjs`); a length is identified by slug + `duration_min`:

- may: change any row's `price_gbp`, `duration_min`, `option` and `name`; add a length to an existing treatment (anywhere in the list); remove a length (discontinued); move a treatment to another group that is already on the menu; change `read_at`
- may not: add a treatment (a new slug needs its page, copy and photo slots: a person adds it), remove a treatment's last length (its page and the links to it go: a person does it), rename a slug, reorder treatments or the lengths that stay, introduce a new group, change `_about`, `source` or `currency`, add a health word to a name that the old name did not have, or move a price by more than 50% of the old price for the same length (a new length must be between half the treatment's lowest price and twice its highest). These guard typos; a bigger real change is merged by a person.

Everything else follows: menu prices, option buttons and the Service JSON-LD come from the file (check-site compares them). A live promotion whose text names a price that no longer exists fails `validate-promotions.mjs`, so the services pull request stays open until the promotion is changed too. Copy that describes lengths in words ("one of the two shortest treatments") is a person's to update.

### copy (`data/copy.json`)

Text slots: named pieces of `content/*.md` the managers may reword. The list is `scripts/lib/copy-slots.json` (a human change, like the photo slots): each slot has `kind` (`line` or `paragraph`), `max` characters, and where it points (`file`, `section`, `field`: `eyebrow`, `h1`, `lead`, `paras.N`, `subs.N.paras.M` for the Nth card's paragraph, or `fm.h1` for a treatment page's heading). `node scripts/lib/copy-text.mjs` prints the markdown wording of every slot (what the site shows while the slot is null), for the bot to show the manager.

```json
{"updated_at": "2026-11-19T09:00:00Z", "slots": {"home.hero.eyebrow": null, "home.hero.lead": "We bring the traditional techniques ...", "...": null}}
```

- Every slot of the list is present, each `null` (the markdown stays) or a string; no other key. Setting a value back to `null` restores the markdown.
- A value: plain text on one line, no spaces at either end, no double spaces; `line` at least 2 characters, `paragraph` at least 20, both at most the slot's `max`. Refused: markdown or markup (the characters `*`, `_`, `#`, backtick, `[`, `]`, `{`, `}`, `<`, `>`, `~`, backslash and `|`, and `->`; regex `MARKUP` in `scripts/lib/copy-rules.mjs`), so no `{{placeholders}}`, no HTML and no emphasis; opening times and weekday names (hours come only from `data/hours.json`); typed treatment lengths ("90 minutes"; walking minutes such as "a 9-minute walk" or "11 minutes away" are fine); any money (`£`, `€`, `$`, `%`, "20 pounds", "discount", "half price", "free of charge": prices come only from `data/services.json`, offers from `data/promotions.json`); deposit, paying, cancelling, refund, terms, privacy, consent and health-safety words (pregnant, doctor, condition, operation: that wording stays in the core copy); "Greenwich" not followed by ", Cutty Sark" (except "Greenwich station"); the neighbouring business's name; "therapists" (plural: one therapist takes bookings) except in `careers.*` slots and the `/careers/` page; and everything the shared text rules refuse (emoji, Thai, links, emails, phone numbers, `[web-`, the short shop name, health and review wording). For the health test only, "therapist(s)" and a service's own name from `data/services.json` are ignored.
- The lists: no slot points into `privacy.md`, `_booking-terms.md` or `README.md`, or at text holding `{{deposit}}` or `{{booking_terms...}}`; the health-safety cards ("Tell us about your health"), "Running late?", the gift voucher paying step and the photo note on `/tour/` are left out on purpose. `validate-copy.mjs` fails if a slot points at text that does not exist, and so does the build.
- `check-site` fails when a set value is not in its page's visible text (so a slot cannot silently do nothing).
- With every value `null` the built site is the markdown alone (checked 19 Nov 2026: every built file identical apart from Next's build id).

Slots (59): `<page>.hero.eyebrow` (line, 60), `<page>.hero.h1` (line, 100), `<page>.hero.lead` (paragraph, 400) for `home about treatments gift-vouchers visit tour faq careers`; `home.how-booking-works.body`, `.step-1`, `.step-2`; `home.treatments-preview.body`; `home.our-roots.body-1`, `.body-2`; `home.gift-vouchers.body`; `home.tour-teaser.body`; `about.wat-pho.body-1`, `.body-2`; `about.the-space.body-1`, `.body-2`; `about.how-we-work.massage-only`; `visit.getting-here.cutty-sark-dlr`, `.greenwich-station`, `.deptford-station`; `visit.before-you-come.arrive-early`; `gift-vouchers.how-it-works.step-1`, `.step-3`; `tour.visit.lead`; `careers.how-to-apply.step-1`, `.step-2`, `.step-3`; `treatment.<slug>.h1` (line, 80) and `treatment.<slug>.intro` (paragraph, 400; also the Service description in the JSON-LD) for each of the six slugs. Headings set through a slot lose the markdown's italic accent (values are plain text).

### seo (`data/seo.json`)

`{"updated_at": ..., "pages": {"/": {"title": null, "description": null}, "/treatments/thai-massage/": {...}, ...}}`: exactly the routes of `scripts/lib/seo-pages.json` (every page but `/privacy/` and the 404), each with both keys. `null` keeps the page's front matter; a string replaces the `<title>`, `og:title`, `twitter:title` (title) or the meta, OG and Twitter description. Title 10 to 60 characters (`|` allowed), description 50 to 155; otherwise the same rules as a copy value. Several front-matter titles on main are longer than 60; that is fine until the bot replaces them. `check-site` fails when a set value is not the page's own.

### Not the shop system's

`content/*.md` itself (structure, buttons and their tags, links, placeholders, images), `content/privacy.md`, `content/_booking-terms.md` (deposit, paying, moving, cancelling), the core FAQ, new treatments and pages, the slot lists, code, styles and config are changed by a person in a pull request.

### Workflow self-tests (what must stay open, what must merge)

Throwaway pull requests from branches in this repository; each must stay open with a comment ending in the marker shown:

| Branch | Diff against main | Expected |
|---|---|---|
| `shop-agent/hours-x` | `M data/promotions.json` | open, `stage=check concern=hours` |
| `shop-agent/photos-x` | `M data/promotions.json` only | open, `stage=check concern=photos` |
| `shop-agent/foo-x` | any | open, `stage=check concern=unknown` |
| `shop-agent/promotions-x` | `M data/promotions.json` and any other file | open, `stage=check concern=promotions` |
| `shop-agent/promotions-x` | `M data/promotions.json` with an existing offer's `title` changed | open, `stage=check` (diff rule) |
| `shop-agent/closures-x` | `M data/closures.json` with an existing `label` or `from` changed, or an entry removed | open, `stage=check` |
| `shop-agent/photos-x` | `M data/photos.json` plus `M public/img/<existing>.webp` (overwrite), or a `D`, `R`, or a file not named `sp-<slug>-(800|1600).webp` | open, `stage=check` |
| `shop-agent/photos-x` | WebP with an EXIF chunk, an oversize file, or only one of the pair | open, `stage=check` |
| `shop-agent/hours-x` | `M data/hours.json` valid | merges, Pages deploys, `build.json` sha equals the merge commit |
| `shop-agent/photos-x` | `M data/photos.json` plus a valid new `sp-` pair, listed in `images` | merges |
| `shop-agent/promotions-x` | `M data/promotions.json` with a `draft` offer appended | merges, no visible change |
| `shop-agent/services-x` | `M data/services.json` with one price changed by a few pounds | merges; menu, treatment page and JSON-LD show the new price |
| `shop-agent/services-x` | `M data/services.json` plus any other file, or a new slug, or a price moved by more than half | open, `stage=check concern=services` |
| `shop-agent/copy-x` | `M data/copy.json` with `home.hero.lead` set | merges; the home lead changes, nothing else |
| `shop-agent/copy-x` | `M content/home.md`, or `data/copy.json` plus `content/privacy.md`, a new file, a new slot key, a link, a price or a health claim in a value | open, `stage=check concern=copy` |
| `shop-agent/seo-x` | `M data/seo.json` with one title set | merges; that page's `<title>` changes |

## Build and check

```bash
npm ci
npm run validate     # every validator and its tests
npx next build
node scripts/write-build-json.mjs
node scripts/check-site.mjs
node scripts/build-redirect-stubs.mjs
```

### The shop tour (`/tour/`)

Photos are the shop's own (6 Nov 2026), edited only naturally: crop, light, colour cast, straightening; nothing added, removed or generated, and the neighbouring business's signage is left as photographed (it is never named in copy or alt). To change a photo or add one: copy the originals from Gumon's OneDrive (`10-Work/SST-Sri-Siam-Thai-Therapy/originals/`, never into git: this repository is public and they show phone numbers and staff names) into the gitignored `assets/photos/original/`, put any new original in OneDrive first, edit its entry in `data/tour.json` (`photos`: source, crop `[x, y, w, h]` in source pixels, optional `rotate` degrees, `tone`; `zones`: caption and alt), run `npm run tour-images`, then `npm run check`. `publish: false` keeps a photo out of the site (photo 03, whose A-board shows the old phone number at full size). `redact` pixelates printed text that must not be published (the old number on the A-board in `entrance`); it is the only edit that hides anything. Output never exceeds the crop's own width, strips all metadata, and `check-site.mjs` fails on any EXIF, XMP or GPS in `public/img/tour/` or `room-daylight-*`, a JPEG over 250 KB, a missing srcset file, a tour photo without its open-full-screen button, or the neighbouring business named anywhere. `scripts/validate-tour.mjs` applies the shared public-text rules to every caption and alt (alt 10 to 160 characters, different from the caption). The lightbox (`components/Lightbox.tsx`) is hand-written: dialog, Esc, arrows, swipe, focus trap, focus returned to the thumbnail, scroll lock. The Book button uses tag `TR`.

`check-site.mjs` fails the build on: a missing route, wrong CNAME, the old private number, a wa.me link to another number or without a tag, menu prices that differ from `services.json`, missing titles/descriptions, missing noindex while `indexable` is false, emoji, unparseable JSON-LD, "Wat Pho" anywhere, or "therapists" outside `/careers/` (unconfirmed claims, 25 Nov 2026: no certificate on file, one therapist takes bookings). Pushing to `main` runs the same steps in `.github/workflows/pages.yml` and deploys.

## The shop's name

The shop is always named in full, "Sri Siam Thai Therapy & Wellness" (owner's rule, 6 Nov 2026). "Sri Siam" alone is never the shop's name on the site, in a title, in OG/JSON-LD, in alt text or in a WhatsApp message (`lib/whatsapp.ts`, `data/promotions.json` `message`s). `check-site.mjs` fails the build when any built page's visible text, `<title>`, meta description, `og:title`, `og:site_name`, `og:description`, `alt`/`aria-label` text, a wa.me link's `text=` parameter or a JSON-LD `name` matches, case-sensitively:

```
/Sri Siam(?! Thai Therapy (?:&|&amp;) Wellness)|SriSiam/
```

That is: "Sri Siam" not followed by " Thai Therapy & Wellness" (HTML-escaped `&amp;` also accepted), or "SriSiam". The email address and domain are lowercase and are not affected. The same regex is `SHORT_NAME` in `scripts/lib/public-text.mjs`, exported as `short_name` in `scripts/lib/public-text.json`, and `checkPublicText` refuses it in any text the shop system writes. In the header the name is shown on two lines on phones ("Sri Siam" over "Thai Therapy & Wellness"), and the OG image carries it the same way.
