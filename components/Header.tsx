import Link from "next/link";
import { WaButton } from "@/components/Button";
import { MobileMenu } from "@/components/MobileMenu";
import { sharedCopy } from "@/lib/shared";
import { fill } from "@/lib/content";
import { MSG, TAG, buildWhatsAppLink } from "@/lib/whatsapp";

export function Header() {
  const c = sharedCopy();
  return (
    <header className="sticky top-0 z-50 border-b border-stone bg-cream">
      <div className="container-x flex h-16 items-center justify-between gap-3 xl:h-20">
        <Link href="/" className="flex min-h-[44px] items-center gap-2.5" aria-label={`${c.wordmark1} ${c.wordmark2}, home`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo/logo-96h.webp"
            width={69}
            height={96}
            alt=""
            aria-hidden="true"
            className="h-10 w-auto xl:h-12"
          />
          <span className="flex flex-col leading-none">
            <span className="font-display text-[22px] font-semibold text-plum">{c.wordmark1}</span>
            <span className="mt-1 hidden text-[11px] font-medium uppercase tracking-[0.2em] text-ink-2 sm:block">
              {c.wordmark2}
            </span>
          </span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {c.nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="inline-flex min-h-[44px] items-center rounded-full px-4 font-medium text-ink hover:text-plum-mid"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <WaButton message={MSG.book} tag={TAG.header} className="!px-4 lg:!px-[22px]">
            <span aria-hidden="true" className="lg:hidden">
              Book
            </span>
            <span className="sr-only lg:not-sr-only">{c.bookLabel}</span>
          </WaButton>
          <MobileMenu
            nav={c.nav}
            hours={fill("{{hours_sentence}}")}
            menuLabel={c.menuLabel}
            bookLabel={c.bookLabel}
            bookHref={buildWhatsAppLink(MSG.book, TAG.header)}
          />
        </div>
      </div>
    </header>
  );
}
