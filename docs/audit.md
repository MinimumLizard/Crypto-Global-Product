# Phase 0 audit: the old Crypto terminal

**Date:** 2026-10-19. **Read-only:** nothing in the old repository was changed; it was cloned from GitHub and from the
safety bundle (below). **Builds on** the shared platform's audit of 2026-10-11 (TBD@ca7e44c `docs/audit.md` §4, §7,
§8), which looked at the same code commit; this audit re-checks it, measures the data as it stands today, and decides
what this product takes.

| | |
|---|---|
| Repository | github.com/MinimumLizard/Crypto (public) |
| Code branch | `claude/minilizard-crypto-terminal-e6g100`, commit `4dc446a` (2026-10-04; unchanged since the 2026-10-11 audit) |
| Data branch | `data`, commit `3b8a566` ("Data update (2026-10-19)": still collecting daily) |
| Live site | minimumlizard.github.io/Crypto/ answered HTTP 200 on 2026-10-19 (a single-page app; the HTML shell is 1,154 bytes) |
| History | 74 commits: 29 on the code branch, 45 on `data` |
| Safety copy | `Crypto.bundle` (107 MB) + `Crypto.files.sha256` (703 files) + `Crypto.refs`, made by `scripts/backup_repos.sh`; restore-tested, every `data` file re-checked against its fingerprint. Not in git. |

Every number below comes from a command; the commands are in Appendix A.

---

## 1. Summary

1. **It is a personal research terminal, not a product.** About 20 free data sources, 15 calculations, 13 pages, a
   personal portfolio plan and a trading-signal engine. It is well engineered (289 tests pass) and honest about its
   limits, but almost none of its data may be used commercially, and several of its calculations conflict with this
   product's hard rules.
