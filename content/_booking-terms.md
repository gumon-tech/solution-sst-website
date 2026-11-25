# Booking and payment terms (single source)

Confirmed by the lead on 2026-10-31 from the shop-agent room. Everything about money on the site renders from this file; nothing about deposits, paying or cancelling is written anywhere else. `{{deposit}}` is a constant in `lib/site.ts` (currently 15, rendered "£15").

## booking_terms_short

One sentence, used under booking buttons on the home page, the menu and every treatment page.

A {{deposit}} deposit secures your booking. We send a secure payment link on WhatsApp, and the {{deposit}} comes off your bill at the shop.

## booking_terms_full

Used on `/faq/` (the deposit and paying answers), in the "Good to know" band on `/treatments/`, and in full on `/terms/` (which adds the Marketing messages section).

### Deposit

A {{deposit}} deposit secures every booking made on WhatsApp. Once we have agreed a time, the team sends you a secure payment link for that booking. The {{deposit}} is taken off your bill at the shop.

### Paying the rest

The rest is paid at the shop on the day, by credit card, debit card or cash. If you would rather pay the full price online in advance, just say so when you book and the team will send a link for the full amount instead.

### Moving your booking

If you need to move your booking and give us at least 24 hours' notice, your deposit moves with it to the new time.

### Cancelling, or changes at short notice

Please message us as early as you can and the team will help.

### Marketing messages

**Marketing messages.** When you book or visit Sri Siam Thai Therapy & Wellness, we may send you news and offers about similar treatments from Sri Siam Thai Therapy & Wellness by email and WhatsApp. You can opt out at any time: reply STOP to any WhatsApp message, or use the unsubscribe link in any email. Opting out stops all marketing messages on every channel. We still send messages about your bookings.

## booking_terms_lines

Three one-liners for the "Good to know" cards on `/treatments/` and `/about/`.

- Deposit: A {{deposit}} deposit secures your booking and comes off your bill at the shop.
- Paying: Pay the rest at the shop on the day, by card or cash, or pay in full online if you prefer.
- Changes: Need to move it? Give us at least 24 hours' notice and your deposit moves with you. Anything else, message us as early as you can.

## marketing_notice

Shown as a plain paragraph under the booking buttons on the home page, `/treatments/` and every treatment page (components/MarketingNotice.tsx). Wording agreed with the lead; change it only with them. There is no tickbox: customers opt out with STOP or the unsubscribe link.

- Sentence: By booking, you agree that Sri Siam Thai Therapy & Wellness may send you occasional news and offers about our treatments by email and WhatsApp.
