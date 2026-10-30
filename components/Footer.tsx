import Link from "next/link";
import { Phone } from "lucide-react";
import { Ornament } from "@/components/Ornament";
import { WaLink } from "@/components/Button";
import { fill } from "@/lib/content";
import { SITE, hoursCompact } from "@/lib/site";
import { MSG, TAG, telHref } from "@/lib/whatsapp";
import { sharedCopy } from "@/lib/shared";

const PAGE_HREF: Record<string, string> = {
  Treatments: "/treatments/",
  About: "/about/",
  "Gift Vouchers": "/gift-vouchers/",
  Visit: "/visit/",
  FAQ: "/faq/",
  Privacy: "/privacy/",
};

/** The legal line with SITE.builtBy linked to the builder's site; plain text if the copy no longer names it. */
function LegalLine({ text }: { text: string }) {
  const at = text.indexOf(SITE.builtBy);
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <a href={SITE.builtByUrl} target="_blank" rel="noopener" className="link">
        {SITE.builtBy}
      </a>
      {text.slice(at + SITE.builtBy.length)}
    </>
  );
}

export function Footer() {
  const c = sharedCopy();
  const f = c.footer;
  return (
    <footer className="on-plum bg-plum-deep text-cream">
      <div className="container-x py-14 xl:py-20">
        <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cream">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo/logo-160h.png" width={114} height={160} alt="" aria-hidden="true" loading="lazy" className="h-10 w-auto" />
            </div>
            <p className="mt-4 font-display text-2xl font-semibold">{f.name}</p>
            <p className="mt-2 max-w-xs text-gold-pale">{f.blurb}</p>
          </div>

          <div>
            <h2 className="eyebrow">{f.visitHeading}</h2>
            <address className="mt-3 not-italic">{SITE.address}</address>
            <a href={SITE.mapsUrl} target="_blank" rel="noopener" className="link mt-1 inline-flex min-h-[44px] items-center">
              {f.directions}
            </a>
            <p className="mt-2 text-gold-pale">
              {hoursCompact().map((h) => (
                <span key={h} className="block">
                  {h}
                </span>
              ))}
            </p>
          </div>

          <div>
            <h2 className="eyebrow">{f.contactHeading}</h2>
            <div className="mt-3 flex items-center gap-2">
              <WaLink message={MSG.book} tag={TAG.footer} className="link inline-flex min-h-[44px] items-center text-lg">
                <span className="sr-only">WhatsApp </span>
                {SITE.phoneDisplay}
              </WaLink>
              <a
                href={telHref}
                aria-label={`Call ${SITE.phoneDisplay}`}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gold-pale/60 text-gold-pale hover:bg-gold-pale hover:text-plum-deep"
              >
                <Phone size={18} aria-hidden="true" />
              </a>
            </div>
            <p className="mt-1 max-w-xs text-sm text-gold-pale">{f.phoneLine}</p>
            <a href={`mailto:${SITE.email}`} className="link mt-3 inline-flex min-h-[44px] items-center break-all">
              {SITE.email}
            </a>
            <a href={SITE.mapsUrl} target="_blank" rel="noopener" className="link inline-flex min-h-[44px] items-center">
              {f.reviews}
            </a>
          </div>

          <nav aria-label="Footer">
            <h2 className="sr-only">Pages</h2>
            <ul className="md:mt-0">
              {f.pages.map((p) => (
                <li key={p}>
                  <Link href={PAGE_HREF[p] ?? "/"} className="inline-flex min-h-[44px] items-center text-cream hover:text-gold-pale">
                    {p}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 border-t border-gold-pale/20 pt-8">
          <Ornament tone="pale" />
          <p className="text-center text-sm text-gold-pale">
            <LegalLine text={fill(f.legal)} />
          </p>
        </div>
      </div>
    </footer>
  );
}
