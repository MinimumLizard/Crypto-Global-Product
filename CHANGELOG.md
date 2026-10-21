# Changelog

## 2026-10-21 (later) — A terminal look, the MiniLizard map, the phases revised

- **The site redesigned** after the owners said it looked "too AI-generated": dark by default (a light theme follows
  the visitor's setting), IBM Plex Sans with Plex Mono for every number, a brass accent, square panels with a heading
  row and a date chip, a ticker strip of every tracked asset's latest close under the header, today's UTC date, and
  the current section marked in the navigation. The front page is now a "today" screen: a briefing written from the
  day's closes (facts only), every asset in one table with 90-day trend lines, bitcoin's history, and bitcoin's long
  averages (Charts tier; free visitors see them a week late). Manrope removed; Plex is under the SIL Open Font
  Licence (`web/app/fonts/IBM-Plex-OFL.txt`). Chart colours no longer repeat the accent as the second series.
- The front page now shows `crypto_cycle`, so the tier-leak suite checks `/` for it too (`web/lib/routes.ts`).
- **`docs/minilizard-gap.md`**: every part of the old MiniLizard terminal mapped to what comes back, reframed, cannot
  come back (and which hard rule stops it), or needs paid data (with prices); three versions of portfolio rebalancing
  and their legal weight.
- **Plan §9 revised**: Phase 1 foundations (accounts through Whop, staging behind a password, notes, e-mail),
  Phase 2 the terminal's licensed parts, launch gate, Phase 3 paid-data sections, Phase 4 the rebalancing lab.
  Plan §12.1 records where the owners live and how Whop enforces its rules.
- The private preview republished with the new look (same link). Checks: Python 114 passed + 2 skipped, web unit 58,
  type check, build, tier-leak 28, copy lint clean.

## 2026-10-21 — The owners' first answers

- **Name: Cointrigue**; tier names (Free, Charts, Research, Research + Calls) and prices approved and shown on the plans
  page; crypto first (decision 0022). `cointrigue.com` is registered by someone else; other endings are free.
- **Plan §12:** starting without a company and selling through Whop (fees, Whop's approval for crypto education,
  liability and tax); licensed price data without Bitstamp (CoinMarketCap Startup, CoinGecko Analyst); the name; how
  to get a real live site.
- **A private clickable preview** of the site on real Bitstamp prices to the 2026-10-20 close (36 pages, Free and
  Research views), published for the owners only. The export banner's tier switch now says "Research".
- Bitstamp history refreshed in the development database (+22 candles); the models added only new rows and changed
  no earlier ones. Checks: web unit 58, type check, build, tier-leak 28, copy lint clean.

## 2026-10-19 — Phase 0 (awaiting approval)

- **Safety copy of the old Crypto terminal**: `scripts/backup_repos.sh` (adapted from the shared platform's, narrowed
  to Crypto) made a verified bundle of every branch (74 commits) and fingerprints of all 703 files; the bundle was
  restored and every `data` file re-checked. Kept outside git.
- **Platform ported from TBD@ca7e44c** (decision 0020): core, model framework and registry, jobs, compliance tools,
  the Bitstamp collector, `crypto_market`, `crypto_cycle`, `crypto_trend_bands`, the website shell, the tier-leak
  suite, the static-preview exporter, CI and workflows. Everything Sri Lankan left out.
- **Fresh migrations** 0001–0005 with row-level security on every table; the test finds every schema itself.
- **Dates are UTC days**; generic tests now use synthetic models and scratch tables; the recent-window tier rule stays
  tested; a calendar without a publication hour fails loudly.
- **A crypto weekly e-mail** on the shared layout and tier rule, covered by the tier-leak suite (no delayed preview in
  an e-mail); a crypto home page; a neutral placeholder name and mark.
- **Copy lint** now also bans the compared paid service's names and entry/exit framing.
- **Checks:** Python 116 passed (114 + 2 cross-check tests on the full Bitstamp history), web unit 58, type check,
  build, tier-leak 28, copy lint clean; CI green. The 30 public cross-checks re-run on Bitstamp's history to
  2026-10-18: 0 failed.
- **Docs:** `docs/audit.md` (old Crypto tool), `docs/plan.md` (product, tiers, content, data, legal, costs, names,
  order of work), decisions 0020 and 0021, the inherited decisions and architecture adapted.
- **Owner decision:** the repository stays public until a paid GitHub plan (decision 0021).
