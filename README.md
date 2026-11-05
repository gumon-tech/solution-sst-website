# solution-sst-website

Website for Sri Siam Thai Therapy & Wellness (Thai massage, Greenwich, London), built and hosted by Gumon Technology.

- Live: https://srisiamthaitherapyandwellness.co.uk (GitHub Pages, custom domain; DNS on Cloudflare in Gumon's account: apex A to the GitHub Pages IPs 185.199.108-111.153 and `www` CNAME `gumon-tech.github.io`, DNS only; HTTPS enforced). The Wix site was detached from the domain on 5 Nov 2026.
- Public repository: never commit customer data, staff personal data or secrets.
- Handover, open items and how to change things: [HANDOFF.md](HANDOFF.md)

## Stack

Next.js 15 (App Router) + React 19 + TypeScript + Tailwind 3, static export to `out/`. No cookies, analytics or third-party scripts; fonts are self-hosted by `next/font`. Motion is CSS plus one IntersectionObserver and is off under `prefers-reduced-motion`.

## Where things live

```
data/services.json          every service, length and price, copied from Treatwell (venue 528970); the only source
data/promotions.json        live offers, written only by the shop's WhatsApp system (see "Data the shop system writes")
data/hours.json             weekly opening hours (same system)
data/closures.json          closed days and changed-hours days (same system)
data/notice.json            one site-wide notice (same system)
data/faq-extra.json         extra FAQ questions (same system)
data/photos.json            photos the system added and which slot shows them (same system)
content/*.md                every word of customer-facing copy, read at build time
content/_booking-terms.md   the only place deposit, paying and changes are worded
lib/site.ts                 name, address, phone, deposit, Maps link, the indexable switch; hours come from data/hours.json via lib/hours-text.ts
lib/whatsapp.ts             wa.me links and the [web-X] source tags (register in docs/design/DIRECTION.md section 8)
lib/structured-data.ts      DaySpa, Service/Offer, FAQPage, BreadcrumbList JSON-LD
docs/design/DIRECTION.md    research, design tokens, layouts, motion, WhatsApp register
public/img/                 the shop's own photos from its Wix site, WebP 800 and 1600 wide
```

## Data the shop system writes

The shop manager confirms a change in WhatsApp chat; the shop system (shop-agent, shop id `sst`) then keeps at most one open pull request per concern from a branch `shop-agent/<concern>-<id>`, rebuilt from main plus every confirmed change (or closed if they were withdrawn before it merged). `.github/workflows/auto-merge-shop-agent.yml` merges it by itself when the branch, the file rule, `npm run check` and the diff rules all hold, then starts `pages.yml` (a merge by `GITHUB_TOKEN` does not trigger it). Anything else stays open for a person. Who may ask for what (management or shop manager) is enforced by the bot, not the site.

One concern = one data file = one branch prefix = one validator:

| Concern | Branch | Files the pull request may change | Validator and test |
|---|---|---|---|
| promotions | `shop-agent/promotions-<id>` | `M data/promotions.json` only | `validate-promotions.mjs`, `test-promotions.mjs` |
| hours | `shop-agent/hours-<id>` | `M data/hours.json` only | `validate-hours.mjs`, `test-hours.mjs` |
| closures | `shop-agent/closures-<id>` | `M data/closures.json` only | `validate-closures.mjs`, `test-closures.mjs` |
| notice | `shop-agent/notice-<id>` | `M data/notice.json` only | `validate-notice.mjs`, `test-notice.mjs` |
| faq-extra | `shop-agent/faq-extra-<id>` | `M data/faq-extra.json` only | `validate-faq-extra.mjs`, `test-faq-extra.mjs` |
| photos | `shop-agent/photos-<id>` | exactly one `M data/photos.json`, plus new files `A public/img/sp-<slug>-800.webp` and `A public/img/sp-<slug>-1600.webp` (no D, no R, no M of a photo file, nothing else) | `validate-photos.mjs`, `test-photos.mjs` |

Files must exist on main first (a person creates them), so `A data/<concern>.json` is never valid. `<id>` is `[A-Za-z0-9._-]+`. An unknown concern stays open.

### Workflow

