// The consent text version ("cv") of the ad click reference, worked out from the words themselves so it cannot
// be forgotten: "<siteId>-" + the first 8 hex characters of SHA-256 over
//   1. the cookie-banner section of content/_shared.md as shown while the click reference is on,
//   2. every {{#if click_ref}} block of content/privacy.md,
//   3. the site id and the two retention values from lib/site.ts (they fill the notice).
// Any change to them gives a new version: it is sent with every click reference and names the browser's consent
// key (lib/consent.ts), so everyone is asked again. Used by next.config.mjs (build) and scripts/check-site.mjs.
// Plain Node, no dependencies. Shop-neutral.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

/** Conditions as they stand while the click reference is on (lib/content.ts CONDITIONS). */
const ON = { google_ads: true, click_ref: true, google_ads_only: false };

/** Lines kept when the click reference is on; `only` keeps just the lines inside blocks of that condition. */
function evaluate(text, only) {
  const out = [];
  let state = null;
  for (const line of text.split("\n")) {
    const t = line.trim();
    const open = /^\{\{#if ([a-z0-9_]+)\}\}$/.exec(t);
    if (open) {
      if (!(open[1] in ON)) throw new Error(`consent-version: unknown condition "${open[1]}"`);
      state = { name: open[1], keep: ON[open[1]] };
    } else if (t === "{{else}}" && state) state = { name: state.name, keep: !state.keep, inElse: true };
    else if (t === "{{/if}}") state = null;
    else if (!t) continue;
    else if (only ? state && state.name === only && !state.inElse : !state || state.keep) out.push(t);
  }
  return out.join("\n");
}

export function consentVersion(root, siteId, clickRetention, clickLogRetention) {
  const shared = readFileSync(path.join(root, "content/_shared.md"), "utf8");
  const m = /^## cookie-banner\b[^\n]*\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(shared);
  if (!m) throw new Error("consent-version: content/_shared.md has no cookie-banner section");
  const notice = readFileSync(path.join(root, "content/privacy.md"), "utf8");
  const parts = [evaluate(m[1]), evaluate(notice, "click_ref"), siteId, clickRetention, clickLogRetention];
  const hex = createHash("sha256").update(parts.join("\n\u0000\n"), "utf8").digest("hex").slice(0, 8);
  return `${siteId}-${hex}`;
}
