# From the MiniLizard terminal to Cointrigue: what comes back, how, and what cannot

**Date:** 2026-10-21. **Why this exists:** the owner pointed out that Cointrigue, as built in Phase 0, is "nowhere
close" to the MiniLizard terminal (minimumlizard.github.io/Crypto/), and asked for a dynamic portfolio-rebalancing
feature. This maps every part of the old terminal to its route into Cointrigue. Screenshots of the old site taken
2026-10-21 are in the session scratchpad (not in git).

## Why Phase 0 was so much smaller

Phase 0's job was the safe foundation (backup, platform, tests, audit, plan), carried over with the three crypto models
that already existed on licensed-to-be data. The MiniLizard terminal was never ported because three of the brief's
own rules stop most of it from moving over *as it is*:

1. **Its data.** About 20 free sources, and almost all of them forbid commercial use or need a paid plan (Binance,
   Coinbase, CoinGecko's free plan, Coin Metrics' community data, DefiLlama; `docs/audit.md` §4). A paid product
   cannot show them (hard rule 2). Each section below names a licensed replacement and its price.
2. **Its provenance.** Some sections were designed from confidential memos of the paid service Cointrigue is compared
   with (old repo D011; `docs/audit.md` §6). Hard rule 1 says never copy or imitate that service, so those sections
   are not rebuilt in any form.
3. **Its framing.** Some sections are trading signals or personal portfolio tools (BULL/BEAR regimes, GET IN /
   GET OUT, a buy order). Hard rule 3 says information and education only. Some of these can come back reframed as
   plain facts; the signals themselves cannot.

Everything else can come back, rebuilt from public definitions on licensed data, with the platform's guarantees
(tier checks on the server, point-in-time history, method pages, tests).

## Section by section

Legend: **Yes** = can be rebuilt; **Reframed** = the facts can come back, the signal framing cannot; **No** = not
rebuilt (rule given); **Paid data** = needs a licence with the price shown.

