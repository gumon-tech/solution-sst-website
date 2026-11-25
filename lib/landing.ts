// The address the visit opened on (the first page this JavaScript ran on), kept in page memory
// only. Read once, before any in-app page change drops the query. Shop-neutral.
// Used by components/AdSource.tsx ([web-AD]) and lib/consent.ts (ad click reference on a late Accept).
let landing: string | null = null;

export function landingUrl(): string {
  if (landing === null) landing = window.location.href;
  return landing;
}
