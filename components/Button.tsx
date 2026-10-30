import Link from "next/link";
import type { ReactNode } from "react";
import { clsx } from "clsx";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export type Variant =
  | "primary"
  | "secondary"
  | "ghost"
  | "light"
  | "heroPrimary"
  | "heroGhost";

const VARIANT: Record<Variant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  light: "btn-light",
  // On the dark photo overlay at phone width, then the normal buttons from lg up.
  heroPrimary: "bg-cream text-plum lg:bg-plum lg:text-cream lg:hover:bg-plum-mid",
  heroGhost:
    "border-[1.5px] border-gold-pale text-gold-pale lg:border-plum lg:text-plum lg:hover:bg-plum-tint",
};

export function variantFor(name?: string): Variant {
  if (!name) return "primary";
  if (name.startsWith("ghost")) return "ghost";
  if (name.startsWith("secondary")) return "secondary";
  return "primary";
}

interface WaProps {
  message: string;
  tag: string;
  variant?: Variant;
  className?: string;
  glyph?: boolean;
  /** Longer accessible name when several identical buttons sit on one page; must start with the visible label. */
  ariaLabel?: string;
  children: ReactNode;
}

/** A WhatsApp booking button. Every wa.me link on the site comes through here. */
export function WaButton({ message, tag, variant = "primary", className, glyph = true, ariaLabel, children }: WaProps) {
  return (
    <a
      href={buildWhatsAppLink(message, tag)}
      target="_blank"
      rel="noopener"
      aria-label={ariaLabel}
      className={clsx("btn", VARIANT[variant], className)}
    >
      {glyph && <WhatsAppIcon className="btn-glyph shrink-0" size={20} />}
      <span>{children}</span>
    </a>
  );
}

/** A text link that opens WhatsApp (used for the number on /visit/ and in the footer). */
export function WaLink({
  message,
  tag,
  className,
  children,
}: {
  message: string;
  tag: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a href={buildWhatsAppLink(message, tag)} target="_blank" rel="noopener" className={className}>
      {children}
    </a>
  );
}

export function LinkButton({
  href,
  variant = "secondary",
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  const cls = clsx("btn", VARIANT[variant], className);
  if (/^https?:/.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener" className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

export function TextLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const cls = clsx("link inline-flex min-h-[44px] items-center", className);
  if (/^https?:/.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener" className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}
