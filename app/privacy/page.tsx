import type { Metadata } from "next";
import { CookieSettingsButton } from "@/components/CookieConsent";
import { Rich } from "@/components/Rich";
import { fmString, loadDoc } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { sharedCopy } from "@/lib/shared";
import { SITE } from "@/lib/site";

const doc = loadDoc("privacy.md");

export const metadata: Metadata = pageMetadata({
  title: fmString(doc, "title"),
  description: fmString(doc, "description"),
  path: "/privacy/",
});

/** The h2 in privacy.md under which the "Cookie settings" control is shown. */
const WEBSITE_SECTION = "This website";

interface Chunk {
  h2?: string;
  paras: string[];
}

export default function PrivacyPage() {
  // privacy.md has no `## id` sections: an h1, an intro, then plain `## heading` chunks.
  const chunks: Chunk[] = [{ paras: [] }];
  let h1 = "";
  for (const line of doc.preamble.lines) {
    if (line.startsWith("# ")) h1 = line.slice(2).trim();
    else if (line.startsWith("## ")) chunks.push({ h2: line.slice(3).trim(), paras: [] });
    else chunks[chunks.length - 1].paras.push(line.trim());
  }

  return (
    <article className="container-x max-w-[720px] py-12 xl:py-20">
      <h1 className="t-display text-plum">{h1}</h1>
      {chunks.map((c, i) => (
        <section key={c.h2 ?? i} className="mt-8">
          {c.h2 && <h2 className="t-h3">{c.h2}</h2>}
          <div className="prose-sst mt-3 space-y-4">
            {c.paras.map((p, j) => (
              <p key={j}>
                <Rich text={p} />
              </p>
            ))}
          </div>
          {/* The control the "This website" section points to (only while the Google Ads tag is configured). */}
          {c.h2 === WEBSITE_SECTION && SITE.googleAds.id ? (
            <p className="mt-4">
              <CookieSettingsButton className="btn btn-secondary">{sharedCopy().cookies.settings}</CookieSettingsButton>
            </p>
          ) : null}
        </section>
      ))}
    </article>
  );
}
