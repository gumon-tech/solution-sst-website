import { existsSync } from "node:fs";
import path from "node:path";
import { fill, fmString, loadDoc, section, type Block, type Doc } from "@/lib/content";
import { ALT_OVERRIDE, IMAGES, TREATMENT_IMAGE, type ImageKey } from "@/lib/images";
import { getTreatment } from "@/lib/services";

export function hasTreatmentFile(slug: string): boolean {
  return existsSync(path.join(process.cwd(), "content", "treatments", `${slug}.md`));
}

export function treatmentDoc(slug: string): Doc | null {
  return hasTreatmentFile(slug) ? loadDoc(`treatments/${slug}.md`) : null;
}

/** Card/menu image for a slug. Unknown slugs (e.g. a future reflexology row) use foot-massage, per DIRECTION section 7. */
export function imageFor(slug: string): { key: ImageKey; alt: string } {
  return TREATMENT_IMAGE[slug] ?? { key: "foot-massage", alt: IMAGES["foot-massage"].alt };
}

/** The one-line description used on cards and menu rows. */
export function cardLine(slug: string): string {
  const doc = treatmentDoc(slug);
  if (doc) return fmString(doc, "card");
  const generic = section(loadDoc("treatments.md"), "generic-treatment-copy");
  const line = generic.lines.find((l) => l.startsWith("Card line:"));
  return (line ?? "").replace("Card line:", "").trim();
}

export function genericIntro(slug: string): string {
  const t = getTreatment(slug);
  const generic = section(loadDoc("treatments.md"), "generic-treatment-copy");
  const para = generic.paras.find((p) => p.startsWith("Intro:")) ?? "";
  return fill(para.replace("Intro:", "").trim(), { name: t?.name ?? "" });
}

export interface TreatmentCopy {
  doc: Doc;
  title: string;
  description: string;
  h1: string;
  card: string;
  heroImage: ImageKey;
  heroAlt: string;
  secondaryImage: ImageKey;
  secondaryAlt: string;
  alsoLike: string[];
  hero: Block;
  expect: Block;
  focus: Block;
  room: Block;
  faq: Block;
}

export function treatmentCopy(slug: string): TreatmentCopy | null {
  const doc = treatmentDoc(slug);
  if (!doc) return null;
  const heroImage = fmString(doc, "hero_image") as ImageKey;
  const secondaryImage = fmString(doc, "secondary_image") as ImageKey;
  const heroAlt = slug === "back-neck-shoulders-massage" ? ALT_OVERRIDE.bnsHero : IMAGES[heroImage].alt;
  const secondaryAlt =
    slug === "lymphatic-drainage-massage" && secondaryImage === "hands-back-b"
      ? ALT_OVERRIDE.lymphaticSecondary
      : IMAGES[secondaryImage].alt;
  const also = doc.fm["also_like"];
  return {
    doc,
    title: fmString(doc, "title"),
    description: fmString(doc, "description"),
    h1: fmString(doc, "h1"),
    card: fmString(doc, "card"),
    heroImage,
    heroAlt,
    secondaryImage,
    secondaryAlt,
    alsoLike: Array.isArray(also) ? also : [],
    hero: section(doc, "hero"),
    expect: section(doc, "what-to-expect"),
    focus: section(doc, "focus"),
    room: section(doc, "room-image"),
    faq: section(doc, "faq"),
  };
}
