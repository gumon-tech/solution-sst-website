"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { TourPicture } from "@/components/TourPicture";
import type { TourShot } from "@/lib/tour";

const SWIPE_PX = 44;
const FOCUSABLE = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

/**
 * Full-screen viewer for the tour photos. A modal dialog: Escape and a click on the backdrop close it, the arrow keys and the
 * on-screen buttons step (wrapping), a horizontal swipe of 44px or more steps on touch screens, Tab stays inside it, page scrolling
 * is locked while it is open (the previous overflow is restored), and focus goes back to the thumbnail that opened it.
 */
export function Lightbox({ shots, openAt, onClose }: { shots: TourShot[]; openAt: number | null; onClose: () => void }) {
  const open = openAt !== null;
  const [index, setIndex] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const imgId = useId();
  const count = shots.length;

  useEffect(() => {
    if (openAt !== null) setIndex(openAt);
  }, [openAt]);

  const step = useCallback((d: number) => setIndex((i) => (i + d + count) % count), [count]);

  // Scroll lock, initial focus and focus return.
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, [open]);

  // Keyboard: Escape, arrows, and a Tab trap.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
      } else if (e.key === "Tab") {
        const nodes = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
        if (nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        const active = document.activeElement;
        if (!dialogRef.current?.contains(active)) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, step]);

  if (!open) return null;
  const shot = shots[index];

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={imgId}
      className="lb-fade fixed inset-0 z-[100] flex flex-col bg-plum-deep/95 text-cream"
      onTouchStart={(e) => {
        const t = e.touches[0];
        touchStart.current = { x: t.clientX, y: t.clientY };
      }}
      onTouchEnd={(e) => {
        const s = touchStart.current;
        touchStart.current = null;
        if (!s) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - s.x;
        if (Math.abs(dx) >= SWIPE_PX && Math.abs(dx) > Math.abs(t.clientY - s.y)) step(dx < 0 ? 1 : -1);
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        <p aria-live="polite" aria-atomic="true" className="font-body text-sm font-semibold tabular-nums">
          {index + 1} / {count}
        </p>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close full screen view"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-gold-pale/60 text-gold-pale hover:bg-cream/10"
        >
          <X size={22} aria-hidden="true" />
        </button>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-14 md:px-24"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label="Previous photo"
          className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gold-pale/60 text-gold-pale hover:bg-cream/10 md:left-6"
        >
          <ChevronLeft size={24} aria-hidden="true" />
        </button>
        <div
          className="flex h-full w-full items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <TourPicture key={shot.key} shot={shot} id={imgId} sizes="(min-width: 1024px) 80vw, 100vw" eager className="block h-auto max-h-[calc(100dvh-10rem)] w-auto max-w-full rounded-r-md object-contain" />
        </div>
        <button
          type="button"
          onClick={() => step(1)}
          aria-label="Next photo"
          className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gold-pale/60 text-gold-pale hover:bg-cream/10 md:right-6"
        >
          <ChevronRight size={24} aria-hidden="true" />
        </button>
      </div>

      <p className="px-4 py-4 text-center text-sm md:px-6">{shot.caption}</p>
    </div>
  );
}
