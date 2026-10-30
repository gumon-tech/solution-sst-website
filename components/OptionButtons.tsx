import { buildWhatsAppLink, MSG } from "@/lib/whatsapp";
import { formatPrice, type Treatment } from "@/lib/services";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

/**
 * One button per length for a treatment: "1 hour · £59". The label and the
 * message both come from services.json, so a price or a length is never typed.
 */
export function OptionButtons({ treatment, tag, className = "" }: { treatment: Treatment; tag: string; className?: string }) {
  return (
    <ul className={`flex flex-col gap-2 ${className}`}>
      {treatment.rows.map((r) => (
        <li key={r.option}>
          <a
            href={buildWhatsAppLink(MSG.serviceOption(r.name, r.option), tag)}
            target="_blank"
            rel="noopener"
            className="opt"
          >
            <WhatsAppIcon size={18} className="shrink-0 text-gold-pale" />
            <span className="flex-1">
              {r.option} · <span className="opt-price inline-block">£{formatPrice(r.price_gbp)}</span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
