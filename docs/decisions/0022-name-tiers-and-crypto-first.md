# 0022 — The name is Cointrigue; tier names and prices approved; crypto first

- **Date:** 2026-10-21
- **Status:** Accepted (the owners' answers to `docs/plan.md` §0)

## Decision

1. **Name: Cointrigue.** The site, the e-mail and the packages use it. The logo stays a neutral placeholder mark until
   one is designed.
   - Domain: `cointrigue.com` is registered by someone else (GoDaddy, since 2023-06-28; it shows a parked page).
     `cointrigue.io`, `.co`, `.app`, `.net` and `.xyz` were unregistered on 2026-10-21 (RDAP). The owners choose
     between asking to buy the .com and using another ending.
   - No business using the name was found in a web search (2026-10-21). That is not a trademark search; one is still
     needed before the name is registered or marketed (plan §5, question 8).
2. **Tiers and prices as proposed** (plan §1.2): Free; Charts (`plus`) US$19 a month or US$190 a year; Research
   (`pro`) US$49 a month or US$490 a year; Research + Calls (`professional`) US$149 a month, about 30 members. The
   display names and prices are in `web/messages/en.json`; the internal ids are unchanged.
3. **Crypto first.** The owners want to see the live site before deciding whether to add macro and global markets at
   all. Phase 3 of the plan (macro and global markets, and the US$250/month equity data licence) waits for that
   decision; the crypto chart library comes first.

## Consequences

- A private, clickable preview of the site on real Bitstamp prices was published for the owners on 2026-10-21 (a
  private claude.ai artifact made with `web/scripts/export-static.mjs`). It is a private preview, which Bitstamp's
  current status allows (`config/sources.yaml`); it must not be shared publicly before a price licence is in place.
- The copy lint does not object to the name. Marketing under it must still avoid hype and promises (hard rule 3,
  and Whop's rules on earnings claims if Whop is used: plan §12).
