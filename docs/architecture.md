# Architecture

**Status:** built and running locally and in CI (Phase 0); accounts and deployment wait for the owners (§19).
**Origin:** the shared platform's architecture (TBD@ca7e44c `docs/architecture.md`, 2026-10-11), carried over on
2026-10-19 with its section numbers kept, so references in code stay valid. Sri Lankan specifics are removed;
`docs/plan.md` has this product's costs and order of work.
**Reads with:** `docs/decisions/` (one short record per decision) and `docs/audit.md` (the old Crypto terminal).

---

## 1. The design in one page

One website, with free and paid tiers, showing crypto (and later macro and global-market) information. Behind it are
six layers, each with one job:

```
   Licensed sources (Bitstamp; later market caps, macro agencies, an index/equity vendor)
        │  fetch, politely, on a schedule
        ▼
 ┌──────────────────────────────┐   every response saved untouched, named by its fingerprint,
 │ 1. RAW ARCHIVE  (Cloudflare  │   locked against deletion; copied nightly to Backblaze B2
 │    R2, write-once)           │
 └──────────────┬───────────────┘
                │  parse + validate (the same code can re-run on any old file)
                ▼
 ┌──────────────────────────────┐   append-only facts: every row carries source, fetched_at and the
 │ 2. DATABASE  (Supabase        │   raw file it came from; nightly export to R2 and B2
 │    Postgres)                  │
 └──────────────┬───────────────┘
        ▲       │
        │  3. COLLECTORS: one Python module per source: fetch → archive → parse → validate → store
        │       │
        │       ▼
        │  4. MODELS: one plug-in folder per model: manifest + compute + METHOD.md + tests; versioned outputs
        │       │
        │       ▼
 ┌──────────────────────────────┐   checks the visitor's tier on the server before any number leaves;
 │ 5. API (server routes inside │   free visitors never receive paid numbers, nor do their e-mails
 │    the web app)              │
 └──────────────┬───────────────┘
                ▼
 ┌──────────────────────────────┐   one mobile-first site and one weekly e-mail per tier, one design
 │ 6. WEB APP (Next.js on       │   system, all text in message files
 │    Vercel)                   │
 └──────────────────────────────┘
```

**Where things run.** Collectors and models are Python jobs on GitHub Actions. The database and logins are on Supabase;
the website and its server routes on Vercel; raw files on Cloudflare R2 with a second copy on Backblaze B2.
Healthchecks.io e-mails the owners when a scheduled job doesn't check in, and a daily gap check reports missing days.

## 2. Principles that decide the details

1. **Store first, parse second.** Nothing is parsed until its raw bytes are archived. Any table can be rebuilt.
2. **Append, never overwrite.** Corrections become new rows; "what did we show on 3 March?" always has an answer.
3. **Every number knows where it came from:** `source`, `fetched_at`, `raw_object_id` on facts; `model`,
   `method_version`, input fingerprint and code version on outputs.
4. **Fail loudly, never quietly.** A collector that fetches nothing is a failure; a missing day is an alert.
5. **Rights are configuration, not memory** (`config/sources.yaml`, decision 0009).
6. **Compliance is enforced by the build:** banned phrases fail CI; disclaimers come from one registry (decision 0010).
7. **Boring tools, few of them.** Python for data, TypeScript only for the website, Postgres for state, plain files
   for config.

## 3. Repository layout

```
CLAUDE.md                     hand-over notes (keep current)
config/                       sources.yaml (rights), datasets.yaml (gap check), entitlements.yaml (tiers), calendars/
compliance/                   disclaimers.yaml, banned_phrases.yaml
data_platform/                core/ (archive, db, http, collector runner), collectors/<source>/, models/<name>/,
                              migration/ (parity), jobs/ (entry points the scheduler calls)
db/migrations/                numbered SQL migrations (never edit an applied one)
web/                          Next.js app: app/ (pages, API routes), lib/ (entitlements, db, data, email), messages/
tests/                        cross-cutting tests (core, framework, web access, repo rules, gap check, feedback)
scripts/                      one-off tools (repo backup)
docs/                         this file, decisions/, audit.md, plan.md, research/, letters/
.github/workflows/            CI and the scheduled jobs
```

## 4. Layer 1: raw archive

Every response a collector receives, byte for byte, named `raw/<source>/<yyyy>/<mm>/<dd>/<sha256>.<ext>`, catalogued
in `ops.raw_objects` and `ops.raw_fetches`. Cloudflare R2 with a bucket lock (no delete, no overwrite), copied nightly
to Backblaze B2; a monthly job re-reads a sample from both and checks fingerprints (decision 0003). Locally the archive
is a folder (`RAW_STORE=local:<path>`).

