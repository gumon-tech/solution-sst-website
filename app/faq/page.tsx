import type { Metadata } from "next";
import { Accordion } from "@/components/Accordion";
import { ActionView } from "@/components/Actions";
import { ClosingBand } from "@/components/ClosingBand";
import { CompactHero } from "@/components/CompactHero";
import { Img } from "@/components/Img";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/Reveal";
import { Rich } from "@/components/Rich";
import { SectionHead } from "@/components/SectionHead";
import { fmString, loadDoc, plain, section } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { faqLd } from "@/lib/structured-data";

const doc = loadDoc("faq.md");

export const metadata: Metadata = pageMetadata({
  title: fmString(doc, "title"),
  description: fmString(doc, "description"),
  path: "/faq/",
});

const GROUP_IDS = ["booking-and-paying", "your-visit", "treatments", "vouchers-and-contact"];

export default function FaqPage() {
  const hero = section(doc, "hero");
  const still = section(doc, "still-a-question");
  const groups = GROUP_IDS.map((id) => section(doc, id));
  const pairs = groups.flatMap((g) => g.subs.map((s) => ({ q: plain(s.h3), a: plain(s.paras.join(" ")) })));

  return (
    <>
      <JsonLd data={faqLd(pairs)} />

      <CompactHero eyebrow={hero.eyebrow} h1={hero.h1} lead={<Rich text={hero.lead ?? ""} />}>
        <div className="mt-6">
          <ActionView action={hero.actions[0]} variant="primary" />
        </div>
      </CompactHero>

      <section className="pb-12 pt-4 xl:pb-20" aria-label="Questions and answers">
        <div className="container-x grid gap-10 xl:grid-cols-12 xl:gap-12">
          <div className="space-y-12 xl:col-span-8">
            {groups.map((g) => (
              <div key={g.id}>
                <h2 className="t-h2 mb-5">{g.h2}</h2>
                <Accordion
                  openFirstOnDesktop
                  items={g.subs.map((s) => ({
                    q: s.h3,
                    a: (
                      <div className="space-y-3">
                        {s.paras.map((p, i) => (
                          <p key={i}>
                            <Rich text={p} />
                          </p>
                        ))}
                        {s.actions.map((a) => (
                          <p key={a.label}>
                            <ActionView action={a} />
                          </p>
                        ))}
                      </div>
                    ),
                  }))}
                />
              </div>
            ))}
          </div>
          <aside className="hidden xl:col-span-4 xl:block" aria-hidden="true">
            <div className="sticky top-28 overflow-hidden rounded-r-frame shadow-card">
              <Img k="orchid-stones" alt="" sizes="360px" className="aspect-[3/4] w-full object-cover" />
            </div>
          </aside>
        </div>
      </section>

      <section className="bg-sand section-y" aria-labelledby="still-h">
        <div className="container-x flex flex-col items-center text-center">
          <SectionHead title={still.h2} id="still-h" center />
          <Reveal i={2} className="mt-5 max-w-xl t-lead">
            <p>{still.paras[0]}</p>
          </Reveal>
          <Reveal i={3} className="mt-6">
            <ActionView action={still.actions[0]} variant="primary" />
          </Reveal>
        </div>
      </section>

      <ClosingBand />
    </>
  );
}
