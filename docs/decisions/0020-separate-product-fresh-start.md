# 0020 — A separate product, started from the shared platform with a fresh database history

- **Date:** 2026-10-19
- **Status:** Done in Phase 0 (awaiting the owners' approval of Phase 0 as a whole)

## Context

The owners run two separate companies. One builds a Sri Lankan markets portal (in the TBD repository); this product
(crypto and global markets) belongs to the other. A working crypto section, its data platform and its website shell
were built inside TBD and then moved out; commit `ca7e44c` is the last one that holds them.

## Decision

1. **Copy, don't share.** The platform code was copied from TBD@ca7e44c into this repository: the core, the model
   framework and registry, the jobs, the compliance tools, the Bitstamp collector, the three crypto models, and the
   website shell with its tier check and tier-leak suite. There is no shared package or submodule, so the two
   products can change independently. Who owns the copied code is a question for the lawyer (an assignment or licence
   between the two companies: docs/plan.md).
2. **Nothing Sri Lankan, nothing of the other company's product.** Every Sri Lankan collector, model, migration, fixture, calendar, page,
   message and document was left out, and a search for leftovers is part of the checks. This product never uses the
   other company's product name, links to it or shares its accounts.
3. **A fresh migration sequence.** No migration had been applied to a production database, so the sequence starts
   again: 0001 ops, 0002 model bookkeeping, 0003 website access and row-level security, 0004 feedback, 0005 crypto.
   The generic ones merge what were TBD's 0001, 0004 (bookkeeping only), 0006, 0007 (the web-access parts) and 0012;
   0005 is TBD's 0010 unchanged in substance. Every table has row-level security, and the test finds every schema in
   the database itself, so a new schema cannot be missed.
4. **UTC days.** The site, the gap check and the freshness checks use UTC days (TBD used Sri Lanka time).
5. **Generic tests stay generic.** Framework, gap-check and fact-table tests that used bond or stock tables now use
   small synthetic models and scratch tables, so they test the platform rather than whichever models exist. The
   "recent window" tier rule, which no crypto model uses yet, is tested by switching it on for one model inside the
   test.
6. **Crypto e-mail.** TBD's weekly e-mail covered stocks and bonds only; a crypto version was written on the same
   layout and the same tier rule, and the tier-leak suite now checks it for every model and tier.
7. **The paid service's names are banned in the copy lint**, together with entry and exit framing ("accumulation
   zone", "take profit" and similar), so hard rules 1 and 3 are enforced by the build.
8. **A neutral placeholder name** ("Research Terminal") and mark until the owners choose a name.

## Consequences

- Python 116 tests (114 without the full Bitstamp history), website unit tests, type check, build and the tier-leak
  suite pass locally and in CI; the 30 public cross-checks pass on Bitstamp's history to 2026-10-18.
- Later fixes to the same code in TBD do not arrive here automatically; they are ported by hand if wanted.
