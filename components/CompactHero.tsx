import type { CSSProperties, ReactNode } from "react";

/** Image-less hero: eyebrow, h1, lead and optional extras. */
export function CompactHero({
  eyebrow,
  h1,
  lead,
  children,
}: {
  eyebrow: ReactNode;
  h1: ReactNode;
  lead?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="container-x pb-8 pt-12 xl:pb-12 xl:pt-20">
      <p className="eyebrow hero-rise" style={{ "--i": 0 } as CSSProperties}>
        {eyebrow}
      </p>
      <h1 className="t-display mt-3 max-w-3xl text-plum">{h1}</h1>
      {lead && (
        <p className="t-lead hero-rise mt-4 max-w-2xl" style={{ "--i": 1 } as CSSProperties}>
          {lead}
        </p>
      )}
      {children}
    </section>
  );
}
