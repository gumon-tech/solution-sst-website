import Link from "next/link";
import { Img } from "@/components/Img";
import { WaButton } from "@/components/Button";
import { imageFor } from "@/lib/treatment-content";
import { formatPrice, type Treatment } from "@/lib/services";
import { MSG, TAG } from "@/lib/whatsapp";

/** Home-page treatment card: image, name, card line, option chips, from-price, Details + Book (tag H). */
export function TreatmentCard({ t, card, details, book }: { t: Treatment; card: string; details: string; book: string }) {
  const img = imageFor(t.slug);
  return (
    <article className="card lift flex h-full flex-col overflow-hidden">
      <div className="zoom aspect-[4/3] overflow-hidden bg-sand">
        <Img k={img.key} alt={img.alt} sizes="(min-width:1024px) 380px, 78vw" className="h-full w-full object-cover" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="t-h3">
          <Link href={`/treatments/${t.slug}/`}>{t.name}</Link>
        </h3>
        <p className="mt-2 text-ink-2">{card}</p>
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Lengths">
          {t.rows.map((r) => (
            <li key={r.option} className="rounded-r-sm bg-plum-tint px-3 py-1 text-sm font-medium text-plum">
              {r.option}
            </li>
          ))}
        </ul>
        <p className="mt-4 font-semibold text-gold-deep">from £{formatPrice(t.fromPrice)}</p>
        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          <Link href={`/treatments/${t.slug}/`} className="btn btn-secondary flex-1">
            {details}
          </Link>
          <WaButton message={MSG.service(t.name)} tag={TAG.card} className="flex-1" ariaLabel={`${book} ${t.name}`}>
            {book}
          </WaButton>
        </div>
      </div>
    </article>
  );
}
