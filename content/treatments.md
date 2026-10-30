---
title: "Massage Menu & Prices in Greenwich | Sri Siam"
description: "Every treatment we offer in Greenwich with durations and prices, exactly as on our booking calendar. Tap any option to book it on WhatsApp."
h1: "Our massage menu"
---

## hero

Eyebrow: Treatments and prices

# Our massage menu

Lead: Everything below is exactly what is on our booking calendar, in the lengths we offer it. Tap the length you want and WhatsApp opens with the booking message ready to send.

Small line: Menu checked {{menu_checked_date}}. Prices are confirmed when we book you in.

## group-chips

One chip per group in `data/services.json`, in file order, linking to the group anchor. Groups today: Classic Massages · Reflexology & Lymphatic Massages.

## menu

For each group: h2 = group name. For each treatment (distinct slug) in the group:

- Image: per-slug key from DIRECTION.md section 7
- h3: {{name}} -> /treatments/{{slug}}/
- One line: the `card` line from `treatments/<slug>.md`
- Option buttons (tag M), one per row for the slug, label "{{option}} · £{{price}}"
- Link: About this treatment -> /treatments/{{slug}}/

Under every treatment's options, small text: {{booking_terms_short}}

## good-to-know

Eyebrow: Good to know

## Before you book

Three cards:

### Booking
We book by WhatsApp only. Tap an option above, send the message and we reply with free times. {{booking_terms_lines.deposit}}

### Paying
{{booking_terms_lines.paying}}

### Your health
If you are pregnant, or you have a health condition, an injury or a recent operation, please tell us before you book so the team can confirm the right treatment for you. If you are unsure, it is worth asking your doctor first.

- Link: More questions answered -> /faq/

## closing-band

(from _shared.md, tag T)

## generic-treatment-copy

Used only if a slug appears in `data/services.json` without a matching file in `content/treatments/`. The build should also flag it.

Card line: A massage from our menu. Choose the length that suits you below.

Intro: {{name}} is one of the treatments on our menu in Greenwich. Choose the length that suits you from the options below and we will confirm your time on WhatsApp. If you would like to know more about it before you book, ask us in the same chat and the team will explain what it involves.
