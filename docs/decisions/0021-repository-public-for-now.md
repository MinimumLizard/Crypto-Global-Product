# 0021 — The repository stays public until a paid GitHub plan

- **Date:** 2026-10-19
- **Status:** Accepted (the owner's written decision)

## Context

Hard rule 5 of the brief said "Keep this repository private." On 2026-10-19 the repository was found to be public.
Asked whether to make it private before the first push, the owner answered:

> "I was wrong to put the hard rule about privacy, lets not worry about that now once i buy my github membership we
> can make everything private, do it on public for now because i anyway need a website and if we do it on private i
> wont be able to get that if i dont have a membership, dw, i take responsibility for this decision"

(GitHub Pages sites from private repositories need a paid plan, which is also why the old Crypto terminal's site went
offline when that repository was briefly made private.)

## Decision

- The repository stays **public** for now, and becomes private when the owner buys a paid GitHub plan.
- The rest of hard rule 5 is unchanged and still enforced by CI (`tests/test_repo_rules.py`): **no secrets and no data
  in git**, every setting in `.env.example` with no values.

## Consequences

- Everything committed is visible to anyone: the code, the audit, the plan, the legal questions and the competitor
  research. Nothing confidential may be committed; if a document ever needs to be confidential, it goes to the owners
  as a file instead (as the safety copies do).
- Public visibility of the plan is one more reason to keep competitor material factual and to name the paid service
  only in research documents, never in the product (the copy lint enforces the product side).
