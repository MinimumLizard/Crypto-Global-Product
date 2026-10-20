# 0015 — How models are computed, stored and versioned

- **Date:** 2026-10-11
- **Status:** Accepted in the shared platform; carried over
- **Inherited:** from the shared platform (TBD@ca7e44c, same number), adapted for this product on 2026-10-19 (the
  rules are unchanged; the bond and stock specifics, and the measurements that came from them, are removed).

## Decisions

1. **Model outputs are recomputed, not appended, and every change is kept.** Models run in full each time from the
   facts (the three crypto models take a few seconds locally on all of Bitstamp's history), so a rule change can never
   leave half the history under old rules. The writer only touches rows whose value changed (to 1e-9 relative or
   1e-12 absolute, so last-bit differences between machines are not revisions) and first copies the old row to
   `models.revisions`, which the database keeps append-only. A run that saw the same inputs as the last one but
   produced different outputs is flagged as non-deterministic.
2. **One table per output shape**, each keyed by `method_version`. Versions never mix: the site reads only a model's
   current version.
3. **A manifest lists several versions at once.** Exactly one is `current` (shown on the site). Others can be
   `reference` (kept running beside it for comparison) or `retired` (no longer computed; rows kept).
4. **Tiers live only in `config/entitlements.yaml`**, not in each manifest. Which feature is in which tier is the
   owners' business decision, so it sits in one file they edit; the registry refuses a model with no tier.
5. **Version 1 of a ported model reproduces the old tool exactly.** Comments and names in ported code are reworded to
   neutral language (hard rule 3); the arithmetic is unchanged. Improvements are a later version beside it.
6. **Parity runs in memory and compares against the old tool itself:** the old code is imported from a read-only clone
   at a pinned commit and run on the same inputs. No golden data files are committed (data stays out of git). The
   reports (counts and differences only) go to `docs/migration/parity-*.json`. The plan for the old Crypto
   terminal's ports is `docs/audit.md` §7.
7. **Before launch, versions are changed in place; from launch, never.** Until the first production run nothing has
   been published, so fixes go into the current version number. From the first production run, any change that
   alters outputs gets a new version, and the old one stays.
8. **Reference versions do not fill the revision log.** They are shown to nobody and exist for comparison.

## Consequences

Retiring a version is a one-line manifest change (`status: retired`).
