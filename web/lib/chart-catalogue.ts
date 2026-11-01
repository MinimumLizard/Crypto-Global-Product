// The chart library's catalogue: every chart the library has or plans, its category, the models it reads (so its
// tier follows from config/entitlements.yaml through the one tier check), and the kind of data it needs, which says
// whether that data is free to show commercially or needs a licence (docs/charts.md). Text is in messages
// (charts.items.<slug>, charts.categories.<category>, charts.data.<need>).
import { type ModelName, type Tier, TIERS, modelEntry } from "./registry";

export const CATEGORIES = [
  "price", "returns", "cycles", "momentum", "risk", "relative", "network", "marketcap", "onchain", "derivatives", "macro", "tradfi",
] as const;
export type Category = (typeof CATEGORIES)[number];

// Where a chart's data comes from. The message file says, for each, what it costs and whether it may be shown
// commercially (charts.data.<need>), from config/sources.yaml and docs/charts.md.
export const DATA_NEEDS = ["prices", "network", "marketcaps", "onchain", "derivatives", "macro", "tradfi"] as const;
export type DataNeed = (typeof DATA_NEEDS)[number];

// Whether a kind of data is free to show on a paid site, needs a licence we do not have yet, or costs money
// (docs/charts.md has the sources and their terms).
export const DATA_COST: Record<DataNeed, "free" | "licence" | "paid"> = {
  prices: "licence", network: "free", marketcaps: "free", onchain: "free", derivatives: "paid", macro: "free", tradfi: "paid",
};

// usd: any coin against the US dollar; alts: every coin but bitcoin; btc: bitcoin only; all: every coin at once.
export type Assets = "usd" | "alts" | "btc" | "all";

export interface ChartSpec {
  slug: string;
  category: Category;
  data: DataNeed;
  assets: Assets;
  models: ModelName[]; // empty: planned, not built yet
}

const live = (slug: string, category: Category, assets: Assets, models: ModelName[], data: DataNeed = "prices"): ChartSpec =>
  ({ slug, category, data, assets, models });
const planned = (slug: string, category: Category, data: DataNeed, assets: Assets = "btc"): ChartSpec =>
  ({ slug, category, data, assets, models: [] });

export const CHARTS: ChartSpec[] = [
  // Price and long averages
  live("multiplier-bands", "price", "usd", ["crypto_market", "crypto_charts"]),
  live("two-year-multiplier", "price", "usd", ["crypto_market", "crypto_charts"]),
  live("long-averages", "price", "usd", ["crypto_cycle"]),
  live("weekly-band", "price", "usd", ["crypto_cycle"]),
  live("pi-cycle", "price", "usd", ["crypto_cycle"]),
  live("trend-bands", "price", "btc", ["crypto_trend_bands"]),
  // Returns
  live("running-returns", "returns", "usd", ["crypto_market", "crypto_charts"]),
  live("year-to-date", "returns", "usd", ["crypto_charts"]),
  live("monthly-returns", "returns", "usd", ["crypto_cycle"]),
  live("quarterly-returns", "returns", "usd", ["crypto_charts"]),
  live("seasonality", "returns", "usd", ["crypto_cycle"]),
  live("since-first-close", "returns", "all", ["crypto_market"]),
  // Cycles
  live("after-halving", "cycles", "usd", ["crypto_market", "crypto_cycle"]),
  live("after-cycle-low", "cycles", "usd", ["crypto_market", "crypto_cycle"]),
  live("after-cycle-peak", "cycles", "usd", ["crypto_market", "crypto_cycle"]),
  // Momentum
  live("rsi", "momentum", "usd", ["crypto_charts"]),
  live("macd", "momentum", "usd", ["crypto_charts"]),
  live("bollinger", "momentum", "usd", ["crypto_market", "crypto_charts"]),
  // Risk
  live("volatility", "risk", "usd", ["crypto_market", "crypto_charts"]),
  live("sharpe-sortino", "risk", "usd", ["crypto_charts"]),
  live("drawdown", "risk", "usd", ["crypto_market"]),
  // Against bitcoin
  live("price-in-bitcoin", "relative", "alts", ["crypto_charts"]),
  live("correlation", "relative", "alts", ["crypto_charts"]),
  live("beta", "relative", "alts", ["crypto_charts"]),
  // The Bitcoin network (free: read from the network itself)
  planned("supply-issuance", "network", "network"),
  planned("hash-rate", "network", "network"),
  planned("hash-ribbons", "network", "network"),
  planned("stock-to-flow", "network", "network"),
  planned("puell-multiple", "network", "network"),
  planned("halving-countdown", "network", "network"),
  // Market capitalisation
  planned("total-market-cap", "marketcap", "marketcaps", "all"),
  planned("dominance", "marketcap", "marketcaps", "all"),
  planned("stablecoin-supply-ratio", "marketcap", "marketcaps", "all"),
  planned("altcoin-market-cap", "marketcap", "marketcaps", "all"),
  planned("market-cap-what-if", "marketcap", "marketcaps", "all"),
  planned("heatmap", "marketcap", "marketcaps", "all"),
  planned("altcoin-season", "marketcap", "marketcaps", "all"),
  // On-chain (every transaction)
  planned("realised-price-mvrv", "onchain", "onchain"),
  planned("supply-in-profit", "onchain", "onchain"),
  planned("hodl-waves", "onchain", "onchain"),
  planned("coin-days-destroyed", "onchain", "onchain"),
  planned("terminal-price", "onchain", "onchain"),
  planned("rhodl-ratio", "onchain", "onchain"),
  // Derivatives
  planned("funding-rates", "derivatives", "derivatives", "usd"),
  planned("open-interest", "derivatives", "derivatives", "usd"),
  // Macro (US agencies)
  planned("net-liquidity", "macro", "macro", "all"),
  planned("money-supply", "macro", "macro", "all"),
  planned("rates-yield-curve", "macro", "macro", "all"),
  planned("inflation-jobs", "macro", "macro", "all"),
  // Traditional markets
  planned("equities", "tradfi", "tradfi", "all"),
  planned("dollar-gold", "tradfi", "tradfi", "all"),
];

export function chartBySlug(slug: string): ChartSpec | undefined {
  return CHARTS.find((c) => c.slug === slug);
}

export function isLive(c: ChartSpec): boolean {
  return c.models.length > 0;
}

/** The tier a chart needs: the highest minimum tier among the models it reads. */
export function chartTier(c: ChartSpec): Tier | null {
  if (!isLive(c)) return null;
  return c.models.map((m) => modelEntry(m).minimum_tier).reduce((a, b) => (TIERS.indexOf(b) > TIERS.indexOf(a) ? b : a));
}
