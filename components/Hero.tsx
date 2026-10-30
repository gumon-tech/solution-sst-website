import type { CSSProperties, ReactNode } from "react";
import { Img } from "@/components/Img";
import type { ImageKey } from "@/lib/images";

/**
 * Image hero used by home, treatment pages, About and Gift vouchers.
 *
 * Phone: `overlay` puts the copy over the lower part of the photo on a plum
 * gradient; `stack` shows a 16:9 photo above the copy. Desktop (lg): a 7/5
 * split, copy left, photo right in a 24px frame with an offset gold hairline.
 * The photo is the LCP element: eager, fetchpriority high, never animated.
 */
export function Hero({
  imageKey,
  alt,
  eyebrow,
  h1,
  lead,
  actions,
  facts,
  mobile = "overlay",
  glow = false,
  position = "center",
  topSpace = "pt-[220px]",
}: {
  imageKey: ImageKey;
  alt?: string;
  eyebrow: ReactNode;
  h1: ReactNode;
  lead: ReactNode;
  actions?: ReactNode;
  facts?: ReactNode;
  mobile?: "overlay" | "stack";
  glow?: boolean;
  /** object-position for the phone crop. */
  position?: string;
  /** Tailwind padding-top for the phone overlay: how much photo shows above the copy. */
  topSpace?: string;
}) {
  const overlay = mobile === "overlay";
  const photoCol =
    "lg:relative lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1 " +
    (overlay ? "absolute inset-0" : "relative aspect-[16/9] w-full lg:aspect-auto");
  return (
    <section className="lg:container-x lg:grid lg:grid-cols-12 lg:items-center lg:gap-x-6 lg:py-16 xl:py-20">
      <div className={`relative lg:contents ${overlay ? "bg-plum-deep" : ""}`}>
        <div className={photoCol}>
          {glow && <div className="candle pointer-events-none absolute -inset-24 hidden lg:block" aria-hidden="true" />}
          <div
            className="pointer-events-none absolute inset-0 hidden translate-x-[14px] translate-y-[14px] rounded-r-frame border-[1.5px] border-gold lg:block"
            aria-hidden="true"
          />
          <div className="absolute inset-0 overflow-hidden lg:relative lg:inset-auto lg:rounded-r-frame lg:shadow-card">
            <Img
              k={imageKey}
              alt={alt}
              priority
              position={position}
              sizes="(min-width:1280px) 480px, (min-width:1024px) 40vw, 100vw"
              className="h-full w-full object-cover lg:h-auto lg:aspect-[4/5]"
            />
          </div>
        </div>

        {overlay && (
          <div
            className="pointer-events-none absolute inset-0 lg:hidden"
            aria-hidden="true"
            style={{
              background:
                "linear-gradient(180deg, rgba(45,27,54,0) 16%, rgba(45,27,54,.9) 40%, rgba(45,27,54,.96) 100%)",
            }}
          />
        )}

        <div
          className={`relative z-10 px-4 md:px-8 lg:col-span-7 lg:col-start-1 lg:row-start-1 lg:px-0 lg:pr-8 ${
            overlay ? `pb-8 ${topSpace} text-cream lg:pb-0 lg:pt-0 lg:text-ink` : "pb-4 pt-6 lg:pb-0 lg:pt-0"
          }`}
        >
          <p
            className={`eyebrow hero-rise ${overlay ? "!text-gold-pale lg:!text-gold-deep" : ""}`}
            style={{ "--i": 0 } as CSSProperties}
          >
            {eyebrow}
          </p>
          <h1 className={`t-display mt-3 ${overlay ? "text-cream lg:text-plum" : "text-plum"}`}>{h1}</h1>
          <p className="t-lead hero-rise mt-4 max-w-xl" style={{ "--i": 1 } as CSSProperties}>
            {lead}
          </p>
          {actions && <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">{actions}</div>}
        </div>
      </div>

      {facts && <div className="lg:col-span-7 lg:col-start-1 lg:row-start-2 lg:pr-8">{facts}</div>}
    </section>
  );
}
