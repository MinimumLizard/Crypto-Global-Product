# 0002 — One monorepo, six layers

- **Date:** 2026-10-11
- **Status:** Proposed
- **Inherited:** from the shared platform (TBD@ca7e44c, same number), adapted for this product on 2026-10-19 (repository and libraries unchanged; references to the earlier tools generalised).

## Context

The earlier tools each re-implemented fetching, storage, run logs and a site builder. The product needs one
platform that grows for years.

## Decision

- One GitHub monorepo, holding code only (public for now: decision 0021).
- Python (managed with `uv`) for collectors and models, in `data_platform/`.
- TypeScript only for the website, in `web/`.
- The six layers of `docs/architecture.md`.
- Python 3.12. pandas as the default data library: it is familiar from R data frames. polars is allowed inside a
  model where ported code uses it (the old Crypto terminal's code).

## Alternatives considered

- **Separate repos per layer:** more places for config and versions to drift, for no benefit at this size.
- **All-TypeScript:** would mean rewriting every model away from the scientific Python stack the models are built on
  (cvxpy, scipy, scikit-learn).

## Consequences

- One pull request can change a collector, a model and its page together, with one CI run.
- The repo needs two toolchains (uv and npm); CLAUDE.md lists the commands.
