# Decisions

One short record per decision, so a later session (or a person) can see what was decided, why, and what it costs.

**Numbering.** This product's platform was carried over from the shared platform in the TBD repository at commit
`ca7e44c` (decision 0020). Records 0001–0019 are that platform's; the ones that still apply are kept here **under their
original numbers**, so references in code and config (for example "decision 0019") stay valid. Each says at the top
how it was adapted. Missing numbers were Sri Lankan or ZinvestIQ-specific and do not apply. This repository's own
decisions start at **0020**.

| # | Decision | Origin |
|---|---|---|
| 0002 | One monorepo, six layers | inherited |
| 0003 | Raw archive on Cloudflare R2 (write-once), copied to Backblaze B2 | inherited |
| 0004 | Supabase Postgres (Pro); region reopened | inherited |
| 0005 | Collectors on GitHub Actions, built to survive its schedule | inherited |
| 0006 | Models are plug-in folders with manifests and method versions | inherited |
| 0007 | The API is the web app's own server routes | inherited |
| 0008 | Next.js on Vercel Pro; all copy in message files | inherited |
| 0009 | A source is used only if its terms allow commercial use or are silent | inherited (owner's rule) |
| 0010 | Compliance enforced by the build: disclaimers, copy lint, vocabulary | inherited |
| 0011 | Monitoring and environments | inherited |
| 0015 | How models are computed, stored and versioned | inherited |
| 0016 | How the website reads data and decides who sees what | inherited |
| 0019 | The crypto section: public methods on Bitstamp prices | inherited |
| 0020 | A separate product, started from the shared platform with a fresh database history | this repository |
| 0021 | The repository stays public until a paid GitHub plan (owner, 2026-10-19) | this repository (owner's answer) |
