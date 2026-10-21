// A neutral placeholder mark until Cointrigue has a designed logo: a coin's rim with a rising line through it.
// Colours come from the theme.
export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" focusable="false">
      <circle cx="16" cy="16" r="14" fill="none" style={{ stroke: "var(--gold)" }} strokeWidth="2.4" />
      <path d="M9 20l5-5 3.5 3L23 12" fill="none" style={{ stroke: "var(--text)" }} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
