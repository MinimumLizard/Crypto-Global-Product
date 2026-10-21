# Plan: a subscription research terminal for crypto and global markets

**Status:** Phase 0 proposal, **awaiting the owners' approval**. Nothing here is bought, signed or launched.
**Date:** 2026-10-19 (prices and terms checked on that day; sources in §11). **Updated 2026-10-21** with the owners'
first answers: the name is **Cointrigue**, the tiers and prices are approved, crypto comes first (decision 0022);
their questions on incorporation, Whop and data licences are answered in §12.
**Reads with:** `docs/audit.md` (the old Crypto terminal), `docs/architecture.md` (how the platform works),
`docs/research/crypto-itc-review.md` (the compared paid service: offer, prices, what is public, what not to copy),
`docs/decisions/` (one record per decision).

---

## 0. In one page

**What exists today (Phase 0, done).** A working platform copied from the shared one: raw archive, append-only
database, collectors, model plug-ins, a website whose tier check runs only on the server, a weekly e-mail built through
the same check, and a tier-leak test suite that attacks every page, API route and e-mail as every tier. Three crypto
models on Bitstamp's daily prices since 2011 pass 30 cross-checks against public reference points. All tests pass,
locally and in CI. The old Crypto terminal is backed up, verified and audited; it keeps running untouched.

**What the product is.** A research service in four tiers: a free weekly e-mail with the main bitcoin and ether
figures and education; a chart library; macro and global markets with your written (and later video) analysis; and a
small premium tier with a members' call. It is built only from published methods and licensed data, and it is
information and education, never advice.

**What it needs from you before anything is public** (each is explained below):

| # | Decision or action | Why it blocks | Section |
|---|---|---|---|
| 1 | **Where the company is incorporated, and who the customers are.** The owners would rather start without a company and take payments through Whop: §12.1 sets out what that means | Decides the lawyer, the payment provider, the privacy law and the advice rules | §5, §8, §12.1 |
| 2 | **A lawyer's view** on the questions in §5 | Advice rules for crypto and market research differ by country; the founders' own analysis is the riskiest part | §5 |
| 3 | ~~The name~~ **Cointrigue** (decision 0022). Still open: the domain (`.com` is taken; §12.3) and a trademark search | Domain, accounts and letters need it | §7, §12.3 |
| 4 | **Send the Bitstamp licence request** (draft ready), and decide whether CoinMarketCap's US$79/month plan should be the price source instead | Every crypto page needs licensed prices | §4, §12.2 |
| 5 | **A data budget** (§6: about US$80/month for crypto market caps, US$250/month for US end-of-day prices with display rights, on-chain later) | Decides which indicators come first | §4, §6 |
| 6 | **The weekly content commitment** (§2: about 8–14 hours a week between you at launch) | The paid tiers are mostly your analysis | §2 |
| 7 | ~~Approve the tiers, their names and prices~~ **Approved** (decision 0022) | | §1 |
| 8 | **Who owns the platform code** copied from the other company's repository | Needs an assignment or licence between the two companies | §5 |

---

## 1. The product and its tiers

### 1.1 What the compared service offers (public pages only; details in `docs/research/crypto-itc-review.md`)

Four plans: a free tier (weekly newsletter, a few long-run charts); about US$49/month for "all risk indicators and
historical charts" (150+ charts); about US$109/month adding three weekly videos, a private chat group, a macro
section and an indicator builder (300+ charts); and a US$9,700 / 3-month one-to-one tier for five members. Its core is
a proprietary 0–1 "risk" score and the founder's own analysis. **We copy none of it:** no risk score, no names, no
charts, no text, no calibration against it (hard rule 1).

### 1.2 Our version (proposal for you to edit)

Tier names are neutral and descriptive, and avoid the compared service's plan names (Lite, Standard, Pro, Direct
Access). The internal ids in `config/entitlements.yaml` stay `free < plus < pro < professional`; only the names shown
to people change, in one message file.

| Tier (proposed name) | Internal id | Proposed price | What it includes |
|---|---|---|---|
| **Free** | `free` | US$0 | The weekly e-mail (numbers for everyone, plus a short note from you); bitcoin and ether prices, returns, drawdowns and volatility; every Learn page and method page; the archive of free notes |
| **Charts** | `plus` | US$19/month or US$190/year | The full crypto chart library with full history: long averages, Pi cycle lines, halvings and the cycle table, monthly and quarterly returns, RSI, MACD, Bollinger bands, correlations, dominance and an altcoin index (as licensed data arrives, §4); alerts when a measure crosses a level the subscriber chooses (after the lawyer's view, §5) |
| **Research** | `pro` | US$49/month or US$490/year | Everything in Charts; macro and global markets (inflation, jobs, central-bank rates, yield curves, the dollar, gold, equity indices and sectors); bitcoin's long-run trend bands; your weekly written analysis and its archive; later, video and the members' community |
| **Research + Calls** | `professional` | US$149/month, capped at about 30 members | Everything in Research; a monthly members' call with Q&A on the published research (never on anyone's own holdings: §5) |

