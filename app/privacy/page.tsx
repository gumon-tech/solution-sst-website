import type { Metadata } from "next";
import { Rich } from "@/components/Rich";
import { fmString, loadDoc } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

const doc = loadDoc("privacy.md");

export const metadata: Metadata = pageMetadata({
  title: fmString(doc, "title"),
  description: fmString(doc, "description"),
  path: "/privacy/",
});

interface Chunk {
  h2?: string;
  paras: string[];
}

export default function PrivacyPage() {
  // privacy.md has no `## id` sections: an h1, an intro, then plain `## heading` chunks.
  const chunks: Chunk[] = [{ paras: [] }];
  let h1 = "";
  for (const line of doc.preamble.lines) {
    if (line.startsWith("# ")) h1 = line.slice(2).trim();
    else if (line.startsWith("## ")) chunks.push({ h2: line.slice(3).trim(), paras: [] });
    else chunks[chunks.length - 1].paras.push(line.trim());
  }

  return (
    <article className="container-x max-w-[720px] py-12 xl:py-20">
      <h1 className="t-display text-plum">{h1}</h1>
      {chunks.map((c, i) => (
        <section key={c.h2 ?? i} className="mt-8">
          {c.h2 && <h2 className="t-h3">{c.h2}</h2>}
          <div className="prose-sst mt-3 space-y-4">
            {c.paras.map((p, j) => (
              <p key={j}>
                <Rich text={p} />
              </p>
            ))}
          </div>
        </section>
      ))}
    </article>
  );
}
