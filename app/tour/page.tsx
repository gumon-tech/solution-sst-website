import type { Metadata } from "next";
import { ActionView } from "@/components/Actions";
import { CompactHero } from "@/components/CompactHero";
import { HoursTable } from "@/components/HoursTable";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/Reveal";
import { Rich } from "@/components/Rich";
import { SectionHead } from "@/components/SectionHead";
import { TourGallery } from "@/components/TourGallery";
import { fmString, loadDoc, section } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { breadcrumbLd } from "@/lib/structured-data";

const doc = loadDoc("tour.md");

export const metadata: Metadata = pageMetadata({
  title: fmString(doc, "title"),
  description: fmString(doc, "description"),
  path: "/tour/",
});

export default function TourPage() {
  const hero = section(doc, "hero");
  const note = section(doc, "note");
  const visit = section(doc, "visit");
  const [book, directions, more] = visit.actions;

  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Tour the shop", path: "/tour/" }])} />

      <CompactHero eyebrow={hero.eyebrow} h1={hero.h1} lead={<Rich text={hero.lead ?? ""} />}>
        <p className="mt-4 max-w-2xl text-sm text-ink-2">{note.small}</p>
      </CompactHero>

      <TourGallery />

      <section className="bg-sand section-y mt-14 xl:mt-20" aria-labelledby="tour-visit-h">
        <div className="container-x grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <SectionHead eyebrow={visit.eyebrow} title={visit.h2} id="tour-visit-h">
              <p>
                <Rich text={visit.lead ?? ""} />
              </p>
            </SectionHead>
            <address className="mt-6 text-lg not-italic text-ink">{SITE.address}</address>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {book && <ActionView action={book} variant="primary" />}
              {directions && <ActionView action={directions} variant="secondary" />}
            </div>
            {more && (
              <p className="mt-3">
                <ActionView action={more} />
              </p>
            )}
          </div>
          <Reveal className="card p-6 xl:p-8">
            <h3 className="t-h3">{visit.caption}</h3>
            <HoursTable className="mt-3" />
          </Reveal>
        </div>
      </section>
    </>
  );
}
