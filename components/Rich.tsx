import type { ReactNode } from "react";
import { WaLink } from "@/components/Button";
import { fill, type Ctx } from "@/lib/content";
import { MSG, TAG, telHref } from "@/lib/whatsapp";
import { SITE } from "@/lib/site";

const TOKEN = /(\{\{phone_display\}\}|\{\{email\}\}|\*[^*\n]+\*)/;

/**
 * Inline copy: fills placeholders, renders *emphasis* as italics, turns the
 * phone number into a tel: link (or, in "message 07903 653786", a WhatsApp
 * link) and the email into a mailto: link.
 */
export function Rich({ text, ctx }: { text: string; ctx?: Ctx }) {
  const parts = text.split(TOKEN);
  const out: ReactNode[] = [];
  let before = "";
  parts.forEach((p, i) => {
    if (p === "{{phone_display}}") {
      if (/message $/i.test(before)) {
        out.push(
          <WaLink key={i} message={MSG.question} tag={TAG.question} className="link">
            {SITE.phoneDisplay}
          </WaLink>,
        );
      } else {
        out.push(
          <a key={i} href={telHref} className="link whitespace-nowrap">
            {SITE.phoneDisplay}
          </a>,
        );
      }
    } else if (p === "{{email}}") {
      out.push(
        <a key={i} href={`mailto:${SITE.email}`} className="link break-all">
          {SITE.email}
        </a>,
      );
    } else if (p.startsWith("*") && p.endsWith("*") && p.length > 2) {
      out.push(<em key={i}>{fill(p.slice(1, -1), ctx)}</em>);
    } else {
      out.push(fill(p, ctx));
    }
    before += p;
  });
  return <>{out}</>;
}

/** A run of paragraphs from the copy files. */
export function Paras({ items, ctx, className = "" }: { items: string[]; ctx?: Ctx; className?: string }) {
  return (
    <>
      {items.map((p, i) => (
        <p key={i} className={className}>
          <Rich text={p} ctx={ctx} />
        </p>
      ))}
    </>
  );
}
