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
content/*.md                every word of customer-facing copy, read at build time
content/_booking-terms.md   the only place deposit, paying and changes are worded
lib/site.ts                 name, address, phone, hours, deposit, Maps link, and the indexable switch
lib/whatsapp.ts             wa.me links and the [web-X] source tags (register in docs/design/DIRECTION.md section 8)
lib/structured-data.ts      DaySpa, Service/Offer, FAQPage, BreadcrumbList JSON-LD
docs/design/DIRECTION.md    research, design tokens, layouts, motion, WhatsApp register
public/img/                 the shop's own photos from its Wix site, WebP 800 and 1600 wide
```

## Build and check

```bash
npm ci
node scripts/validate-services.mjs
npx next build
node scripts/check-site.mjs
node scripts/build-redirect-stubs.mjs
```

`check-site.mjs` fails the build on: a missing route, wrong CNAME, the old private number, a wa.me link to another number or without a tag, menu prices that differ from `services.json`, missing titles/descriptions, missing noindex while `indexable` is false, emoji, or unparseable JSON-LD. Pushing to `main` runs the same steps in `.github/workflows/pages.yml` and deploys.
