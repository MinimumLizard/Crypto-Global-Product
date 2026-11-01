// The free "Crypto basics" course, in order. Text is in messages (basics.lessons.<slug>); `see` links each lesson to
// the free pages and charts that show what it explains.
export const LESSONS = [
  { slug: "what-is-bitcoin", see: ["/crypto/btc"] },
  { slug: "what-is-a-blockchain", see: ["/charts/hash-rate"] },
  { slug: "keys-and-wallets", see: [] },
  { slug: "exchanges", see: ["/crypto"] },
  { slug: "stablecoins", see: [] },
  { slug: "scams", see: [] },
  { slug: "volatility", see: ["/charts/volatility", "/charts/drawdown"] },
  { slug: "reading-charts", see: ["/learn#logScale", "/learn#movingAverage"] },
  { slug: "supply-and-halvings", see: ["/charts/supply-issuance", "/charts/halving-countdown"] },
  { slug: "market-cap", see: ["/learn#marketCap"] },
] as const;

export type LessonSlug = (typeof LESSONS)[number]["slug"];

export function lessonIndex(slug: string): number {
  return LESSONS.findIndex((l) => l.slug === slug);
}
