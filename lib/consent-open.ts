// Lets a "Cookie settings" control reopen the cookie banner, even when it is clicked before the
// banner's lazy chunk has loaded (the request is kept and served when the banner mounts).
// Shop-neutral. No strings on purpose: with the Ads id empty nothing of this ships.
type Open = (opener: HTMLElement | null) => void;

let handler: Open | null = null;
let pending: { opener: HTMLElement | null } | null = null;

export function openCookieSettings(opener: HTMLElement | null): void {
  if (handler) handler(opener);
  else pending = { opener };
}

/** The banner registers here; a request made before that is delivered now. Returns the unregister function. */
export function onOpenCookieSettings(fn: Open): () => void {
  handler = fn;
  if (pending) {
    const p = pending;
    pending = null;
    fn(p.opener);
  }
  return () => {
    if (handler === fn) handler = null;
  };
}
