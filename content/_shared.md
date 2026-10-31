# Shared copy: header, footer, sticky bar, closing band, hours

## header

- Wordmark line 1: Sri Siam
- Wordmark line 2: Thai Therapy & Wellness
- Nav: Treatments -> /treatments/ · About -> /about/ · Gift Vouchers -> /gift-vouchers/ · Visit -> /visit/ · FAQ -> /faq/
- Button (primary, tag N): Book on WhatsApp
- Mobile menu button label: Menu (aria-label "Open menu" / "Close menu")
- Mobile menu footer line: {{hours_sentence}}

## sticky-bar (phones only)

- Button (primary, tag SB): Book on WhatsApp
- Icon button (secondary, aria-label "See the treatment menu") -> /treatments/

## closing-band

Used on every page except Privacy and 404.

Eyebrow: Ready when you are

### Book your massage in a message

Tell us which treatment you would like and when suits you. We reply on WhatsApp and confirm your time.

- Button (primary, tag T): Book on WhatsApp
- Line under the button: Prefer to talk? Call {{phone_display}} as a normal phone call. WhatsApp voice and video calls do not connect on this number.

## footer

Column 1 (brand): logo · Sri Siam Thai Therapy & Wellness · Traditional Thai massage in Greenwich, London SE8.

Column 2 (visit):
- Heading: Visit
- {{address}}
- Link: Directions on Google Maps -> {{maps_url}}
- {{hours_table}} (compact: "Mon Closed · Tue–Sun 11:00–19:00" is acceptable on phones if rendered from data)

Column 3 (contact):
- Heading: Contact
- WhatsApp: {{phone_display}} (link, tag F)
- Line: Call it as a normal phone call. WhatsApp voice and video calls do not connect on this number.
- Email: {{email}}
- Link: Read our reviews on Google -> {{maps_url}}

Column 4 (pages): Treatments · About · Gift Vouchers · Visit · FAQ · Careers · Privacy

Legal line: © {{year}} Sri Siam Thai Therapy & Wellness. Website by Gumon Technology.

## hours (data, confirmed 2026-10-31)

Rendered from `lib/site.ts`, never typed in prose.

- Monday: Closed
- Tuesday to Sunday: 11:00 to 19:00

Sentence form (`{{hours_sentence}}`): Open Tuesday to Sunday, 11:00 to 19:00. Closed on Mondays.
Table form (`{{hours_table}}`): seven rows, Monday first, Monday reads "Closed".

## phone line (used wherever the number is offered for calling)

Call {{phone_display}} as a normal phone call, or message the same number on WhatsApp. WhatsApp voice and video calls do not connect on this number.
