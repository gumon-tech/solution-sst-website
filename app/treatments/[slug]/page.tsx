import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionView } from "@/components/Actions";
import { Accordion } from "@/components/Accordion";
import { ClosingBand } from "@/components/ClosingBand";
import { Hero } from "@/components/Hero";
import { Img } from "@/components/Img";
import { JsonLd } from "@/components/JsonLd";
import { OptionButtons } from "@/components/OptionButtons";
import { Reveal } from "@/components/Reveal";
import { Paras, Rich } from "@/components/Rich";
import { SectionHead } from "@/components/SectionHead";
import { fill, plain } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { TREATMENTS, formatPrice, getTreatment } from "@/lib/services";
import { breadcrumbLd, faqLd, serviceLd } from "@/lib/structured-data";
import { cardLine, genericIntro, imageFor, treatmentCopy } from "@/lib/treatment-content";
import { TAG_UNKNOWN_TREATMENT, TREATMENT_TAG } from "@/lib/whatsapp";
import type { ImageKey } from "@/lib/images";

export function generateStaticParams() {
  return TREATMENTS.map((t) => ({ slug: t.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = getTreatment(slug);
  if (!t) return {};
  const c = treatmentCopy(slug);
  if (!c) {
    return pageMetadata({
      title: `${t.name} in Greenwich | Sri Siam`,
      description: genericIntro(slug),
      path: `/treatments/${slug}/`,
    });
  }
  return pageMetadata({ title: c.title, description: c.description, path: `/treatments/${slug}/` });
}

export default async function TreatmentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = getTreatment(slug);
  if (!t) notFound();
  const c = treatmentCopy(slug);
  const tag = TREATMENT_TAG[slug] ?? TAG_UNKNOWN_TREATMENT;
  const ctx = { group: t.group, name: t.name };

  // Treatment in services.json with no content file: render from the JSON with the generic copy.
  if (!c) {
    const img = imageFor(slug);
    return (
      <>
        <JsonLd data={serviceLd(t, genericIntro(slug))} />
        <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Treatments", path: "/treatments/" }, { name: t.name, path: `/treatments/${slug}/` }])} />
        <Hero
          imageKey={img.key}
          alt={img.alt}
          eyebrow={`Treatments · ${t.group}`}
          h1={`${t.name} in Greenwich`}
          lead={genericIntro(slug)}
        />
        <section className="container-x section-y">
          <OptionButtons treatment={t} tag={tag} className="max-w-md" />
        </section>
        <ClosingBand />
      </>
    );
  }

  const doc = c.doc;
  const options = doc.sections["options"];
  const eyebrowHero = fill(c.hero.eyebrow ?? "", ctx);
  const askAction = options.actions.find((a) => a.tag === "Q");
  const faqPairs = c.faq.subs.map((s) => ({ q: s.h3, a: s.paras.join(" ") }));
  const alsoList = (doc.sections["also-like"]?.bullets ?? [])
    .map((b) => getTreatment(b.replace(/^\/treatments\//, "").replace(/\/$/, "")))
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  const heroPos = slug === "back-neck-shoulders-massage" ? "50% 30%" : "50% 40%";

  return (
    <>
      <JsonLd data={serviceLd(t, plain(c.hero.lead ?? "", ctx))} />
      <JsonLd data={faqLd(faqPairs.map((p) => ({ q: plain(p.q, ctx), a: plain(p.a, ctx) })))} />
      <JsonLd
        data={breadcrumbLd([
          { name: "Home", path: "/" },
          { name: "Treatments", path: "/treatments/" },
          { name: t.name, path: `/treatments/${slug}/` },
        ])}
      />

      <Hero
        imageKey={c.heroImage}
        alt={c.heroAlt}
        eyebrow={eyebrowHero}
        h1={c.h1}
        lead={<Rich text={c.hero.lead ?? ""} ctx={ctx} />}
        position={heroPos}
      />

      {/* Choose your length */}
      <section className="bg-sand section-y" aria-labelledby="len-h">
        <div className="container-x grid gap-8 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-5">
            <SectionHead title={options.eyebrow} id="len-h" />
          </div>
          <div className="lg:col-span-7">
            <OptionButtons treatment={t} tag={tag} className="max-w-lg" />
            <p className="mt-4 max-w-lg text-ink-2">
              <Rich text={options.paras.find((p) => p.includes("booking_terms_short")) ?? ""} />
            </p>
            {askAction && (
              <p className="mt-2">
                <ActionView action={askAction} name={t.name} />
              </p>
            )}
          </div>
        </div>
      </section>

      {/* What to expect */}
      <section className="section-y" aria-labelledby="expect-h">
        <div className="container-x">
          <div className="max-w-3xl">
            <SectionHead title={c.expect.h2} id="expect-h" />
            <Reveal i={2} className="mt-6 space-y-4">
              <Paras items={c.expect.paras} ctx={ctx} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* Focus and good to know */}
      <section className="bg-sand section-y" aria-label="What it focuses on and good to know">
        <div className="container-x grid gap-6 lg:grid-cols-2 lg:gap-8">
          {c.focus.subs.map((s, i) => (
            <Reveal key={s.h3} i={i} className="card p-6 xl:p-8">
              <h2 className="t-h3">{s.h3}</h2>
              <ul className="mt-4 space-y-3">
                {s.bullets.map((b) => (
                  <li key={b} className="flex gap-3">
                    <span className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                    <span>
                      <Rich text={b} ctx={ctx} />
                    </span>
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </section>

      {/* A moment of the room */}
      <section className="section-y" aria-label="The room">
        <div className="container-x">
          <figure>
            <div className="overflow-hidden rounded-r-frame shadow-card">
              <Img
                k={c.secondaryImage as ImageKey}
                alt={c.secondaryAlt}
                sizes="(min-width:1280px) 1104px, 100vw"
                className="aspect-[4/3] w-full object-cover sm:aspect-[16/9] xl:aspect-[16/7]"
              />
            </div>
            {c.room.caption && <figcaption className="mt-3 text-sm text-ink-2">{c.room.caption}</figcaption>}
          </figure>
        </div>
      </section>

      {/* Questions */}
      <section className="bg-sand section-y" aria-labelledby="q-h">
        <div className="container-x grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHead title={`Questions about ${t.name}`} id="q-h" />
          </div>
          <div className="lg:col-span-8">
            <Accordion
              items={c.faq.subs.map((s) => ({
                q: fill(s.h3, ctx),
                a: (
                  <p>
                    <Rich text={s.paras.join(" ")} ctx={ctx} />
                  </p>
                ),
              }))}
            />
          </div>
        </div>
      </section>

      {/* You might also like */}
      {alsoList.length > 0 && (
        <section className="section-y" aria-labelledby="also-h">
          <div className="container-x">
            <SectionHead title="You might also like" id="also-h" />
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:gap-6">
              {alsoList.map((a, i) => {
                const im = imageFor(a.slug);
                return (
                  <Reveal key={a.slug} i={i}>
                    <article className="card lift flex h-full gap-4 p-4">
                      <div className="zoom h-28 w-28 shrink-0 overflow-hidden rounded-r-md bg-sand">
                        <Img k={im.key} alt={im.alt} sizes="112px" className="h-full w-full object-cover" />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <h3 className="t-h3">
                          <Link href={`/treatments/${a.slug}/`}>{a.name}</Link>
                        </h3>
                        <p className="mt-1 text-sm text-ink-2">{cardLine(a.slug)}</p>
                        <p className="mt-auto pt-2 font-semibold text-gold-deep">from £{formatPrice(a.fromPrice)}</p>
                      </div>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <ClosingBand />
    </>
  );
}
