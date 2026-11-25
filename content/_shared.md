# Shared copy: header, footer, sticky bar, closing band, hours

## header

- Wordmark line 1: Sri Siam
- Wordmark line 2: Thai Therapy & Wellness
- Nav: Treatments -> /treatments/ · About -> /about/ · Gift Vouchers -> /gift-vouchers/ · Visit -> /visit/ · Tour -> /tour/ · FAQ -> /faq/
- Button (primary, tag N): Book on WhatsApp
- Mobile menu button label: Menu (aria-label "Open menu" / "Close menu")
- Mobile menu footer line: {{hours_sentence}}

## sticky-bar (phones only)

- Button (primary, tag SB): Book on WhatsApp
- Icon button (secondary, aria-label "See the treatment menu") -> /treatments/

## closing-band

Used on every page except Privacy and 404.

Eyebrow: Begin your journey of serenity

### Book your treatment in a message

Book an authentic Thai treatment in one WhatsApp chat. Tell us which treatment you would like and when suits you, and we reply and confirm your time.

- Button (primary, tag T): Book on WhatsApp
- Line under the button: Questions? Call {{phone_display}}: phone calls or WhatsApp messages, no WhatsApp calls.

## footer

Column 1 (brand): logo · Sri Siam Thai Therapy & Wellness · Traditional Thai massage in Greenwich, Cutty Sark, London SE8.

Column 2 (visit):
- Heading: Visit
- {{address}}
- Link: Directions on Google Maps -> {{maps_url}}
- {{hours_table}} (compact lines from data/hours.json: closed days first, then one line per run of days with the same hours)

Column 3 (contact):
- Heading: Contact
- Call or WhatsApp: {{phone_display}} (link, tag F)
- Line: Phone calls or WhatsApp messages, no WhatsApp calls.
- Email: {{email}}
- Link: Read our reviews on Google -> {{maps_url}}

Column 4 (pages): Treatments · About · Gift Vouchers · Visit · Tour · FAQ · Careers · Privacy

Legal line: © {{year}} Sri Siam Thai Therapy & Wellness. Website by Gumon Technology.

## cookie-banner (read only when lib/site.ts googleAds.id is set, and may be left out otherwise; the settings button sits in the footer of every page and on the privacy notice)

Text version (only while lib/site.ts googleAds.clickEndpoint is set, so only in the click_ref branch): sent as "cv" with every ad click reference (lib/clickref.ts) and part of the browser's consent key, so a new version asks everyone again. Change it whenever any wording in this section changes while the click reference is on. Up to 32 of A-Z a-z 0-9 . _ -, one line only.

- Region label: Cookie choice

{{#if click_ref}}

- Text: We would like to use Google Ads cookies to see which of our ads lead people to our WhatsApp buttons. If you came from one of our ads, we also share its click reference with our booking system when you tap a WhatsApp button, so we can tell Google when it led to a booking. Nothing from Google loads and nothing is shared unless you accept.
- Text version: sst-2026-11-25-cr

{{else}}

- Text: We would like to use Google Ads cookies to see which of our ads lead people to our WhatsApp buttons. Nothing from Google loads unless you accept.

{{/if}}

- Privacy link: Privacy notice -> /privacy/
- Accept button: Accept
- Reject button: Reject
- After accepting: You have accepted these cookies.
- After rejecting: You have rejected these cookies.
- Settings button: Cookie settings

## hours (data/hours.json)

The opening hours live only in `data/hours.json` (changed by the shop system through an hours pull request) and are rendered by `lib/hours-text.ts`; they are never typed in prose, so nothing here goes stale when they change.

Sentence form: {{hours_sentence}}
Table form: {{hours_table}}, seven rows, Monday first; a closed day reads "Closed".

## phone line (used wherever the number is offered for calling)

Call or WhatsApp {{phone_display}}: phone calls or WhatsApp messages, but no WhatsApp calls. WhatsApp voice and video calls do not connect on this number.
