// Types and date rules for data/promotions.json. No file access here, so a
// client component can import it. The shop's WhatsApp system writes the file
// (README, "Promotions"); the schema is the one it writes. scripts/validate-promotions.mjs
// holds the same rules for the build.

export interface Promotion {
  code: string;
  title: string;
  eyebrow: string;
  detail: string;
  points: string[];
  offer: string;
  /** Pre-filled WhatsApp text. The site adds the [web-PR] tag itself. */
  message: string;
  /** Always null for offers the system writes; a path under /images/ otherwise. */
  image: string | null;
  illustrative: boolean;
  /** YYYY-MM-DD, London. Shown from the start of this day. */
  starts: string;
  /** YYYY-MM-DD, London. Shown until the end of this day. */
  ends: string;
  ends_label: string;
  status: "live" | "ended" | "draft";
}

export interface PromotionsFile {
  updated_at: string;
  note?: string;
  promotions: Promotion[];
}

/** Today's date in London as YYYY-MM-DD. */
export function londonDay(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** Shown on `day`: status live, started, and not past its last day. Ended offers never show. */
export function isShownOn(p: Pick<Promotion, "status" | "starts" | "ends">, day: string): boolean {
  return p.status === "live" && p.starts <= day && day <= p.ends;
}
