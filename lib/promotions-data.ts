// Server side only: reads data/promotions.json at build time.
import { readFileSync } from "node:fs";
import path from "node:path";
import { isShownOn, londonDay, type Promotion, type PromotionsFile } from "@/lib/promotions";

export function loadPromotions(): PromotionsFile {
  return JSON.parse(readFileSync(path.join(process.cwd(), "data", "promotions.json"), "utf8")) as PromotionsFile;
}

/**
 * Offers to render into the page now. Ended offers and offers that have not started are not written into
 * the HTML at all. The daily rebuild (pages.yml, scheduled) moves the line at midnight London; the
 * browser also hides an offer once its last day has passed (PromoCards).
 */
export function promotionsForBuild(): { promos: Promotion[]; buildDay: string } {
  const buildDay = londonDay();
  return { promos: loadPromotions().promotions.filter((p) => isShownOn(p, buildDay)), buildDay };
}
