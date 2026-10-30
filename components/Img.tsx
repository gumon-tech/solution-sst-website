import { IMAGES, type ImageKey } from "@/lib/images";

interface Props {
  k: ImageKey;
  /** Omit to use the alt from DIRECTION.md section 7; pass "" for decoration. */
  alt?: string;
  sizes: string;
  /** The LCP image of the page: eager and high priority. Everything else is lazy. */
  priority?: boolean;
  className?: string;
  /** object-position for cropped uses. */
  position?: string;
  /** Decorative texture: serve only the 800w file, no srcset. */
  small?: boolean;
}

/** Plain <img> with 800w/1600w srcset and intrinsic width/height so nothing shifts. */
export function Img({ k, alt, sizes, priority = false, className, position, small = false }: Props) {
  const m = IMAGES[k];
  const text = alt ?? m.alt;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/img/${k}-800.webp`}
      srcSet={small ? undefined : `/img/${k}-800.webp ${m.w800}w, /img/${k}-1600.webp ${m.w}w`}
      sizes={small ? undefined : sizes}
      width={m.w}
      height={m.h}
      alt={text}
      aria-hidden={text === "" ? true : undefined}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding={priority ? "sync" : "async"}
      className={className}
      style={position ? { objectPosition: position } : undefined}
    />
  );
}
