import { Ornament } from "@/components/Ornament";
import { Reveal } from "@/components/Reveal";
import { Rich } from "@/components/Rich";
import { WaButton } from "@/components/Button";
import { sharedCopy } from "@/lib/shared";
import { MSG, TAG } from "@/lib/whatsapp";

/** The closing call-to-action band (tag T), on every page except Privacy and 404. */
export function ClosingBand() {
  const { closing } = sharedCopy();
  return (
    <section className="on-plum bg-plum-deep text-cream section-y" aria-labelledby="closing-h">
      <div className="container-x flex flex-col items-center text-center">
        <Reveal>
          <p className="eyebrow">{closing.eyebrow}</p>
        </Reveal>
        <Reveal i={1} className="mt-3">
          <h2 id="closing-h" className="t-h2">
            {closing.title}
          </h2>
        </Reveal>
        <div className="mt-4" data-orn="">
          <Ornament tone="pale" />
        </div>
        <Reveal i={2}>
          <p className="mx-auto mt-5 max-w-xl t-lead">{closing.body}</p>
        </Reveal>
        <Reveal i={3} className="mt-8">
          <WaButton message={MSG.book} tag={TAG.closing} variant="ghost">
            {closing.button}
          </WaButton>
        </Reveal>
        <Reveal i={4}>
          <p className="mx-auto mt-6 max-w-md text-gold-pale">
            <Rich text={closing.phoneLine} />
          </p>
        </Reveal>
      </div>
    </section>
  );
}
