# Data sources for crypto (2026-10-18)

Research done in the shared platform (TBD@ca7e44c) for its crypto section, carried over on 2026-10-19 with its
non-crypto sections (Sri Lankan rates, inflation and the stock exchange's terms) removed. Every status is recorded with
its evidence in `config/sources.yaml`. This is not legal advice; every "silent" or "with agreement" source needs written
confirmation before paid use (decision 0009). The macro and global-markets sources are researched in `docs/plan.md`;
the old Crypto terminal's sources in `docs/audit.md` §4.

## Crypto price and on-chain data

No free source clearly allows commercial use of deep price history. These are the usable routes:

| Source | Status | What it gives |
|---|---|---|
| **Bitstamp**, under its Data License Agreement | Commercial use and redistribution allowed once signed; fee not published | BTC/USD daily and hourly from 2011-09-14 (measured), plus ETH and other majors |
| **CoinMarketCap Startup** (USD 79/month) | Explicit commercial licence for one product (up to 100k users) | All-time daily history across coins; market caps |
| **Running our own Bitcoin node** | Allowed (MIT software, public chain) | On-chain metrics (supply, hash rate, realized cap, MVRV). Needs about 2 TB of SSD and a small server, so deferred |
| alternative.me Fear & Greed | Allowed, with attribution beside the data | Sentiment index |

Prohibited or paid-only for us:
- **Exchanges:** Kraken, Gemini, OKX, Bybit, KuCoin, Crypto.com, Deribit, Coinbase, Binance.
- **Aggregators:** CoinGecko (free plan), CoinDesk/CryptoCompare (free tier retired May 2026), Messari, Kaiko,
  CoinPaprika (redistribution only on Enterprise), CoinCap.
- **On-chain providers:** Glassnode, CryptoQuant, Blockchain.com, Blockchair, Coin Metrics (CC BY-NC).
- **General finance sites:** Yahoo Finance.
- **Unclear:** mempool.space's hosted API says nothing on commercial use; ask before relying on it.

**Sri Lanka's position on crypto** (legal context while either founder lives in, or the product is marketed to, Sri Lanka):
- CBSL (2021): virtual currencies are not legal tender, and no entity is licensed to deal in them.
- CBSL (2023): crypto is "not recognized as an asset-class". It "urges those who are engaged in promoting and
  facilitating the promotion of investing and trading in cryptocurrency to refrain from such activities".
- The Cabinet approved a virtual-asset framework under the SEC on 2026-07-27; no law has passed yet.

So crypto pages are framed as global market information and education, in USD:
- no exchange links, no "how to get crypto" content;
- a crypto risk notice on every crypto page (`compliance/disclaimers.yaml`, `crypto_risk`), with any country-specific
  wording added on the lawyer's advice;
- a lawyer's view, in the company's jurisdiction, before anything is published. While either founder is in Sri Lanka
  or the product is marketed there, that view should cover the CBSL's 2023 "promoting" wording.
