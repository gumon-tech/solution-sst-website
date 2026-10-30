// JSON-LD builders. Facts come from lib/site.ts and prices from data/services.json only.
// No aggregateRating and no review: the site quotes no reviews.
import { DAYS, HOURS, SITE, absoluteUrl } from "@/lib/site";
import { GROUPS, SERVICE_ROWS, formatPrice, type Treatment } from "@/lib/services";

const BUSINESS_ID = `${SITE.url}/#business`;

function priceRange(): string {
  const prices = SERVICE_ROWS.map((r) => r.price_gbp);
  return `£${formatPrice(Math.min(...prices))}–£${formatPrice(Math.max(...prices))}`;
}

function openingHours() {
  // Group days that share the same hours into one specification.
  const groups = new Map<string, string[]>();
  for (const d of DAYS) {
    const h = HOURS[d];
    if (!h) continue;
    const key = `${h.opens}-${h.closes}`;
    groups.set(key, [...(groups.get(key) ?? []), d]);
  }
  return [...groups.entries()].map(([key, days]) => {
    const [opens, closes] = key.split("-");
    return { "@type": "OpeningHoursSpecification", dayOfWeek: days, opens, closes };
  });
}

export function businessNode(extra: Record<string, unknown> = {}) {
  return {
    "@type": "DaySpa",
    "@id": BUSINESS_ID,
    name: SITE.name,
    url: `${SITE.url}/`,
    image: absoluteUrl("/img/og-1200x630.jpg"),
    logo: absoluteUrl("/logo/logo-512.png"),
    telephone: SITE.phoneE164,
    email: SITE.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE.streetAddress,
      addressLocality: SITE.locality,
      addressRegion: SITE.region,
      postalCode: SITE.postalCode,
      addressCountry: SITE.country,
    },
    geo: { "@type": "GeoCoordinates", latitude: SITE.geo.latitude, longitude: SITE.geo.longitude },
    hasMap: SITE.mapsUrl,
    openingHoursSpecification: openingHours(),
    priceRange: priceRange(),
    paymentAccepted: "Cash, Credit Card, Debit Card",
    currenciesAccepted: "GBP",
    sameAs: [SITE.mapsUrl],
    ...extra,
  };
}

export function businessLd(extra?: Record<string, unknown>) {
  return { "@context": "https://schema.org", ...businessNode(extra) };
}

function offerFor(r: { name: string; option: string; price_gbp: number }) {
  return {
    "@type": "Offer",
    name: `${r.name} (${r.option})`,
    price: r.price_gbp.toFixed(2),
    priceCurrency: "GBP",
    availability: "https://schema.org/InStock",
  };
}

/** /treatments/: the business with an OfferCatalog per group and an Offer per row. */
export function menuLd() {
  return businessLd({
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `${SITE.shortName} treatments`,
      itemListElement: GROUPS.map((g) => ({
        "@type": "OfferCatalog",
        name: g.name,
        itemListElement: g.treatments.flatMap((t) =>
          t.rows.map((r) => ({ ...offerFor(r), itemOffered: { "@type": "Service", name: r.name } })),
        ),
      })),
    },
  });
}

export function serviceLd(t: Treatment, description: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: t.name,
    serviceType: t.name,
    description,
    url: absoluteUrl(`/treatments/${t.slug}/`),
    provider: { "@type": "DaySpa", "@id": BUSINESS_ID, name: SITE.name },
    areaServed: "Greenwich, London",
    offers: t.rows.map(offerFor),
  };
}

export function faqLd(pairs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: pairs.map((p) => ({
      "@type": "Question",
      name: p.q,
      acceptedAnswer: { "@type": "Answer", text: p.a },
    })),
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}
