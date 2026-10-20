# 0009 — A source is used only if its terms allow commercial use or are silent

- **Date:** 2026-10-11
- **Status:** Accepted (owner rule, decision 0001)
- **Inherited:** from the shared platform (TBD@ca7e44c, same number), adapted for this product on 2026-10-19 (the example and the status table now describe this product's sources).

## Rule

Every source has an entry in `config/sources.yaml`:

```yaml
bitstamp:
  enabled: true
  rights:
    status: permission_required   # allowed | silent | permission_required | prohibited
    evidence: "Commercial use needs a signed Data License Agreement (partners@bitstamp.net)."
    url: https://www.bitstamp.net/api/
    checked: 2026-10-18
    attribution: "Source: Bitstamp"
```

A collector whose source is `prohibited` refuses to run, and CI fails if one is enabled. Attribution text required by
a source is shown on every page that uses it. Status is re-checked every six months, a reminder the gap check also
emails.

## Status of the sources

Kept in `config/sources.yaml`, with the evidence for each. The crypto sources are summarised in
`docs/research/data-sources-2026-10-18.md`, the old Crypto terminal's in `docs/audit.md` §4 (including the rights
tag of each of its 32 FRED series), and the short list for macro and global markets in `docs/plan.md`.

## Consequences

- The old Crypto terminal's data cannot move into the product (docs/audit.md §4). The product's crypto history comes
  from Bitstamp under its Data License Agreement; market caps, on-chain data and index or stock prices need paid
  licences (docs/plan.md).
- `permission_required` (added 2026-10-18) is a source that may run for development but blocks launch until the
  publisher's written permission is on file (`sources.launch_blockers()`).
- "Silent" is accepted risk, not permission. If a source later objects, it is switched off within one deploy and
  its history is retained internally, pending legal advice.
