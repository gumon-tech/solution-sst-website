// Image keys, intrinsic sizes (of the -1600 file; the -800 file has the same
// ratio) and alt text. Alt strings are final copy from DIRECTION.md section 7.

import photos from "@/data/photos.json";
import slotList from "@/scripts/lib/photo-slots.json";

type BuiltInKey =
  | "hands-back-b"
  | "hands-back-a"
  | "therapist-hot-stone"
  | "hot-stones-spine-a"
  | "hot-stones-spine-b"
  | "oils-stones"
  | "foot-massage"
  | "orchid-stones"
  | "purple-stones-still"
  | "purple-stones-candles"
  | "room-pink-curtains"
  | "room-daylight";

/** A built-in photo, or one the shop system added (key sp-<slug>, data/photos.json). */
export type ImageKey = BuiltInKey | `sp-${string}`;

interface ImageMeta {
  w: number;
  h: number;
  /** 800w file width (height scales). */
  w800: number;
  h800: number;
  alt: string;
}

const BUILT_IN: Record<BuiltInKey, ImageMeta> = {
  "hands-back-b": { w: 1200, h: 1600, w800: 600, h800: 800, alt: "A therapist in white pressing along a client's back" },
  "hands-back-a": { w: 1200, h: 1600, w800: 600, h800: 800, alt: "Close-up of a therapist's hands pressing along a client's back during a Thai massage" },
  "therapist-hot-stone": { w: 722, h: 546, w800: 722, h800: 546, alt: "A therapist in a beige uniform placing warm stones along a client's back, with candles lit beside the bed" },
  "hot-stones-spine-a": { w: 1024, h: 1024, w800: 800, h800: 800, alt: "A line of warm basalt stones resting down a client's spine, white orchids beside them" },
  "hot-stones-spine-b": { w: 1200, h: 1600, w800: 600, h800: 800, alt: "Warm stones placed down a client's back, candlelight in the background" },
  "oils-stones": { w: 1024, h: 1024, w800: 800, h800: 800, alt: "Amber bottles of massage oil, smooth grey stones and white orchids on a wooden table" },
  "foot-massage": { w: 1024, h: 1024, w800: 800, h800: 800, alt: "A therapist massaging a client's foot with both thumbs, orchids on the table" },
  "orchid-stones": { w: 1076, h: 1600, w800: 538, h800: 800, alt: "Pink orchids, a stack of smooth black stones and a lit candle beside a bowl of water" },
  "purple-stones-still": { w: 1024, h: 1536, w800: 533, h800: 800, alt: "Black stones on a rolled towel, a lit candle and white flowers against a purple wall" },
  "purple-stones-candles": { w: 1600, h: 900, w800: 800, h800: 450, alt: "Black stones, tealights and purple orchids on purple silk" },
  "room-pink-curtains": { w: 1600, h: 700, w800: 800, h800: 350, alt: "A treatment bed between pink and lilac curtains" },
  // The shop's own photo of its treatment room (6 Nov 2026, scripts/make-tour-images.mjs "siteImages"). The "1600" file is the full 1080 px the source allows.
  "room-daylight": { w: 1080, h: 472, w800: 800, h800: 350, alt: "The treatment room by day: a worktop with brass bowls and a green lamp, a chair with a blue cushion, a tiled border on the wall and the end of the bed" },
};

interface PhotoEntry extends ImageMeta {
  key: string;
  added: string;
  status: "live" | "retired";
}
const PHOTOS = photos as unknown as { images: PhotoEntry[]; slots: Record<string, string | null> };

/** Built-in photos plus the live ones from data/photos.json. A retired photo is not in the map. */
export const IMAGES: Record<string, ImageMeta> = {
  ...BUILT_IN,
  ...Object.fromEntries(PHOTOS.images.filter((i) => i.status === "live").map((i) => [i.key, { w: i.w, h: i.h, w800: i.w800, h800: i.h800, alt: i.alt }])),
};

export type SlotId = string;
const SLOT_IDS = new Set(slotList.slots.map((s) => s.id));

/**
 * A named place on the site that data/photos.json may point at a bot-added photo. Unset (null): the built-in photo and alt the
 * caller passes. Set: the photo's own key and alt. An unknown slot id is a build error, so a typo cannot silently do nothing.
 */
export function applySlot(slot: SlotId | undefined, key: ImageKey, alt?: string): { key: ImageKey; alt: string | undefined } {
  if (!slot) return { key, alt };
  if (!SLOT_IDS.has(slot)) throw new Error(`unknown photo slot "${slot}" (scripts/lib/photo-slots.json)`);
  const k = PHOTOS.slots[slot];
  const m = k ? IMAGES[k] : undefined;
  return k && m ? { key: k as ImageKey, alt: m.alt } : { key, alt };
}

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
