# 0003 — Raw archive on Cloudflare R2 (write-once), copied nightly to Backblaze B2

- **Date:** 2026-10-11
- **Status:** Proposed
- **Inherited:** from the shared platform (TBD@ca7e44c, same number), adapted for this product on 2026-10-19 (unchanged except the history).

## Context

Raw source files are the one thing that cannot be recreated. Today:
- the earlier tools threw them away or dropped their response caches;
- GitHub held the only copy of everything (the old Crypto terminal still works this way: docs/audit.md §2).

The owner asked where to store data apart from GitHub.

## Decision

- **Primary:** Cloudflare R2. Files are named by SHA-256, and a **bucket lock** rule forbids deleting or overwriting
  anything under `raw/` and `exports/`.
- **Second copy:** Backblaze B2, filled by a nightly copy job. It is a different company and a different failure domain.
- **Third copy, for the founders:** a periodic download (monthly) of the bundles and exports to a drive you hold, for
  example an external disk or your own cloud drive.
- A monthly job re-reads a sample from both buckets and checks fingerprints.

## Why these two

- **R2:** $0.015/GB-month after a 10 GB free tier, and **no download fees**, so re-parsing the whole archive is free.
  Bucket locks are documented and managed from the dashboard. S3-compatible, so tools are standard.
- **B2:** $6.95/TB-month after 10 GB free, and free downloads up to 3× stored volume. A cheap, boring second copy.

## Alternatives considered

- **Supabase Storage:** works, but puts the database and the archive with one vendor.
- **AWS S3 with Object Lock:** the gold standard, but download fees and a console far harder for a non-engineer to
  run safely.
- **Google Drive or Dropbox only:** fine as the founders' third copy, but not as the platform's archive (no
  write-once guarantee, awkward to automate).

## Until the accounts exist

The safety copy of the old Crypto terminal made on 2026-10-19 (`Crypto.bundle` and its fingerprints; docs/audit.md)
is handed to the owner as files. They should go to at least two of: an external drive, the owner's personal cloud drive, the co-founder's.
