# 0027 — Use Bitstamp's data without asking for a licence first

- **Date:** 2026-11-26
- **Status:** Accepted (the owner, 2026-11-26: "forget about bitstamp just use their data for now and if there are
  any issues we'll use other data then okay").

## Decision

- **Don't send the Bitstamp licence request.** Keep using Bitstamp's public daily candles as the price source.
- **If Bitstamp objects, or anything else goes wrong with that data**, switch to another source. The fallbacks:
  - CoinMarketCap's free plan for the last year;
  - the Kaggle CC BY-SA copy of Bitstamp's bitcoin history (decision 0026);
  - a paid licence once there is revenue.
- This replaces the "send the Bitstamp letter now" step in decision 0026.

## What it does not change yet

- **The private preview needs nothing new.** It already uses Bitstamp's data, and only the owners see it.
- **The code blocker stays for now.** `sources.launch_blockers()` still lists Bitstamp's agreement, so
  `publish-site.yml` will not put the site on the public internet. Lifting it is a one-line change in
  `config/sources.yaml`, made when the owners say "go public". Doing it then keeps the public launch a deliberate
  step: the lawyer's view (plan §5) is still open.
- **Hard rule 2 is relaxed for Bitstamp only**, on the owner's written instruction above. Every other source still
  needs terms that allow commercial use.

## The risk the owners accepted

- Bitstamp's terms say its market data needs a licence for commercial use.
- If it objects after launch, we take its prices down the same day and switch to a fallback.
- The fallbacks cover only bitcoin's long history (Kaggle) and the last year of every coin (CoinMarketCap free).
  The long histories of the other coins would be lost until a paid source.