## 5. Layer 2: database

Supabase Postgres (decision 0004; region to be decided). Schemas:

| Schema | Holds |
|---|---|
| `ops` | run log, raw-file catalogue, value conflicts, gap checks, applied migrations |
| `crypto` | `ohlc_daily`: Bitstamp daily candles (append-only) |
| `models` | model outputs, one table per output shape keyed by `method_version`; `runs`, `registry`, `revisions`, `model_stats` |
| `community` | visitors' feedback, writable only through one checked function |

Fact tables refuse UPDATE and DELETE (`ops.forbid_change`). A re-fetch that disagrees with a stored fact is recorded in
`ops.value_conflicts`, never written over it. Row-level security is on for every table in every schema (migration 0003;
the test finds every schema itself). Macro and global-market schemas are added by their own migrations (docs/plan.md).

Backups: Supabase's daily backups; a nightly `pg_dump` to R2 and B2 (`jobs.backup export`); a monthly restore test.

## 6. Layer 3: collectors

One module per source, all with the same shape (`data_platform/core/collector.py`): `collect()` decides what is
missing, `self.fetch()` archives and catalogues every response before anything is parsed, pure `parse_*` functions
turn bytes into rows, `core.db.insert_facts` stores them append-only. `run_collector` adds, for every collector: the
rights gate (a source not `enabled`, or `prohibited`, cannot run), the run log, commit-or-rollback, and the
Healthchecks.io ping. Collectors catch up on any missed day rather than asking "what is today?" (decision 0005).

| Job | When (UTC) | Notes |
|---|---|---|
| Bitstamp daily candles | 00:17, repair run 06:17 | only finished UTC days |
| Models | after each collection, and 17:52 daily | only rows that changed are written |
| Gap check | 03:23 | fails (so GitHub e-mails) when a day is missing |
| Backups | 21:13 (archive copy), 21:43 (database export), monthly verify | |

Every scheduled job skips itself until the repository variable `COLLECTION_ENABLED=true` and the secrets exist.

## 7. Layer 4: model plug-ins

