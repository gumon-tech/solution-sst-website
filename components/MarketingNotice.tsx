"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useSyncExternalStore } from "react";
import { insertOptOut, removeOptOut } from "@/lib/whatsapp";

/**
 * UK soft opt-in notice (PECR reg 22) under the booking buttons, with the opt-out tickbox.
 *
 * The site has no booking form: every booking button is a wa.me link with a pre-filled message, so the opt-out
 * travels inside the message: ticking the box puts OPT_OUT_TEXT (lib/whatsapp.ts) before the final " [web-...]"
 * tag of every wa.me link on the page; unticking takes it out again. Unticked, the message is exactly what it
 * was before. Register note: DIRECTION.md section 8; the bot-facing format: README "Marketing opt-out".
 *
 * The answer lives only in this module's memory (like components/AdSource.tsx): no cookie, no localStorage or
 * sessionStorage, nothing sent anywhere. Every notice on the page shows the same state, and it lasts through
 * the site's own page changes (next/link) and ends on a full reload. The box is never pre-ticked.
 * Without JavaScript the sentence is in the page and the box is disabled (nothing can be sent then).
 */
let optedOut = false;
const listeners = new Set<() => void>();

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
const getState = () => optedOut;
const getServerState = () => false;
const noSubscribe = () => () => {};

function retag(a: HTMLAnchorElement, want: boolean) {
  let u: URL;
  try {
    u = new URL(a.href);
  } catch {
    return;
  }
  if (u.hostname !== "wa.me") return;
  const text = u.searchParams.get("text");
  if (!text) return;
  const next = want ? insertOptOut(text) : removeOptOut(text);
  if (next === text) return;
  // Same encoding as buildWhatsAppLink (encodeURIComponent, not form encoding).
  a.href = `https://wa.me${u.pathname}?text=${encodeURIComponent(next)}`;
}

function retagAll() {
  document.querySelectorAll<HTMLAnchorElement>('a[href^="https://wa.me/"]').forEach((a) => retag(a, optedOut));
}

function setOptedOut(v: boolean) {
  if (v === optedOut) return;
  optedOut = v;
  retagAll();
  listeners.forEach((fn) => fn());
}

/** Mounted once in app/layout.tsx: keeps links that appear later (sticky bar, menus, new pages) in step with the box. */
export function MarketingOptOutSync() {
  const pathname = usePathname();

  useEffect(() => {
    // Buttons that appear later are caught when they are used.
    const onActivate = (e: Event) => {
      if (!optedOut) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (a instanceof HTMLAnchorElement) retag(a, true);
    };
    document.addEventListener("click", onActivate, true);
    document.addEventListener("auxclick", onActivate, true);
    document.addEventListener("contextmenu", onActivate, true);
    return () => {
      document.removeEventListener("click", onActivate, true);
      document.removeEventListener("auxclick", onActivate, true);
      document.removeEventListener("contextmenu", onActivate, true);
    };
  }, []);

  // Every page the visit reaches: bring its buttons in step.
  useEffect(() => {
    if (optedOut) retagAll();
  }, [pathname]);

  return null;
}

export function MarketingNotice({
  sentence,
  label,
  tone = "light",
  className = "",
}: {
  sentence: string;
  label: string;
  /** "plum" on the dark plum band (cream text); the text is always the normal text colour of its surface. */
  tone?: "light" | "plum";
  className?: string;
}) {
  const id = useId();
  const checked = useSyncExternalStore(subscribe, getState, getServerState);
  const ready = useSyncExternalStore(noSubscribe, () => true, () => false);
  const ink = tone === "plum" ? "text-cream" : "text-ink";
  return (
    <div className={`max-w-xl ${ink} ${className}`} data-marketing-notice="">
      <p>{sentence}</p>
      <div className="mt-1 flex items-center">
        <label htmlFor={id} className="-ml-3 flex min-h-[44px] cursor-pointer items-center gap-3 py-1 pl-3 pr-2">
          <input
            id={id}
            type="checkbox"
            checked={checked}
            disabled={!ready}
            onChange={(e) => setOptedOut(e.target.checked)}
            className="h-6 w-6 shrink-0 cursor-pointer accent-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          />
          <span>{label}</span>
        </label>
      </div>
    </div>
  );
}
