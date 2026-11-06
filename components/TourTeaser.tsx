import { ActionView } from "@/components/Actions";
import { Reveal } from "@/components/Reveal";
import { SectionHead } from "@/components/SectionHead";
import { TourPicture } from "@/components/TourPicture";
import type { Block } from "@/lib/content";
import { teaserShots } from "@/lib/tour";

/** Home page strip: four photos from /tour/ and a link to it. Copy: content/home.md, section tour-teaser. */
export function TourTeaser({ copy }: { copy: Block }) {
  const shots = teaserShots();
  return (
    <section className="bg-sand section-y lg:pb-32 xl:pb-40" aria-labelledby="tour-h">
      <div className="container-x">
        <SectionHead eyebrow={copy.eyebrow} title={copy.h2} id="tour-h">
          <p>{copy.paras[0]}</p>
        </SectionHead>
        <ul className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5 xl:mt-12">
          {shots.map((s, i) => (
            <Reveal as="li" key={s.key} i={i}>
              <div className="aspect-[4/5] overflow-hidden rounded-r-md border border-stone bg-cream shadow-card [&>picture]:block [&>picture]:h-full">
                <TourPicture shot={s} sizes="(min-width: 1280px) 270px, (min-width: 1024px) 22vw, 50vw" className="h-full w-full object-cover" />
              </div>
            </Reveal>
          ))}
        </ul>
        {copy.actions[0] && (
          <div className="mt-8">
            <ActionView action={copy.actions[0]} variant="secondary" />
          </div>
        )}
      </div>
    </section>
  );
}
