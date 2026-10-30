"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import type { NavItem } from "@/lib/shared";

/** Phone-width navigation: a 44px Menu button and a full-screen plum overlay. */
export function MobileMenu({
  nav,
  hours,
  menuLabel,
  bookLabel,
  bookHref,
}: {
  nav: NavItem[];
  hours: string;
  menuLabel: string;
  bookLabel: string;
  bookHref: string;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    btnRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key !== "Tab" || !overlayRef.current) return;
      const f = overlayRef.current.querySelectorAll<HTMLElement>("a[href], button");
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return (
    <div className="lg:hidden">
      <button
        ref={btnRef}
        type="button"
        className="btn btn-secondary !px-4"
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen(true)}
      >
        <Menu size={20} aria-hidden="true" />
        <span aria-hidden="true">{menuLabel}</span>
      </button>
      {open && (
        <div
          id="mobile-menu"
          ref={overlayRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="menu-overlay on-plum fixed inset-0 z-50 flex flex-col bg-plum px-4 pb-8 pt-4"
        >
          <div className="flex justify-end">
            <button ref={closeRef} type="button" className="btn btn-ghost !px-4" aria-label="Close menu" onClick={close}>
              <X size={20} aria-hidden="true" />
              <span aria-hidden="true">{menuLabel}</span>
            </button>
          </div>
          <ul className="mt-6 flex flex-col">
            {nav.map((n, i) => (
              <li key={n.href} style={{ "--i": i } as React.CSSProperties} className="border-b border-gold-pale/20">
                <Link
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-[56px] items-center font-display text-[32px] font-semibold text-cream"
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-8">
            <a href={bookHref} target="_blank" rel="noopener" className="btn btn-light w-full">
              <WhatsAppIcon size={20} className="shrink-0 text-whatsapp" />
              <span>{bookLabel}</span>
            </a>
            <p className="mt-5 text-center text-gold-pale">{hours}</p>
          </div>
        </div>
      )}
    </div>
  );
}
