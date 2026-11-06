"use client";

import { useCallback, useState } from "react";
import { Lightbox } from "@/components/Lightbox";
import { Reveal } from "@/components/Reveal";
import { SectionHead } from "@/components/SectionHead";
import { TourPicture } from "@/components/TourPicture";
import { TOUR_SHOTS, TOUR_ZONES, type TourShot } from "@/lib/tour";

// Only this part of /tour/ needs state (which photo is open); the page around it stays a server component.
// One lightbox walks the whole tour, not one zone: keep stepping and you reach the last photo.

const unitsOf = (shots: TourShot[]) => shots.reduce((n, s) => n + (s.orientation === "landscape" ? 2 : 1), 0);
/** Columns from lg up, chosen so every row is filled: 4 normally, 3 for three portraits, 2 for a pair. */
const LG_COLS: Record<number, string> = { 2: "lg:w-1/2 lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4" };

function Thumb({ shot, index, sizes, eager, onOpen }: { shot: TourShot; index: number; sizes: string; eager: boolean; onOpen: (i: number) => void }) {
  const ratio = shot.orientation === "landscape" ? "aspect-[16/10]" : "aspect-[3/4]";
  return (
    <figure>
      <button
        type="button"
        onClick={() => onOpen(index)}
        aria-label={`Open ${shot.caption.replace(/\.$/, "")} full screen`}
        className={`group block w-full cursor-zoom-in overflow-hidden rounded-r-md border border-stone bg-sand shadow-card [&>picture]:block [&>picture]:h-full ${ratio}`}
      >
        <TourPicture shot={shot} sizes={sizes} eager={eager} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
      </button>
      <figcaption className="mt-2 text-sm text-ink-2">{shot.caption}</figcaption>
    </figure>
  );
}

export function TourGallery() {
  const [openAt, setOpenAt] = useState<number | null>(null);
  const close = useCallback(() => setOpenAt(null), []);
  const indexOf = (shot: TourShot) => TOUR_SHOTS.findIndex((s) => s.key === shot.key);

  return (
    <>
      <div className="space-y-14 xl:space-y-20">
        {TOUR_ZONES.map((z, zi) => {
          const headId = `zone-${z.id}`;
          const single = z.shots.length === 1 ? z.shots[0] : null;
          if (single) {
            const portrait = single.orientation === "portrait";
            const textFirst = zi % 2 === 0;
            return (
              <section key={z.id} aria-labelledby={headId} className="container-x">
                <div className="grid items-center gap-6 lg:grid-cols-12 lg:gap-12">
                  <div className={`lg:col-span-5 ${textFirst ? "" : "lg:order-2"}`}>
                    <SectionHead eyebrow={z.kicker} title={z.title} id={headId}>
                      <p>{z.intro}</p>
                    </SectionHead>
                  </div>
                  <Reveal className={`${portrait ? "mx-auto w-full max-w-sm lg:col-span-5 lg:col-start-8" : "lg:col-span-7"} ${textFirst ? "" : "lg:order-1"}`}>
                    <ul>
                      <li>
                        <Thumb
                          shot={single}
                          index={indexOf(single)}
                          sizes={portrait ? "(max-width: 1024px) 384px, 420px" : "(max-width: 1024px) 100vw, 640px"}
                          eager={zi === 0}
                          onOpen={setOpenAt}
                        />
                      </li>
                    </ul>
                  </Reveal>
                </div>
              </section>
            );
          }
          const cols = LG_COLS[Math.min(unitsOf(z.shots), 4)] ?? LG_COLS[4];
          return (
            <section key={z.id} aria-labelledby={headId} className="container-x">
              <SectionHead eyebrow={z.kicker} title={z.title} id={headId}>
                <p>{z.intro}</p>
              </SectionHead>
              <ul className={`mt-8 grid gap-4 sm:grid-cols-2 lg:gap-5 ${cols}`}>
                {z.shots.map((s, si) => (
                  <Reveal as="li" key={s.key} i={si} className={s.orientation === "landscape" ? "sm:col-span-2" : undefined}>
                    <Thumb
                      shot={s}
                      index={indexOf(s)}
                      sizes={s.orientation === "landscape" ? "(max-width: 1024px) 100vw, 560px" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px"}
                      eager={false}
                      onOpen={setOpenAt}
                    />
                  </Reveal>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      <Lightbox shots={TOUR_SHOTS} openAt={openAt} onClose={close} />
    </>
  );
}
