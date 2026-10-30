// Image keys, intrinsic sizes (of the -1600 file; the -800 file has the same
// ratio) and alt text. Alt strings are final copy from DIRECTION.md section 7.

export type ImageKey =
  | "hands-back-b"
  | "hands-back-a"
  | "therapist-hot-stone"
  | "hot-stones-spine-a"
  | "hot-stones-spine-b"
  | "oils-stones"
  | "compress-oils"
  | "herbal-compress"
  | "foot-massage"
  | "orchid-stones"
  | "purple-stones-still"
  | "purple-stones-candles"
  | "room-wood-purple"
  | "room-pink-curtains";

interface ImageMeta {
  w: number;
  h: number;
  /** 800w file width (height scales). */
  w800: number;
  h800: number;
  alt: string;
}

export const IMAGES: Record<ImageKey, ImageMeta> = {
  "hands-back-b": { w: 1200, h: 1600, w800: 600, h800: 800, alt: "A therapist in white pressing slowly along a client's back on the treatment bed at Sri Siam, Greenwich" },
  "hands-back-a": { w: 1200, h: 1600, w800: 600, h800: 800, alt: "Close-up of a therapist's hands pressing along a client's back during a Thai massage" },
  "therapist-hot-stone": { w: 722, h: 546, w800: 722, h800: 546, alt: "A therapist in a beige uniform placing warm stones along a client's back, with candles lit beside the bed" },
  "hot-stones-spine-a": { w: 1024, h: 1024, w800: 800, h800: 800, alt: "A line of warm basalt stones resting down a client's spine, white orchids beside them" },
  "hot-stones-spine-b": { w: 1200, h: 1600, w800: 600, h800: 800, alt: "Warm stones placed down a client's back, candlelight in the background" },
  "oils-stones": { w: 1024, h: 1024, w800: 800, h800: 800, alt: "Amber bottles of massage oil, smooth grey stones and white orchids on a wooden table" },
  "compress-oils": { w: 1200, h: 1600, w800: 600, h800: 800, alt: "A Thai herbal compress, oil bottles, black stones and frangipani flowers laid out before a treatment" },
  "herbal-compress": { w: 1024, h: 1024, w800: 800, h800: 800, alt: "A therapist in white with gold trim pressing a warm Thai herbal compress to a client's back" },
  "foot-massage": { w: 1024, h: 1024, w800: 800, h800: 800, alt: "A therapist massaging a client's foot with both thumbs, orchids on the table" },
  "orchid-stones": { w: 1076, h: 1600, w800: 538, h800: 800, alt: "Pink orchids, a stack of smooth black stones and a lit candle beside a bowl of water" },
  "purple-stones-still": { w: 1024, h: 1536, w800: 533, h800: 800, alt: "" },
  "purple-stones-candles": { w: 1600, h: 900, w800: 800, h800: 450, alt: "Black stones, tealights and purple orchids on purple silk" },
  "room-wood-purple": { w: 1200, h: 1600, w800: 600, h800: 800, alt: "The treatment room at Sri Siam: wood-panelled walls with carved Thai ornaments, two beds with rolled towels and orchid petals, lit in soft purple" },
  "room-pink-curtains": { w: 1600, h: 700, w800: 800, h800: 350, alt: "A treatment bed between pink and lilac curtains in the Sri Siam room" },
};

/** Per-treatment thumbnail/card image and its alt, DIRECTION.md section 7. */
export const TREATMENT_IMAGE: Record<string, { key: ImageKey; alt: string }> = {
  "thai-massage": { key: "hands-back-a", alt: IMAGES["hands-back-a"].alt },
  "aromatherapy-massage": { key: "oils-stones", alt: IMAGES["oils-stones"].alt },
  "hot-stone-massage": { key: "therapist-hot-stone", alt: IMAGES["therapist-hot-stone"].alt },
  "lymphatic-drainage-massage": { key: "orchid-stones", alt: IMAGES["orchid-stones"].alt },
  "thai-foot-massage": { key: "foot-massage", alt: IMAGES["foot-massage"].alt },
  "back-neck-shoulders-massage": {
    key: "hands-back-b",
    alt: "A therapist's hands working across a client's upper back and shoulders",
  },
};

/** Alt overrides for an image used in a second, different role. */
export const ALT_OVERRIDE = {
  lymphaticSecondary: "A therapist's hands resting lightly on a client's upper back",
  bnsHero: "A therapist's hands working across a client's upper back and shoulders",
} as const;

export function imageSrc(key: ImageKey, size: 800 | 1600): string {
  return `/img/${key}-${size}.webp`;
}
