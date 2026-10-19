// A neutral placeholder mark until the product is named: a rising line in a rounded square, with a gold point at its
// end. Colours come from the theme.
export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="9" style={{ fill: "var(--navy)" }} />
      <path d="M8 22l6-6 4 3 6-8" fill="none" style={{ stroke: "#ffffff" }} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="11" r="2.6" style={{ fill: "var(--gold)" }} />
    </svg>
  );
}
