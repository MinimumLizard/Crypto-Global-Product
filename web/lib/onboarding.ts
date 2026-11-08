// "Where are you starting from?": four starting points, one follow-up question each, and for every answer three next
// steps (lessons first, then the charts they explain). Text is in messages (start.*).
//
// The questions are about knowledge and experience only, never money, income, goals or holdings: a site that
// suggests something based on a person's objectives or financial situation is giving personal financial advice,
// which needs a licence (hard rule 3). So every answer leads to things to learn, never to anything to do with money.
export const PATHS = ["new", "curious", "holder", "investor"] as const;
export type PathId = (typeof PATHS)[number];

export type Step = { lesson: string } | { chart: string } | { href: string; label: string };

// Each path's follow-up question: its options, and the three steps each option leads to (the first option is the
// default when the question is skipped).
export const FOCUS: Record<PathId, Record<string, Step[]>> = {
  new: {
    "how-it-works": [{ lesson: "what-is-bitcoin" }, { lesson: "what-is-a-blockchain" }, { lesson: "supply-and-halvings" }],
    safety: [{ lesson: "keys-and-wallets" }, { lesson: "scams" }, { lesson: "exchanges" }],
    prices: [{ lesson: "volatility" }, { lesson: "reading-charts" }, { lesson: "market-cap" }],
  },
  curious: {
    "where-to-start": [{ lesson: "what-is-bitcoin" }, { lesson: "exchanges" }, { lesson: "keys-and-wallets" }],
    scams: [{ lesson: "scams" }, { lesson: "keys-and-wallets" }, { lesson: "stablecoins" }],
    "losing-money": [{ lesson: "volatility" }, { chart: "drawdown" }, { lesson: "reading-charts" }],
    jargon: [{ lesson: "market-cap" }, { lesson: "reading-charts" }, { href: "/learn#drawdown", label: "glossary" }],
  },
  holder: {
    "price-swings": [{ lesson: "volatility" }, { chart: "drawdown" }, { chart: "volatility" }],
    charts: [{ lesson: "reading-charts" }, { chart: "long-averages" }, { chart: "multiplier-bands" }],
    cycles: [{ lesson: "supply-and-halvings" }, { chart: "after-halving" }, { chart: "after-cycle-low" }],
    safety: [{ lesson: "keys-and-wallets" }, { lesson: "scams" }, { lesson: "exchanges" }],
  },
  investor: {
    cycles: [{ chart: "after-cycle-low" }, { chart: "pi-cycle" }, { chart: "trend-bands" }],
    momentum: [{ chart: "rsi" }, { chart: "macd" }, { chart: "bollinger" }],
    network: [{ chart: "supply-issuance" }, { chart: "hash-ribbons" }, { chart: "puell-multiple" }],
    risk: [{ chart: "sharpe-sortino" }, { chart: "correlation" }, { chart: "volatility" }],
  },
};

export function isPath(v: unknown): v is PathId {
  return typeof v === "string" && (PATHS as readonly string[]).includes(v);
}

/** The steps for a path and an answer (the first option's when the answer is missing or unknown). */
export function stepsFor(path: PathId, focus: string | undefined): { focus: string; steps: Step[] } {
  const options = FOCUS[path];
  const key = focus && Object.hasOwn(options, focus) ? focus : Object.keys(options)[0];
  return { focus: key, steps: options[key] };
}

export function stepHref(s: Step): string {
  return "lesson" in s ? `/learn/basics/${s.lesson}` : "chart" in s ? `/charts/${s.chart}` : s.href;
}
