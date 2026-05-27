## Implementation

- [x] Update Spectra artifacts and pass initial consistency checks.
- [x] Implement Requirement: 方案與升級頁顯示開發中功能開關 and cover design decision: 功能清單來源仍由 product UI contract 提供 by updating the shared feature controls source with six development feature rows.
- [x] Cover design decision: 超級管理員才可切換 by wiring admin-only toggle behavior and disabled non-admin switches.
- [x] Cover design decision: 實價登錄納入同一組 feature toggle by adding the real-price row to the same toggle list and mock feature flags.
- [x] Implement Requirement: 地政授權頁提供官方註冊入口 and cover Land registry authorization help with the official registration URL and certificate guidance.
- [x] Cover design decision: 地政授權申請入口是普通客服導向文案 by replacing the placeholder application instructions.
- [x] Update unit and E2E assertions for the new wording, default-off state, admin toggle behavior, and land registration link.

## Verification

- [x] Run settings/product metadata unit tests.
- [x] Run type-check and production build.
- [x] Run focused Playwright E2E for settings, auth flow, and demo alignment.
- [x] Run `spectra analyze settings-dev-feature-toggles-and-land-auth-help --json` and `spectra validate settings-dev-feature-toggles-and-land-auth-help`.
