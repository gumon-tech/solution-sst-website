import type { Action } from "@/lib/content";
import { fill, type Ctx } from "@/lib/content";
import { LinkButton, TextLink, WaButton, WaLink, variantFor, type Variant } from "@/components/Button";
import { messageForTag } from "@/lib/whatsapp";

/** Renders an action line from the copy files: a WhatsApp button, a page button or a text link. */
export function ActionView({
  action,
  name,
  ctx,
  variant,
  className,
}: {
  action: Action;
  /** Treatment name for tag Q on a treatment page. */
  name?: string;
  ctx?: Ctx;
  variant?: Variant;
  className?: string;
}) {
  const label = fill(action.label, ctx);
  const href = action.href ? fill(action.href, ctx) : undefined;
  if (action.kind === "button") {
    const v = variant ?? variantFor(action.variant);
    if (href) {
      return (
        <LinkButton href={href} variant={v} className={className}>
          {label}
        </LinkButton>
      );
    }
    return (
      <WaButton message={messageForTag(action.tag ?? "T", name)} tag={action.tag ?? "T"} variant={v} className={className}>
        {label}
      </WaButton>
    );
  }
  if (href) {
    return (
      <TextLink href={href} className={className}>
        {label}
      </TextLink>
    );
  }
  return (
    <WaLink
      message={messageForTag(action.tag ?? "Q", name)}
      tag={action.tag ?? "Q"}
      className={`link inline-flex min-h-[44px] items-center ${className ?? ""}`}
    >
      {label}
    </WaLink>
  );
}