| Old terminal | What it shows | Route into Cointrigue | Data and cost |
|---|---|---|---|
| Header ticker strip | prices and 1-day change of six names; UTC and local clocks | **Yes** | CoinMarketCap Startup, US$79/month (§12.2 of the plan) |
| Home: "What matters today" | short notes on the day | **Yes**, as the owners' notes (plan §2) | — |
| Home: 50-week confirmation | two weekly closes above the 50-week average, "confirmed" | **Reframed**: the 50-week average and how many weekly closes in a row sit above or below it, as a fact, without "confirmation" | same prices |
| Home: key levels | 20W SMA, 21W EMA, 50W SMA, 200W SMA, 200D SMA, Mayer, distance from each | **Yes** (most already computed by `crypto_cycle`; the 50-week average is added) | same |
| Home: Bitcoin regime | MiniLizard score, BULL / NEUTRAL / BEAR | **No** (hard rule 3: a trading signal; also your personal engine, never verified against TradingView). Its ingredients (trend, momentum, volatility indicators) can each be shown as plain measures | — |
| Home: the grid | every tracked name: price, 1D/7D/30D/90D, regime, score, vs 200-day, sector | **Yes** without the regime and score columns: price, returns, distance from the 200-day average, drawdown, volatility, sector | CoinMarketCap Startup covers every listed coin (Bitstamp covers only ten) |
| Assets and each asset's page | price history, indicators, returns | **Yes**, with the indicator library (RSI, MACD, Bollinger bands, ATR, ADX and others) ported from the old code with exact-parity tests (`docs/audit.md` §7) | same |
| BTC cycle: cycle table | each peak and low, drawdown, days | **Yes** (already in `crypto_cycle`, shown as percentages) | same |
| BTC cycle: quantile bands | quantile regression with a "replication gate" | **No** (hard rule 1: follows a paper by the compared service's founder and is calibrated to his numbers) | — |
| BTC cycle: risk scorecard and composite | every metric as a 0–1 percentile, families, composite | **No** (hard rule 1: the scorecard's layout and the 0–1 "risk" idea come from that service's confidential memos; hard rule 3) | — |
| BTC cycle: midterm-year table | monthly returns in US midterm years | **No** (memo-shaped analog, D011). Plain monthly and quarterly return tables are already there | — |
| Valuation | fee and revenue multiples, holder yield, dilution, grades A–F | **Reframed**: the multiples as numbers, with no grades | **Paid data**: protocol fees and revenue. DefiLlama Pro API is US$300/month (its commercial terms still to confirm in writing); Token Terminal's API is priced on request |
| Breadth | dominance ex-stablecoins, advance-decline line, % above average, names beating BTC, correlations | **Yes** | CoinMarketCap Startup (market caps, the top 100, categories); correlations from prices |
| Sectors | sector indices (equal and cap weighted), relative-strength chart | **Yes** for sector indices built from our own sector list; the relative-strength chart only under a neutral name ("Relative Rotation Graph" is another firm's trademark) | CoinMarketCap Startup |
| Derivatives | funding rates by venue, open interest, basis, implied volatility | **Yes** | **Paid data**: CoinGlass's commercial API plans start at US$299/month (its terms on display and redistribution still to confirm); implied volatility needs Deribit's permission |
| Macro: net liquidity, policy path, rates, inflation, labour, claims | | **Yes**, from the agencies that publish them (BLS, BEA, the Fed Board, Treasury), free; the 10y–2y and 10y–3m spreads computed from Treasury yields | free, public domain |
| Macro: VIX, high-yield spread, S&P 500, financial conditions | | **Partly**: VIX (Cboe) and the Chicago Fed's conditions index with permission or a licence; the high-yield spread (ICE) and the S&P 500 index (S&P) only with their owners' licences; equity exposure through ETFs with a display licence (Tiingo US$250/month) | see plan §4 |
| Macro: liquidity and business-cycle composites | 0–1 composites | **No** (hard rule 1: their structure came from the memos). The underlying series are shown individually | — |
| Geopolitics | news-theme spikes, geopolitical-risk and policy-uncertainty indices, event-market odds | **Later, if wanted**: GDELT allows commercial use with citation; the risk indices and event markets need their terms checked | mostly free |
| Radar and low-cap screener | ranked list of names | **No** as a ranking (reads as picks: hard rule 3). A neutral "largest moves this week" table can replace it | CoinMarketCap Startup |
| Source health | every source's last fetch | **Yes**, as an owners-only status page (the platform already logs every run) | — |
| Portfolio (planned P5) | book monitor, deployment tranches, open items, Australian CGT discount tracker | see the next section | — |

## Portfolio rebalancing

You live in Australia and the product is sold worldwide. Three different things go by the name "rebalancing", and
they carry very different legal weight. This is general information, not legal advice; the lawyer decides (plan §5).

| Version | What the user does | What it tells them | Legal weight | Recommendation |
|---|---|---|---|---|
| **A. Your own tool** | the two of you enter your own holdings and targets | your own drift and trades | none: it is your own portfolio, not a product | Build it now if you want it, as an owners-only page that no subscriber can reach (the tier check already makes that easy) |
| **B. A rebalancing lab (education)** | a subscriber picks a hypothetical basket, weights and a rule (monthly, quarterly, or when drift passes X%) | how that rule *would have* behaved in the past against not rebalancing: return, drawdown, volatility, number of trades | low to moderate: no real holdings, no forward-looking suggestion, no "trade now". Australia has specific rules for financial calculators, so the lawyer confirms | **Recommended for the product**, Research tier, after the lawyer's view. A distinctive feature the compared service does not frame this way |
| **C. Personal rebalancing** | a subscriber enters their real holdings and targets | which trades to make now | high: telling a person what to trade, based on their own holdings, is close to the textbook definition of personal financial advice, which in Australia needs a licence (whether a particular crypto-asset counts as a financial product is itself a question for the lawyer). Keeping the holdings in the browser protects privacy but does not change the advice question | **Not without a licence and the lawyer's written view.** It would also need your written approval to relax hard rule 3 |

## What changes in the order of work

The plan's phases are updated (plan §9, as revised 2026-10-21): rebuilding the terminal's licensed parts becomes
Phase 2, the paid-data sections Phase 3, and the rebalancing lab Phase 4, after the lawyer's view.
