import type { CSSProperties, ElementType, ReactNode } from "react";

/**
 * Scroll-reveal wrapper. Renders plain markup; RevealObserver (one client
 * component in the layout) adds `.in` when it scrolls into view. Stagger with
 * `i` (max 6 steps of 70ms).
 */
export function Reveal({
  as: Tag = "div",
  i = 0,
  className,
  children,
}: {
  as?: ElementType;
  i?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag data-reveal="" className={className} style={{ "--i": Math.min(i, 6) } as CSSProperties}>
      {children}
    </Tag>
  );
}
