import type { Metadata } from "next";
import { ActionView } from "@/components/Actions";
import { ClosingBand } from "@/components/ClosingBand";
import { Hero } from "@/components/Hero";
import { Img } from "@/components/Img";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/Reveal";
import { Paras, Rich } from "@/components/Rich";
import { SectionHead } from "@/components/SectionHead";
import { fmString, loadDoc, section, trailingActions } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbLd } from "@/lib/structured-data";

const doc = loadDoc("about.md");

export const metadata: Metadata = pageMetadata({
  title: fmString(doc, "title"),
  description: fmString(doc, "description"),
  path: "/about/",
});

export default function AboutPage() {
  const hero = section(doc, "hero");
  const wat = section(doc, "wat-pho");
  const space = section(doc, "the-space");
  const how = section(doc, "how-we-work");

  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "About", path: "/about/" }])} />

      <Hero
        imageKey="room-wood-purple"
        eyebrow={hero.eyebrow}
        h1={<Rich text={hero.h1 ?? ""} />}
        lead={<Rich text={hero.lead ?? ""} />}
        position="50% 60%"
      />

      <section className="section-y" aria-labelledby="wat-h">
        <div className="container-x grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
          <figure className="lg:col-span-5">
            <div className="overflow-hidden rounded-r-frame shadow-card">
              <Img k="hands-back-b" sizes="(min-width:1280px) 480px, (min-width:1024px) 40vw, 100vw" className="aspect-square w-full object-cover" />
            </div>
            <figcaption className="mt-3 text-sm text-ink-2">{wat.caption}</figcaption>
          </figure>
          <div className="lg:col-span-7">
            <SectionHead eyebrow={wat.eyebrow} title={wat.h2} id="wat-h" />
            <Reveal i={2} className="mt-6 space-y-4">
              <Paras items={wat.paras} />
            </Reveal>
          </div>
        </div>
      </section>

      <section className="bg-sand section-y" aria-labelledby="space-h">
        <div className="container-x">
          <div className="max-w-2xl">
            <SectionHead eyebrow={space.eyebrow} title={space.h2} id="space-h" />
            <Reveal i={2} className="mt-6 space-y-4">
              <Paras items={space.paras} />
            </Reveal>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-3 lg:gap-6 xl:mt-12">
            <div className="overflow-hidden rounded-r-frame shadow-card lg:col-span-2">
              <Img k="room-pink-curtains" sizes="(min-width:1280px) 730px, (min-width:1024px) 60vw, 100vw" className="aspect-[1600/700] h-full w-full object-cover lg:aspect-auto" />
            </div>
            <div className="overflow-hidden rounded-r-frame shadow-card">
              <Img k="room-wood-purple" sizes="(min-width:1280px) 360px, (min-width:1024px) 30vw, 100vw" className="aspect-[4/3] w-full object-cover lg:aspect-[3/4]" />
            </div>
          </div>
        </div>
      </section>

      <section className="section-y" aria-labelledby="how-h">
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
