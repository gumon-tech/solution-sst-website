# HANDOFF · Sri Siam website (room KSSW)

Written 2026-10-31 by KSSW (Lead, Opus 5.5). Read README.md first.

## State

Live at https://sst.gumon.io, built from `main`. 13 pages: `/`, `/treatments/`, six `/treatments/<slug>/`, `/gift-vouchers/`, `/about/`, `/visit/`, `/faq/`, `/privacy/`, plus 404. The shop's own Wix site at its own domain is still the main site; this one is **noindex** on KWS's ruling so the two do not compete in Google.

How it was made (A19):

```
research, design direction, all copy    executor Fable 5.1   (design and long-form content, A10)
Next.js build, checks, screenshots      executor Sonnet 5.5  (multi-file UI from a complete spec)
copy sourcing pass (KWS ruling)         executor Opus 5.5    (customer-facing wording with legal exposure)
adversarial review                      executor Opus 5.5    (fresh context: wording, law, prices, links)
lead: data, images, redirects, fixes    Opus 5.5
```

## Rules the site follows (keep them)

- Services, lengths and prices come only from `data/services.json`, copied from Treatwell venue 528970 (read via Treatwell Connect by room KSST, 30 Oct 2026 19:07 UTC). When the shop changes a price in Treatwell, change this file the same day. Never type a price into copy.
- Every statement about how a treatment is done or what the shop has must trace to the Treatwell menu text or the shop's old Wix site (KWS ruling 31 Oct). No health-result claims (detox, circulation, pain, stress, swelling, immunity). No review quotes, ratings or aggregateRating (DMCC 2024).
- Every booking button is `https://wa.me/447903653786?text=<message> [web-X]`; the shop bot reads the tag. Register: DIRECTION.md section 8. The number takes normal calls but not WhatsApp calls; every place it is offered for calling says so. The old private number must never appear (check-site enforces it).
- Images: only the shop's own uploads from its Wix site (`63aa52_` files). The Wix stock photos (`11062b_` and bare-hash files) are licensed for Wix only and are not used. The herbal-compress photos were dropped because the compress is not on the menu.
- Deposit wording lives only in `content/_booking-terms.md` (£15 from `lib/site.ts`), as KSST confirmed on 31 Oct: £15 per WhatsApp booking by payment link, taken off the bill; rest by credit card, debit card or cash; full price online if preferred; moving with 24 hours' notice keeps the deposit. Cancelling or short notice is not settled, so the site stays vague.

## Switching to the shop's real domain (when Khun Komphet decides)

1. `lib/site.ts`: set `url` to the new origin and `indexable: true` (one switch: robots meta, robots.txt and sitemap follow).
2. `public/CNAME`: the new domain; Pages settings custom domain; DNS at the registrar.
3. Old Wix URLs already have redirect stubs (`scripts/build-redirect-stubs.mjs`): `/services`, `/book-online`, `/contact`, `/about-us`, `/gallery` and the Wix system pages go to their new pages; `/service-page/*` and `/booking-calendar/*` are matched by keyword in `404.html`; any other unknown path shows the not-found page, which links home.
4. Update the booking link in Google Business Profile to the site or the wa.me link.

## Checks done on 31 Oct 2026

- check-site, eslint, tsc: pass. All 13 routes 200 on the live site; HTTPS enforced; CNAME sst.gumon.io.
- Lighthouse mobile (live): Performance 91 home, 98-100 others; Accessibility 100; Best Practices 100; SEO 69 only because of noindex (`is-crawlable` is the only failing audit).
- Every wa.me link: number 447903653786 and a valid tag; per-length messages name the exact Treatwell service and length. Prices on every page and in JSON-LD match Treatwell.
- Screenshots at 390 and 1280 checked by the lead.

## Open (not blocking)

1. Privacy notice: the shop's legal entity name (if any) should replace the trading name as controller; a retention period once the DPA settles it (proposed 24 months). It names Gumon Technology as the assistant provider and says data may go to Thailand and the United States; the DPA, IDTA and transfer risk assessment are still drafts and must be signed before real customer chats.
2. Late arrival: copy says the treatment may be shortened; whether the full price applies is not stated (ask the shop).
3. The deposit message on WhatsApp should state the deposit terms before the customer pays (for room KSST).
4. Walking minutes to Cutty Sark DLR, Greenwich and Deptford stations are not stated (only "a short walk"); add if measured.
5. Facebook page not linked: ownership not verified.
6. Some photos look like stock or generated images uploaded by the shop; alt text describes them neutrally and does not claim they show the shop's own room.
