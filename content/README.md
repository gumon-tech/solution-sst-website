# Content files

Final customer-facing copy for sst.gumon.io, one file per page, UK English. The developer pastes from these files; the design and structure are in `docs/design/DIRECTION.md`.

Conventions

- `## section-id` headings match the section names in DIRECTION.md section 5. Text under them is final.
- `- Button (primary, tag X): Label` — a WhatsApp button; the message for each tag is in DIRECTION.md section 8. `- Button (secondary): Label -> /path/` is a page link.
- `[image: key]` — the image key from DIRECTION.md section 7; alt text is there too.
- `{{placeholders}}` are filled by the code from `data/services.json`, `lib/site.ts` or the two shared files below. A duration, a price, the deposit amount or the opening hours never appear typed out in prose.
- Shared blocks: `_booking-terms.md` (money terms, one place), `_shared.md` (header, footer, sticky bar, closing band, hours phrasing).
- Treatment pages: `treatments/<slug>.md`, keyed by the `slug` in `services.json`. If a slug appears in the JSON with no file here, render the page from the JSON only with the generic copy at the end of `treatments.md`, and tell the lead.
- Front matter per page: `title`, `description`, `h1`. Titles are at most 60 characters, descriptions at most 155.

Hard rules the copy already follows and the build must not break: no medical or health-result claims, no review quotes or star counts, no cookie or analytics wording, no "AI", no second phone number, no emoji.
