# The chart library: what each chart needs, and what needs a licence

**Date:** 2026-11-01. **Why this exists:** the owners asked for the comprehensive build, with a clear line between
what can be shown for free and what needs a licence. The same information is on the site itself: every chart in
the library (`/charts`) carries a tag saying where its data comes from and whether that data is free, needs a
licence, or costs money (`web/lib/chart-catalogue.ts`, text in `web/messages/en.json`, `charts.data`). Evidence for
every source is in `config/sources.yaml`; the research is summarised below.

The chart set was chosen from public definitions of common crypto analytics. The compared paid service's
proprietary "risk" family (its 0–1 score and the views built on it) is not built, and no chart copies its design,
names or text (hard rule 1).

## What is built (2026-11-01)

| Topic | Charts | Model | Data | Status |
|---|---|---|---|---|
| Price and long averages | multiplier bands (350-day × 1.6…21), two-year × 5, 50/200-day and 200-week averages, 20/21-week band, Pi cycle lines, trend bands | crypto_charts, crypto_cycle, crypto_trend_bands | daily prices | live |
| Returns | running 1/2/4-year, year to date, monthly and quarterly calendars, seasonality, every coin since its first close | crypto_market, crypto_charts, crypto_cycle | daily prices | live |
| Cycle comparisons | after each halving, cycle low, cycle peak (overlaid) | crypto_market + crypto_cycle | daily prices | live |
| Momentum | RSI (daily, weekly), MACD, Bollinger bands | crypto_charts | daily prices | live |
| Risk | volatility (30/90/365 days), Sharpe and Sortino, drawdown | crypto_market, crypto_charts | daily prices | live |
| Against bitcoin | price in bitcoin, correlation, beta | crypto_charts | daily prices | live |
| Bitcoin network | supply and issuance, hash rate and difficulty, hash ribbons, stock-to-flow, halving countdown, Puell multiple | btc_network | the Bitcoin network (Puell also uses the price) | live |
| Market capitalisation | total, dominance, stablecoin ratio, without bitcoin, comparisons, heatmap, coins beating bitcoin | — | market caps | planned |
| On-chain | realised price and MVRV, supply in profit, HODL waves, coin days destroyed, terminal price, RHODL | — | every transaction + prices | planned |
| Derivatives | funding rates, open interest | — | derivatives venues | planned |
| Macro | net liquidity, money supply, rates and the yield curve, inflation and jobs | — | US agencies | planned |
| Traditional markets | stock indices, the dollar and gold | — | index vendors | planned |

The free tier is education first: the Crypto basics course (`/learn`), the glossary, today's prices and the free
price pages. The chart library is the Charts tier (and the trend bands the Research tier), set in
`config/entitlements.yaml`.

## Each kind of data: source, licence and cost

| Data | Free source allowed for a paid site? | What we use / would use | Cost |
|---|---|---|---|
| **Long daily price history** (BTC from 2010–11, ETH from 2015) | **No.** Every exchange and free aggregator checked forbids commercial display or storage (Bitstamp, Coinbase, Kraken, Gemini, Binance, Bitfinex, Luno, Independent Reserve, HTX, Blockchain.com, Yahoo, Google, CF Benchmarks, Coin Metrics, Glassnode, Chainlink…). Free datasets labelled CC0 or CC BY are re-uploads of exchange or vendor data. | Preview: Bitstamp (development and private preview only). Launch: Bitstamp's licence (fee not published) or **CoinMarketCap Startup** | from **US$79/month** |
| Recent prices (about one year) | **Yes:** CoinMarketCap's free Basic API plan includes commercial use for one product (credit "Data provided by CoinMarketCap.com"). Its terms allow storing data only "temporarily … to the extent necessary", so building our own archive from it needs CoinMarketCap's written confirmation (letter drafted). | the stopgap if nothing is paid | free |
| **Bitcoin network** (blocks: supply, issuance, difficulty, hash rate) | **Yes.** The peer-to-peer network has no operator and no terms; headers are verified here by their proof of work. | `collectors/bitcoin_network` (built) | free |
| Market caps, dominance | CoinMarketCap Basic: commercial, one year of history. Longer: Startup (from 2013 for market-wide totals). CoinGecko's free plan does not allow it. | not built | free (1 year) / US$79 |
| On-chain (every transaction) | The data is public and free, but needs our own Bitcoin node (free software, about 1 TB of SSD, a day or two to sync). Open Bitcoin Metrics (CC BY 4.0) gives coin days destroyed, dormancy, supply and more to 2026-06-28 as a starting point. Realised price, MVRV and supply in profit also need the long price history. | not built | free + a computer (or about US$20–40/month for a server) |
| Stablecoin supply | Read on-chain from Ethereum and Tron; free public RPC providers' terms restrict reuse, so it needs our own nodes, or market caps from CoinMarketCap. | not built | via CoinMarketCap |
| **US macro** | **Yes**, from the agencies themselves: Treasury Fiscal Data (explicitly commercial), Treasury yields and the Federal Reserve Board (public domain, cite), BLS (public domain, cite; free key), BEA (with its notice). The New York Fed's terms have a "same permissions" clause for the lawyer; the Fed's H.4.1 already covers reverse repos, so it is not needed. Not FRED's service (needs consent). | not built | free |
| Derivatives (funding, open interest) | No free source allows commercial display. | not built | from about US$299/month |
| Stock indices, dollar index, gold | Index values belong to their providers; a display licence is needed. | not built | from about US$250/month |

## Order of the remaining work

1. **Macro** from the US agencies (free): net liquidity (Fed H.4.1: total assets minus the Treasury General Account
   minus reverse repos), M2 (H.6), Treasury yields and the curve, CPI and unemployment (BLS key needed).
2. **Market caps** from CoinMarketCap's free plan once the owners create the API key: current dominance, the
   heatmap, market-cap comparisons, coins beating bitcoin; history builds up from then (if CoinMarketCap confirms we
   may keep it).
3. **On-chain** once there is a Bitcoin node (the owners' computer or a small server): coin days destroyed, dormancy
   and age bands first (no price needed), realised price and MVRV once a long price history is licensed.
4. **Paid data** only on the owners' decision: the long price history (US$79/month) first, since most charts and
   the public launch depend on it.
