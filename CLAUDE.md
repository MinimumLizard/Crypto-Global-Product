# CLAUDE.md — read this first

Hand-over notes between sessions. Keep this file current: future sessions rely on it.

## What this is

**Cointrigue**: a paid research service for crypto (and possibly, later, global markets), sold as a subscription:
Free; Charts US$19/month; Research US$49/month; Research + Calls US$149/month (decision 0022). Built from public
methods and licensed data only. Crypto comes first; whether to add macro and global markets is the owners' decision
after they have seen the site.

The owner works in finance, is fluent in R and learning Python, and is not a professional engineer. Their partner is
Janu. Explain decisions in plain language. Prefer boring, well-documented, managed services over clever or self-hosted
ones. Before anything costly or hard to reverse, ask first.

**Two companies.** The owners run two separate companies. The other one builds a Sri Lankan markets portal in
github.com/MinimumLizard/TBD. This product belongs to the other company: **never use that portal's name, link to it,
or share its accounts.** This repository's platform was copied from TBD@ca7e44c (decision 0020); TBD is read-only to
us.

## Current phase

**Phase 0 is done and awaits the owners' approval** (`docs/plan.md` §0 lists their decisions). Do not start Phase 1
until they approve. On 2026-10-21 they answered part of it (decision 0022): the name, the tiers and prices, crypto
first. They are not incorporated and want to take payments through Whop: `docs/plan.md` §12 sets out what that means
(Whop approval first; personal liability; tax residence still unknown). Price data: send the Bitstamp request, or use
CoinMarketCap Startup instead (§12.2). A private clickable preview was published for them on 2026-10-21 with
`web/scripts/export-static.mjs` (private claude.ai artifact; never share it publicly before a price licence).

- Done: verified safety copy of the old Crypto repo; the platform, Bitstamp collector, three crypto models, website,
  weekly e-mail, CI and tier-leak suite ported, with every test passing locally and in CI; 30 public cross-checks pass
  on Bitstamp's history; `docs/audit.md` (old Crypto tool); `docs/plan.md`.
- Next (after approval): `docs/plan.md` §9, Phase 1 (notes publishing, accounts, Stripe, sending the e-mail, staging).
- Launch blockers: Bitstamp's Data License Agreement (`sources.launch_blockers()`), the lawyer's view (plan §5),
  including whether to show the 0–1 "position between the fitted bands" at all.

## Hard rules (from the owner's brief; do not relax without written approval)

1. **Never copy or imitate the paid service** the product is compared with (`docs/research/crypto-itc-review.md`).
   Don't subscribe to it to calibrate, scrape it or compare with it systematically. Don't reproduce its charts, text,
   scripts or proprietary "risk" score, or use its names, branding or its founder's name in the product or marketing
   (the copy lint bans them). Build only from published definitions; cross-check against independent public data.
   The old Crypto tool was designed with that service's confidential memos: nothing they shaped is ported
   (`docs/audit.md` §6).
2. **Licensed data only.** A source is used only if its terms allow commercial use (or say nothing), with the evidence
   in `config/sources.yaml` (decision 0009). Most free crypto APIs prohibit it. Bitstamp needs a signed licence. Index
   values and stock prices need a vendor whose plan allows display in a paid product. Not every FRED series is free to
   republish, and FRED's own service needs written consent for commercial use: take public-domain series from the
   originating agency (`docs/audit.md` §4).
3. **Information and education only.** No buy/sell/hold language, no price targets, no "zones" to buy or exit, no
   picks, no personalised advice. Any 0–1 position score is shown only as a description, and only after a lawyer's
   view. One place for disclaimers (`compliance/disclaimers.yaml`); a copy lint that fails the build on banned phrases.
4. **Paid data never reaches an unentitled browser, including e-mail.** Tier checks run on the server
   (`web/lib/entitlements.ts` is the only tier check); the tier-leak tests cover every page, API route and e-mail.
5. **No secrets and no data in the repo**; use environment variables and `.env.example`. *Amended by the owner on
   2026-10-19 (decision 0021):* the repository stays **public** until they buy a paid GitHub plan, so nothing
   confidential may be committed either.
6. **Never lose or rewrite historical data.** Every migration is verified by row counts and checksums, and must be
   repeatable.
7. **Stop at the end of each phase and wait for approval.** When unsure, ask.

Also from the brief: **never change, move or delete anything in the old Crypto repo** (github.com/MinimumLizard/Crypto,
code on `claude/minilizard-crypto-terminal-e6g100`, data on `data`, site minimumlizard.github.io/Crypto/), keep its
site running, and never lose or rewrite its history, until the owners approve a migration plan (`docs/audit.md` §8).

## Architecture in brief

Raw archive (Cloudflare R2, write-once, copied to Backblaze B2) → Supabase Postgres (append-only facts) → Python
collectors on GitHub Actions (fetch → archive → parse → validate → store; Healthchecks.io; daily gap check) → model
plug-ins (`data_platform/models/<name>/`: manifest, compute, METHOD.md, tests; outputs carry `method_version`) → API
as Next.js server routes → Next.js site on Vercel, all copy in `web/messages/en.json`. Details: `docs/architecture.md`
(section numbers are cited in code; keep them). Decisions: `docs/decisions/` (README explains the numbering: 0002–0019
inherited, 0020+ ours).

