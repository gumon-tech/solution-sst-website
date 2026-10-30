/** The one drawn ornament: a gold hairline with a three-petal mark at its centre. */
export function Ornament({ tone = "gold", className = "" }: { tone?: "gold" | "pale"; className?: string }) {
  return (
    <svg
      className={`orn ${tone === "pale" ? "text-gold-pale" : "text-gold"} ${className}`}
      width="64"
      height="12"
      viewBox="0 0 64 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path pathLength={1} d="M1 6.5H23" />
      <path pathLength={1} d="M41 6.5H63" />
      <path pathLength={1} d="M32 10.5C30 7.5 30 4.5 32 1.5C34 4.5 34 7.5 32 10.5Z" />
      <path pathLength={1} d="M32 10.5C28.5 10.2 26.2 8 25.5 5C29 5.3 31.4 7.4 32 10.5Z" />
      <path pathLength={1} d="M32 10.5C35.5 10.2 37.8 8 38.5 5C35 5.3 32.6 7.4 32 10.5Z" />
    </svg>
  );
}
