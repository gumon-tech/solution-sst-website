# solution-sst-website

Website for Sri Siam Thai Therapy & Wellness (Thai massage, Greenwich, London), built and hosted by Gumon Technology.

- Live: https://sst.gumon.io (GitHub Pages, custom domain via Cloudflare DNS `sst` CNAME `gumon-tech.github.io`, DNS only; HTTPS enforced)
- Public repository: never commit customer data, staff personal data or secrets.
- Handover, open items and how to change things: [HANDOFF.md](HANDOFF.md)

## Stack

Next.js 15 (App Router) + React 19 + TypeScript + Tailwind 3, static export to `out/`. No cookies, analytics or third-party scripts; fonts are self-hosted by `next/font`. Motion is CSS plus one IntersectionObserver and is off under `prefers-reduced-motion`.

## Where things live

```
data/services.json          every service, length and price, copied from Treatwell (venue 528970); the only source
data/promotions.json        live offers, written only by the shop's WhatsApp system (see Promotions below); starts empty
content/*.md                every word of customer-facing copy, read at build time
content/_booking-terms.md   the only place deposit, paying and changes are worded
lib/site.ts                 name, address, phone, hours, deposit, Maps link, and the indexable switch
lib/whatsapp.ts             wa.me links and the [web-X] source tags (register in docs/design/DIRECTION.md section 8)
lib/structured-data.ts      DaySpa, Service/Offer, FAQPage, BreadcrumbList JSON-LD
docs/design/DIRECTION.md    research, design tokens, layouts, motion, WhatsApp register
public/img/                 the shop's own photos from its Wix site, WebP 800 and 1600 wide
```

## Promotions

The shop manager confirms an offer in WhatsApp chat; the shop system (shop-agent, shop id `sst`) then keeps at most one open pull request from a branch named `shop-agent/promotions-*`, rebuilt from main plus every confirmed offer (or closed if the offers were withdrawn before it merged). It changes only `data/promotions.json`. `.github/workflows/auto-merge-shop-agent.yml` merges it by itself when the branch prefix, the one-file rule (`git diff --name-status HEAD^1 HEAD` is exactly `M data/promotions.json`) and `npm run check` all hold, then starts `pages.yml` (a merge by `GITHUB_TOKEN` does not trigger it). Anything else stays open for a person.

The workflow has a `check` job with no token (checkout without stored credentials, `npm ci`, `npm run check`) and a separate `merge` job that never runs npm. A failure leaves a comment ending `shop-agent-merge-failed stage=<check|merge|publish> sha=<head> run=<url>`; the shop system reads it and tells the manager.

- The home page shows an offers section, anchor `#promotions`, only for offers with `status: "live"` and today (London) between `starts` and `ends`. No live offer means no section and no anchor. Ended offers are not written into the HTML; the browser also hides an offer whose last day has passed since the build, and `pages.yml` rebuilds every night just after midnight London.
- Schema (one object per offer, no other keys): `code` (`P-AB12`), `title`, `eyebrow`, `detail`, `points[]`, `offer`, `message`, `image` (`null` for system offers), `illustrative`, `starts`, `ends` (YYYY-MM-DD), `ends_label` (e.g. `Monday 30 November 2026`), `status` (`live`, `ended`, `draft`). File level: `updated_at`, optional `note`. The Book button is `message` plus the tag `[web-PR]`, added by `lib/whatsapp.ts`.
- `scripts/validate-promotions.mjs` rejects a malformed file, emoji, Thai script, links, emails, phone numbers, the old private number, health and medical claims (the UK ASA/CAP list for massage) and invented service prices. `node scripts/test-promotions.mjs` tests the validator. `check-site.mjs` checks the home page shows exactly the offers live today.
- The shop system may edit offers only by status and end date, plus add new ones at the end. It never edits the wording of an offer already on the site.

## Build and check

```bash
npm ci
node scripts/validate-services.mjs
node scripts/validate-promotions.mjs
npx next build
node scripts/check-site.mjs
node scripts/build-redirect-stubs.mjs
```

`check-site.mjs` fails the build on: a missing route, wrong CNAME, the old private number, a wa.me link to another number or without a tag, menu prices that differ from `services.json`, missing titles/descriptions, missing noindex while `indexable` is false, emoji, or unparseable JSON-LD. Pushing to `main` runs the same steps in `.github/workflows/pages.yml` and deploys.
