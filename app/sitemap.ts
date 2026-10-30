import type { MetadataRoute } from "next";
import { allRoutes } from "@/lib/routes";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-static";

/** Generated whether or not the site is indexable; robots.txt decides if it is referenced. */
export default function sitemap(): MetadataRoute.Sitemap {
  return allRoutes().map((p) => ({ url: absoluteUrl(p) }));
}
