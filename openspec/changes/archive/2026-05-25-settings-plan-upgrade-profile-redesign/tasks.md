## 1. SR and validation

- [x] 1.1 Create SR `settings-plan-upgrade-profile-redesign` for plan upgrade and profile settings redesign.
- [x] 1.2 Run `spectra analyze settings-plan-upgrade-profile-redesign --json` and `spectra validate settings-plan-upgrade-profile-redesign`; fix Critical and Warning findings.

## 2. Navigation and settings IA

- [x] 2.1 Cover Requirement: Plans and upgrade SHALL replace duplicate entitlement pages and Requirement: Settings sidebar SHALL avoid duplicate entitlement entries. Merge `功能開關` and `授權與升級` into one `方案與升級` sidebar entry.
- [x] 2.2 Cover Requirement: Settings section scope and Requirement: Personal settings SHALL be the default settings landing page. Make `/settings` render 個人設定 sections for profile/account/password/brand/activity.

## 3. Plan and upgrade UI

- [x] 3.1 Cover Requirement: Plans page SHALL use three plan cards. Implement 基本款、進階款、高級款 cards with clear current-plan and upgrade actions.
- [x] 3.2 Cover Requirement: Engineering labels SHALL be hidden from customer upgrade UI. Replace `MCP Hub` customer copy with `實價登錄`.
- [x] 3.3 Cover Requirement: Available features SHALL be understandable and not broken toggles. Show only usable test-build feature controls and fix toggle thumb alignment.

## 4. Tests and verification

- [x] 4.1 Add/update unit tests for navigation, personal settings, plans page, no engineering labels, and toggle alignment classes.
- [x] 4.2 Add/update E2E to click personal settings and plans upgrade flow.
- [x] 4.3 Run targeted tests, type-check, build, E2E, Spectra analyze, and Spectra validate.

## 5. Handoff

- [x] 5.1 Commit and push only this SR's files and related implementation changes.
