# Tasks

- [x] 1. Customer Delivery E2E Gate / Stale E2E Contract: update stale route assertions from retired `/cases/_?caseId=` and `/cases/_/preview?caseId=` to canonical `/cases/<id>` routes.
- [x] 2. Customer Delivery E2E Gate / Stale E2E Contract: update stale workbench tab expectations from `補件/現場` and case-level `資料來源` to current tab labels.
- [x] 3. Free Pre-Survey E2E / Pre-Survey Assertions: fix assertions that hard-code unstable result text while preserving visible land/building result checks.
- [x] 4. Paid Formal Pull E2E / Paid Formal Pull Assertions: fix formal pull assertion so it verifies visible actual charge without hard-coding retired `NT20`.
- [x] 5. Delivery Flow Contract: fix settings/branding and upgrade CTA E2E assertions against current delivery contract.
- [x] 6. Run focused E2E specs for the 14 failing cases and record remaining issues.
- [x] 7. Full E2E Gate: run full Chromium E2E gate and record result.
- [x] 8. Run `pnpm type-check`, `spectra analyze`, and `spectra validate`.
