/**
 * UK soft opt-in notice (PECR reg 22) under the booking buttons: one static paragraph, normal size and colour.
 * The wording is in content/_booking-terms.md (`## marketing_notice`). There is no tickbox: customers opt out
 * by replying STOP to a WhatsApp message or with the unsubscribe link in an email (README "Marketing opt-out").
 */
export function MarketingNotice({ sentence, tone = "light", className = "" }: { sentence: string; tone?: "light" | "plum"; className?: string }) {
  return (
    <p className={`max-w-xl ${tone === "plum" ? "text-cream" : "text-ink"} ${className}`} data-marketing-notice="">
      {sentence}
    </p>
  );
}
