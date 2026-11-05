// Writes scripts/lib/public-text.json: the rule lists of public-text.mjs in a form the shop bot can read.
//   node scripts/lib/export-public-text.mjs           write the file
//   node scripts/lib/export-public-text.mjs --check   exit 1 if the file is stale (npm run check runs this)
// Regexes are JavaScript flavour: { source, flags }. The bot translates them (\p{Extended_Pictographic} needs the `regex` module in Python).
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EMAIL, EMOJI, HEALTH, LINK, OLD_NUMBER_FRAGMENTS, PHONE_LIKE, PHONE_MIN_DIGITS, REVIEW_WORDS, THAI, WEB_TAG, loadFacts } from "./public-text.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const target = path.join(here, "public-text.json");
const re = (r) => ({ source: r.source, flags: r.flags });

export function build() {
  const facts = loadFacts();
  return (
    JSON.stringify(
      {
        _generated: "by scripts/lib/export-public-text.mjs from scripts/lib/public-text.mjs. Do not edit by hand.",
        shop_name: facts.shopName,
        deposit_gbp: facts.deposit,
        emoji: re(EMOJI),
        thai: re(THAI),
        link: re(LINK),
        email: re(EMAIL),
        phone_like: re(PHONE_LIKE),
        phone_min_digits: PHONE_MIN_DIGITS,
        old_number_fragments: OLD_NUMBER_FRAGMENTS,
        web_tag: re(WEB_TAG),
        health: re(HEALTH),
        review_words: re(REVIEW_WORDS),
        rules: {
          shop_name_exempt_from_health: "remove the shop's exact display name (case-insensitive) from the text before testing health",
          money: "a £ amount must be a discount ('£5 off'), the deposit, or a price in data/services.json; notice and faq-extra allow none",
          alt_text_only: "the word therapist(s) is allowed in photo alt text (it describes the photo) and is removed before the health test",
        },
      },
      null,
      2,
    ) + "\n"
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const fresh = build();
  if (process.argv.includes("--check")) {
    if (!existsSync(target) || readFileSync(target, "utf8") !== fresh) {
      console.error("scripts/lib/public-text.json is stale: run node scripts/lib/export-public-text.mjs and commit it");
      process.exit(1);
    }
    console.log("public-text.json is current");
  } else {
    writeFileSync(target, fresh);
    console.log("wrote scripts/lib/public-text.json");
  }
}
