# solution-sst-website

Website for Sri Siam Thai Therapy & Wellness (London), built and hosted by Gumon Technology.

- Live: https://sst.gumon.io (GitHub Pages, custom domain via Cloudflare DNS `sst` CNAME `gumon-tech.github.io`, DNS only)
- Public repository: never commit customer data, staff personal data or secrets.
- Static Next.js 15 export (`out/`). Build: `npm ci && node scripts/validate-services.mjs && npx next build && node scripts/check-site.mjs`.
- Copy lives in `content/`, prices in `data/services.json`, facts and the indexing switch (`SITE.indexable`) in `lib/site.ts`.
