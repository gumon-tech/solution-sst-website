import { TREATMENTS } from "@/lib/services";

/** Every page that must exist in out/. check-site.mjs keeps its own copy of this list on purpose. */
export const STATIC_ROUTES = [
  "/",
  "/treatments/",
  "/gift-vouchers/",
  "/about/",
  "/visit/",
  "/faq/",
  "/careers/",
  "/privacy/",
] as const;

export function allRoutes(): string[] {
  return [...STATIC_ROUTES, ...TREATMENTS.map((t) => `/treatments/${t.slug}/`)];
}
