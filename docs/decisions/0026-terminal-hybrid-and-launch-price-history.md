# 0026 — A markets terminal with personal tools, and the price history for a public launch

- **Date:** 2026-11-25
- **Status:** Accepted. The owners asked for the terminal on 2026-11-25. They left the dataset question to us
  ("I'll leave it to u to decide"), so part 1 is our call, open to their reversal.

## 1. Where bitcoin's long price history comes from at launch

The owners don't want data costs before revenue, and no free source of a long price history allows commercial use
(`docs/charts.md`, plan §12.2). The choice is ours, in this order:

1. **Private previews (now):** Bitstamp's own history, as today. Nobody outside the owners sees it.
2. **Send the Bitstamp letter now** (drafted, plan §12.2). It is free to ask, and a small-business licence may be free
   or cheap. If Bitstamp licenses it, use that and skip step 3.
3. **Public launch, if there is still neither a licence nor revenue for CoinMarketCap Startup (US$79/month):** use
   the openly labelled Kaggle copy of Bitstamp's bitcoin history (uploader *mczielinski*, labelled CC BY-SA 4.0).
   We checked it against Bitstamp's own candles: the closes match to the cent.
   - Credit it as its licence requires: "Bitcoin history: Kaggle dataset by mczielinski, CC BY-SA 4.0, derived from
     Bitstamp".
   - Use it only for bitcoin before the period that CoinMarketCap's free plan covers.
   - Record the risk in `config/sources.yaml`. The uploader may not have had the right to license Bitstamp's data
     (plan §12.2: "an uploader cannot give away rights they never had"). If Bitstamp or anyone else objects, those
     pages come down the same day. This is why the copy is a fallback and never the first choice.
   - Replace it with a licensed source as soon as revenue allows (CoinMarketCap Startup, or Bitstamp's licence).
4. **Never:** datasets derived from Yahoo Finance (its terms forbid redistribution), and Mt. Gox's trade records
   (taken from a hacked exchange, and of uncertain ownership).

Until step 3 is taken, `sources.launch_blockers()` still blocks a public site that shows Bitstamp's prices.

## 2. A markets terminal with personal tools (the owners' request of 2026-11-25)

The owners asked for "more like CoinGecko… a crypto research terminal. With all the personal elements too… a
hybrid". It is built from our own designs and data, not by copying CoinGecko's pages:

- **Markets** (`/crypto`):
  - the biggest rises and falls today and this week;
  - one table of every coin priced in US dollars, sortable by any column, with a search box, stars and a
    "watchlist only" switch;
  - pairs priced in bitcoin are linked below the table, so every column compares like with like.
- **Coin pages** (`/crypto/<coin>`):
  - the price and its 1-day, 7-day, 30-day and 1-year changes;
  - key figures: highest and lowest close and their dates, fall from the high, volatility, first close;
  - the 52-week and all-time ranges with today's place in them;
  - every chart in the library for that coin, each labelled with the plan it needs.
- **My coins** (`/portfolio`):
  - a watchlist;
  - a portfolio tracker: the visitor enters amounts and, optionally, the price paid. The tracker values each coin at
    the latest daily close and shows its share of the total and the change since the price paid.
- **Site search** in the header, over coins, live charts, lessons and the main pages.
- **The visitor's starting point is remembered:** after choosing a path on `/start`, the front page offers it again.

The rules these follow:

- **Personal data stays in the visitor's browser** (`localStorage`). No account, nothing sent to us, nothing stored on
  the server, and no privacy policy needed for it yet. A unit test fails if `public/terminal.js` gains any way to send
  data. Clearing the browser's data removes it, and the page says so.
- **The tracker is a calculator, not advice** (hard rule 3). It only multiplies and adds. It never suggests changing
  anything, never compares the portfolio with a target or a "model" mix, and never asks about goals or money beyond
  the numbers the visitor types in. The educational rebalancing lab (Phase 2) stays a separate lesson with made-up
  portfolios.
- **The pages work without the script.** Every row, link and label is rendered by the server (hidden where needed);
  `public/terminal.js` only sorts, filters, shows, hides and does arithmetic. Static copies (`export-static.mjs`)
  inline that one script and drop the rest.
- **Free tier.** Every figure on these pages comes from the free `crypto_market` model, so tier checks are unchanged,
  and the tier-leak suite covers `/portfolio`.

## Not yet

- **Market capitalisation, rank by size, and more than ten coins:** these need CoinMarketCap's free plan, which
  allows commercial display. It waits for the owners' free API key. The table then gains market cap, volume and
  circulating supply, and its order follows market cap.
- **A portfolio kept across devices:** needs accounts (Phase 1), and then a privacy policy.
