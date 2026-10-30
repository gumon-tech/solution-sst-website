// Pulls the header, footer, sticky bar and closing band copy out of content/_shared.md.
import { loadDoc, section, type Block } from "@/lib/content";

function after(block: Block, prefix: string): string {
  const stripped = block.lines.map((l) => l.replace(/^-\s+/, ""));
  const hit = stripped.find((l) => l.startsWith(prefix));
  if (!hit) throw new Error(`_shared.md: line starting "${prefix}" not found in ${block.id}`);
  return hit.slice(prefix.length).trim();
}

export interface NavItem {
  label: string;
  href: string;
}

export function sharedCopy() {
  const doc = loadDoc("_shared.md");
  const header = section(doc, "header");
  const sticky = section(doc, "sticky-bar");
  const closing = section(doc, "closing-band");
  const footer = section(doc, "footer");

  const nav: NavItem[] = after(header, "Nav:")
    .split(" · ")
    .map((p) => {
      const [label, href] = p.split(" -> ");
      return { label: label.trim(), href: href.trim() };
    });

  const stickyIcon = sticky.lines.find((l) => l.includes("Icon button")) ?? "";
  const stickyAria = /aria-label "([^"]+)"/.exec(stickyIcon)?.[1] ?? "Menu";

  const col1 = after(footer, "Column 1 (brand):").split(" · ");
  const col4 = after(footer, "Column 4 (pages):")
    .split(" · ")
    .map((s) => s.trim());

  const headings = footer.lines.filter((l) => l.startsWith("- Heading:")).map((l) => l.replace("- Heading:", "").trim());

  const sub = closing.subs[0];
  return {
    wordmark1: after(header, "Wordmark line 1:"),
    wordmark2: after(header, "Wordmark line 2:"),
    nav,
    bookLabel: header.actions[0]?.label ?? "Book on WhatsApp",
    menuLabel: "Menu",
    stickyLabel: sticky.actions[0]?.label ?? "Book on WhatsApp",
    stickyAria,
    closing: {
      eyebrow: closing.eyebrow ?? "",
      title: sub.h3,
      body: sub.paras[0],
      button: sub.actions[0].label,
      phoneLine: (sub.bullets.find((b) => b.startsWith("Line under the button:")) ?? "")
        .replace("Line under the button:", "")
        .trim(),
    },
    footer: {
      name: col1[1]?.trim() ?? "",
      blurb: col1[2]?.trim() ?? "",
      visitHeading: headings[0] ?? "Visit",
      contactHeading: headings[1] ?? "Contact",
      directions: footer.actions.find((a) => a.label.startsWith("Directions"))?.label ?? "Directions on Google Maps",
      phoneLine: after(footer, "Line:"),
      reviews: footer.actions.find((a) => a.label.startsWith("Read our reviews"))?.label ?? "Read our reviews on Google",
      pages: col4,
      legal: after(footer, "Legal line:"),
    },
  };
}