A `check` job (check run name `site-check`) with no token (checkout without stored credentials, `fetch-depth: 2`, `npm ci`, `npm run check`), then a separate `merge` job that never runs npm (`gh pr merge --squash --delete-branch --match-head-commit`, then `gh workflow run pages.yml`). Rule order in `check`: concern known, file rule (before any npm, so the scripts that run are always main's), head sha equals the reviewed one, `npm run check`, then `node scripts/check-shop-agent-diff.mjs <concern>`.

Failure marker, last line of the comment the workflow posts on the pull request (the bot parses it):

```
shop-agent-merge-failed stage=<check|merge|publish> concern=<promotions|hours|closures|notice|faq-extra|photos|unknown> sha=<pull request head sha> run=<url of the workflow run>
```

`stage=check`: unknown concern, wrong files, a validator, the build, check-site or a diff rule failed (the run log says which). `stage=merge`: GitHub refused the merge (the pull request stays open). `stage=publish`: merged, but starting `pages.yml` failed (the site updates at the next nightly rebuild). A run replaced by a newer commit on the branch stays silent. `concern=unknown` appears when the branch name has no known concern.

Confirming "live": `pages.yml` writes `out/build.json` (below). The bot tells the manager "live" when `https://srisiamthaitherapyandwellness.co.uk/build.json` has `sha` equal to the merge commit (or any later commit on main), or when `data.<concern>` equals the sha256 of its file on main.

### build.json

`scripts/write-build-json.mjs` runs after `next build` (in `npm run check` and in `pages.yml`) and writes `out/build.json`: `{"sha": <GITHUB_SHA or git rev-parse HEAD>, "built_at": <UTC ISO>, "data": {"promotions": <sha256 of data/promotions.json>, "hours": ..., "closures": ..., "notice": ..., "faq-extra": ..., "photos": ...}}`. No secrets; not in the sitemap; `check-site.mjs` fails if it is missing or does not parse. A test with no visible change: merge a promotion with `status: "draft"` (or a future `starts`) through the whole pipeline, then read `build.json`.

### Shared text rules

`scripts/lib/public-text.mjs` holds the rules every text field passes: no emoji, no Thai script, no links, no emails, no phone-like numbers, not the old private number, no `[web-`, no health or medical claims (the UK ASA/CAP list for massage), no review wording (review, reviews, rated, rating, stars, the star symbol, "5 star", testimonial, Trustpilot, Google reviews: no review claims, DMCC 2024), no `£` amount that is not a discount, the deposit or a price in `data/services.json` (notice, closures labels, extra FAQ and photo alt allow no `£` at all), and the shop's exact display name is exempt from the health list. Photo alt text may say "therapist". The same lists are in `scripts/lib/public-text.json`, written by `node scripts/lib/export-public-text.mjs` for the bot; `node scripts/lib/export-public-text.mjs --check` (run by `scripts/test-public-text.mjs`, so by `npm run check`) fails if the JSON is stale. The regexes are JavaScript flavour; `\p{Extended_Pictographic}` needs the `regex` module in Python.

No validator rule depends on today's date (the nightly rebuild must never fail because time passed). Filtering by date is the site's job.

### Diff rules (`scripts/check-shop-agent-diff.mjs <concern>`, rules in `scripts/lib/shop-agent-diff.mjs`)

Compares `data/<concern>.json` at `HEAD^1` (main) with `HEAD` (the merge result). Entries are never removed or reordered; new entries go at the end; on an existing entry only these fields may change:

- promotions: `status`, `ends`, `ends_label`
- closures: `status`, `to`
- faq-extra: `status`
- photos `images`: `status` (the `slots` map is free)
- hours and notice have no list: the whole object may be replaced (the validator holds the rules)

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

### Not in this release

`services` (prices, lengths, new treatments) is not chat-editable: TODO after the Treatwell write test on Monday 9 Nov 2026. `data/services.json` stays a human-only file.

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

## Build and check

```bash
npm ci
npm run validate     # every validator and its tests
npx next build
node scripts/write-build-json.mjs
node scripts/check-site.mjs
node scripts/build-redirect-stubs.mjs
```

`check-site.mjs` fails the build on: a missing route, wrong CNAME, the old private number, a wa.me link to another number or without a tag, menu prices that differ from `services.json`, missing titles/descriptions, missing noindex while `indexable` is false, emoji, or unparseable JSON-LD. Pushing to `main` runs the same steps in `.github/workflows/pages.yml` and deploys.
