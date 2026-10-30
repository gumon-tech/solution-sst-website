import type { Metadata } from "next";
import { ClosingBand } from "@/components/ClosingBand";
import { CompactHero } from "@/components/CompactHero";
import { JsonLd } from "@/components/JsonLd";
import { MenuRow } from "@/components/MenuRow";
import { Reveal } from "@/components/Reveal";
import { Rich } from "@/components/Rich";
import { SectionHead } from "@/components/SectionHead";
import { ActionView } from "@/components/Actions";
import { fill, fmString, loadDoc, section, terms, trailingActions } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { GROUPS } from "@/lib/services";
import { menuLd } from "@/lib/structured-data";
import { cardLine } from "@/lib/treatment-content";

const doc = loadDoc("treatments.md");

export const metadata: Metadata = pageMetadata({
  title: fmString(doc, "title"),
  description: fmString(doc, "description"),
  path: "/treatments/",
});

export default function TreatmentsPage() {
  const hero = section(doc, "hero");
  const menu = section(doc, "menu");
  const good = section(doc, "good-to-know");
  const aboutLabel = menu.actions.find((a) => a.label.startsWith("About this"))?.label ?? "About this treatment";
  const termsShort = terms()["booking_terms_short"];

  return (
    <>
      <JsonLd data={menuLd()} />

      <CompactHero eyebrow={hero.eyebrow} h1={hero.h1} lead={hero.lead}>
        <p className="hero-rise mt-3 text-sm text-ink-2" style={{ "--i": 2 } as React.CSSProperties}>
          {fill(hero.small ?? "")}
        </p>
        <ul className="mt-6 flex flex-wrap gap-2" aria-label="Menu sections">
          {GROUPS.map((g) => (
            <li key={g.anchor}>
              <a
                href={`#${g.anchor}`}
                className="inline-flex min-h-[44px] items-center rounded-full border-[1.5px] border-plum bg-cream px-5 font-semibold text-plum hover:bg-plum-tint"
              >
                {g.name}
              </a>
            </li>
          ))}
        </ul>
      </CompactHero>

      {GROUPS.map((g) => (
        <section key={g.anchor} id={g.anchor} className="container-x pb-6 pt-8 xl:pb-10 xl:pt-12" aria-labelledby={`${g.anchor}-h`}>
          <SectionHead title={g.name} id={`${g.anchor}-h`} />
          <div className="mt-4">
            {g.treatments.map((t) => (
              <MenuRow key={t.slug} t={t} card={cardLine(t.slug)} aboutLabel={aboutLabel} terms={termsShort} />
            ))}
          </div>
        </section>
      ))}

      <section className="mt-10 bg-sand section-y" aria-labelledby="gtk-h">
        <div className="container-x">
          <SectionHead eyebrow={good.eyebrow} title={good.h2} id="gtk-h" />
          <div className="mt-8 grid gap-4 lg:grid-cols-3 lg:gap-6">
            {good.subs.map((s, i) => (
              <Reveal key={s.h3} i={i} className="card p-6">
                <h3 className="t-h3">{s.h3}</h3>
                <p className="mt-2">
                  <Rich text={s.paras[0]} />
                </p>
              </Reveal>
            ))}
          </div>
          {trailingActions(good)[0] && (
            <p className="mt-6">
              <ActionView action={trailingActions(good)[0]} />
            </p>
          )}
        </div>
      </section>

      <ClosingBand />
    </>
  );
}
