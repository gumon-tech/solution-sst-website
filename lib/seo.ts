import type { Metadata } from "next";
import { SITE, absoluteUrl } from "@/lib/site";

export const OG_IMAGE = "/img/og-1200x630.jpg";

export const ROBOTS = SITE.indexable
  ? ({ index: true, follow: true } as const)
  : ({ index: false, follow: false } as const);

/** Title, description, canonical, Open Graph, Twitter and robots for a page. */
export function pageMetadata({
  title,
  description,
  path,
  noindex = false,
}: {
  title: string;
  description: string;
  path: string;
  /** Force noindex even when SITE.indexable is true (the 404). */
  noindex?: boolean;
}): Metadata {
  const url = absoluteUrl(path);
  const image = { url: absoluteUrl(OG_IMAGE), width: 1200, height: 630, alt: SITE.name };
  return {
    title,
    description: description || undefined,
    alternates: { canonical: url },
    robots: noindex ? { index: false, follow: false } : ROBOTS,
    openGraph: {
      type: "website",
      url,
      title,
      description: description || undefined,
      siteName: SITE.name,
      locale: "en_GB",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: description || undefined,
      images: [image.url],
    },
  };
}
