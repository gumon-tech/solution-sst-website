# HANDOFF · Sri Siam website (room KSSW, now held by KSST)

Written 2026-10-31 by KSSW (Lead, Opus 5.5). Read README.md first.

## State

Live at https://srisiamthaitherapyandwellness.co.uk, built from `main`. 15 pages: `/`, `/treatments/`, six `/treatments/<slug>/`, `/gift-vouchers/`, `/about/`, `/visit/`, `/tour/`, `/faq/`, `/privacy/`, `/careers/`, plus 404. This is the shop's main site since 5 Nov 2026 and is indexable.

Session of 5–6 Nov 2026 (room KSST): domain switched; palette brightened toward the old Wix site (#16); copy rebuilt from the owner's old-site wording within ASA/CAP rules (#18); "Greenwich, Cutty Sark" wherever the area is named and the address line without a lone "Greenwich" (#20, #21); the full name "Sri Siam Thai Therapy & Wellness" everywhere (#22); chat-editable data for the shop bot: hours, closures, notice, faq-extra, photos, build.json, deploy retry (#9, #17). check-site enforces the Greenwich and full-name rules. sst.gumon.io redirects to the new domain via a Cloudflare rule until about 5 Feb 2027 (room KWHL removes it after that).

How it was made (A19):

```
research, design direction, all copy    executor Fable 5.1   (design and long-form content, A10)
Next.js build, checks, screenshots      executor Sonnet 5.5  (multi-file UI from a complete spec)
copy sourcing pass (KWS ruling)         executor Opus 5.5    (customer-facing wording with legal exposure)
adversarial review                      executor Opus 5.5    (fresh context: wording, law, prices, links)
lead: data, images, redirects, fixes    Opus 5.5
```

## Offers from the shop system (added 31 Oct 2026, room KSST)

`data/promotions.json` starts empty and nothing shows. The shop's WhatsApp system writes it by pull request after the manager confirms an offer in chat; `auto-merge-shop-agent.yml` merges it when the branch is `shop-agent/promotions-*`, only `data/promotions.json` changed, and `npm run check` passes, then dispatches `pages.yml`. Details and schema: README, "Promotions". Tag `PR` is registered in DIRECTION.md section 8.

Needs: the shop pod's `WEBSITE_GITHUB_TOKEN` (set by the lead). `main` must not require a pull request review, or the automatic merge waits for a person. The first pull request cannot be merged by the workflow until the workflow file is on `main`.

## Rules the site follows (keep them)

- Services, lengths and prices come only from `data/services.json`, copied from Treatwell venue 528970 (read via Treatwell Connect by room KSST, 30 Oct 2026 19:07 UTC). When the shop changes a price in Treatwell, change this file the same day. Never type a price into copy.
- Every statement about how a treatment is done or what the shop has must trace to the Treatwell menu text or the shop's old Wix site (KWS ruling 31 Oct). No health-result claims (detox, circulation, pain, stress, swelling, immunity). No review quotes, ratings or aggregateRating (DMCC 2024).
- Every booking button is `https://wa.me/447903653786?text=<message> [web-X]`; the shop bot reads the tag. Register: DIRECTION.md section 8. The number takes normal calls but not WhatsApp calls; every place it is offered for calling says so. The old private number must never appear (check-site enforces it).
- Images: only the shop's own uploads from its Wix site (`63aa52_` files). The Wix stock photos (`11062b_` and bare-hash files) are licensed for Wix only and are not used. The herbal-compress photos were dropped because the compress is not on the menu.
- Deposit wording lives only in `content/_booking-terms.md` (£15 from `lib/site.ts`), as KSST confirmed on 31 Oct: £15 per WhatsApp booking by payment link, taken off the bill; rest by credit card, debit card or cash; full price online if preferred; moving with 24 hours' notice keeps the deposit. Cancelling or short notice is not settled, so the site stays vague.

## Switched to the shop's domain (5 Nov 2026)

1. Done: `lib/site.ts` url is `https://srisiamthaitherapyandwellness.co.uk` and `indexable: true` (robots meta, robots.txt and sitemap follow).
2. Done: `public/CNAME` and the Pages custom domain; Cloudflare DNS (Gumon's account): apex A to 185.199.108-111.153, `www` CNAME `gumon-tech.github.io`, DNS only. The Wix site is detached from the domain; sst.gumon.io is no longer served.
3. Done: `scripts/check-site.mjs` expects the new domain. Old Wix URLs have redirect stubs (`scripts/build-redirect-stubs.mjs`): `/services`, `/book-online`, `/contact`, `/about-us`, `/gallery` and the Wix system pages go to their new pages; `/service-page/*` and `/booking-calendar/*` are matched by keyword in `404.html`; any other unknown path shows the not-found page, which links home.
4. Done 6 Nov 2026: Google Business Profile (verified listing 11701451269298450188, managed from the shop's Google account in the Chrome profile "SST (Sri Siam)"): Website set to https://srisiamthaitherapyandwellness.co.uk/, menu link /treatments/. Two stray listings were handled: the duplicate was already disabled by Google; the unverified one with the old private number was removed by Khun Komphet. Search Console: domain property verified by a TXT record in Cloudflare (keep that record), sitemap submitted (14 pages; `/tour/` makes 15 once deployed: resubmit or let Google re-read it).

## Checks done on 31 Oct 2026

- check-site, eslint, tsc: pass. All 13 routes 200 on the live site; HTTPS enforced; CNAME was sst.gumon.io (domain switched on 5 Nov 2026).
- Lighthouse mobile (live): Performance 91 home, 98-100 others; Accessibility 100; Best Practices 100; SEO 69 only because of noindex (`is-crawlable` is the only failing audit).
- Every wa.me link: number 447903653786 and a valid tag; per-length messages name the exact Treatwell service and length. Prices on every page and in JSON-LD match Treatwell.
- Screenshots at 390 and 1280 checked by the lead.

## Open (not blocking)

1. Privacy notice: the shop's legal entity name (if any) should replace the trading name as controller; a retention period once the DPA settles it (proposed 24 months). It names Gumon Technology as the assistant provider and says data may go to Thailand and the United States; the DPA, IDTA and transfer risk assessment are still drafts and must be signed before real customer chats.
2. Late arrival: copy says the treatment may be shortened; whether the full price applies is not stated (ask the shop).
3. The deposit message on WhatsApp should state the deposit terms before the customer pays (for room KSST).
4. Done 6 Nov 2026: walking minutes measured by the lead with Google Maps walking directions from the shop (51.48263, -0.01891): Cutty Sark DLR 9 min (0.4 mile), the Cutty Sark ship 11 min (0.5 mile), Greenwich station 16 min (0.7 mile); now in `content/visit.md`, `content/home.md` and the home and visit titles/descriptions. Deptford station is still "a short walk" (not measured).
5. Facebook page not linked: ownership not verified.
6. Some photos look like stock or generated images uploaded by the shop; alt text describes them neutrally and does not claim they show the shop's own room. On 5 Nov 2026 the shop said `room-wood-purple` showed another shop's room; it was removed. Done 7 Nov 2026: the owner's own photos of the shop are on `/tour/` and `room-daylight` (made from them) replaces `room-pink-curtains` on Home "Visit", `/visit/` and `/about/`; `room-pink-curtains` remains only as the thai-massage secondary photo and should be replaced or confirmed with the shop. Held back from the site: the certificates photo (shows a therapist's name and photograph; staff names are not on the site until the shop agrees) and photo 03 (the A-board shows the old private number at full size). The entrance photo shows another business's sign on the same frontage; the copy does not name it, the shop should confirm it is happy with that photo.
7. Deposit links: the shop bot's £15 deposit links are Wix Payment Links on the Wix site's primary domain (https://www.<domain>/_paylink/<id>). Since the switch they no longer open on the shop domain. Plan with room KBOT: make pay.<domain> the Wix primary domain and redirect /_paylink/* there. Meanwhile `out/404.html` forwards any `/_paylink/*` path (with query and hash) to `SITE.wixPaylinkBase` in `lib/site.ts` (the Wix site), so old www links still work; switch that constant to `https://pay.<domain>/_paylink` once pay. is connected.
8. Not yet run for real: the bot's positive path for hours, closures, notice and photos (promotions already merged through the new workflow, #14 #15). Room KBOT tests with draft/future data, then posts the closure for 24 Dec–4 Jan. A `services` concern (price edits via Treatwell first) waits for KBOT's Treatwell write test.

## Shop bot integration (room KSST, 31 Oct 2026)

Room KSST now holds this repo (KSSW closed). The Sri Siam shop bot (k8s ns shop-sst, release 20261031-0133) publishes promotions here:

- The bot opens one PR at a time on a `shop-agent/promotions-*` branch that changes only `data/promotions.json`. `auto-merge-shop-agent.yml` runs `site-check` (no token, no stored credentials), then merges and dispatches Pages. The bot tells the manager when the card is live or if a stage failed.
- Main has a ruleset (id 26252392): every change needs a pull request and a passing `site-check`, 0 approvals, nobody can bypass. Human edits go through a PR too.
- Tested 31 Oct: PR #1 added a TEST card, PR #2 ended it; both merged and deployed.
- The bot's token is a fine-grained PAT limited to this repo (contents and pull requests write), expiring 30 Oct 2027. Renew it before then.
- Team publishing is off (`web.team_sync: false` in the bot) until the shop consents to staff names on the site.
