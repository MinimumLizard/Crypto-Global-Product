# 0006 — Models are plug-in folders with a manifest; outputs carry a method version

- **Date:** 2026-10-11
- **Status:** Proposed (the owner's default, made concrete)
- **Inherited:** from the shared platform (TBD@ca7e44c, same number), adapted for this product on 2026-10-19 (unchanged except the history).

## Decision

- Each model lives in `data_platform/models/<name>/` and contains:
  - `manifest.yaml`: name, market, required datasets, outputs, minimum tier, method version, disclaimer key, label
    vocabulary;
  - `compute.py`: a pure function of its inputs;
  - `METHOD.md`;
  - tests with golden files.
- A registry discovers manifests, validates them, and publishes them to the database. The website and the API read
  the same registry.
- Every output row carries `method_version` and the code commit. A change that alters outputs bumps the version and
  starts a new series; old series are never overwritten. (An earlier tool's `series` label, generalised.)
- Model inputs are the database's `*_current` views. A model never fetches from the network.

## Why

The earlier tools' audit found stored outputs silently recomputed or recalibrated in place; the old Crypto terminal
recomputes its artefacts the same way (docs/audit.md §2). The brief requires history to stay comparable when a method changes, and requires that adding a model doesn't
edit the core.

## Consequences

A model's tier, disclaimer and labels are checked by CI before it can ship. Walkthrough: architecture §16.
