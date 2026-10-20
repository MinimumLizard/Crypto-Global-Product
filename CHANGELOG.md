# Changelog

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
