import type { Metadata } from "next";
import { ActionView } from "@/components/Actions";
import { ClosingBand } from "@/components/ClosingBand";
import { Hero } from "@/components/Hero";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/Reveal";
import { Paras, Rich } from "@/components/Rich";
import { SectionHead } from "@/components/SectionHead";
import { fmString, loadDoc, section, trailingActions } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbLd } from "@/lib/structured-data";

const doc = loadDoc("gift-vouchers.md");

export const metadata: Metadata = pageMetadata({
  title: fmString(doc, "title"),
  description: fmString(doc, "description"),
  path: "/gift-vouchers/",
});

export default function GiftVouchersPage() {
  const hero = section(doc, "hero");
  const how = section(doc, "how-it-works");
  const good = section(doc, "good-to-know");

  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Gift vouchers", path: "/gift-vouchers/" }])} />

      <Hero
        imageKey="purple-stones-candles"
        mobile="stack"
        eyebrow={hero.eyebrow}
        h1={hero.h1}
        lead={<Rich text={hero.lead ?? ""} />}
        actions={<ActionView action={hero.actions[0]} variant="primary" />}
      />

      <section className="bg-sand section-y" aria-labelledby="how-h">
        <div className="container-x">
          <SectionHead eyebrow={how.eyebrow} title={how.h2} id="how-h" />
          <ol className="mt-8 grid gap-4 lg:grid-cols-3 lg:gap-6 xl:mt-12">
            {how.subs.map((s, i) => {
              const m = /^(\d+)\.\s*(.*)$/.exec(s.h3);
              return (
                <Reveal as="li" key={s.h3} i={i} className="card p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-gold font-body text-lg font-semibold text-gold-deep" aria-hidden="true">
                    {m?.[1] ?? i + 1}
                  </span>
                  <h3 className="t-h3 mt-4">{m?.[2] ?? s.h3}</h3>
                  <p className="mt-2">
                    <Rich text={s.paras[0]} />
                  </p>
                </Reveal>
              );
            })}
          </ol>
          <Reveal className="mt-10">
            <ActionView action={trailingActions(how)[0]} variant="primary" />
          </Reveal>
        </div>
      </section>

      <section className="section-y" aria-labelledby="good-h">
        <div className="container-x">
          <div className="max-w-3xl">
          <SectionHead eyebrow={good.eyebrow} title={good.h2} id="good-h" />
          <ul className="mt-6 space-y-3">
            {good.bullets.map((b) => (
              <li key={b} className="flex gap-3">
                <span className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 space-y-4">
            <Paras items={good.paras} />
          </div>
          {good.actions[0] && (
            <p className="mt-4">
              <ActionView action={good.actions[0]} />
            </p>
          )}
          </div>
        </div>
      </section>

      <ClosingBand />
    </>
  );
}
