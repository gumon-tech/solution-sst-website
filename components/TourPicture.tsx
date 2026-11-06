import { MIME, type TourShot } from "@/lib/tour";

/** AVIF and WebP sources, then the JPEG <img>; width and height are set so nothing shifts while loading. */
export function TourPicture({
  shot,
  sizes,
  eager = false,
  className,
  id,
}: {
  shot: TourShot;
  sizes: string;
  /** The first picture on a page loads at once; everything else is lazy. */
  eager?: boolean;
  className?: string;
  id?: string;
}) {
  return (
    <picture>
      {shot.sources
        .filter((s) => s.ext !== "jpg")
        .map((s) => (
          <source key={s.ext} type={MIME[s.ext]} srcSet={s.srcSet} sizes={sizes} />
        ))}
      <img
        id={id}
        src={shot.src}
        srcSet={shot.sources.find((s) => s.ext === "jpg")?.srcSet}
        sizes={sizes}
        width={shot.width}
        height={shot.height}
        alt={shot.alt}
        loading={eager ? undefined : "lazy"}
        fetchPriority={eager ? "high" : undefined}
        decoding="async"
        className={className}
      />
    </picture>
  );
}
