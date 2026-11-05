// data/closures.json read at build time (a static import, so no file access at run time).
import file from "@/data/closures.json";
import { upcomingClosures, type Closure } from "@/lib/hours-text";
import { londonDay } from "@/lib/promotions";

const CLOSURES = (file as { closures: Closure[] }).closures;

/** Live closures not over yet on the build day (London) and starting within 60 days: what the page text shows. */
export function closuresForBuild(): Closure[] {
  return upcomingClosures(CLOSURES, londonDay());
}

/** Every live closure not over yet, however far ahead: for structured data (Google's holiday hours). */
export function closuresForStructuredData(): Closure[] {
  return upcomingClosures(CLOSURES, londonDay(), 3650);
}
