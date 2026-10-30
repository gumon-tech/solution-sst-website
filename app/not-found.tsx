import type { Metadata } from "next";
import { ActionView } from "@/components/Actions";
import { Img } from "@/components/Img";
import { fmString, loadDoc } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { Paras } from "@/components/Rich";

const doc = loadDoc("not-found.md");

export const metadata: Metadata = pageMetadata({
  title: fmString(doc, "title"),
  description: "",
  path: "/404/",
  noindex: true,
});

export default function NotFound() {
  const b = doc.preamble;
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[40%] lg:block" aria-hidden="true">
        <Img k="purple-stones-still" alt="" sizes="40vw" small className="h-full w-full object-cover opacity-30" />
      </div>
      <div className="container-x relative py-20 xl:py-32">
        <p className="eyebrow">{b.eyebrow}</p>
        <h1 className="t-display mt-3 max-w-2xl text-plum">{b.h1}</h1>
        <div className="mt-5 max-w-xl t-lead">
          <Paras items={b.paras} />
        </div>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {b.actions.map((a) => (
            <ActionView key={a.label} action={a} />
          ))}
        </div>
      </div>
    </section>
  );
}
