"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { TAG } from "@/lib/whatsapp";

/**
 * Tag [web-AD]: when the visit started on a page whose address carries `gclid`
 * or `utm_source=google&utm_medium=cpc` (a Google Ads click), every WhatsApp
 * button for the rest of the visit ends with [web-AD] instead of its own tag.
 *
 * The answer lives only in this module's memory: no cookie, no localStorage or
 * sessionStorage, nothing sent anywhere. It survives the site's own in-app page
 * changes (next/link) and is decided once, from the address the visit opened on.
 * Without JavaScript the buttons keep their own tags. Register: DIRECTION.md section 8.
 */
let fromAd: boolean | null = null;

function visitFromAd(): boolean {
  if (fromAd === null) {
    const p = new URLSearchParams(window.location.search);
    fromAd =
      p.has("gclid") ||
      (p.get("utm_source")?.toLowerCase() === "google" && p.get("utm_medium")?.toLowerCase() === "cpc");
  }
  return fromAd;
}

const TAG_AT_END = / \[web-[A-Z]{1,2}\]$/;

function retag(a: HTMLAnchorElement) {
  let u: URL;
  try {
    u = new URL(a.href);
  } catch {
    return;
  }
  if (u.hostname !== "wa.me") return;
  const text = u.searchParams.get("text");
  if (!text || !TAG_AT_END.test(text)) return;
  const next = text.replace(TAG_AT_END, ` [web-${TAG.ad}]`);
  if (next === text) return;
  // Same encoding as buildWhatsAppLink (encodeURIComponent, not form encoding).
  a.href = `https://wa.me${u.pathname}?text=${encodeURIComponent(next)}`;
}

function retagAll() {
  document.querySelectorAll<HTMLAnchorElement>('a[href^="https://wa.me/"]').forEach(retag);
}

export function AdSource() {
  const pathname = usePathname();

  // Decide on the first page of the visit, before any in-app navigation drops the query.
  useEffect(() => {
    if (!visitFromAd()) return;
    // Buttons that appear later (menus, dialogs) are caught when they are used.
    const onActivate = (e: Event) => {
      const a = (e.target as Element | null)?.closest?.("a");
      if (a instanceof HTMLAnchorElement) retag(a);
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

  // Every page the visit reaches: rewrite the buttons on it.
  useEffect(() => {
    if (visitFromAd()) retagAll();
  }, [pathname]);

  return null;
}
