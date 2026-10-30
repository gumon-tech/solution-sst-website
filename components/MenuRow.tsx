import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Img } from "@/components/Img";
import { OptionButtons } from "@/components/OptionButtons";
import { Rich } from "@/components/Rich";
import type { Treatment } from "@/lib/services";
import { imageFor } from "@/lib/treatment-content";
import { TAG } from "@/lib/whatsapp";

/** One treatment on the menu: thumbnail, name, one line, an option button per length. */
export function MenuRow({ t, card, aboutLabel, terms }: { t: Treatment; card: string; aboutLabel: string; terms: string }) {
  const img = imageFor(t.slug);
  return (
    <div className="grid grid-cols-[88px_1fr] gap-x-4 gap-y-4 border-b border-stone py-6 lg:grid-cols-[160px_1fr_340px] lg:items-start lg:gap-x-8 lg:py-8">
      <div className="overflow-hidden rounded-r-md bg-sand">
        <Img k={img.key} alt={img.alt} sizes="(min-width:1024px) 160px, 88px" className="aspect-square h-full w-full object-cover" />
      </div>
      <div className="min-w-0">
        <h3 className="t-h3">
          <Link href={`/treatments/${t.slug}/`} className="hover:text-plum-mid">
            {t.name}
          </Link>
        </h3>
        <p className="mt-1 text-ink-2">{card}</p>
        <Link
          href={`/treatments/${t.slug}/`}
          className="link mt-1 hidden min-h-[44px] items-center gap-1 lg:inline-flex"
        >
          {aboutLabel}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
      <div className="col-span-2 lg:col-span-1 lg:col-start-3">
        <OptionButtons treatment={t} tag={TAG.menu} />
        <p className="mt-3 text-sm text-ink-2">
          <Rich text={terms} />
        </p>
        <Link href={`/treatments/${t.slug}/`} className="link mt-1 inline-flex min-h-[44px] items-center gap-1 lg:hidden">
          {aboutLabel}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
