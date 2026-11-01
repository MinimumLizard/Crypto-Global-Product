# 0024 — A live, password-protected preview on GitHub Pages

- **Date:** 2026-11-01
- **Status:** Accepted (the owners asked for a live site on GitHub to look at and discuss, 2026-10-26)

## Decision

The preview the owners have been seeing as a private claude.ai page is also published on GitHub Pages
(`https://minimumlizard.github.io/Crypto-Global-Product/`), rebuilt every day and on every push to the working branch
by `.github/workflows/preview-pages.yml`.

- **It is a preview, not the product.** GitHub's terms forbid using Pages to run an online business; nothing on the
  preview sells anything. The commercial site goes elsewhere later (plan §12.5).
- **Every page is encrypted with a password** the owners choose (the `PREVIEW_PASSWORD` repository secret), with
  StatiCrypt (MIT licence; AES-256; the password is checked in the visitor's browser and never sent anywhere). The
  reason is data, not secrecy of the design: the preview shows Bitstamp's prices, which may be used for development
  and the owners' private preview only until Bitstamp's licence is signed (`config/sources.yaml`). A Pages site from
  a public repository is public, so without encryption the prices would be published. The job refuses to deploy
  without the password, and checks that every page it publishes is encrypted.
- **Nothing is committed.** Data is collected fresh into a throwaway database on each run, and the pages are uploaded
  to Pages as a build artifact (hard rule 5).
- When the site runs only on data free for commercial display, the password can go.

## Setup (the owners, once)

1. Settings → Pages → Build and deployment → Source: **GitHub Actions**.
2. Settings → Secrets and variables → Actions → **New repository secret**: `PREVIEW_PASSWORD`, a long password you
   share with each other.
3. Actions → "Preview: password-protected site on GitHub Pages" → Run workflow (or wait for the next push or 01:41 UTC).