Dates are **UTC days** everywhere (site, gap check, freshness). Tiers are ordered `free < plus < pro < professional`
(internal ids; display names are in the message file).

## Commands

```
uv sync                                                        # once (Python 3.12+)
TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:54321/postgres uv run pytest -m "not legacy"   # what CI runs
uv run python -m data_platform.compliance                      # copy lint
uv run python -m data_platform.jobs.migrate                    # apply db/migrations (DATABASE_URL)
uv run python -m data_platform.jobs.collect bitstamp           # Bitstamp daily candles (development only until licensed)
uv run python -m data_platform.jobs.models [--market crypto] [--model NAME] [--as-of D]   # --as-of: in memory only
uv run python -m data_platform.jobs.crosscheck_crypto          # the 30 public cross-checks (docs/research/crypto-crosscheck.md)
uv run python -m data_platform.jobs.gapcheck                   # missing days
uv run python -m data_platform.jobs.backup replicate|export|verify
uv run python -m data_platform.jobs.feedback summary|list|mark|delete   # visitors' feedback (owners only)
uv run python -m data_platform.models.registry check|order|publish|export-web   # manifests; the web copy
cd web && npm ci && npm run typecheck && npm test && npm run build      # website
TEST_DATABASE_URL=... uv run python web/tests/leak/seed.py     # prints a DATABASE_URL; then in web/:
  DATABASE_URL=<printed> ALLOW_TEST_TIERS=1 npx next start -p 3100 &   # wait until it answers, then:
  npm run test:leak                                                     # the tier-leak suite
bash scripts/backup_repos.sh <out_dir>                         # verified backup of the old Crypto repo (outside git!)
```

**Local Postgres in a cloud session:** Postgres 16 is installed. Start it as the `postgres` user, never as root, on
port 54321 with data under /var/tmp:

```
mkdir -p /var/tmp/pg16 && chown postgres:postgres /var/tmp/pg16
su postgres -c "/usr/lib/postgresql/16/bin/initdb -D /var/tmp/pg16 -A trust -U postgres"     # first time only
su postgres -c "/usr/lib/postgresql/16/bin/pg_ctl -D /var/tmp/pg16 -o '-p 54321 -k /var/tmp' -l /var/tmp/pg16/log.txt start"
```

The cross-check tests skip in CI (the price history is not committed). To run them: collect Bitstamp into a separate
local database (`DATABASE_URL=... RAW_STORE=local:<scratch dir>`), run the models, then
`CROSSCHECK_DATABASE_URL=<that database> uv run pytest tests/test_crypto_crosscheck.py`.

Chromium for screenshots is at /opt/pw-browsers; don't run `playwright install`. To stop a local Next.js server, kill
the `next-server` process by its PID (a `pkill -f 'next start'` also matches your own shell command).

## Layout and rules for changes

- `data_platform/core` (archive, db, http, collector runner); `collectors/<source>/` (pure `parse*` functions plus a
  `Collector`); `models/<name>/`; `models/_lib/` (shared model code); `migration/parity.py` (exact-parity helpers);
  `jobs/`.
- `db/migrations/NNNN_*.sql`: never edit an applied one; add a new file. Every table needs row-level security, and a
  new schema must be added to `PLATFORM_SCHEMAS` in `tests/test_web_access.py` (the test finds every schema in the
  database and fails on an unknown one).
- `config/`: `sources.yaml` (rights), `datasets.yaml` (gap check), `entitlements.yaml` (tiers: the owners' file),
  `calendars/`. After changing a manifest, METHOD.md, disclaimer, calendar or tier, run `registry export-web`.
- `web/`: `lib/entitlements.ts` is the only tier check, `lib/db.ts` the only database access, all text in
  `messages/en.json`. A new model needs its routes in `lib/routes.ts` and marker values in `tests/leak/seed.py`.
- The copy lint scans messages, manifests, METHOD pages, disclaimers, and model and web code, so avoid banned words
  even in identifiers and comments (e.g. JavaScript's `.trim()`; use a regex).
- Model rules: version 1 of a ported model reproduces the old tool exactly (parity report under `docs/migration/`);
  improvements are a new version beside it. Until the first production run, fixes go into the current version; after
  it, any output-changing change is a new version (decision 0015). Outputs must be point-in-time: a row for day D does
  not change when later days arrive (each crypto model tests this).
- Scheduled jobs skip themselves until the repository variable `COLLECTION_ENABLED=true` and the secrets exist.

## Conventions

- Small commits on the feature branch with plain-language messages. No pull requests unless the owner asks.
- Tests for every collector and model. Nothing merges with failing tests.
- Numbers in docs are measured by a command, not typed in; cite the command.
- Update this file and `CHANGELOG.md` at the end of every session.

## Safety copies (never in git)

The verified backup of the old Crypto repo (`Crypto.bundle`, `Crypto.files.sha256`, `Crypto.refs`, `SHA256SUMS`,
`README.txt`) was made on 2026-10-19 in the session scratchpad and handed to the owners to store in two places (for
example an external drive and a personal cloud drive). To check a copy: `sha256sum -c SHA256SUMS`. Expected
fingerprint of the bundle at that date: `14398972019d5ecfbc16a1c96a0b4355d3cb8b78c2c940fff6195c2bac277535`. Re-run
`scripts/backup_repos.sh` for a fresh copy (the old repo is still collecting daily).