Why these prices: a new name without an audience cannot charge the compared service's prices at first. US$19 is an
impulse price for a chart library; US$49 matches the compared service's lower tier for a bigger offer. At the costs in
§6, about 15–30 paying subscribers cover the fixed costs. Prices are a business decision: change them freely.

What the free tier sees of paid models is decided per model in `config/entitlements.yaml` (for example, the cycle
measures a week late), and enforced on the server and in the e-mail.

---

## 2. The content you and Janu would produce, and how the platform supports it

Much of the compared service's value is its founder's own analysis. The data and charts here can be built once and
run themselves; the analysis cannot. This is the honest weekly workload.

### 2.1 Weekly (at launch)

| Piece | Tier | Length | Time (estimate) | Who |
|---|---|---|---|---|
| **Free e-mail note**: 150–250 words on what moved this week, above the automatic figures | Free | short | 1 hour | either |
| **Crypto note**: what the charts show this week (cycle measures, drawdowns, volatility, correlations), with 3–5 charts | Research | 800–1,200 words | 3–4 hours | one of you |
| **Macro and markets note**: inflation, jobs, rates, the curve, the dollar, gold, equities (from Phase 3) | Research | 600–1,000 words | 3–4 hours | the other |
| **Review and copy check** of both notes before publishing (the build's copy lint also checks them) | — | — | 1 hour | the one who didn't write it |
| **Reading feedback** (the feedback job) | — | — | 30 minutes | either |
| **Total** | | | **about 8–10 hours a week** (crypto only: about 5) | |

### 2.2 Later (each is a separate decision)

| Piece | Tier | Time | Note |
|---|---|---|---|
| One 15–25 minute video a week (screen recording of the week's charts) | Research | 3–4 hours | The compared service's top tier offers three; one is plenty to start |
| Community moderation | Research | 2–3 hours a week | People talking to each other changes the legal picture (§5) |
| Monthly members' call (60 minutes plus preparation) | Research + Calls | about 3 hours a month | Only on the published research; recorded; never on anyone's holdings |

**The writing rule that matters most** (hard rule 3): describe what the data shows and how it compares with history;
never say what to do, never give a price target or a "zone", never say what price something "should" be. The copy
lint catches the obvious words; it cannot catch a sentence like "bitcoin is likely to reach X". That is what the review
step and the lawyer's guidance (§5) are for.

### 2.3 How the platform supports it (to build in Phase 1)

- **Publishing workflow.** Each note is a Markdown file in `content/notes/<date>-<slug>.md` with a short header (title,
  date, tier, market, the free excerpt). You write it in GitHub's web editor (or any editor) and open a pull request.
  CI runs the copy lint on it like any other text; the preview deployment shows it exactly as it will appear, for the
  tier it is set to. Merging publishes it. Charts in a note are embedded by name (for example
  `{{chart crypto_cycle btcusd sma_200w}}`), so they are drawn from the live models, through the same tier check, not
  pasted as images. *Why files in git rather than a content system:* nothing new to pay for or learn, every edit is on
  record, and the copy lint and the tier check already cover files. If writing in GitHub turns out to be awkward, a
  small owner-only editor page can write the same files later.
- **The weekly e-mail per tier.** One e-mail per tier per week (Saturday morning UTC), built by
  `web/lib/email/weekly.ts` through the tier check: the automatic figures, then the week's notes (the free excerpt
  and an invitation for lower tiers; the full note for the tier it belongs to). Everyone on a tier gets the same
  e-mail. Sending: Resend (§6). The tier-leak suite already checks the e-mail; it will also check the notes.
- **The archive.** `/notes` lists every note by date and market; each note's page shows the full text to its tier and
  the excerpt to others. Search by market and month.
- **Video** (later). Hosted on Bunny Stream with signed, expiring links issued only after the tier check; the page
  never contains a playable link for a visitor below the tier.
- **Community** (later). Discord with a bot that gives and removes the members' role from the subscription record, or
  Circle (about US$89/month, a hosted community with paid gating). Decide after the lawyer's view.

---

## 3. Indicators: order and method

All from published definitions, each with a METHOD.md, tests, a point-in-time test and (where the old tool computed
it) an exact-parity test (`docs/audit.md` §7).

| Order | Indicators | Data | Licence status | Phase |
|---|---|---|---|---|
| 1 | Existing: returns, drawdown, volatility; long averages, 200-week average, 20W/21W band, Mayer multiple, Pi cycle lines, halvings, cycle table, monthly returns; log-regression and power-law bands | Bitstamp | DLA to sign | done |
| 2 | RSI, MACD, Bollinger bands, ATR; rolling correlations; quarterly returns; running 1-year return and returns from cycle peaks and lows | Bitstamp | as above | 2 |
| 3 | Fear & Greed, with alternative.me's attribution beside every display | alternative.me | allowed with attribution | 2 |
| 4 | Market-cap dominance (BTC, ETH, stablecoins), an altcoin index (share of the top 50, ex stablecoins and wrapped tokens, beating BTC over 90 days), the ETH/BTC market-cap ratio | CoinMarketCap Startup | commercial use included; confirm in writing (letter ready) | 2 |
| 5 | Macro: CPI and core CPI, PCE, payrolls, unemployment and the Sahm rule (computed by us), claims, job openings, the Fed funds rate, the Fed's balance sheet and net liquidity, the Treasury yield curve and its 10y−2y and 10y−3m spreads (computed by us), the Fed's broad dollar index, oil | BLS, BEA, Department of Labor, the Federal Reserve Board, Treasury, EIA: each agency's own API | public domain (US government works); cite the agency | 3 |
| 6 | Index and sector performance (the S&P 500, Nasdaq-100, world regions and the eleven US sectors through the ETFs that track them), gold (through a gold ETF), returns and drawdowns | Tiingo end-of-day with display licence | US$250/month start-up licence | 3 |
| 7 | Other central banks' rates and inflation (ECB, Bank of England, Bank of Japan and others) | each bank's or statistics office's own data | most allow reuse with attribution; to confirm one by one | 3 |
| 8 | Valuation series (P/E, cyclically adjusted P/E, earnings) | needs licensed fundamentals or index data | not yet found at a sensible price | later |
| 9 | On-chain: realized price, MVRV, supply in profit, Puell multiple | Glassnode Professional with redistribution rights (price on request), or our own Bitcoin node | licence or own node | 4 |

**Why ETFs for indices.** Index values belong to their owners (S&P, Nasdaq, MSCI, FTSE Russell), who license display
separately and expensively; FRED marks its S&P 500 series "pre-approval required" and allows only non-commercial use.
The ETFs that track them are exchange-traded prices that Tiingo's display licence covers. The pages say "the SPDR S&P
500 ETF (SPY)", never "the S&P 500", and note that an ETF's price includes its fees and dividends policy.

**On-chain, the choice.** Glassnode's terms allow commercial use only on its Professional plan, with redistribution
rights bought on top (price on request). Our own node is allowed (public chain, open-source software) but means a
dedicated server with about 1 TB of fast disk (the full chain was about 760 GB in August 2026), an indexer, and
upkeep, which is against your preference for managed services. Recommendation: ask Glassnode for a quote in Phase 3;
build the node only if the quote is out of reach.

---

## 4. Data sources and licences: the short list

The rule (decision 0009): a source is used only if its terms allow commercial use or are silent, with the evidence in
`config/sources.yaml`. Free crypto APIs mostly prohibit it (`docs/research/data-sources-2026-10-18.md`).

| Need | Choice | Price | Terms, in short | Status | Alternatives |
|---|---|---|---|---|---|
| Crypto prices, 2011 on | **Bitstamp** | not published | Commercial use and redistribution once a Data License Agreement is signed | **launch blocker**; request drafted (`docs/letters/`) | Kraken (needs permission); CoinGecko Analyst US$129/month (attribution "Data provided by CoinGecko"; daily history from 2013 only) |
| Crypto market caps, supply | **CoinMarketCap Startup** | US$79/month (US$948/year) | "Commercial use rights", one product up to 100,000 users, data must be part of a larger product, no resale | to confirm in writing (letter drafted), then subscribe | CoinGecko Analyst US$129/month |
| Sentiment | **alternative.me Fear & Greed** | free | Commercial use allowed with attribution right next to the data | ready | — |
| US macro | **BLS, BEA, Department of Labor, Federal Reserve Board, Treasury, EIA** (their own APIs) | free (BLS and BEA need a free key) | US government works: public domain; cite the agency | ready | FRED for development only: its full terms need the St. Louis Fed's written consent for commercial use of the service, and 10 of the old tool's 32 series are third-party copyrighted (`docs/audit.md` §4) |
| Other central banks, international | ECB, Bank of England, OECD, World Bank and others | free | Mostly reuse with attribution (several under CC BY 4.0) | **to confirm one by one** in Phase 3 | — |
| US equities and ETFs, end of day | **Tiingo, "EOD + IEX Redistribution", start-up** | US$250/month (US$500 for "enterprise") | Explicit "display redistribution" licence; US equities, ETFs and mutual funds from 1962 | ready to buy when Phase 3 starts | Massive (formerly Polygon) business plans from US$2,499/month; EODHD, Twelve Data, Financial Modeling Prep: commercial or display use only by custom agreement (FMP's standard terms forbid it) |
| Index values themselves | index owners (S&P DJI, Nasdaq, MSCI) | quotes needed | Display licences | not planned; ETFs instead (§3) | — |
| Gold | through a gold ETF (Tiingo) | in the Tiingo licence | as above | Phase 3 | LBMA prices are licensed; FRED's gold series were third-party |
| On-chain | **Glassnode Professional + redistribution rights** | on request | Commercial use only on Professional; redistribution rights purchased separately | quote in Phase 3 | CryptoQuant (its data-distribution policy was unreadable here: confirm); Coin Metrics (paid licence; community tier is CC BY-NC); own node |

**Monthly data cost by phase:** launch (crypto) ≈ US$79 + Bitstamp's fee; with macro and global markets ≈ US$329 +
Bitstamp; with on-chain, add Glassnode's quote.

---

## 5. Legal questions for the lawyer

These reduce risk; they do not replace advice. Put them to a lawyer in the country where the company is incorporated,
with a view on the main customer countries.

1. **Jurisdiction.** Where should the company be incorporated, given where you and Janu live and work, where the
   customers will be (worldwide, English-speaking first), and the payment provider (Stripe does not serve Sri Lankan
   businesses; it does serve Australia, the UK, Singapore and the US, §8)? The old tool's records suggest at least
   one founder works in Australian time and reports in Australian dollars.
2. **Information versus advice, by country.** Is a subscription that publishes charts, statistics, education and the
   founders' written and video analysis of crypto and markets "advice" anywhere you sell it? Specifically: Australia
   (general advice and the licensing of financial services, and the new rules for digital assets); the US (the
   publisher's exclusion for impersonal, regularly published research); the UK (the regime for promoting
   crypto-assets to consumers); the EU (whether research on crypto-assets is an authorised service under MiCA);
   Sri Lanka (the Central Bank's 2023 statement urging those "engaged in promoting and facilitating the promotion of
   investing and trading in cryptocurrency to refrain from such activities", and the SEC's approach), while either
   founder lives or markets there.
3. **The riskiest features, one by one:** the 0–1 "position between the fitted bands" (hard rule 3: shown only as a
   description and only after this view); user-chosen alerts; the members' call; the community (members talking to
   each other); the founders' own written analysis and video. What wording and process keep each on the right side?
4. **Disclaimers** (`compliance/disclaimers.yaml`): the wording, and any country-specific notices.
5. **The compared service.** Confirm that building from published definitions, never subscribing to calibrate,
   never using its names, and the old tool's provenance finding (`docs/audit.md` §6) leave no exposure.
6. **Ownership of the platform code** copied from the other company's repository (decision 0020): an assignment or a
   licence between the two companies, and who may use later improvements.
7. **Data licences:** review Bitstamp's agreement and CoinMarketCap's confirmation before signing.
8. **The name:** a proper trademark search in the chosen countries before buying the domain (§7 is only an
   obvious-conflict check).
9. **Consumer and subscription law:** automatic renewal and cancellation rules, refunds and cooling-off periods in the
   customer countries; terms of service.
10. **Privacy:** accounts, e-mail lists and the feedback form under the applicable privacy laws (for example
    Australia's Privacy Act, the UK and EU GDPR); a privacy policy; consent for marketing e-mail.
11. **Tax:** sales tax, VAT and GST on digital subscriptions sold worldwide (Stripe Tax can collect it; registration
    is still yours, §8).
12. **Employment:** does either founder's employer restrict publishing market research or running this business?

---

## 6. Costs (US$ per month, checked 2026-10-19)

| Item | Launch (0–500 subscribers) | 5,000 on the list, ~500 paying | Basis |
|---|---|---|---|
| Supabase Pro (production) | 25 | 25–40 | US$25 including US$10 compute credit (one Micro instance); Small is US$15 |
| Supabase staging project | 10 | 10 | one Micro instance |
| Vercel Pro | 20–40 | 40 | US$20 per developer seat, US$20 usage credit; the free plan forbids commercial use |
| Cloudflare R2 + Backblaze B2 | 0–2 | 1–3 | a few GB of raw files |
| Resend: transactional (log-in links, receipts) | 0–20 | 20 | free 3,000/month (100/day); Pro US$20 for 50,000 |
| Resend: weekly e-mail to the list | 0–40 | 180 | free up to 1,000 contacts; US$40 for 5,000; US$180 for 25,000 |
| GitHub Team (private repositories, when you choose) | 0–8 | 8 | US$4 per user; the repository is public for now (decision 0021) |
| Healthchecks.io, domain | 2–7 | 2–7 | |
| Video (Bunny Stream), later | 1–10 | 10–30 | from US$0.01/GB stored, US$0.005/GB delivered |
| Community (Circle), later and optional | 0 | 89 | Discord with a bot instead: about US$0 |
| **Platform subtotal** | **≈ 60–150** | **≈ 300–430** | |
| Data: CoinMarketCap Startup | 79 | 79 | |
| Data: Tiingo display licence (from Phase 3) | 0 | 250 | |
| Data: Bitstamp | unknown | unknown | request sent in Phase 1 |
| Data: on-chain | 0 | quote | Phase 4 |
| **Fixed total, before Bitstamp and on-chain** | **≈ 140–230** | **≈ 630–760** | |
| Payments (Stripe, Australia as an example) | per sale | per sale | 1.65% + A$0.30 domestic cards, 3.5% + A$0.30 international, +2% if converted; Billing 0.7%; Stripe Tax 0.5% |
| Legal | quote | — | one-off advice in §5, per country |

**Break-even, roughly:** at launch about 10–15 Charts subscribers (US$19) cover the fixed costs; with macro and
global markets, about 15 Research subscribers (US$49). Your time (§2) is the real cost.

---

## 7. The name

Neutral, global, easy to say, no hype or advice words ("signals", "alpha", "edge", "profit"), nothing that echoes the
compared service ("verse", "risk", "metric"). Each was checked on 2026-10-19 for a free .com domain (Verisign's
registry: no registration found) and for obvious conflicts among financial or crypto businesses (web search). **This
is not a trademark search**: the lawyer should run one (USPTO, EUIPO, UK IPO, IP Australia, WIPO) before you buy.

| Name | .com | Obvious conflicts found | Notes |
|---|---|---|---|
| **Long Run Markets** (recommended) | longrunmarkets.com: free | none | Plain English everywhere; says "long horizons, not trading"; fits cycles and macro equally |
| **Long Horizon Markets** | longhorizonmarkets.com: free | none (the phrase is common in investing) | Similar idea; a little longer |
| **Fieldnote Markets** | fieldnotemarkets.com: free | none in finance; "Field Notes" is a notebook brand (another class of goods) | Suggests observation and record-keeping, not advice |
| Even Keel Research | evenkeelresearch.com: free | an Australian fund product called "Even Keel Strategy" | Avoid if the company is Australian |
| Observatory Markets | observatorymarkets.com: free | similar names: "Coin Observatory" (a crypto research firm), "Market Observation" (a newsletter) | Fits "information only", but crowded |
| *Rejected* | | Sextant (Saturna Capital's Sextant funds); Orrery (an existing prediction-market research product); Lantern Markets (an options start-up; Lantern Finance, crypto lending); about 30 others already registered as .com | |

Until you choose, the site uses the placeholder "Research Terminal" and a neutral mark.

---

## 8. Payments and accounts

- **Payments: Stripe**, with Stripe Billing (subscriptions) and Stripe Tax. Stripe serves businesses in Australia, the
  UK, Singapore and the US (not Sri Lanka), so it depends on §5 question 1. Its restricted-business list does not
  prohibit a market-information publisher (crypto exchanges, wallets and "other financial services" need approval;
  "get rich quick" claims are prohibited): describe the business accurately when applying.
- **Not Paddle.** Paddle (a merchant of record that would handle worldwide tax for 5% + 50¢) lists among products it
  does not allow "cryptocurrencies", "trading and financial services/advice" and "investment or financial advice,
  including trading signals and strategies". A crypto research subscription would probably be refused.
- **Accounts and logins:** Supabase Auth, e-mail magic links first (no passwords to manage). The subscription record
  (from Stripe's webhooks) sets the tier; `web/lib/viewer.ts` is the one file that changes.
- **Hosting:** Vercel Pro for the site, Supabase Pro for the database. **Region:** where most customers are; if
  undecided, a US or EU region (decision 0004 reopened it).
- **E-mail:** Resend for log-in links, receipts and the weekly e-mail. A separate sending domain for the newsletter.

---

## 9. Order of work (each phase ends with a stop for your approval)

*Revised 2026-10-21* after the owners' answers: payments through Whop rather than Stripe (§12.1), crypto first
(decision 0022), the MiniLizard terminal's licensed parts rebuilt (`docs/minilizard-gap.md`), and a rebalancing lab
after the lawyer's view.

| Phase | What I build | What you do meanwhile | Ends when |
|---|---|---|---|
| **0 (approved 2026-10-21)** | Safety copy, the platform port, the audit, this plan, the private preview, the blue and white retail look (decision 0023) | read and decide (§0) | ~~you approve~~ approved |
| **1. Foundations: a real site you can log into** | The site online on Vercel with its database on Supabase, behind a password until a price licence is signed; Whop memberships setting each subscriber's tier (Whop's API and webhooks); notes publishing (§2.3) and the archive; the weekly e-mail sending through Resend; a CoinMarketCap collector for prices and market caps if you choose it (§12.2); the old terminal's history archived (`docs/audit.md` §8) | ask Whop to approve the category; send the Bitstamp and CoinMarketCap letters; create the Vercel, Supabase, Resend and Whop accounts and the domain; the ABN and a written agreement between you (§12.1) | you can log in to the live site, subscribe in Whop's test mode, see your tier's pages, and publish a note |
| **2. The terminal** | The MiniLizard terminal's licensed parts, rebuilt: the ticker strip; the grid of every tracked name; each asset's page with the indicator library (ported with exact-parity tests); long averages and weekly-close facts; the cycle page; breadth (dominance, names above their averages, names beating bitcoin); sectors; correlations; Fear & Greed; quarterly and running returns. **The rebalancing lab** (decision 0023; `docs/minilizard-gap.md` version B), shown publicly only after the lawyer's view. Optionally the macro page from free public-domain agency data (net liquidity, rates, inflation, labour) | write the first notes; the lawyer's view (§5) | the Charts tier is complete and live behind the password |
| **Launch** | Switch-on checklist: a price source whose terms allow display, with `config/sources.yaml` updated; the lawyer's view applied (including the 0–1 band position and the rebalancing lab); terms, privacy policy, disclaimers; monitoring live; a restore test passed; the password removed | approve the launch; set up the Whop business (§12.1) | the site is public and taking payments |
| **3. Paid-data sections** | Each only if you choose to pay for its data: derivatives (CoinGlass, from US$299/month); valuation multiples (protocol fees and revenue, DefiLlama Pro US$300/month or Token Terminal); on-chain (Glassnode quote or our own node); global markets (Tiingo US$250/month) | decide each against its cost | each is its own approval |
| **4. Community** | Video, community, the members' call (the rebalancing lab moved to Phase 2: decision 0023) | decide each | each is its own approval |

**The old Crypto terminal** keeps running untouched until you approve its migration plan (`docs/audit.md` §8); the
proposal is to archive it in Phase 1 and stop its daily job only after the new crypto pages are live.

---

## 10. Risks

| Risk | Effect | Mitigation |
|---|---|---|
| Bitstamp's fee is too high, or it declines | No licensed crypto price history | CoinGecko Analyst (US$129/month, daily from 2013) or Kraken by permission; the collector framework makes a second source a small job |
| The lawyer finds the founders' analysis or the members' call is advice where you sell | The paid tiers' main content changes | Ask early (Phase 1); keep everything impersonal, published to all subscribers alike, never about anyone's holdings |
| Not enough time for weekly writing | Paid tiers feel empty | Start with crypto only (about 5 hours a week); the automatic figures carry the free e-mail |
| A data vendor changes its terms | A section must switch off | Rights are configuration (`config/sources.yaml`); history stays archived internally |
| The repository is public (decision 0021) | Plans and code are visible to competitors | Nothing secret is committed (CI checks); make it private with a paid GitHub plan when convenient |

---

## 11. Sources (read 2026-10-19 unless stated)

- Compared service's plans and terms: `docs/research/crypto-itc-review.md` (read 2026-10-18).
- CoinMarketCap API pricing and licence FAQ: https://coinmarketcap.com/api/pricing/
- CoinGecko API pricing and licence FAQ: https://www.coingecko.com/en/api/pricing
- Tiingo end-of-day licence prices: https://www.tiingo.com/products/end-of-day-stock-price-data and
  https://www.tiingo.com/about/pricing
- Massive (formerly Polygon) business plans: https://massive.com/business; individual plans: https://massive.com/pricing
- EODHD plans: https://eodhd.com/pricing; Twelve Data plans: https://twelvedata.com/pricing
- Financial Modeling Prep terms: https://site.financialmodelingprep.com/terms-of-service
- Glassnode terms (updated 2026-05-21): https://studio.glassnode.com/terms-and-conditions
- FRED terms: https://fred.stlouisfed.org/legal/; each series page for its rights tag (`docs/audit.md` §4)
- Bitcoin chain size (about 760 GB, August 2026): https://www.spark.money/tools/bitcoin-node-storage-calculator
- Stripe countries: https://stripe.com/global; Stripe restricted businesses: https://stripe.com/legal/restricted-businesses;
  Stripe Australia fees: https://stripe.com/au/pricing; Stripe Tax: https://stripe.com/tax/pricing
- Paddle pricing: https://www.paddle.com/pricing; Paddle's prohibited products:
  https://paddle.com/support/what-products-am-i-not-allowed-to-sell-on-paddle
- Supabase: https://supabase.com/pricing; Vercel: https://vercel.com/pricing; Resend: https://resend.com/pricing;
  GitHub: https://github.com/pricing; Bunny Stream: https://bunny.net/pricing/stream/; Circle: https://circle.so/pricing
- Domain registrations: Verisign RDAP, https://rdap.verisign.com/com/v1/domain/<name>.com

---

## 12. The owners' questions of 2026-10-21

### 12.1 Starting without a company, and taking payments through Whop

*The owners' position:* not incorporated yet; customers worldwide; the two of them run it. The owner lives in
Australia (Australian and Sri Lankan citizen); Janu lives in Sri Lanka (Sri Lankan citizen) (owner, 2026-10-21). The
idea is to sell through Whop and skip incorporating for now. Janu already has a personal Whop account.

**What Whop is and charges** (its own fee page, docs.whop.com/fees, read 2026-10-21): a platform for selling
memberships, communities and digital products, with checkout and Discord or Telegram access built in. Card payments
cost 2.7% + US$0.30, plus 1.5% for international cards and 1% when currency is converted; collecting sales tax is an
optional 2%; disputes cost US$15 each; payouts cost from US$2.50 (US bank) to a country-dependent fee abroad.
Identity is verified by Whop's verification provider (an ID and a selfie); an individual can be verified without a
company. Whop pays out to "over 200 different countries", Australia and Sri Lanka among them, in the payout country's
own currency (docs.whop.com, set-up-payouts and payout-methods pages, read 2026-10-21). **Expect about 5–7% of each
sale in total, before payout fees.** Listing on Whop's marketplace also lets its affiliates promote the product for a
default 30% commission, which can be changed per product.

**Setting up the business with two people** (docs.whop.com, manage-team-roles page and Terms of Service, read
2026-10-21). Each person keeps their own personal Whop account. One of them creates the business ("Start selling")
from their account, then invites the other by e-mail (Dashboard → Team) with a role. Whop has five roles; **Owner**
has "full access to everything", including payouts, withdrawals and the API keys, and can invite "other Owners", so
both of you can be Owners. Whop's terms add one rule to settle between you first: "The owner of the first Linked
Account with a payment method connected to your account is considered the owner of all associated revenue", and Whop
does not mediate disputes between partners. So agree in writing who links the payout bank account, in which country
(Australia in AUD, or Sri Lanka in LKR), before anyone links one: it decides whose income it is in Whop's records and,
in practice, which country's tax rules apply first.

**Whether Whop will accept this product** (its "What is not allowed" page, read 2026-10-21): selling cryptocurrencies
is prohibited, but "Whop may permit educational or informational content" that "doesn't involve direct sales,
exchanges, or investment solicitation"; crypto is a restricted category that needs Whop's approval through its
support team. Investment products offered without registration are prohibited, and any earnings claims must be
"accurate, substantiated, and not misleading". *The owners' decision (0023):* no advance request to Whop; Whop's own
sign-up review sees the website and the product description, so those must describe the product exactly as it is
(charts, statistics, education and written analysis; no trading, no custody, no personal advice, no "signals").
Many communities on Whop sell trading signals; Cointrigue's pages, marketing and listing must not look like one of
them.

**How Whop enforces its rules** (its community guidelines, suspension and risk-score pages, read 2026-10-21; and
sellers' public reviews, which are one side of the story): mostly **after** you start selling, through your money.
Whop scores each account's risk; if it cannot verify what a seller sells, it pauses payouts and asks for proof; its
Trust & Safety team can withhold payouts, hold funds in reserve for up to 120 days (the card-dispute window), refund
customers, claw back withdrawals, suspend the account or ban it. Appeals go to support within 30 days. In one public
case a seller said support had approved their business model, and Whop later suspended it anyway for falling into
a prohibited financial category, holding the balance for up to 120 days; Whop replied that earlier guidance "does not
constitute approval" of a business outside its policies. Whop's payment partners (Stripe among them) can also refuse
a category on their own. So the practical risk is not a refusal at sign-up but money held later. Hence: keep every
page and the listing plainly educational, avoid earnings claims, keep refunds simple, and do not let a large balance
build up on Whop (withdraw regularly).

**What not incorporating means** (general information, not legal or tax advice; the lawyer and an accountant confirm):

- You can legally sell before forming a company. But the business still exists in law: two people running a business
  together for profit are usually treated as a **partnership**, and each partner is **personally liable** for the
  business's debts and for claims against it, including a customer who says the research cost them money. A company
  limits that liability to the company's own assets.
- **Tax** is due in each partner's country of tax residence on their share. In Australia, a person carrying on a
  business normally needs an ABN (free), and must register for GST once turnover reaches A$75,000 a year (check both
  with the ATO). In Sri Lanka, the Inland Revenue rules apply to Janu's share. Where the account holder lives decides
  which country's rules apply to Whop's payouts: **which country does each of you live in, for tax?**
- **Contracts usually need a party:** a data licence (Bitstamp, CoinMarketCap), a domain and the cloud accounts can be
  signed by an individual, but a vendor may prefer a company, and the person who signs is personally bound.
- **The advice rules do not depend on having a company.** Whether the founders' written analysis or the members' call
  counts as financial advice (§5, question 2) is the same question either way. The Central Bank of Sri Lanka's 2023
  statement on "promoting" crypto (§5) is relevant while either of you lives in, or markets to, Sri Lanka.
- **Between the two of you:** a short written agreement (who owns the name, the code and the content, how money is
  split, what happens if one leaves) protects you both, company or not.

**Recommendation.**
1. ~~Ask Whop for written approval first~~ (the owners chose not to: decision 0023).
2. Start as individuals: one Whop business with both of you as Owners, the payout account chosen on purpose (above),
   an ABN if the Australian side carries on the business, and a written agreement between you. Enable Whop's tax
   collection (2%); Whop's terms say it is merchant of record only for card-network purposes, so you remain the
   supplier for tax and consumer law.
3. Form a company (an Australian Pty Ltd costs about A$636 to register and A$342 a year, per third-party summaries of
   ASIC's 2026 fees: check asic.gov.au) before signing a data licence that costs real money, or as soon as revenue is
   steady, mainly to limit personal liability.
4. Get the lawyer's view on the advice question (§5) before charging anyone, with or without a company.

**For the platform:** Whop changes Phase 1. Instead of building a Stripe checkout, subscribers would pay on Whop, and
the site would learn each subscriber's tier from Whop (Whop has an API and sends webhooks when a membership starts or
ends). `web/lib/viewer.ts` remains the one place a tier is read, and the tier-leak tests stay as they are. Whop's
Discord integration could also handle the community (§2.2).

### 12.2 Licensed prices without Bitstamp

**Why a licence at all.** An exchange's price history is its data, and its terms say what others may do with it.
Bitstamp's terms allow commercial use once its Data License Agreement is signed. The free crypto APIs mostly forbid
commercial use (`docs/research/data-sources-2026-10-18.md`). Free datasets on sites such as Kaggle are copies of exchange
data; an uploader's "CC0" or "public domain" label does not override the exchange's terms, because the uploader never
had those rights to give away.

**What a Bitstamp licence costs.** Not published. Bitstamp's API page sends commercial users to partners@bitstamp.net
for the agreement, and nothing public gives a figure. Market-data licences in general range very widely (one
industry overview cites US$32 to over US$20,000 a month per exchange, mostly for traditional exchanges). The only way
to know is to ask; the request is drafted and costs nothing to send.

**How the compared service gets its data.** Nothing public says, and finding out by subscribing or probing its
service would break hard rule 1. Research services of this kind usually license aggregated data from paid providers,
which is the route below.

**The licensed alternatives, without negotiation** (each is a paid plan whose terms include commercial use):

| Option | Price | History | Terms | Trade-off |
|---|---|---|---|---|
| **CoinMarketCap Startup** | US$79/month (US$948/year) | daily price and market-cap quotes over the whole of its data; market-wide totals (for dominance) from 2013 | commercial use for one product up to 100,000 users; data must be part of a larger product; no resale; confirm in writing (letter drafted) | One source for prices **and** market caps, which the plan needs anyway (dominance, altcoin index). Prices are an average across exchanges, not one exchange. Its plan table says daily history "from 2010", but its bitcoin records are believed to begin on 28 April 2013 (confirm with a test download before relying on it); if so, bitcoin's 2011–2013 history is lost: the 200-week average then starts in 2017 instead of 2015, and the two 2013 Pi cycle crossings disappear |
| **CoinGecko Analyst** | US$129/month | daily from 2013; daily open/high/low/close from 2018 | commercial use; "Data provided by CoinGecko" with a link beside the data | Dearer and shorter than CoinMarketCap for this purpose |
| **Bitstamp Data License Agreement** | unknown | daily from 2011-09-14 (measured) | commercial use and redistribution once signed | Longest bitcoin history from one exchange; already built and cross-checked; price and timing unknown |

**Recommendation.** Send the Bitstamp request now. Plan on CoinMarketCap Startup either way (it is needed for market
caps). If Bitstamp is expensive or slow, switch the price source to CoinMarketCap: a new collector and a re-run of
the cross-checks, about a week of work, with the history trade-off above stated on every page it affects. Until one
of the two is licensed, the site can be shown privately (as the 2026-10-21 preview is) but not published.

### 12.3 The name

Cointrigue (decision 0022). `cointrigue.com` was registered by someone else on 2023-06-28 through GoDaddy and shows a
parked page; it may be for sale (GoDaddy's domain broker service can ask the owner, for a fee plus the price).
`cointrigue.io`, `.co`, `.app`, `.net` and `.xyz` were free on 2026-10-21. No business using the name turned up in a
web search. A trademark search (USPTO, IP Australia, EUIPO, UK IPO) is still needed before marketing.

### 12.4 Crypto first

Agreed (decision 0022). The order of work becomes: Phase 1 (foundations, now built around Whop if it approves), then
Phase 2 (the crypto chart library); macro and global markets (Phase 3) only if you decide to add them after seeing
the site. That also defers the US$250/month equity data licence.

### 12.5 Seeing the live website

- **Now:** a private, clickable copy of the site on real Bitstamp prices (to the 20 October close) was published for
  you as a private claude.ai page (link in the session; open its Share menu only to share with Janu). The banner on
  each page switches between the Free view and the Research view. It is a snapshot: links, charts and tier views
  work, but the feedback form and sign-up do not.
- **A real site on the internet** needs three accounts in your names and a domain:
  1. **Vercel** (hosting the site): free Hobby plan for a private preview; Pro (US$20/month) once it is commercial;
  2. **Supabase** (the database): free plan for the preview; Pro (US$25/month) for launch;
  3. **GitHub Actions secrets** for the daily price collection (no new account; settings in this repository);
  4. the domain (§12.3).
  Until a price licence is signed, that site must sit behind a login or password, so it is not public. Adding a
  simple password gate is a small Phase 1 task.
