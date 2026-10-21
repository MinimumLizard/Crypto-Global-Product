// A neutral placeholder mark until Cointrigue has a designed logo: a blue coin with a rising line across it.
// Colours come from the theme.
export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" focusable="false">
      <circle cx="16" cy="16" r="15" style={{ fill: "var(--accent)" }} />
      <circle cx="16" cy="16" r="11.5" fill="none" style={{ stroke: "var(--surface)" }} strokeOpacity="0.35" strokeWidth="1.2" />
      <path d="M9 20l5-5 3.5 3L23 12" fill="none" style={{ stroke: "var(--surface)" }} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
