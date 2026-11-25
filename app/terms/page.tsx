import type { Metadata } from "next";
import { ActionView } from "@/components/Actions";
import { ClosingBand } from "@/components/ClosingBand";
import { CompactHero } from "@/components/CompactHero";
import { Rich } from "@/components/Rich";
import { fmString, loadDoc, section, terms } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

const doc = loadDoc("terms.md");

export const metadata: Metadata = pageMetadata({
  title: fmString(doc, "title"),
  description: fmString(doc, "description"),
  path: "/terms/",
});

/** Every part of booking_terms_full in _booking-terms.md, in order: [id, heading, key in terms()]. */
const PARTS = [
  ["deposit", "Deposit", "booking_terms_full.deposit"],
  ["paying", "Paying the rest", "booking_terms_full.paying"],
  ["moving", "Moving your booking", "booking_terms_full.moving"],
  ["cancelling", "Cancelling, or changes at short notice", "booking_terms_full.cancelling"],
  ["marketing", "Marketing messages", "booking_terms_full.marketing"],
] as const;

/** "**Lead.** rest" -> bold lead and the rest (Rich has no bold). */
function Para({ text }: { text: string }) {
  const m = /^\*\*(.+?)\*\*\s*([\s\S]*)$/.exec(text);
  if (!m) return <Rich text={text} />;
  return (
    <>
      <strong>{m[1]}</strong> <Rich text={m[2]} />
    </>
  );
}

export default function TermsPage() {
  const hero = section(doc, "hero");
  const t = terms();
  return (
    <>
      <CompactHero eyebrow={hero.eyebrow} h1={hero.h1} lead={<Rich text={hero.lead ?? ""} />}>
        <div className="mt-6">
          <ActionView action={hero.actions[0]} variant="primary" />
        </div>
      </CompactHero>

      <article className="container-x max-w-[720px] pb-12 pt-4 xl:pb-20">
        {PARTS.map(([id, heading, key]) => (
          <section key={id} id={id} className="mt-8 scroll-mt-24 first:mt-0" aria-labelledby={`${id}-h`}>
            <h2 className="t-h3" id={`${id}-h`}>
              {heading}
            </h2>
            <p className="prose-sst mt-3">
              <Para text={t[key]} />
            </p>
          </section>
        ))}
      </article>

      <ClosingBand />
    </>
  );
}
