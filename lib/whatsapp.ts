import { SITE } from "@/lib/site";

/**
 * Source tags appended to every pre-filled WhatsApp message as " [web-X]", so
 * the room answering WhatsApp can see where an enquiry came from. One or two
 * capital letters. The register is DIRECTION.md section 8.
 * QS is reserved for the printed QR in the shop and is not used on the site.
 */
export const TAG = {
  home: "O",
  header: "N",
  card: "H",
  menu: "M",
  question: "Q",
  gift: "G",
  visit: "C",
  about: "A",
  sticky: "SB",
  closing: "T",
  footer: "F",
  notFound: "E",
} as const;

/** Per-treatment tag for the option buttons on a treatment page. */
export const TREATMENT_TAG: Record<string, string> = {
  "thai-massage": "PT",
  "aromatherapy-massage": "PA",
  "hot-stone-massage": "PH",
  "lymphatic-drainage-massage": "PL",
  "thai-foot-massage": "PF",
  "back-neck-shoulders-massage": "PB",
};

/** Used if a treatment has no registered tag; a missing one must not break the build. */
export const TAG_UNKNOWN_TREATMENT = "M";

/** "an Aromatherapy Massage", "a Thai Massage". */
export function withArticle(name: string): string {
  return `${/^[aeiou]/i.test(name) ? "an" : "a"} ${name}`;
}

/** https://wa.me/<digits>?text=<encoded message + " [web-X]"> */
export function buildWhatsAppLink(message: string, tag: string): string {
  const text = `${message.trim()} [web-${tag}]`;
  return `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

export const MSG = {
  book: "Hi Sri Siam, I'd like to book a massage please.",
  gift: "Hi Sri Siam, I'd like to buy a gift voucher please.",
  question: "Hi Sri Siam, I have a question please.",
  questionAbout: (name: string) => `Hi Sri Siam, I have a question about ${name} please.`,
  service: (name: string) => `Hi Sri Siam, I'd like to book ${withArticle(name)} please.`,
  serviceOption: (name: string, option: string) =>
    `Hi Sri Siam, I'd like to book ${withArticle(name)} (${option}) please.`,
};

export const telHref = `tel:${SITE.phoneE164}`;

/** The message that goes with a tag when a button comes from the copy files. */
export function messageForTag(tag: string, name?: string): string {
  if (tag === TAG.gift) return MSG.gift;
  if (tag === TAG.question) return name ? MSG.questionAbout(name) : MSG.question;
  return MSG.book;
}
