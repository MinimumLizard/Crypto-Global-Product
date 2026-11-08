# 0025 — The chart library, free Bitcoin network data, and paths for beginners

- **Date:** 2026-11-01 (chart library, network data), 2026-11-08 (Janu's feedback)
- **Status:** Accepted (the owners' requests of 2026-10-26, 2026-11-01 and 2026-11-08)

## Decision

1. **Paid tier: a chart library in the spirit of a professional crypto research service**, built only from
   published definitions (hard rule 1: never the compared service's risk score, designs, names or text). Every chart
   is in one catalogue (`web/lib/chart-catalogue.ts`) with its category, the models it reads (so its tier comes
   from `config/entitlements.yaml`) and the data it needs, tagged free, licence pending or paid (`docs/charts.md`).
   Models `crypto_charts` (migration 0006) and `btc_network` (migration 0007) store their lines in long form.
2. **Free data first.** The Bitcoin network is read from the network itself (peer-to-peer, no terms;
   `collectors/bitcoin_network`), every header verified. US macro data will come from the agencies (public domain).
   A long price history has no free licensed source (`docs/charts.md`); the preview uses Bitstamp until a licence or
   the owners' decision on an openly labelled dataset (their open question of 2026-11-05).
3. **Free tier: education for first-time users** — the Crypto basics course (`/learn/basics/…`).
4. **Janu's feedback (2026-11-08)**, as built:
   - The front page opens with "Where are you starting from?": new to crypto; knows a bit but hasn't started;
     owns some but confused; invests and wants deeper analysis. Each has its own page (`/start/…`) with **one**
     follow-up question and **three** next steps (no choice overload; `web/lib/onboarding.ts`).
   - **Questions about knowledge and experience only.** Asking about money, income, goals or holdings and
     answering with what to do would be personal financial advice (Australia: advice that takes account of a
     person's objectives, financial situation or needs), which needs a licence; hard rule 3 forbids it. So answers
     lead only to things to learn. "This is what you need to do" became "here's where to start learning".
   - **Statistics that make people feel seen:** only verified figures with their source and date shown beside them.
   - **"Was this lesson useful?"** after every lesson, and "N people found this lesson useful" only from real votes
     (each sender once, at least 25; migration 0008). Invented or inflated social proof would mislead (Australian
     Consumer Law), and Whop's rules forbid unrealistic claims too.

## Not yet (waits for accounts, cost or the lawyer)

- **A week of Research free for a short review after a week on the free tier:** fine as a private feedback survey
  through Whop's free-trial or promotion features once accounts exist. If reviews are ever shown publicly, the
  incentive must be disclosed, and positive and negative answers must earn it equally.
- **A chatbot:** possible with a hosted language model, answering only from our lessons and method pages, never
  about anyone's own money; it costs per use and needs the lawyer's view. Waits for the owners.
- **E-mail capture:** later, as Janu said (it needs a privacy policy and a sending service).
- **Sri Lanka:** the Central Bank of Sri Lanka has warned the public about crypto; nothing on the site may look
  like promotion of crypto in Sri Lanka (plan §5).
