import type { Metadata } from "next";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { ActionView } from "@/components/Actions";
import { WaLink } from "@/components/Button";
import { ClosingBand } from "@/components/ClosingBand";
import { CompactHero } from "@/components/CompactHero";
import { HoursTable } from "@/components/HoursTable";
import { Img } from "@/components/Img";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/Reveal";
import { Rich } from "@/components/Rich";
import { SectionHead } from "@/components/SectionHead";
import { fmString, loadDoc, section } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { breadcrumbLd, businessLd } from "@/lib/structured-data";
import { MSG, TAG, telHref } from "@/lib/whatsapp";

const doc = loadDoc("visit.md");

export const metadata: Metadata = pageMetadata({
  title: fmString(doc, "title"),
  description: fmString(doc, "description"),
  path: "/visit/",
});

/** "WhatsApp: {{phone_display}} (link, tag C) — Message us…" -> the part after the dash. */
function afterDash(s: string): string {
  const i = s.indexOf(" — ");
  return i === -1 ? "" : s.slice(i + 3).trim();
}

export default function VisitPage() {
  const hero = section(doc, "hero");
  const hc = section(doc, "hours-and-contact");
  const here = section(doc, "getting-here");
  const before = section(doc, "before-you-come");

  const [hoursSub, contactSub] = hc.subs;
  const waDesc = afterDash(contactSub.bullets.find((b) => b.startsWith("WhatsApp:")) ?? "");
  const phoneDesc = afterDash(contactSub.bullets.find((b) => b.startsWith("Phone:")) ?? "");
  const lineUnder = here.paras.find((p) => p.startsWith("Line under the cards:"))?.replace("Line under the cards:", "").trim();
  const directions = hero.actions.find((a) => a.href);
  const book = hero.actions.find((a) => a.tag === "C");
  const reviews = contactSub.actions[0];

  return (
    <>
      <JsonLd data={businessLd()} />
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Visit", path: "/visit/" }])} />

      <CompactHero eyebrow={hero.eyebrow} h1={hero.h1} lead={<Rich text={hero.lead ?? ""} />}>
        <address className="mt-6 text-lg not-italic text-ink">{SITE.address}</address>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {directions && <ActionView action={directions} variant="secondary" />}
          {book && <ActionView action={book} variant="primary" />}
        </div>
      </CompactHero>

      <section className="pb-12 pt-6 xl:pb-20" aria-label="Opening hours and contact">
        <div className="container-x grid gap-6 lg:grid-cols-2 lg:gap-8">
          <Reveal className="card p-6 xl:p-8">
            <h2 className="t-h3">{hoursSub.h3}</h2>
            <HoursTable className="mt-3" />
            {hc.small && <p className="mt-4 text-sm text-ink-2">{hc.small}</p>}
          </Reveal>
          <Reveal i={1} className="card p-6 xl:p-8">
            <h2 className="t-h3">{contactSub.h3}</h2>
            <ul className="mt-4 space-y-4">
              <li className="flex gap-3">
                <MessageCircle size={22} className="mt-1 shrink-0 text-gold-deep" aria-hidden="true" />
                <div>
                  <WaLink message={MSG.book} tag={TAG.visit} className="link inline-flex min-h-[44px] items-center text-lg">
                    {SITE.phoneDisplay}
                  </WaLink>
                  <p className="text-ink-2">{waDesc}</p>
                </div>
              </li>
              <li className="flex gap-3">
                <Phone size={22} className="mt-1 shrink-0 text-gold-deep" aria-hidden="true" />
                <div>
                  <a href={telHref} className="link inline-flex min-h-[44px] items-center text-lg">
                    {SITE.phoneDisplay}
                  </a>
                  <p className="text-ink-2">{phoneDesc}</p>
                </div>
              </li>
              <li className="flex gap-3">
                <Mail size={22} className="mt-1 shrink-0 text-gold-deep" aria-hidden="true" />
                <div>
                  <a href={`mailto:${SITE.email}`} className="link inline-flex min-h-[44px] items-center break-all">
                    {SITE.email}
                  </a>
                </div>
              </li>
            </ul>
            {reviews && (
              <p className="mt-2">
                <ActionView action={reviews} />
              </p>
            )}
          </Reveal>
        </div>
      </section>

      <section className="bg-sand section-y" aria-labelledby="here-h">
        <div className="container-x">
          <SectionHead eyebrow={here.eyebrow} title={here.h2} id="here-h" />
          <div className="mt-8 grid gap-4 lg:grid-cols-3 lg:gap-6 xl:mt-12">
            {here.subs.map((s, i) => (
              <Reveal key={s.h3} i={i} className="card p-6">
                <h3 className="t-h3">{s.h3}</h3>
                <p className="mt-2">{s.paras[0]}</p>
              </Reveal>
            ))}
          </div>
          {lineUnder && <p className="mt-6 max-w-2xl">{lineUnder}</p>}
          {here.actions[0] && (
            <p className="mt-2">
              <ActionView action={here.actions[0]} />
            </p>
          )}
        </div>
      </section>

      <section className="section-y" aria-label="The room">
        <div className="container-x">
          <div className="overflow-hidden rounded-r-frame shadow-card">
            <Img k="room-pink-curtains" sizes="(min-width:1280px) 1104px, 100vw" className="aspect-[1600/700] w-full object-cover" />
          </div>
        </div>
      </section>

      <section className="bg-sand section-y" aria-labelledby="before-h">
        <div className="container-x">
          <SectionHead eyebrow={before.eyebrow} title={before.h2} id="before-h" />
          <div className="mt-8 grid gap-4 lg:grid-cols-3 lg:gap-6 xl:mt-12">
            {before.subs.map((s, i) => (
              <Reveal key={s.h3} i={i} className="card p-6">
                <h3 className="t-h3">{s.h3}</h3>
                <p className="mt-2">
                  <Rich text={s.paras[0]} />
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <ClosingBand />
    </>
  );
}

