import type { Metadata } from "next";
import { ActionView } from "@/components/Actions";
import { ClosingBand } from "@/components/ClosingBand";
import { CompactHero } from "@/components/CompactHero";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/Reveal";
import { Rich } from "@/components/Rich";
import { SectionHead } from "@/components/SectionHead";
import { fmString, loadDoc, section, trailingActions } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbLd } from "@/lib/structured-data";

const doc = loadDoc("careers.md");

export const metadata: Metadata = pageMetadata({
  title: fmString(doc, "title"),
  description: fmString(doc, "description"),
  path: "/careers/",
});

export default function CareersPage() {
  const hero = section(doc, "hero");
  const how = section(doc, "how-to-apply");

  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Careers", path: "/careers/" }])} />

      <CompactHero eyebrow={hero.eyebrow} h1={<Rich text={hero.h1 ?? ""} />} lead={<Rich text={hero.lead ?? ""} />}>
        <div className="mt-6">
          <ActionView action={hero.actions[0]} variant="primary" />
        </div>
      </CompactHero>

      <section className="bg-sand section-y" aria-labelledby="how-h">
        <div className="container-x">
          <SectionHead eyebrow={how.eyebrow} title={how.h2} id="how-h" />
          <div className="mt-8 grid gap-4 lg:grid-cols-3 lg:gap-6 xl:mt-12">
            {how.subs.map((s, i) => (
              <Reveal key={s.h3} i={i} className="card p-6">
                <h3 className="t-h3">{s.h3}</h3>
                <p className="mt-2">
                  <Rich text={s.paras[0]} />
                </p>
              </Reveal>
            ))}
          </div>
          <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            {trailingActions(how).map((a) => (
              <ActionView key={a.label} action={a} variant={a.kind === "button" ? "primary" : undefined} />
            ))}
          </div>
        </div>
      </section>

      <ClosingBand />
    </>
  );
}