2. **Hard rule 1 (never imitate the paid service) rules out a large part of it.** The tool's own records say five
   *confidential* memos from the paid crypto-research service this product is compared with, and a paper by that
   service's founder, were used to decide what to build (old repo `docs/DECISIONS.md` D011; `docs/SPEC.md` §6.5, §7.2,
   §7.3, §13). They shaped the 0–1 "normalised risk" score and its composites, the cycle "risk scorecard" ("laid out
   like the memos' table"), the liquidity and business-cycle composites, some cycle analogs, and the quantile bands
   (calibrated to reproduce the founder's published parameters). **None of these is ported, under any name.** The
   memos themselves were never committed: no path under `private/` exists in any of the 74 commits (Appendix A).
3. **Hard rule 3 (information only) rules out the rest of the questionable parts:** the "GET IN / GET OUT" regime
   engine, valuation grades A–F, the low-cap screener, key levels and the "50-week rule" confirmations, and the
   personal portfolio plan (buy order, tranches, next buy).
4. **What is worth porting is small and generic:** the indicator library (RSI, MACD inputs, Bollinger inputs, ATR and
   others, written to TradingView's published definitions), some cycle price maths (running ROI, ROI from cycle peaks
   and lows), correlations, and the net-liquidity arithmetic. Each is ported with an exact-parity test against the old
   code (§7). The three crypto models already in this repository were built separately, from public definitions, in
   the shared platform (decision 0019); they did not come from this tool.
5. **Its data cannot simply move over.** Prices come from Binance, Coinbase and Hyperliquid; on-chain data from Coin
   Metrics' community tier; market caps from CoinGecko's free plan; fundamentals from DefiLlama. All of these prohibit
   commercial use or need a paid licence (§4). The product gets its own history from licensed sources instead. The old
   data is archived whole, for the record, and is never shown in the product.
6. **The 24 days of daily snapshots no API can re-serve** (supply, top 100, derivatives, order-book depth, event odds,
   governance; 2026-09-26 to 2026-10-19) are safe in the bundle. They came from sources that prohibit or have not
   granted commercial use, so their value to the product is as a private record only.

---

## 2. What it collects

| Family | Source and endpoint | Stored as (data branch) | Files | Rows | Range |
|---|---|---|---|---|---|
| Daily and hourly prices (OHLCV) | Binance market data (`data-api.binance.vision`), Coinbase Exchange candles, Hyperliquid `candleSnapshot`; per venue, never merged | `ohlcv/{symbol}/{venue}/{year}` | 292 | 92,671 | 2010-07-18 → 2026-10-19 |
| BTC and ETH on-chain (31 metrics; realized cap and others derived) | Coin Metrics community API | `onchain/btc`, `onchain/eth` | 33 | 178,000 | 2010-01-01 → 2026-10-18 |
| Market caps and supply | CoinGecko (Demo key) | `onchain/cg_*` | 52 | 19,900 | 2025-09-27 → 2026-10-19 |
| Funding rates | Hyperliquid `fundingHistory`, `predictedFundings` (which also carries Binance and Bybit rates) | `onchain/funding_*`, `snapshots/funding_hourly_*` | 63 | 134,740 | 2026-05-29 → 2026-10-19 |
| Options, implied volatility (DVOL), basis | Deribit public API | `onchain/deribit_*`, `onchain/market` | 3 | 4,293 | 2017-11-29 → 2026-10-19 |
| Sentiment | alternative.me Fear & Greed; Wikimedia pageviews | `onchain/sentiment` | 4 | 13,291 | 2015-07-01 → 2026-10-19 |
| Protocol fees, revenue, TVL, stablecoins, hacks | DefiLlama | `fundamentals/*`, `snapshots/stablecoin*`, `snapshots/security_incidents` | 79 | 124,851 | 2011-01-31 → 2026-10-19 |
| Macro (32 series) | FRED API, with the fetch time of each vintage | `macro/*` | 32 | 137,340 | 1990-01-01 → 2026-10-16 |
| Geopolitics | GDELT; GPR index (`.xls`); EPU (CSV); Polymarket; Kalshi | `snapshots/gdelt_themes`, `risk_gpr`, `risk_epu`, `event_markets` | 8 | 126,588 | 1985-01-01 → 2026-10-19 |
| Governance, news, calendar | Snapshot; Aave Discourse RSS; CoinDesk RSS; SEC RSS; Federal Reserve FOMC page; GitHub API | `snapshots/governance`, `feeds`, `calendar` | 6 | 735 | |
| Daily snapshots no API serves as history | CoinGecko (supply, top 100, global), Hyperliquid (perp contexts, depth, funding by venue) | `snapshots/{supply,top100,global,perp_contexts,depth,funding_by_venue}` | 12 | 24,000 | **2026-09-26 → 2026-10-19** (24 days; supply and top 100 miss 2026-09-29) |
| Run log | every fetch | `source_health.parquet` | 1 | 11,328 | 2026-09-24 → 2026-10-19 |
| **Total** | | | **585 Parquet files** | **867,943** | |

(Row counts are rounded where a family spans several of the inventory's groups; the exact per-group counts are in
Appendix A. The 2026-10-11 audit measured 846,530 rows in 585 files; the growth is eight more days of collection.)

**How it runs.** `daily.yml` at 00:20 UTC builds everything and redeploys the site; `keepalive.yml` weekly; `ci.yml` on
push. A source that fails is logged in `source_health` and never fails the build, so there is no alerting. Writes
are upserts (a re-fetch silently replaces a stored row), raw responses are discarded, and the plan proposes squashing
the data branch. These are the weaknesses the shared platform's design was built to fix (raw archive, append-only
facts, gap check, dead-man's switch).

---

## 3. What it computes

Numbering follows the 2026-10-11 audit. The last column is this product's decision; §6 and §7 give the reasons.

| # | Calculation | Code (old repo) | Decision |
|---|---|---|---|
| X1 | Indicator library to TradingView's published definitions: SMA, RMA, EMA, RSI, stochastic, CCI, MFI, true range, ATR, DMI/ADX, Supertrend, Ichimoku, OBV, anchored VWAP, pivots | `pipeline/signals/indicators.py` (385 lines, 11 tests) | **Port** RSI, EMA/MACD inputs, SMA/standard deviation for Bollinger bands, ATR; exact parity (§7) |
| X2 | "MiniLizard" regime score (±100), BULL/NEUTRAL/BEAR, **GET IN / GET OUT** | `pipeline/signals/minilizard.py` | **Personal; not ported.** Trading signals (hard rule 3). Its parity was never verified (no TradingView reference values) |
| X3 | Asymmetric quadratic quantile bands for BTC | `pipeline/signals/quantile.py` | **Not ported (hard rule 1).** Follows a paper by the compared service's founder and is gated on reproducing its published parameters |
| X4 | Normalised "risk" (0–1) per metric and weighted composites | `pipeline/metrics/risk.py`, `config/composites.yaml` | **Not ported (hard rules 1 and 3).** A 0–1 score of this kind is the compared service's signature product |
| X5 | Cycle analogs: cycle detection from all-time highs, ROI from peak and from bottom, days since, midterm-year monthly table, YTD ROI, halving countdown | `pipeline/metrics/cycle.py` (22 tests) | **Port** running ROI and ROI from cycle peaks and lows (public methods; partly in `crypto_cycle` already). **Not ported:** the midterm-year table, presidential-term paths and the "2019 analog" (memo-shaped framing, D011 item 5) |
| X6 | Weekly bars, 50-week "rule" confirmations, key levels, returns | `pipeline/metrics/levels.py` (26 tests) | **Port** `to_weekly` (the open week is dropped) for comparison only. **Not ported:** the "rule" and key levels (signal framing) |
| X7 | Valuation multiples, holder yield, dilution, grades A–F, reverse DCF | `pipeline/metrics/valuation.py` | **Not ported.** Grades are evaluations (hard rule 3); inputs are unlicensed |
| X8 | Funding (annualised per venue), open interest, basis, DVOL | `pipeline/metrics/derivs.py` | **Deferred:** no licensed derivatives source yet |
| X9 | Dominance ex-stablecoins, advance-decline line, % above average, assets beating BTC over 90 days, correlations | `pipeline/metrics/breadth.py` | **Port** correlations now (prices only); dominance and an altcoin index later, on licensed market caps, from public definitions |
| X10 | Sector indices, relative rotation graph | `pipeline/metrics/sectors.py` | **Deferred** (needs licensed caps); RRG not planned |
| X11 | Macro: net liquidity and its 13-week change, rates table, commodities, labour, claims, inflation, policy path, next FOMC, 0–1 composites | `pipeline/metrics/macro.py` (18 tests) | **Port** the net-liquidity arithmetic (public formula), on source-agency data. **Not ported:** the 0–1 composites (memo-shaped, D011 items 3–4) |
| X12 | Geopolitics: theme spikes, oil chain, GPR, EPU, event odds | `pipeline/metrics/geopolitics.py` | **Deferred;** not in the product vision |
| X13 | Catalyst radar and low-cap screener (ranked list) | `pipeline/metrics/radar.py` | **Not ported:** a ranked list reads as picks (hard rule 3) |
| X14 | News tagging, governance, security incidents | fetchers, `radar.py` | **Not ported:** third-party headlines; not in the vision |
| X15 | Deployment tracker, buy order, tiers, drift, next buy | `registry.py`, `config/assets.yaml`, `weights.yaml` (secret) | **Personal; never ported** |

---

## 4. Every data source and its licence status

Status vocabulary as in `config/sources.yaml` (decision 0009). "Evidence" is where the shared platform or this audit
read the terms; dates are when they were read.

| Source | Used for | Status for this product | Evidence |
|---|---|---|---|
| Binance market data (`data-api.binance.vision`) | prices | **prohibited** | Dataset terms titled "Terms of Use (Non-Commercial)" (2026-10-11) |
| Coinbase Exchange | prices | **prohibited** | Market Data Terms: "personal or research purposes" (2026-10-11) |
| Hyperliquid API | prices, funding, depth | unknown: no data licence found; enquiry needed | 2026-10-11 |
| Coin Metrics community | on-chain | **prohibited** | CC BY-NC 4.0 (2026-10-11) |
| CoinGecko, Demo plan | caps, supply, top 100 | **prohibited** (free plan) | API terms §6.2; paid plans allow commercial use (2026-10-11) |
| DefiLlama | fees, TVL, stablecoins, hacks | **prohibited** without written permission | Terms 24 Jun 2025 (2026-10-11) |
| Deribit public API | options, DVOL | unknown; exchanges usually license redistribution separately | 2026-10-11 |
| FRED API | 32 macro series | **the FRED service itself needs the St. Louis Fed's written consent for commercial use** (full terms, "Prohibitions"); per series see below | fred.stlouisfed.org/legal, read 2026-10-19 |
| alternative.me Fear & Greed | sentiment | **allowed**, attribution beside the data | 2026-10-18 |
| Wikimedia pageviews | attention | believed public domain (CC0); confirm | 2026-10-11 |
| GDELT | geopolitics | **allowed** with citation | 2026-10-11 |
| GPR index (Caldara–Iacoviello) | geopolitics | unknown; academic dataset, citation requested | 2026-10-11 |
| EPU (policyuncertainty.com) | geopolitics | unknown on the site; the FRED copy (USEPUINDXD) is tagged public domain | FRED tag, 2026-10-19 |
| Polymarket, Kalshi | event odds | unknown; not reviewed | |
| Snapshot, Aave Discourse | governance | unknown | |
| CoinDesk RSS | news | third-party copyright (headlines) | |
| SEC RSS, Federal Reserve FOMC page | calendar, news | US public-sector material | |
| GitHub API | developer activity | GitHub terms; low priority | |
| TradingView Lightweight Charts | the old site's charts | Apache-2.0 with attribution | |

**The 32 FRED series, by FRED's own rights tag** (each series page, read 2026-10-19). What the tags mean, from
FRED's terms: *public domain* series "may be used without permission"; *copyrighted, citation required* series may
be used "with proper attribution of the source", and both kinds "may be displayed in ... newsletters, or reports to
clients" with attribution; *pre-approval required* series "may only be used for non-commercial educational or
personal use".

| Rights tag | Series | Originating agency |
|---|---|---|
| Public domain: citation requested (22) | CPIAUCSL, CPILFESL, UNRATE, PAYEMS, JTSLDL | BLS |
| | PCEPILFE | BEA |
| | ICSA, CCSA | Department of Labor |
| | UNDCONTSA | Census Bureau |
| | M2SL, WALCL, DFF, DGS2, DGS10, DFII10, DTWEXBGS, DEXUSAL | Federal Reserve Board (H.4.1, H.6, H.10, H.15) |
| | WTREGEN | Treasury, via the Fed's H.4.1 |
| | DCOILBRENTEU, DCOILWTICO | EIA |
| | USEPUINDXD, SAHMREALTIME | Baker–Bloom–Davis; Claudia Sahm |
| Copyrighted: citation required (8) | SOFR, RRPONTSYD | Federal Reserve Bank of New York |
| | NFCI | Federal Reserve Bank of Chicago |
| | T10YIE, T10Y2Y, T10Y3M | St. Louis Fed's own calculations (the two spreads can be computed from public-domain Treasury yields instead) |
| | VIXCLS | Cboe |
| | MEDLISPRIUS | Realtor.com |
| Copyrighted: pre-approval required (2) | BAMLH0A0HYM2 | ICE Data Indices ("Reproduction ... prohibited except with the prior written permission") |
| | SP500 | S&P Dow Jones Indices |

**Consequence for the plan:** take public-domain series from the originating agency's own API (BLS, BEA, the Fed
Board's Data Download Program, Treasury, EIA), not from FRED, so the FRED service's commercial-use clause does not
apply; use FRED for development and cross-checks. Copyrighted series need the owner's terms (New York Fed, Chicago
Fed, Cboe) or are dropped; the two pre-approval series are out.

---

## 5. What is personal-only

These exist for one person's own investing and are never ported:

- `config/assets.yaml`: a 21-name "book" with sectors, tiers, custody, gas, thesis and triggers, plus a buy order;
  `config/weights.yaml` (target weights, kept out of git, D009); `config/portfolio_prefs.yaml` (order size).
- X15, the deployment tracker: "unplaced in buy order", "next buy", tranches, drift.
- X2, the MiniLizard regime engine and its GET IN / GET OUT signals. Whose Pine source it reproduces is an open
  question (the 2026-10-11 audit, question 8); either way it is a trading signal and stays out.
- `config/alerts.yaml` (quiet hours in the owner's time zone), DEXUSAL "because the owner reports in AUD".
- The `private/` folder the specification refers to (Pine sources, personal notes, the memos and the paper). It was
  never committed; it is not in the bundle; this product must not use it.

---

## 6. Hard-rule findings

| Finding | Rule | Where | Consequence |
|---|---|---|---|
| Design decisions were taken from five confidential memos of the compared paid service | 1 | old `docs/DECISIONS.md` D011; `docs/SPEC.md` §6.5, §13 | Nothing the memos shaped is ported: X4 and its composites, the scorecard layout, the liquidity and business-cycle composites, the midterm-year and presidential-term analogs, the "2019 analog". The ROI-as-ratio convention is not adopted either: this product shows returns as percentages, as `crypto_cycle` already does |
| A model follows a paper by the compared service's founder and is calibrated to reproduce its parameters | 1 | `signals/quantile.py`, SPEC §7.2 | Not ported. Even if the paper is public, calibrating to it is systematic comparison with that service, and the product could not name its source without using the founder's name |
| A 0–1 position score built from a detrended, percentile-ranked price | 1, 3 | `metrics/risk.py` | Not ported. The product's only 0–1 number is `crypto_trend_bands`' "position between the fitted bands", shown as a description and only after a lawyer's view (decision 0019) |
| GET IN / GET OUT, buy order, next buy, tranches | 3 | X2, X15 | Not ported |
| Valuation grades A–F; ranked screener | 3 | X7, X13 | Not ported |
| Commercially unusable data throughout | 2 | §4 | No data migrates into the product; history comes from licensed sources |
| Repository and site are public, with personal configuration in them | 5 (as it stood) | `config/assets.yaml` | Owner's decision on 2026-10-19: repositories stay public until a paid GitHub plan (decision 0021). Nothing secret is committed there; the weights are gitignored |

The old project was careful (its own D011 forbids copying memo text, charts or names), so this is not a finding of
copying. It is a finding of provenance: the choice of what to build was informed by confidential material, and this
product's rule is stricter than that project's.

---

## 7. What to port, with exact-parity tests

Port first, improve second (architecture §15; decision 0015 rule 5). Version 1.0.0 of each ported calculation
reproduces the old code exactly on identical inputs; any improvement is a later version beside it.

**How parity is proven** (as the shared platform's bond and stock parity runs did, decision 0015 rule 7):

1. Pin the old code at `4dc446a` and import it from a read-only clone (never vendored into this repo).
2. Feed the old function and the new model the **same** input: Bitstamp daily candles from this platform's database
   (so the test needs no unlicensed data), written to the old code's expected layout in a temporary folder.
3. Compare every output value: dates and counts exactly; floating point within 1e-9 absolute or relative; NaN where
   the old code returns NaN (warm-up periods).
4. Write the report (counts and differences only, never data) to `docs/migration/parity-crypto-<model>.json`. Run in
   CI on demand, like the shared platform's `parity` job.

Values shown on the site will differ from the old site's, because the venue differs (Bitstamp, not Binance or
Coinbase). Parity proves the arithmetic; the cross-checks in `docs/research/crypto-crosscheck.md` prove the data.

| New model (proposed) | Old code | Inputs | Outputs and parity check | Old tests to carry over |
|---|---|---|---|---|
| `crypto_indicators` 1.0.0 | `indicators.rsi`, `ema`, `sma`, `rma`, `atr`, `true_range` | daily close, high, low per pair | RSI(14); MACD(12, 26, 9) built from `ema`; Bollinger(20, 2σ) built from `sma` and the population standard deviation; ATR(14). Each series equal to the old function's output at 1e-9, including the seed bars | `tests/test_indicators.py` (11) |
| `crypto_cycle` 1.1.0 (adds to the current model) | `cycle.roi_from_peak`, `roi_from_bottom`, `ytd_roi` | daily close | running 365-day return and the return since each cycle peak and low, aligned on days since. Parity on identical cycle anchors: the old `find_cycles` and the new model's epoch peaks must first agree on the anchor dates (a separate exact test), then the paths at 1e-9 | `tests/test_cycle.py` (the 22, less the midterm-year tests) |
| `crypto_correlations` 1.0.0 | `breadth.correlations` | daily closes | 90-day rolling correlation of daily returns between each pair and BTC; equal at 1e-9 | `tests/test_breadth.py` (correlation tests) |
| `macro_liquidity` 1.0.0 (with the macro sources) | `macro.net_liquidity` | WALCL, WTREGEN, RRPONTSYD (units pinned, as the old unit test does) | net liquidity and its 13-week change; equal at 1e-9 on the same three series. Waits on a licensed route for RRPONTSYD (New York Fed terms) | `tests/test_macro.py` (net-liquidity tests) |
| comparison only, no model | `levels.to_weekly`, `levels.sma` | daily close | the weekly closes `crypto_cycle` uses for its 200-week and 20-week averages agree with the old weekly bars (open week dropped) on every complete week | `tests/test_levels.py` (weekly tests) |

The old suite (289 passed, 2 skipped on 2026-10-19) is the baseline. The two skips are the MiniLizard parity test (no
reference values exist) and the quantile calibration gate (needs the real price history beside the code); with the
data in place the 2026-10-11 audit measured 290 passed, 1 skipped.

---

## 8. What happens to the old repository and site (for the migration plan; nothing is done yet)

Nothing changes until you approve a migration plan (hard rule). The proposal for that plan:

1. **Keep it running unchanged** until the new product's crypto pages are live and you are happy with them.
2. **Archive its history into this platform's raw archive** as `legacy_crypto` (as the shared platform's
   `migration/legacy.py` did for the other tools): every file at the current commit of both branches, checked
   against `Crypto.files.sha256`, plus the bundle. Internal only: none of it is shown, because its sources do not
   allow it.
3. **Then stop its daily workflow** (your action on GitHub), keep the repository read-only, and leave the site up or
   take it down as you prefer. Nothing is deleted, and no history is rewritten; the plan's proposed squash of the
   `data` branch must not happen.

---

## Appendix A. How the numbers were measured

| Number | Command (run from the scratchpad, read-only) |
|---|---|
| commits, branches, files, fingerprints, restore test | `bash scripts/backup_repos.sh <out>`, then `sha256sum -c SHA256SUMS` and the per-file check in its README |
| no `private/` path ever committed | `git log --all --name-only --format= \| grep -c '^private/'` on a mirror clone → 0 |
| files, rows and ranges per group (585 files, 867,943 rows, hash of hashes `1391c56d28828371`) | `uv run --with pyarrow python -I inventory.py <data checkout>` (reads Parquet only) |
| snapshot days | `snapshots.py` (distinct `as_of` dates per table) |
| old test suite | `uv run --frozen --extra dev pytest -q` in a code checkout → 289 passed, 2 skipped |
| FRED rights tags | each series page on fred.stlouisfed.org, Tags list, 2026-10-19 |
| live site | `curl -w "%{http_code}" https://minimumlizard.github.io/Crypto/` → 200 |
