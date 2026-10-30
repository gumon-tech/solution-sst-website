"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export interface AccItem {
  q: string;
  a: ReactNode;
}

/**
 * Question buttons with answer panels. Panels stay in the DOM (closed ones are
 * visibility:hidden) so the text is always in the page. `openFirstOnDesktop`
 * opens the first item at 1280px and up, as the layout spec asks.
 */
export function Accordion({ items, openFirstOnDesktop = false }: { items: AccItem[]; openFirstOnDesktop?: boolean }) {
  const base = useId();
  const [open, setOpen] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (openFirstOnDesktop && window.matchMedia("(min-width: 1280px)").matches) {
      setOpen(new Set([0]));
    }
  }, [openFirstOnDesktop]);

  const toggle = (i: number) =>
    setOpen((prev) => {
      const n = new Set(prev);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });

  return (
    <div className="divide-y divide-stone rounded-r-md border border-stone bg-cream">
      {items.map((it, i) => {
        const isOpen = open.has(i);
        const bid = `${base}-b-${i}`;
        const pid = `${base}-p-${i}`;
        return (
          <div key={it.q} className={isOpen ? "bg-plum-tint" : ""}>
            <h3 className="m-0">
              <button
                id={bid}
                type="button"
                aria-expanded={isOpen}
                aria-controls={pid}
                onClick={() => toggle(i)}
                className="flex min-h-[56px] w-full items-center justify-between gap-4 px-4 py-3 text-left font-display text-[20px] font-semibold leading-snug text-plum md:px-6 xl:text-[22px]"
              >
                <span>{it.q}</span>
                <ChevronDown className="acc-chev shrink-0" size={22} aria-hidden="true" />
              </button>
            </h3>
            <div id={pid} role="region" aria-labelledby={bid} className="acc-panel" data-open={isOpen}>
              <div className="overflow-hidden">
                <div className="prose-sst px-4 pb-5 pt-1 md:px-6">{it.a}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