A model is a folder: `manifest.yaml` (market, datasets read, outputs, versions and parameters, disclaimer key; text keys
only), `compute.py` (`compute(inputs, as_of) -> {table: rows}`, pure), `METHOD.md` (written before the code: inputs,
formulas, assumptions, limits, sources), `tests/`. The framework gives the model an `Inputs` object that reads only
what the manifest declares (and only the pinned version of another model's outputs), fingerprints every row read, and
writes outputs so that a changed value is first copied to `models.revisions`. Tiers live in
`config/entitlements.yaml`, not in manifests. Versioning and parity rules: decision 0015. Every row for day D uses data
up to D only (tested for each model), so history on the site is what was known then.

## 8. Layer 5: API and entitlements

The API is the web app's own server routes (`web/app/api/v1/...`), reading only pre-computed tables. Every request that
returns data passes through one function, `authorize()` in `web/lib/entitlements.ts`, which returns a grant or a
refusal; `web/lib/db.ts` accepts only grants issued by it and reads only that model's published outputs, current
version, within any preview date or recent window. Rules available per model (`config/entitlements.yaml`):

- `minimum_tier`: tiers are ordered `free < plus < pro < professional` (internal ids; display names are the owners'
  choice, docs/plan.md);
- `free_preview: { delay_days: N }`: lower tiers see the same outputs, N days late;
- `recent_window: { days: N, full_history_tier: T }`: tiers below T see only the last N days.

Second line of defence: the site's database login (`web_reader`) can only select from `models`, and row-level security
denies every other role. **E-mail follows the same rule:** the weekly e-mail is built through the same data functions,
once per market and tier, never personalised, and never with a delayed preview (decision 0016).

**Tier-leak tests** (`web/tests/leak`, in CI on every push): a seeded database with unique marker values; every page,
every API route and the e-mail preview requested as every tier; paid markers must be absent below the tier and present
at or above it; reference versions and unpublished statistics never appear; the browser bundle holds no server code or
settings; no data page is built ahead of time.

## 9. Layer 6: web app

Next.js (App Router, TypeScript) on Vercel Pro (decision 0008; Vercel's free plan forbids commercial use). One design
system (`web/app/globals.css`, `web/components/`), Apache ECharts for charts, mobile-first. All text in
`web/messages/en.json`; disclaimers only from `compliance/disclaimers.yaml` via the generated registry. Every page
renders per request on the server and states the day its data is for, warning when it is behind the calendar.

## 10. Compliance by construction

Information and education only (hard rule 3). One disclaimer registry; a copy lint (`python -m
data_platform.compliance`) over messages, manifests, METHOD pages, disclaimers and the model and web code, failing the
build on advice language, entry and exit framing, and the names of the compared paid service (hard rule 1); neutral
output labels; nothing personalised; every method public (decision 0010). These reduce risk; they do not replace a
lawyer's review before launch.

## 11. Environments, CI and secrets

| Environment | Database | Website |
|---|---|---|
| local | local Postgres (`TEST_DATABASE_URL`) or a free Supabase project | `npm run dev` |
| staging | a second Supabase project | Vercel preview deployments |
| production | Supabase Pro | Vercel production, the product's domain |

Secrets only in GitHub Actions secrets, Vercel environment variables and the owners' password manager; `.env.example`
lists every setting with no values. CI on every push: Python tests, registry check and web export, copy lint, source
register, type check, web unit tests, production build, tier-leak suite. The repository is public for now (decision
0021), so a test also fails on committed data files or anything that looks like a secret.

## 12. Monitoring and alerting

Healthchecks.io (one check per job), the daily gap check, failing jobs e-mailing through GitHub, `ops.collector_runs`
for every run. Vercel's logs for the website at launch.

## 13. Costs

In `docs/plan.md` (platform, data licences, legal, payments), checked 2026-10-19.

## 14. Migration from the old Crypto terminal

`docs/audit.md` §8 proposes it; nothing happens until the owners approve. The old repository and site keep running
untouched until then.

## 15. Parity test plan

A ported calculation's version 1 reproduces the old code exactly on identical inputs (text, counts and dates exact;
floating point within 1e-9), proven by running the old code from a read-only clone at a pinned commit beside the new
model (decision 0015). The ports proposed for the old Crypto terminal, and their tests: `docs/audit.md` §7.

## 16. Walkthrough: adding a model

1. Create `data_platform/models/<name>/` with `manifest.yaml`, `compute.py`, `METHOD.md` (write it first), `tests/`.
2. Add its output table in a new migration (with row-level security, the `web_read` policy and the grant).
3. Give it a tier in `config/entitlements.yaml`; add its title and summary to `web/messages/en.json`.
4. Add its routes and pages to `web/lib/routes.ts` and its marker values to `web/tests/leak/seed.py` (a unit test fails
   until the route is listed; the leak suite fails until the markers exist).
5. `python -m data_platform.models.registry check` and `export-web`; tests; a point-in-time test; the copy lint.

**Core files touched: none.**

## 17. Walkthrough: adding a data source

1. **Check the rights first** and record them in `config/sources.yaml` with the evidence (decision 0009). If
   prohibited, stop.
2. Create `data_platform/collectors/<source>/` with pure `parse*` functions and a `Collector`; save real responses in
   `tests/fixtures/<source>/` and test the parser, including a "the response changed shape" test that must fail loudly.
3. Add its fact table in a new migration (append-only trigger, row-level security), its dataset in
   `config/datasets.yaml` (calendar, start, grace days), and a schedule in `.github/workflows/`.
4. Add it to `data_platform/jobs/collect.py`'s registry.

## 18. What not to build yet, and why

| Not yet | Why |
|---|---|
| Payments | Waits on the payment provider and the company's home (docs/plan.md); tiers can be granted by hand meanwhile |
| Personal portfolios, holdings import, alerts on holdings | Personalisation is what the advice rule forbids; revisit with the lawyer |
| Any 0–1 position score beside a live reading, model portfolios | Need a lawyer's view (decision 0010) |
| On-chain measures | Need licensed on-chain data or our own Bitcoin node (docs/plan.md) |
| Real-time or intraday data | Redistribution needs a licence; daily closes are enough for the product |
| A public API, data downloads | A licensing question: it would be redistribution |
| AI-generated commentary | High risk of drifting into advice; needs its own compliance design |
| Native mobile apps | A mobile-first site serves phones |

## 19. What the owners need to set up (before switch-on)

These need your identity, card or legal acceptance:

1. **Accounts**, under a shared business e-mail: Supabase (Pro), Vercel (Pro), Cloudflare (R2), Backblaze (B2),
   Healthchecks.io, the e-mail service, and the payment provider (docs/plan.md). Add Janu to each.
2. **Secrets** into GitHub Actions and Vercel, with the names in `.env.example`; then set the repository variable
   `COLLECTION_ENABLED=true`.
3. **The data licences** that block launch (`python -c "from data_platform.core import sources;
   print(sources.launch_blockers())"`): today, Bitstamp.
4. **The safety copy** of the old Crypto terminal, stored in two places (CLAUDE.md, "Safety copies").
