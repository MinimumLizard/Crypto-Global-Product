# Site text

Every word on the site lives in these files (`en.json` now; other languages are added as `<locale>.json` and listed in
`i18n/request.ts`). No user-facing text is written in code. The copy lint (`python -m data_platform.compliance`)
checks all of them for advice language, and for the names of the paid service this product must never imitate, on
every change. Disclaimers are not here: they live in `compliance/disclaimers.yaml`.
