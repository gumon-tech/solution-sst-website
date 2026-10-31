"use client";

import { useEffect, useState } from "react";
import { WaButton } from "@/components/Button";
import { isShownOn, londonDay, type Promotion } from "@/lib/promotions";
import { TAG } from "@/lib/whatsapp";

export interface PromoCopy {
  eyebrow: string;
  title: string;
  validUntil: string;
  button: string;
}

/**
 * Home-page offers, anchor #promotions. `promos` are the ones live on the build day. After the page
 * loads the browser drops any offer whose last day has passed since the build, so an expired offer
 * leaves the screen without a redeploy. With nothing to show the section is not rendered at all.
 */
export function PromoCards({ promos, buildDay, copy }: { promos: Promotion[]; buildDay: string; copy: PromoCopy }) {
  const [day, setDay] = useState(buildDay);
  useEffect(() => {
    setDay(londonDay());
  }, []);
  const shown = promos.filter((p) => isShownOn(p, day));
  if (shown.length === 0) return null;
  return (
    <section id="promotions" className="scroll-mt-24 bg-sand section-y" aria-labelledby="promos-h">
      <div className="container-x">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h2 id="promos-h" className="t-h2 mt-3">
          {copy.title}
        </h2>
        <ul className="mt-8 grid gap-4 md:grid-cols-2 xl:gap-6">
          {shown.map((p) => (
            <li key={p.code} data-promo={p.code}>
              <article className="card flex h-full flex-col p-6">
                {p.eyebrow && <p className="eyebrow">{p.eyebrow}</p>}
                <h3 className="t-h3 mt-2">{p.title}</h3>
                <p className="mt-3 text-ink-2">{p.detail}</p>
                {p.points.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {p.points.map((pt) => (
                      <li key={pt} className="rounded-r-sm bg-plum-tint px-3 py-1 text-sm font-medium text-plum">
                        {pt}
                      </li>
                    ))}
                  </ul>
                )}
                {p.offer && <p className="mt-3 text-sm text-ink-2">{p.offer}</p>}
                <p className="mt-3 text-sm font-semibold text-gold-deep">
                  {copy.validUntil} {p.ends_label}
                </p>
                <div className="mt-auto pt-4">
                  <WaButton message={p.message} tag={TAG.offer} ariaLabel={`${copy.button}: ${p.title}`}>
                    {copy.button}
                  </WaButton>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
