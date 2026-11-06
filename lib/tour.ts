// The shop tour: zones in walking order and the pictures in them. Copy and crop recipes are in data/tour.json;
// pixel sizes are written by scripts/make-tour-images.mjs into data/tour-sizes.json. Photos: public/img/tour/.
import tour from "@/data/tour.json";
import sizes from "@/data/tour-sizes.json";

export interface TourSource {
  /** "avif" | "webp" | "jpg" */
  ext: string;
  srcSet: string;
}

export interface TourShot {
  key: string;
  caption: string;
  alt: string;
  orientation: "portrait" | "landscape";
  /** The largest file: the <img> fallback and its intrinsic size. */
  src: string;
  width: number;
  height: number;
  sources: TourSource[];
}

export interface TourZone {
  id: string;
  kicker: string;
  title: string;
  intro: string;
  shots: TourShot[];
}

function shotFor(photo: string, caption: string, alt: string): TourShot {
  const s = (sizes as Record<string, Record<string, { w: number; h: number }>>)[photo];
  if (!s) throw new Error(`tour photo "${photo}" has no entry in data/tour-sizes.json (run node scripts/make-tour-images.mjs)`);
  const widths = Object.values(s).sort((a, b) => a.w - b.w);
  const biggest = widths[widths.length - 1];
  const file = (w: number, ext: string) => `/img/tour/${photo}-${w}.${ext}`;
  return {
    key: photo,
    caption,
    alt,
    orientation: biggest.w >= biggest.h ? "landscape" : "portrait",
    src: file(biggest.w, "jpg"),
    width: biggest.w,
    height: biggest.h,
    sources: ["avif", "webp", "jpg"].map((ext) => ({ ext, srcSet: widths.map((v) => `${file(v.w, ext)} ${v.w}w`).join(", ") })),
  };
}

export const TOUR_ZONES: TourZone[] = (tour as unknown as { zones: { id: string; kicker: string; title: string; intro: string; shots: { photo: string; caption: string; alt: string }[] }[] }).zones.map((z) => ({
  id: z.id,
  kicker: z.kicker,
  title: z.title,
  intro: z.intro,
  shots: z.shots.map((s) => shotFor(s.photo, s.caption, s.alt)),
}));

export const TOUR_SHOTS: TourShot[] = TOUR_ZONES.flatMap((z) => z.shots);

export const MIME: Record<string, string> = { avif: "image/avif", webp: "image/webp", jpg: "image/jpeg" };

/** The photos shown as tiles on the home page, in order (keys from data/tour.json). */
export const TEASER_KEYS = ["entrance", "room-day", "candle-shelf", "detail-corner"] as const;
export function teaserShots(): TourShot[] {
  return TEASER_KEYS.map((k) => {
    const s = TOUR_SHOTS.find((x) => x.key === k);
    if (!s) throw new Error(`teaser photo ${k} is not in the tour`);
    return s;
  });
}
