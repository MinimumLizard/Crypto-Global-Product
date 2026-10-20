# 0010 — Compliance is enforced by the build: disclaimers, copy lint, controlled vocabulary

- **Date:** 2026-10-11
- **Status:** Proposed (implements the owner's hard rule)
- **Inherited:** from the shared platform (TBD@ca7e44c, same number), adapted for this product on 2026-10-19 (the regulator is no longer assumed; the examples are crypto).

## Context

Most countries regulate investment advice, and which rules apply depends on where the company is and where its
customers are (an open question for the lawyer: docs/plan.md). The old Crypto terminal, as a personal tool, uses
buy/sell framing (docs/audit.md §6). The product must be information, tools and education only.

## Decision

1. **Disclaimers:** one registry, `compliance/disclaimers.yaml`, referenced by key. Every model page must show its
   disclaimer, and CI checks it.
2. **Copy lint (CI, fails the build):**
   - Scans message files, manifests, METHOD pages, templates and rendered sample pages.
   - The banned list starts with imperatives and evaluations: *buy, sell, hold, strong buy, accumulate, add to,
     trim, get in, get out, entry, exit point, price target, target price, fair value of, undervalued, overvalued,
     cheap, rich, bargain, top pick(s), our picks, you should, we recommend, recommended, outperform, underperform,
     guaranteed, sure thing, can't lose*.
   - Matching is case-insensitive and whole-word.
   - Factual uses the product needs ("directors **bought** Rs 12 mn on 3 Oct") pass only through
     `compliance/banned_phrases.yaml → allow` entries, each with a file, the exact phrase and a reason.
3. **Controlled vocabulary for model outputs.** Labels come from `compliance/vocabulary.yaml`, and manifests declare
   which they use. A price reads "n% above its 200-week average", never "overextended"; the trend-band number is "position
   between the fitted bands", never "risk". There are no "verdict", "signal" or "zone" columns.
4. **No personalised output.** No feature combines a user's own holdings or circumstances with a model to produce an
   action.
5. **Historical "what happened next" statistics** (for example how often a reading was followed by a given move) are shown only on methodology
   pages, as in-sample research results with their caveats, never beside a live reading.
6. **Deferred pending legal advice:** publishing model portfolios, a live model-portfolio record, or any 0–1
   position score beside a live reading.

## Consequences

Ported models whose old labels were evaluative are renamed in version 1 of their manifest, so parity tests compare
numbers, not labels. This reduces risk but does not replace a lawyer's review before launch.
