# disclosure-form-residential Specification

## Purpose

TBD - created by archiving change 'aire-desktop-phase1'. Update Purpose after archive.

## Requirements

### Requirement: Residential disclosure form fields

The system SHALL provide a multi-tab form for cases where `property_type='residential'`, organized into 5 tabs in this order: `標示` (identification), `權利` (rights), `稅費` (tax & fees), `現況` (current condition), `附件` (attachments).

The form SHALL include at minimum the following field groups, each persisted as keys in `disclosure_drafts.payload_json`:

##### Example: residential field groups by tab

| Tab | Field keys (subset) | Type |
| --- | --- | --- |
| 標示 | `building_lot_no`, `land_lot_no`, `floor_area`, `building_age`, `building_structure`, `floor_total`, `floor_this` | text, number |
| 權利 | `ownership_type`, `mortgage_status`, `other_rights` | enum, text |
| 稅費 | `tax_land_value`, `tax_building_value`, `tax_property_tax_annual`, `tax_land_value_tax_annual` | number |
| 現況 | `condition_leakage`, `condition_renovation`, `condition_illegal_addition`, `condition_defects_notes` | boolean, text |
| 附件 | `attachment_property_deed`, `attachment_floor_plan`, `attachment_photos_notes` | boolean, text |

#### Scenario: Form renders all tabs on initial load

- **WHEN** the user opens a residential case edit page
- **THEN** five tab triggers are visible with labels `標示`, `權利`, `稅費`, `現況`, `附件`, and the `標示` tab is selected by default

#### Scenario: Switch tabs preserves entered values

- **WHEN** the user enters `floor_area=35.6` in `標示`, switches to `現況`, then switches back to `標示`
- **THEN** the value `35.6` is still present in the `floor_area` input

---
### Requirement: Field validation rules

The system SHALL validate residential fields on blur and before save:

- Number fields (`floor_area`, `building_age`, `floor_total`, `tax_*`) MUST accept positive numbers including decimals with up to 2 decimal places; negative values MUST be rejected.
- Text fields `building_lot_no`, `land_lot_no` MUST NOT be empty for `status='completed'` transition; while in `draft` they SHALL be allowed to be empty.
- Boolean fields (`condition_*`, `attachment_*`) MUST be tri-state: `true`, `false`, or `unknown`.

##### Example: validation results

| Field | Input | Result |
| --- | --- | --- |
| `floor_area` | `35.6` | accept |
| `floor_area` | `-5` | reject: `不可為負數` |
| `floor_area` | `35.123` | reject: `小數最多 2 位` |
| `building_age` | `0` | accept |
| `building_lot_no` | empty (status=draft) | accept |
| `building_lot_no` | empty (status=completed) | reject: `建物地號為必填` |

#### Scenario: Negative number rejected

- **WHEN** the user types `-5` in `floor_area` and blurs the field
- **THEN** the field displays the error message `不可為負數` and the value is not saved to draft

#### Scenario: Empty required field blocks completion transition

- **WHEN** the user clicks `標示為完成` on a residential case where `building_lot_no` is empty
- **THEN** the system blocks the transition and displays inline errors on missing required fields

---
### Requirement: Draft autosave

The system SHALL debounce field changes by 1000 milliseconds and call the IPC command `save_draft(case_id, payload)` to upsert into `disclosure_drafts`. The form SHALL flush a final save when the window emits a close event before unmount.

##### Example: autosave timing

- **GIVEN** the user types `floor_area=35` at t=0ms
- **WHEN** no further input occurs by t=1000ms
- **THEN** `save_draft` is invoked exactly once with the current full payload

#### Scenario: Save status indicator

- **WHEN** an autosave completes successfully
- **THEN** the top-right status indicator displays `已儲存 HH:mm:ss` in Asia/Taipei time

#### Scenario: Save failure does not block input

- **WHEN** `save_draft` fails with a DB error
- **THEN** the indicator displays `儲存失敗，已保留輸入` in red, the user can continue editing, and the next debounced cycle retries

---
### Requirement: Form reload from saved draft

The system SHALL hydrate the form from `disclosure_drafts.payload_json` when the user opens an existing residential case, using `schema_version` to apply forward-compatible defaults for any new fields added in future migrations.

#### Scenario: Reopen case with saved draft

- **WHEN** the user closes the application, restarts it, and reopens a residential case where a draft was saved with three fields filled
- **THEN** the form displays the three field values exactly as last saved, with all other fields at their default (empty for text, null for number, `unknown` for tri-state booleans)

---
### Requirement: Residential form SHALL include realtor license verification field

The system SHALL add a `RealtorLicenseField` component to the residential disclosure form. The field SHALL accept a license number text input, trigger verification via the `realtor-license-verification` capability after 500ms debounce, and display the three-state UI inline next to the input.

#### Scenario: License field appears in residential form

- **WHEN** the user opens the residential disclosure form for a case
- **THEN** the form contains a labeled field "經紀人證號" with a text input AND inline space for the verification state indicator

#### Scenario: Entering a license number triggers verification

- **WHEN** the user types a 10-character license number into the field
- **THEN** after 500ms of no further keystrokes, the verification IPC `verify_realtor_license` is invoked exactly once AND the state indicator updates to one of the three states


<!-- @trace
source: aire-phase1-legal-clauses-autofill
updated: 2026-05-15
code:
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--5d251-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/theme-c-basic-info-actual.png
  - src-tauri/src/data_portability/conflict.rs
  - e2e/results/test-artifacts/.last-run.json
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-27d84-etch-→-sync-→-DB-→-PDF-全鏈一致-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-舊電腦：建立-3-個案件後應顯示於案件清單-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-82a7d-PDF-渲染-PDF-渲染應嵌入新版法規條文與版本日期-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--77e13-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-9921b-COS-endpoint-應回傳新版三條法規與版本日期-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--ae8ef-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/theme-a-photos-actual.png
  - src-tauri/icons/Square142x142Logo.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-2：使用救援碼驗證應回傳重設-token-chromium-tauri/test-failed-1.png
  - src-tauri/icons/StoreLogo.png
  - src-tauri/src/data_portability/import.rs
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--8110a--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - src-tauri/src/crypto/mod.rs
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-匯出備份：應產生-aire-檔案並回報案件數-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-2：新密碼解鎖應成功-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-跨機完整流程：建立-→-匯出-→-匯入-→-比對案件數一致-chromium-tauri/test-failed-1.png
  - src/components/ThemeSelector.tsx
  - e2e/results/test-artifacts/license-verification-經紀人證號-48d27-he-expired-態：過期證號應回-expired-chromium-tauri/test-failed-1.png
  - src/assets/icon-dark.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-1：設定主密碼後應取得救援碼-chromium-tauri/error-context.md
  - docs/phase4-cr-reports/aire-land-registry-foundation-kimi-cr.md
  - src/lib/pdf-blocks/ai-badge.tsx
  - e2e/results/test-artifacts/license-verification-經紀人證號-5ddad--500ms-debounce-後回-verified-chromium-tauri/test-failed-1.png
  - src-tauri/src/crypto/vault.rs
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-完整救援碼重置流程：設密碼-→-取救援碼-→-忘記-→-重設-→-三斷言-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--cf4e0-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - src-tauri/src/land_registry/time_sync/tests.rs
  - src/lib/pdf-blocks/photo-gallery.tsx
  - src/components/RealtorLicenseField.tsx
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-27d84-etch-→-sync-→-DB-→-PDF-全鏈一致-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-完整救援碼重置流程：設密碼-→-取救援碼-→-忘記-→-重設-→-三斷言-chromium-tauri/test-failed-1.png
  - e2e/.gitkeep
  - e2e/pdf-theme-c-visual.spec.ts-snapshots/theme-c-photos-chromium-tauri-darwin.png
  - src-tauri/Cargo.toml
  - .env.example
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-1：設定主密碼後應取得救援碼-chromium-tauri/test-failed-1.png
  - e2e/pdf-theme-a-visual.spec.ts-snapshots/theme-a-cover-chromium-tauri-darwin.png
  - src-tauri/src/realtor_license/client/tests.rs
  - src-tauri/icons/icon.icns
  - e2e/pdf-theme-a-visual.spec.ts-snapshots/theme-a-basic-info-chromium-tauri-darwin.png
  - e2e/results/test-artifacts/license-verification-經紀人證號-5ddad--500ms-debounce-後回-verified-chromium-tauri/trace.zip
  - src-tauri/src/land_registry/client/mod.rs
  - src-tauri/src/land_registry/errors/mod.rs
  - src/lib/pdf-blocks/life-amenities.tsx
  - docs/phase4-cr-reports/aire-phase1-legal-clauses-autofill-kimi-cr.md
  - src-tauri/icons/64x64.png
  - src-tauri/src/realtor_license/mod.rs
  - e2e/results/test-artifacts/license-verification-經紀人證號-97213-che-7-天-cache：第二次填同證號不打-API-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-舊電腦：建立-3-個案件後應顯示於案件清單-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-27d84-etch-→-sync-→-DB-→-PDF-全鏈一致-chromium-tauri/trace.zip
  - src/app/settings/sync-status/page.tsx
  - scripts/phase4-kimi-cr.sh
  - src-tauri/icons/Square284x284Logo.png
  - docs/data-recovery-guide.md
  - src/components/PdfPreviewer.tsx
  - src-tauri/src/data_portability/aire_format/tests.rs
  - src/lib/pdf-engine/react-pdf-init.ts
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--77e13-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-2：新密碼解鎖應成功-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/license-verification-經紀人證號-7973a-t-found-態：未登錄證號應回-not-found-chromium-tauri/error-context.md
  - src-tauri/icons/Square71x71Logo.png
  - src-tauri/migrations/003_legal_clauses.sql
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--bf32e--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/theme-c-cover-actual.png
  - src-tauri/src/encryption/tests.rs
  - src-tauri/src/data_portability/mod.rs
  - src/lib/pdf-blocks/legal-notice.tsx
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--ae8ef-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-bb38e-legal-clauses-後應回報同步成功與版本日期-chromium-tauri/trace.zip
  - src-tauri/src/encryption/mod.rs
  - docs/pdf-theme-pack-spec.md
  - src-tauri/src/crypto/recovery_code/tests.rs
  - src/lib/pdf-blocks/condition-survey.tsx
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--cf4e0-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-3：使用-token-設定新密碼應成功-chromium-tauri/trace.zip
  - src/lib/pdf-themes/theme-a-minimal/index.tsx
  - e2e/pdf-theme-a-visual.spec.ts-snapshots/theme-a-photos-chromium-tauri-darwin.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-3：解鎖後資料完整（案件數不變）-chromium-tauri/error-context.md
  - src-tauri/icons/128x128.png
  - src/app/page.tsx
  - src/components/ux/MasterPasswordPrompt.tsx
  - src/lib/pdf-engine/index.ts
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-新電腦：匯入備份後案件數應與備份一致-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-跨機完整流程：建立-→-匯出-→-匯入-→-比對案件數一致-chromium-tauri/error-context.md
  - src-tauri/src/land_registry/field_mapping/tests.rs
  - src/lib/pdf-themes/theme-provider.tsx
  - src-tauri/src/data_portability/export/tests.rs
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-3：使用-token-設定新密碼應成功-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/license-verification-經紀人證號-7973a-t-found-態：未登錄證號應回-not-found-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-2：使用救援碼驗證應回傳重設-token-chromium-tauri/trace.zip
  - src/components/ux/ImportConflictDialog.tsx
  - src-tauri/src/legal_clauses/sync/tests.rs
  - src-tauri/migrations/004_master_password_rekey.rs
  - src-tauri/src/data_portability/aire_format.rs
  - src-tauri/src/legal_clauses/cache/tests.rs
  - src-tauri/src/realtor_license/cache/tests.rs
  - src/lib/pdf-blocks/location-map.tsx
  - src-tauri/src/legal_clauses/scheduler.rs
  - src/app/(dashboard)/settings/branding/page.tsx
  - src/app/cases/[id]/preview/page.tsx
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-bb38e-legal-clauses-後應回報同步成功與版本日期-chromium-tauri/test-failed-1.png
  - src-tauri/src/land_registry/mod.rs
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-41aa9--渲染-同步後本地-DB-應含三條法規且版本日期為新版-chromium-tauri/test-failed-1.png
  - src-tauri/icons/icon.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-2：使用救援碼驗證應回傳重設-token-chromium-tauri/error-context.md
  - src-tauri/migrations/002_branding.sql
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-82a7d-PDF-渲染-PDF-渲染應嵌入新版法規條文與版本日期-chromium-tauri/error-context.md
  - src/lib/pdf-layout.ts
  - e2e/pdf-theme-c-visual.spec.ts-snapshots/theme-c-basic-info-chromium-tauri-darwin.png
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-82a7d-PDF-渲染-PDF-渲染應嵌入新版法規條文與版本日期-chromium-tauri/trace.zip
  - src-tauri/src/data_portability/conflict/tests.rs
  - src/lib/pdf-themes/registry.ts
  - e2e/results/test-artifacts/license-verification-經紀人證號-97213-che-7-天-cache：第二次填同證號不打-API-chromium-tauri/test-failed-1.png
  - src/lib/pdf-engine/document.tsx
  - src-tauri/src/land_registry/cache/tests.rs
  - src-tauri/src/crypto/vault/tests.rs
  - src-tauri/src/land_registry/batch/mod.rs
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-匯出備份：應產生-aire-檔案並回報案件數-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--bf32e--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - src-tauri/src/land_registry/time_sync/mod.rs
  - src-tauri/src/crypto/master_password/tests.rs
  - src-tauri/src/land_registry/disk_resilience/mod.rs
  - src-tauri/src/land_registry/billing_log/mod.rs
  - src-tauri/src/land_registry/errors/tests.rs
  - src-tauri/src/legal_clauses/sync.rs
  - scripts/phase5-smoke-2a.sh
  - vitest.config.ts
  - src-tauri/src/land_registry/billing_log/tests.rs
  - src/lib/pdf-blocks/basic-info.tsx
  - src/app/(dashboard)/settings/branding/branding-content.tsx
  - src-tauri/src/realtor_license/client.rs
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-1：舊密碼解鎖應失敗（密碼已被重設）-chromium-tauri/trace.zip
  - src-tauri/src/land_registry/migration_rollback/tests.rs
  - src/lib/pdf-themes/persistence.ts
  - src-tauri/src/crypto/recovery_code.rs
  - src-tauri/icons/Square310x310Logo.png
  - src-tauri/migrations/004_land_registry.sql
  - src-tauri/icons/Square89x89Logo.png
  - src/lib/pdf-blocks/conditional-section.tsx
  - docs/phase4-cr-reports/aire-phase1-data-portability-kimi-cr.md
  - src/components/LogoUploader.tsx
  - e2e/results/license-verification.json
  - src-tauri/icons/icon.ico
  - e2e/results/test-artifacts/license-verification-經紀人證號-97213-che-7-天-cache：第二次填同證號不打-API-chromium-tauri/error-context.md
  - src/lib/pdf-blocks/cover.tsx
  - src/lib/pdf-themes/index.ts
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-41aa9--渲染-同步後本地-DB-應含三條法規且版本日期為新版-chromium-tauri/trace.zip
  - src-tauri/src/branding/logo.rs
  - e2e/results/test-artifacts/license-verification-經紀人證號-59275-allback：應顯示「（最後驗證日期，目前離線中）」-chromium-tauri/trace.zip
  - src-tauri/icons/Square150x150Logo.png
  - src-tauri/src/land_registry/cache/mod.rs
  - src-tauri/src/land_registry/field_mapping/mod.rs
  - playwright.config.ts
  - src-tauri/src/realtor_license/cache.rs
  - src-tauri/src/legal_clauses/scheduler/tests.rs
  - e2e/results/test-artifacts/license-verification-經紀人證號-7973a-t-found-態：未登錄證號應回-not-found-chromium-tauri/test-failed-1.png
  - src-tauri/src/land_registry/opcos_offline_grace/mod.rs
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-9921b-COS-endpoint-應回傳新版三條法規與版本日期-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--77e13-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/theme-c-photos-actual.png
  - src-tauri/src/land_registry/migration_rollback/mod.rs
  - src/lib/pdf-blocks/logo-anchors.tsx
  - src/lib/pdf-renderer.ts
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-新電腦：匯入備份後案件數應與備份一致-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--ae8ef-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - src/components/ux/RecoveryCodeModal.tsx
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-41aa9--渲染-同步後本地-DB-應含三條法規且版本日期為新版-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--8110a--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--5d251-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - e2e/results/test-artifacts/license-verification-經紀人證號-48d27-he-expired-態：過期證號應回-expired-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/license-verification-經紀人證號-59275-allback：應顯示「（最後驗證日期，目前離線中）」-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-匯出備份：應產生-aire-檔案並回報案件數-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--8110a--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/theme-a-cover-actual.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-1：設定主密碼後應取得救援碼-chromium-tauri/trace.zip
  - src-tauri/src/legal_clauses/cache.rs
  - src-tauri/icons/Square44x44Logo.png
  - docs/phase4-cr-reports/aire-phase1-html-pdf-renderer-kimi-cr.md
  - .github/copilot-instructions.md
  - src-tauri/src/db/mod.rs
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-3：使用-token-設定新密碼應成功-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--5d251-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--cf4e0-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/theme-a-basic-info-actual.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-2：新密碼解鎖應成功-chromium-tauri/error-context.md
  - src-tauri/src/data_portability/import/tests.rs
  - src-tauri/src/branding/tests.rs
  - src-tauri/src/land_registry/client/tests.rs
  - src/lib/pdf-blocks/dynamic-composition.tsx
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--77e13-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-1：舊密碼解鎖應失敗（密碼已被重設）-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-3：解鎖後資料完整（案件數不變）-chromium-tauri/trace.zip
  - src/assets/icon-light.png
  - src-tauri/icons/Square30x30Logo.png
  - src-tauri/icons/128x128@2x.png
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-跨機完整流程：建立-→-匯出-→-匯入-→-比對案件數一致-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--ae8ef-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - e2e/results/legal-sync.json
  - src/components/disclosure-form-land.tsx
  - src-tauri/src/land_registry/disk_resilience/tests.rs
  - docs/legal-clauses-sync-spec.md
  - src/components/disclosure-form-residential.tsx
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-9921b-COS-endpoint-應回傳新版三條法規與版本日期-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--5d251-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--bf32e--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - src-tauri/src/branding/mod.rs
  - src-tauri/src/land_registry/opcos_offline_grace/tests.rs
  - src-tauri/src/land_registry/batch/tests.rs
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-3：解鎖後資料完整（案件數不變）-chromium-tauri/test-failed-1.png
  - package.json
  - e2e/pdf-theme-c-visual.spec.ts-snapshots/theme-c-cover-chromium-tauri-darwin.png
  - docs/ux-patterns.md
  - src/lib/pdf-blocks/logo-upload.ts
  - src/lib/pdf-themes/theme-b-professional/index.tsx
  - src/lib/date-format-twn.ts
  - src-tauri/src/data_portability/export.rs
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-新電腦：匯入備份後案件數應與備份一致-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-舊電腦：建立-3-個案件後應顯示於案件清單-chromium-tauri/trace.zip
  - src-tauri/icons/Square107x107Logo.png
  - e2e/results/test-artifacts/license-verification-經紀人證號-59275-allback：應顯示「（最後驗證日期，目前離線中）」-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--bf32e--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-完整救援碼重置流程：設密碼-→-取救援碼-→-忘記-→-重設-→-三斷言-chromium-tauri/trace.zip
  - src-tauri/src/branding/theme.rs
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-1：舊密碼解鎖應失敗（密碼已被重設）-chromium-tauri/test-failed-1.png
  - src-tauri/src/legal_clauses/mod.rs
  - src-tauri/src/lib.rs
  - src/lib/pdf-engine/engine.ts
  - src/lib/pdf-themes/types.ts
  - src/lib/pdf-themes/theme-c-tech-elegant/index.tsx
  - e2e/results/test-artifacts/license-verification-經紀人證號-5ddad--500ms-debounce-後回-verified-chromium-tauri/error-context.md
  - src/lib/pdf-blocks/page-footer.tsx
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--cf4e0-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - src/app/cases/[id]/page.tsx
  - scripts/phase5-smoke.sh
  - e2e/results/test-artifacts/license-verification-經紀人證號-48d27-he-expired-態：過期證號應回-expired-chromium-tauri/trace.zip
  - src-tauri/src/crypto/master_password.rs
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--8110a--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-bb38e-legal-clauses-後應回報同步成功與版本日期-chromium-tauri/error-context.md
  - src-tauri/icons/32x32.png
tests:
  - e2e/data-portability.spec.ts
  - src/lib/pdf-themes/__tests__/registry.test.ts
  - src/lib/pdf-engine/__tests__/engine.test.ts
  - e2e/pdf-theme-c-visual.spec.ts
  - e2e/pdf-theme-a-visual.spec.ts
  - src/components/__tests__/MasterPasswordPrompt.test.tsx
  - src/lib/__tests__/date-format-twn.test.ts
  - src/lib/pdf-blocks/__tests__/legal-notice.test.tsx
  - e2e/license-verification.spec.ts
  - src/app/settings/sync-status/__tests__/page.test.tsx
  - e2e/smoke.spec.ts
  - src/components/__tests__/RecoveryCodeModal.test.tsx
  - src/lib/pdf-blocks/__tests__/legal-notice-wrap.test.tsx
  - e2e/legal-clauses-sync.spec.ts
  - src/lib/pdf-blocks/__tests__/logo-anchors.test.tsx
  - src/components/__tests__/LogoUploader.test.tsx
  - src/components/__tests__/PdfPreviewer.test.tsx
  - src/components/__tests__/ImportConflictDialog.test.tsx
  - docs/__tests__/pdf-theme-pack-spec.test.ts
  - src/components/__tests__/ThemeSelector.test.tsx
  - src/lib/pdf-blocks/__tests__/legal-notice-theme.test.tsx
  - e2e/recovery-reset.spec.ts
  - docs/data-recovery-guide.test.ts
  - src/lib/pdf-themes/__tests__/persistence.test.ts
  - src/lib/pdf-themes/__tests__/theme-provider.test.tsx
  - src/lib/pdf-blocks/__tests__/dynamic-composition.test.tsx
  - src/components/__tests__/RealtorLicenseField.test.tsx
  - docs/__tests__/no-tofu-sample.test.ts
  - src/lib/pdf-blocks/__tests__/legal-notice-empty.test.tsx
  - src/lib/pdf-engine/__tests__/render-with-legal.test.tsx
-->

---
### Requirement: License verification state SHALL be persisted with the case draft

The system SHALL save the last known verification state alongside the case data in the existing draft autosave mechanism so that reopening the form preserves the displayed state without re-querying.

#### Scenario: Reopening form preserves verification state

- **WHEN** a case has been saved with license "ABC123" verified and the user reopens the form
- **THEN** the field shows "✓ 已驗證" immediately on load without calling the verification IPC AND a refresh-on-focus check still runs (per cache TTL rules)

<!-- @trace
source: aire-phase1-legal-clauses-autofill
updated: 2026-05-15
code:
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--5d251-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/theme-c-basic-info-actual.png
  - src-tauri/src/data_portability/conflict.rs
  - e2e/results/test-artifacts/.last-run.json
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-27d84-etch-→-sync-→-DB-→-PDF-全鏈一致-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-舊電腦：建立-3-個案件後應顯示於案件清單-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-82a7d-PDF-渲染-PDF-渲染應嵌入新版法規條文與版本日期-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--77e13-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-9921b-COS-endpoint-應回傳新版三條法規與版本日期-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--ae8ef-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/theme-a-photos-actual.png
  - src-tauri/icons/Square142x142Logo.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-2：使用救援碼驗證應回傳重設-token-chromium-tauri/test-failed-1.png
  - src-tauri/icons/StoreLogo.png
  - src-tauri/src/data_portability/import.rs
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--8110a--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - src-tauri/src/crypto/mod.rs
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-匯出備份：應產生-aire-檔案並回報案件數-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-2：新密碼解鎖應成功-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-跨機完整流程：建立-→-匯出-→-匯入-→-比對案件數一致-chromium-tauri/test-failed-1.png
  - src/components/ThemeSelector.tsx
  - e2e/results/test-artifacts/license-verification-經紀人證號-48d27-he-expired-態：過期證號應回-expired-chromium-tauri/test-failed-1.png
  - src/assets/icon-dark.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-1：設定主密碼後應取得救援碼-chromium-tauri/error-context.md
  - docs/phase4-cr-reports/aire-land-registry-foundation-kimi-cr.md
  - src/lib/pdf-blocks/ai-badge.tsx
  - e2e/results/test-artifacts/license-verification-經紀人證號-5ddad--500ms-debounce-後回-verified-chromium-tauri/test-failed-1.png
  - src-tauri/src/crypto/vault.rs
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-完整救援碼重置流程：設密碼-→-取救援碼-→-忘記-→-重設-→-三斷言-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--cf4e0-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - src-tauri/src/land_registry/time_sync/tests.rs
  - src/lib/pdf-blocks/photo-gallery.tsx
  - src/components/RealtorLicenseField.tsx
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-27d84-etch-→-sync-→-DB-→-PDF-全鏈一致-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-完整救援碼重置流程：設密碼-→-取救援碼-→-忘記-→-重設-→-三斷言-chromium-tauri/test-failed-1.png
  - e2e/.gitkeep
  - e2e/pdf-theme-c-visual.spec.ts-snapshots/theme-c-photos-chromium-tauri-darwin.png
  - src-tauri/Cargo.toml
  - .env.example
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-1：設定主密碼後應取得救援碼-chromium-tauri/test-failed-1.png
  - e2e/pdf-theme-a-visual.spec.ts-snapshots/theme-a-cover-chromium-tauri-darwin.png
  - src-tauri/src/realtor_license/client/tests.rs
  - src-tauri/icons/icon.icns
  - e2e/pdf-theme-a-visual.spec.ts-snapshots/theme-a-basic-info-chromium-tauri-darwin.png
  - e2e/results/test-artifacts/license-verification-經紀人證號-5ddad--500ms-debounce-後回-verified-chromium-tauri/trace.zip
  - src-tauri/src/land_registry/client/mod.rs
  - src-tauri/src/land_registry/errors/mod.rs
  - src/lib/pdf-blocks/life-amenities.tsx
  - docs/phase4-cr-reports/aire-phase1-legal-clauses-autofill-kimi-cr.md
  - src-tauri/icons/64x64.png
  - src-tauri/src/realtor_license/mod.rs
  - e2e/results/test-artifacts/license-verification-經紀人證號-97213-che-7-天-cache：第二次填同證號不打-API-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-舊電腦：建立-3-個案件後應顯示於案件清單-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-27d84-etch-→-sync-→-DB-→-PDF-全鏈一致-chromium-tauri/trace.zip
  - src/app/settings/sync-status/page.tsx
  - scripts/phase4-kimi-cr.sh
  - src-tauri/icons/Square284x284Logo.png
  - docs/data-recovery-guide.md
  - src/components/PdfPreviewer.tsx
  - src-tauri/src/data_portability/aire_format/tests.rs
  - src/lib/pdf-engine/react-pdf-init.ts
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--77e13-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-2：新密碼解鎖應成功-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/license-verification-經紀人證號-7973a-t-found-態：未登錄證號應回-not-found-chromium-tauri/error-context.md
  - src-tauri/icons/Square71x71Logo.png
  - src-tauri/migrations/003_legal_clauses.sql
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--bf32e--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/theme-c-cover-actual.png
  - src-tauri/src/encryption/tests.rs
  - src-tauri/src/data_portability/mod.rs
  - src/lib/pdf-blocks/legal-notice.tsx
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--ae8ef-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-bb38e-legal-clauses-後應回報同步成功與版本日期-chromium-tauri/trace.zip
  - src-tauri/src/encryption/mod.rs
  - docs/pdf-theme-pack-spec.md
  - src-tauri/src/crypto/recovery_code/tests.rs
  - src/lib/pdf-blocks/condition-survey.tsx
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--cf4e0-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-3：使用-token-設定新密碼應成功-chromium-tauri/trace.zip
  - src/lib/pdf-themes/theme-a-minimal/index.tsx
  - e2e/pdf-theme-a-visual.spec.ts-snapshots/theme-a-photos-chromium-tauri-darwin.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-3：解鎖後資料完整（案件數不變）-chromium-tauri/error-context.md
  - src-tauri/icons/128x128.png
  - src/app/page.tsx
  - src/components/ux/MasterPasswordPrompt.tsx
  - src/lib/pdf-engine/index.ts
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-新電腦：匯入備份後案件數應與備份一致-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-跨機完整流程：建立-→-匯出-→-匯入-→-比對案件數一致-chromium-tauri/error-context.md
  - src-tauri/src/land_registry/field_mapping/tests.rs
  - src/lib/pdf-themes/theme-provider.tsx
  - src-tauri/src/data_portability/export/tests.rs
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-3：使用-token-設定新密碼應成功-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/license-verification-經紀人證號-7973a-t-found-態：未登錄證號應回-not-found-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-2：使用救援碼驗證應回傳重設-token-chromium-tauri/trace.zip
  - src/components/ux/ImportConflictDialog.tsx
  - src-tauri/src/legal_clauses/sync/tests.rs
  - src-tauri/migrations/004_master_password_rekey.rs
  - src-tauri/src/data_portability/aire_format.rs
  - src-tauri/src/legal_clauses/cache/tests.rs
  - src-tauri/src/realtor_license/cache/tests.rs
  - src/lib/pdf-blocks/location-map.tsx
  - src-tauri/src/legal_clauses/scheduler.rs
  - src/app/(dashboard)/settings/branding/page.tsx
  - src/app/cases/[id]/preview/page.tsx
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-bb38e-legal-clauses-後應回報同步成功與版本日期-chromium-tauri/test-failed-1.png
  - src-tauri/src/land_registry/mod.rs
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-41aa9--渲染-同步後本地-DB-應含三條法規且版本日期為新版-chromium-tauri/test-failed-1.png
  - src-tauri/icons/icon.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-2：使用救援碼驗證應回傳重設-token-chromium-tauri/error-context.md
  - src-tauri/migrations/002_branding.sql
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-82a7d-PDF-渲染-PDF-渲染應嵌入新版法規條文與版本日期-chromium-tauri/error-context.md
  - src/lib/pdf-layout.ts
  - e2e/pdf-theme-c-visual.spec.ts-snapshots/theme-c-basic-info-chromium-tauri-darwin.png
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-82a7d-PDF-渲染-PDF-渲染應嵌入新版法規條文與版本日期-chromium-tauri/trace.zip
  - src-tauri/src/data_portability/conflict/tests.rs
  - src/lib/pdf-themes/registry.ts
  - e2e/results/test-artifacts/license-verification-經紀人證號-97213-che-7-天-cache：第二次填同證號不打-API-chromium-tauri/test-failed-1.png
  - src/lib/pdf-engine/document.tsx
  - src-tauri/src/land_registry/cache/tests.rs
  - src-tauri/src/crypto/vault/tests.rs
  - src-tauri/src/land_registry/batch/mod.rs
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-匯出備份：應產生-aire-檔案並回報案件數-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--bf32e--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - src-tauri/src/land_registry/time_sync/mod.rs
  - src-tauri/src/crypto/master_password/tests.rs
  - src-tauri/src/land_registry/disk_resilience/mod.rs
  - src-tauri/src/land_registry/billing_log/mod.rs
  - src-tauri/src/land_registry/errors/tests.rs
  - src-tauri/src/legal_clauses/sync.rs
  - scripts/phase5-smoke-2a.sh
  - vitest.config.ts
  - src-tauri/src/land_registry/billing_log/tests.rs
  - src/lib/pdf-blocks/basic-info.tsx
  - src/app/(dashboard)/settings/branding/branding-content.tsx
  - src-tauri/src/realtor_license/client.rs
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-1：舊密碼解鎖應失敗（密碼已被重設）-chromium-tauri/trace.zip
  - src-tauri/src/land_registry/migration_rollback/tests.rs
  - src/lib/pdf-themes/persistence.ts
  - src-tauri/src/crypto/recovery_code.rs
  - src-tauri/icons/Square310x310Logo.png
  - src-tauri/migrations/004_land_registry.sql
  - src-tauri/icons/Square89x89Logo.png
  - src/lib/pdf-blocks/conditional-section.tsx
  - docs/phase4-cr-reports/aire-phase1-data-portability-kimi-cr.md
  - src/components/LogoUploader.tsx
  - e2e/results/license-verification.json
  - src-tauri/icons/icon.ico
  - e2e/results/test-artifacts/license-verification-經紀人證號-97213-che-7-天-cache：第二次填同證號不打-API-chromium-tauri/error-context.md
  - src/lib/pdf-blocks/cover.tsx
  - src/lib/pdf-themes/index.ts
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-41aa9--渲染-同步後本地-DB-應含三條法規且版本日期為新版-chromium-tauri/trace.zip
  - src-tauri/src/branding/logo.rs
  - e2e/results/test-artifacts/license-verification-經紀人證號-59275-allback：應顯示「（最後驗證日期，目前離線中）」-chromium-tauri/trace.zip
  - src-tauri/icons/Square150x150Logo.png
  - src-tauri/src/land_registry/cache/mod.rs
  - src-tauri/src/land_registry/field_mapping/mod.rs
  - playwright.config.ts
  - src-tauri/src/realtor_license/cache.rs
  - src-tauri/src/legal_clauses/scheduler/tests.rs
  - e2e/results/test-artifacts/license-verification-經紀人證號-7973a-t-found-態：未登錄證號應回-not-found-chromium-tauri/test-failed-1.png
  - src-tauri/src/land_registry/opcos_offline_grace/mod.rs
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-9921b-COS-endpoint-應回傳新版三條法規與版本日期-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--77e13-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/theme-c-photos-actual.png
  - src-tauri/src/land_registry/migration_rollback/mod.rs
  - src/lib/pdf-blocks/logo-anchors.tsx
  - src/lib/pdf-renderer.ts
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-新電腦：匯入備份後案件數應與備份一致-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--ae8ef-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - src/components/ux/RecoveryCodeModal.tsx
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-41aa9--渲染-同步後本地-DB-應含三條法規且版本日期為新版-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--8110a--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--5d251-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - e2e/results/test-artifacts/license-verification-經紀人證號-48d27-he-expired-態：過期證號應回-expired-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/license-verification-經紀人證號-59275-allback：應顯示「（最後驗證日期，目前離線中）」-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-匯出備份：應產生-aire-檔案並回報案件數-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--8110a--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/theme-a-cover-actual.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-1：設定主密碼後應取得救援碼-chromium-tauri/trace.zip
  - src-tauri/src/legal_clauses/cache.rs
  - src-tauri/icons/Square44x44Logo.png
  - docs/phase4-cr-reports/aire-phase1-html-pdf-renderer-kimi-cr.md
  - .github/copilot-instructions.md
  - src-tauri/src/db/mod.rs
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-3：使用-token-設定新密碼應成功-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--5d251-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--cf4e0-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/theme-a-basic-info-actual.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-2：新密碼解鎖應成功-chromium-tauri/error-context.md
  - src-tauri/src/data_portability/import/tests.rs
  - src-tauri/src/branding/tests.rs
  - src-tauri/src/land_registry/client/tests.rs
  - src/lib/pdf-blocks/dynamic-composition.tsx
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--77e13-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-1：舊密碼解鎖應失敗（密碼已被重設）-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-3：解鎖後資料完整（案件數不變）-chromium-tauri/trace.zip
  - src/assets/icon-light.png
  - src-tauri/icons/Square30x30Logo.png
  - src-tauri/icons/128x128@2x.png
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-跨機完整流程：建立-→-匯出-→-匯入-→-比對案件數一致-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--ae8ef-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - e2e/results/legal-sync.json
  - src/components/disclosure-form-land.tsx
  - src-tauri/src/land_registry/disk_resilience/tests.rs
  - docs/legal-clauses-sync-spec.md
  - src/components/disclosure-form-residential.tsx
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-9921b-COS-endpoint-應回傳新版三條法規與版本日期-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--5d251-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--bf32e--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - src-tauri/src/branding/mod.rs
  - src-tauri/src/land_registry/opcos_offline_grace/tests.rs
  - src-tauri/src/land_registry/batch/tests.rs
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-3：解鎖後資料完整（案件數不變）-chromium-tauri/test-failed-1.png
  - package.json
  - e2e/pdf-theme-c-visual.spec.ts-snapshots/theme-c-cover-chromium-tauri-darwin.png
  - docs/ux-patterns.md
  - src/lib/pdf-blocks/logo-upload.ts
  - src/lib/pdf-themes/theme-b-professional/index.tsx
  - src/lib/date-format-twn.ts
  - src-tauri/src/data_portability/export.rs
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-新電腦：匯入備份後案件數應與備份一致-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-舊電腦：建立-3-個案件後應顯示於案件清單-chromium-tauri/trace.zip
  - src-tauri/icons/Square107x107Logo.png
  - e2e/results/test-artifacts/license-verification-經紀人證號-59275-allback：應顯示「（最後驗證日期，目前離線中）」-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--bf32e--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-完整救援碼重置流程：設密碼-→-取救援碼-→-忘記-→-重設-→-三斷言-chromium-tauri/trace.zip
  - src-tauri/src/branding/theme.rs
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-1：舊密碼解鎖應失敗（密碼已被重設）-chromium-tauri/test-failed-1.png
  - src-tauri/src/legal_clauses/mod.rs
  - src-tauri/src/lib.rs
  - src/lib/pdf-engine/engine.ts
  - src/lib/pdf-themes/types.ts
  - src/lib/pdf-themes/theme-c-tech-elegant/index.tsx
  - e2e/results/test-artifacts/license-verification-經紀人證號-5ddad--500ms-debounce-後回-verified-chromium-tauri/error-context.md
  - src/lib/pdf-blocks/page-footer.tsx
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--cf4e0-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - src/app/cases/[id]/page.tsx
  - scripts/phase5-smoke.sh
  - e2e/results/test-artifacts/license-verification-經紀人證號-48d27-he-expired-態：過期證號應回-expired-chromium-tauri/trace.zip
  - src-tauri/src/crypto/master_password.rs
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--8110a--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-bb38e-legal-clauses-後應回報同步成功與版本日期-chromium-tauri/error-context.md
  - src-tauri/icons/32x32.png
tests:
  - e2e/data-portability.spec.ts
  - src/lib/pdf-themes/__tests__/registry.test.ts
  - src/lib/pdf-engine/__tests__/engine.test.ts
  - e2e/pdf-theme-c-visual.spec.ts
  - e2e/pdf-theme-a-visual.spec.ts
  - src/components/__tests__/MasterPasswordPrompt.test.tsx
  - src/lib/__tests__/date-format-twn.test.ts
  - src/lib/pdf-blocks/__tests__/legal-notice.test.tsx
  - e2e/license-verification.spec.ts
  - src/app/settings/sync-status/__tests__/page.test.tsx
  - e2e/smoke.spec.ts
  - src/components/__tests__/RecoveryCodeModal.test.tsx
  - src/lib/pdf-blocks/__tests__/legal-notice-wrap.test.tsx
  - e2e/legal-clauses-sync.spec.ts
  - src/lib/pdf-blocks/__tests__/logo-anchors.test.tsx
  - src/components/__tests__/LogoUploader.test.tsx
  - src/components/__tests__/PdfPreviewer.test.tsx
  - src/components/__tests__/ImportConflictDialog.test.tsx
  - docs/__tests__/pdf-theme-pack-spec.test.ts
  - src/components/__tests__/ThemeSelector.test.tsx
  - src/lib/pdf-blocks/__tests__/legal-notice-theme.test.tsx
  - e2e/recovery-reset.spec.ts
  - docs/data-recovery-guide.test.ts
  - src/lib/pdf-themes/__tests__/persistence.test.ts
  - src/lib/pdf-themes/__tests__/theme-provider.test.tsx
  - src/lib/pdf-blocks/__tests__/dynamic-composition.test.tsx
  - src/components/__tests__/RealtorLicenseField.test.tsx
  - docs/__tests__/no-tofu-sample.test.ts
  - src/lib/pdf-blocks/__tests__/legal-notice-empty.test.tsx
  - src/lib/pdf-engine/__tests__/render-with-legal.test.tsx
-->

---
### Requirement: Pull parcel data button integration

The residential disclosure form SHALL include a "拉謄本" button next to the property address field. Clicking the button SHALL trigger the owner-authorization-consent flow, then pre-charge-confirmation, then data pull. Pulled data SHALL auto-fill the corresponding form fields.

#### Scenario: Pull button fills form fields

- **WHEN** user clicks "拉謄本" and completes consent + confirmation
- **THEN** form fields (building area, purpose, ownership info) are populated from API results with source "api"

##### Example: Successful residential pull

- **GIVEN** parcel "0301-0001" exists in sandbox, user consented, user confirmed charge
- **WHEN** pull completes for building_registry + land_registry + co_owners
- **THEN** building_area field = "120.5", building_purpose field = "住家用", all with source "api"

#### Scenario: Pull failure shows manual fallback

- **WHEN** pull fails for some endpoints
- **THEN** failed fields show ManualFallbackInput; successfully pulled fields remain filled

##### Example: Partial failure with fallback

- **GIVEN** building_registry succeeded but mortgages returned Network error
- **WHEN** pull result renders in form
- **THEN** building fields are filled (source "api"), mortgage section shows ManualFallbackInput (empty, editable)

<!-- @trace
source: aire-land-registry-apis-ui
updated: 2026-05-15
code:
  - src/lib/cases-api.ts
  - src-tauri/src/land_registry/mod.rs
  - src-tauri/src/land_registry/pull.rs
  - e2e/results/playwright-report/index.html
  - src-tauri/src/db/drafts.rs
  - src/components/AppTopbar.tsx
  - src-tauri/src/realtor_license/cache.rs
  - src/lib/pdf-themes/index.ts
  - src-tauri/icons/android/mipmap-xxhdpi/ic_launcher.png
  - src/components/settings/LandApiSection.tsx
  - src/app/(dashboard)/dev/components/page.tsx
  - src-tauri/icons/Square30x30Logo.png
  - src-tauri/src/land_registry/billing_log/tests.rs
  - src-tauri/src/startup.rs
  - docs/data-recovery-guide.md
  - src/components/AppSidebar.tsx
  - docs/pdf-theme-pack-spec.md
  - src-tauri/icons/64x64.png
  - src-tauri/src/land_registry/batch/tests.rs
  - src-tauri/icons/Square44x44Logo.png
  - src-tauri/icons/32x32.png
  - src-tauri/src/encryption/mod.rs
  - .artifacts/aire-mvp-bugfix/settings_branding.png
  - src/app/dev/components/page.tsx
  - src/lib/pdf-blocks/location-map.tsx
  - src-tauri/src/main.rs
  - src/components/ux/ImportConflictDialog.tsx
  - playwright.config.ts
  - src-tauri/icons/ios/AppIcon-40x40@2x.png
  - src/lib/pdf-engine/react-pdf-init.ts
  - src-tauri/icons/android/mipmap-mdpi/ic_launcher_round.png
  - src-tauri/src/land_registry/apis/building_registry.rs
  - src-tauri/icons/Square284x284Logo.png
  - src/lib/pdf-themes/registry.ts
  - src/components/ui/Tabs.tsx
  - src-tauri/src/legal_clauses/mod.rs
  - src-tauri/src/land_registry/time_sync/tests.rs
  - src-tauri/src/log.rs
  - src/app/cases/[id]/page.tsx
  - src/components/disclosure-form-land.tsx
  - .artifacts/browser-dev-mock/01-activation-form.png
  - src-tauri/src/land_registry/opcos_offline_grace/tests.rs
  - src-tauri/migrations/005_owner_consent_log.sql
  - e2e/pdf-theme-a-visual.spec.ts-snapshots/theme-a-cover-chromium-tauri-darwin.png
  - src-tauri/icons/android/mipmap-xxxhdpi/ic_launcher_foreground.png
  - src-tauri/icons/128x128.png
  - src-tauri/icons/android/mipmap-xhdpi/ic_launcher_round.png
  - src-tauri/icons/icon.ico
  - src-tauri/src/land_registry/errors/tests.rs
  - src-tauri/src/lib.rs
  - src-tauri/icons/ios/AppIcon-29x29@3x.png
  - src/app/(dashboard)/settings/branding/branding-content.tsx
  - src-tauri/migrations/004_land_registry.sql
  - src-tauri/src/commands/license.rs
  - .artifacts/browser-dev-mock/05-logs-loaded.png
  - src/components/ui/tabs.tsx
  - src-tauri/Cargo.toml
  - src/lib/pdf-blocks/page-footer.tsx
  - src-tauri/src/land_registry/apis/land_registry.rs
  - src-tauri/icons/StoreLogo.png
  - src-tauri/src/db/cases.rs
  - src-tauri/src/data_portability/import.rs
  - src/lib/pdf-blocks/legal-notice.tsx
  - src/components/BalanceBanner.tsx
  - src-tauri/src/data_portability/import/tests.rs
  - src-tauri/icons/Square142x142Logo.png
  - src/components/ux/RecoveryCodeModal.tsx
  - src-tauri/icons/Square71x71Logo.png
  - src/components/settings/PremiumUnlockSection.tsx
  - src/components/ui/skeleton.tsx
  - docs/legal-clauses-sync-spec.md
  - scripts/test-visual-parity.mjs
  - src-tauri/src/land_registry/consent.rs
  - src/app/(dashboard)/layout.tsx
  - src-tauri/icons/android/mipmap-mdpi/ic_launcher.png
  - src-tauri/icons/icon.png
  - src-tauri/src/db/settings.rs
  - src-tauri/src/legal_clauses/scheduler/tests.rs
  - src-tauri/icons/ios/AppIcon-29x29@2x.png
  - src/lib/pdf-blocks/logo-upload.ts
  - src/app/(dashboard)/settings/page.tsx
  - src/components/TauriRequired.tsx
  - src-tauri/src/commands/cases.rs
  - src-tauri/icons/ios/AppIcon-29x29@2x-1.png
  - src-tauri/src/commands/log.rs
  - src-tauri/icons/android/mipmap-hdpi/ic_launcher_foreground.png
  - package.json
  - src-tauri/src/land_registry/disk_resilience/mod.rs
  - docs/ux-patterns.md
  - src/components/ui/button.tsx
  - src/lib/pdf-blocks/photo-gallery.tsx
  - e2e/pdf-theme-c-visual.spec.ts-snapshots/theme-c-photos-chromium-tauri-darwin.png
  - src-tauri/icons/android/mipmap-mdpi/ic_launcher_foreground.png
  - src-tauri/src/crypto/master_password.rs
  - src/components/ui/Input.tsx
  - README.md
  - .artifacts/aire-mvp-bugfix/activation.png
  - src-tauri/icons/android/mipmap-hdpi/ic_launcher.png
  - src-tauri/migrations/003_legal_clauses.sql
  - src/assets/icon-light.png
  - src/app/settings/logs/page.tsx
  - src/components/ux/ErrorState.tsx
  - src/app/(dashboard)/settings/logs/page.tsx
  - src/lib/pdf-themes/theme-c-tech-elegant/index.tsx
  - docs/phase4-cr-reports/aire-land-registry-foundation-kimi-cr.md
  - src-tauri/icons/ios/AppIcon-40x40@1x.png
  - src/lib/pdf-blocks/conditional-section.tsx
  - src-tauri/src/data_portability/export.rs
  - src/hooks/useAuth.ts
  - e2e/pdf-theme-c-visual.spec.ts-snapshots/theme-c-cover-chromium-tauri-darwin.png
  - src-tauri/migrations/002_branding.sql
  - src/components/ui/Dialog.tsx
  - src-tauri/src/land_registry/cache/tests.rs
  - src-tauri/src/secrets.rs
  - src-tauri/src/branding/theme.rs
  - src-tauri/icons/ios/AppIcon-29x29@1x.png
  - src-tauri/src/land_registry/apis/building_ownership.rs
  - src/lib/land-registry-api.ts
  - e2e/results/license-verification.json
  - src-tauri/src/land_registry/apis/mod.rs
  - src/lib/auth.ts
  - .artifacts/aire-mvp-bugfix/cases.png
  - docs/phase4-cr-reports/aire-phase1-data-portability-kimi-cr.md
  - src-tauri/icons/android/mipmap-xxhdpi/ic_launcher_foreground.png
  - src-tauri/src/legal_clauses/cache.rs
  - src-tauri/src/opcos.rs
  - src/components/ui/textarea.tsx
  - src-tauri/src/commands/pdf.rs
  - src/lib/pdf-engine/document.tsx
  - .env.example
  - src-tauri/icons/ios/AppIcon-20x20@2x-1.png
  - src/lib/log.ts
  - src/app/dev/ux/page.tsx
  - e2e/.gitkeep
  - src-tauri/src/crypto/vault.rs
  - src/lib/pdf-themes/persistence.ts
  - src-tauri/src/land_registry/migration_rollback/mod.rs
  - src/lib/pdf-themes/theme-b-professional/index.tsx
  - .artifacts/aire-mvp-bugfix/settings_logs.png
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src/components/ui/input.tsx
  - e2e/results/legal-sync.json
  - src/lib/pdf-themes/types.ts
  - e2e/pdf-theme-a-visual.spec.ts-snapshots/theme-a-photos-chromium-tauri-darwin.png
  - .github/copilot-instructions.md
  - src-tauri/src/legal_clauses/scheduler.rs
  - src-tauri/src/realtor_license/mod.rs
  - src/app/cases/[id]/layout.tsx
  - src-tauri/src/realtor_license/client/tests.rs
  - src-tauri/icons/android/mipmap-xxhdpi/ic_launcher_round.png
  - src-tauri/icons/aire-source.png
  - src/styles/tokens.css
  - src-tauri/migrations/004_master_password_rekey.rs
  - src-tauri/src/land_registry/apis/co_owners.rs
  - src/app/activation/page.tsx
  - src-tauri/icons/ios/AppIcon-40x40@3x.png
  - src-tauri/src/land_registry/field_mapping/mod.rs
  - src/components/ux/MasterPasswordPrompt.tsx
  - src/components/ui/label.tsx
  - src-tauri/icons/ios/AppIcon-83.5x83.5@2x.png
  - src/lib/pdf-renderer.ts
  - src-tauri/icons/ios/AppIcon-40x40@2x-1.png
  - src-tauri/src/legal_clauses/sync.rs
  - src/lib/tauri-bridge.ts
  - e2e/pdf-theme-a-visual.spec.ts-snapshots/theme-a-basic-info-chromium-tauri-darwin.png
  - e2e/pdf-theme-c-visual.spec.ts-snapshots/theme-c-basic-info-chromium-tauri-darwin.png
  - src-tauri/src/land_registry/batch/mod.rs
  - src/components/PdfPreviewer.tsx
  - src/components/LogoUploader.tsx
  - src/components/RealtorLicenseField.tsx
  - src-tauri/icons/ios/AppIcon-76x76@1x.png
  - src-tauri/src/data_portability/aire_format.rs
  - src/components/ui/Card.tsx
  - src-tauri/src/land_registry/apis/address_to_parcel.rs
  - src-tauri/src/land_registry/field_mapping/tests.rs
  - e2e/results/results.json
  - src/components/PullParcelDataButton.tsx
  - src/components/BalanceMonitor.tsx
  - src-tauri/src/land_registry/api_key_storage.rs
  - src/components/ui/table.tsx
  - src/components/ui/sonner.tsx
  - src/app/login/page.tsx
  - src/lib/mock-backend.ts
  - src-tauri/src/branding/logo.rs
  - src-tauri/src/land_registry/apis/land_value.rs
  - src-tauri/src/land_registry/apis/mortgages.rs
  - src/components/ThemeSelector.tsx
  - src-tauri/icons/Square150x150Logo.png
  - src/lib/pdf-blocks/ai-badge.tsx
  - src-tauri/icons/icon.icns
  - scripts/phase5-smoke.sh
  - src/app/cases/new/page.tsx
  - src/components/ui/spinner.tsx
  - src-tauri/icons/ios/AppIcon-60x60@2x.png
  - src/components/ui/sheet.tsx
  - src/components/ui/select.tsx
  - src-tauri/src/data_portability/mod.rs
  - src/lib/pdf-engine/index.ts
  - src/lib/pdf-blocks/condition-survey.tsx
  - src-tauri/icons/Square310x310Logo.png
  - src/app/page.tsx
  - src/assets/icon-dark.png
  - src-tauri/icons/android/mipmap-xxxhdpi/ic_launcher.png
  - src/app/(dashboard)/settings/sync-status/page.tsx
  - src/app/cases/page.tsx
  - src/components/PreChargeConfirmDialog.tsx
  - src-tauri/icons/Square89x89Logo.png
  - src-tauri/src/land_registry/opcos_offline_grace/mod.rs
  - src-tauri/src/legal_clauses/sync/tests.rs
  - src/app/(dashboard)/settings/api-key/page.tsx
  - src-tauri/src/db/mod.rs
  - src/lib/date-format-twn.ts
  - src/lib/pdf-blocks/life-amenities.tsx
  - src-tauri/icons/ios/AppIcon-512@2x.png
  - .artifacts/browser-dev-mock/02-cases-seed-list.png
  - src-tauri/icons/ios/AppIcon-60x60@3x.png
  - src/app/(dashboard)/dev/ux/page.tsx
  - src/lib/pdf-blocks/cover.tsx
  - src/lib/pdf-themes/theme-a-minimal/index.tsx
  - src-tauri/src/commands/drafts.rs
  - src/components/OwnerAuthorizationDialog.tsx
  - src/components/ui/separator.tsx
  - src/components/ManualFallbackInput.tsx
  - src/components/ui/badge.tsx
  - src/components/settings/LicenseSection.tsx
  - src-tauri/src/land_registry/billing_log/mod.rs
  - .artifacts/browser-dev-mock/04-branding-loaded.png
  - src-tauri/icons/ios/AppIcon-20x20@2x.png
  - src-tauri/icons/android/mipmap-hdpi/ic_launcher_round.png
  - src-tauri/src/land_registry/migration_rollback/tests.rs
  - src/components/ui/form.tsx
  - src/app/(dashboard)/cases/new/page.tsx
  - src/app/(dashboard)/cases/[id]/layout.tsx
  - src/components/settings/DevSuperAdmin.tsx
  - src-tauri/icons/android/mipmap-xhdpi/ic_launcher.png
  - src-tauri/src/land_registry/cache/mod.rs
  - src-tauri/src/land_registry/client/tests.rs
  - src-tauri/icons/ios/AppIcon-20x20@3x.png
  - src-tauri/icons/android/mipmap-xhdpi/ic_launcher_foreground.png
  - scripts/phase4-kimi-cr.sh
  - src-tauri/src/land_registry/client/mod.rs
  - src-tauri/icons/Square107x107Logo.png
  - src/app/(dashboard)/cases/page.tsx
  - src-tauri/src/realtor_license/cache/tests.rs
  - src/lib/pdf-blocks/dynamic-composition.tsx
  - src-tauri/icons/ios/AppIcon-20x20@1x.png
  - src/components/ux/ConfirmDialog.tsx
  - src-tauri/src/branding/mod.rs
  - src/lib/pdf-themes/theme-provider.tsx
  - src-tauri/src/land_registry/errors/mod.rs
  - src/lib/pdf-engine/engine.ts
  - src-tauri/src/legal_clauses/cache/tests.rs
  - src/lib/pdf-blocks/logo-anchors.tsx
  - src-tauri/icons/128x128@2x.png
  - src-tauri/src/land_registry/apis/zoning.rs
  - src-tauri/icons/android/mipmap-xxxhdpi/ic_launcher_round.png
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
  - src-tauri/src/land_registry/disk_resilience/tests.rs
  - .artifacts/browser-dev-mock/03-create-case-success.png
  - src/components/disclosure-form-residential.tsx
  - src-tauri/src/realtor_license/client.rs
  - scripts/phase5-smoke-2a.sh
  - e2e/results/test-artifacts/.last-run.json
  - src-tauri/src/data_portability/conflict.rs
  - src-tauri/src/land_registry/balance.rs
  - docs/phase4-cr-reports/aire-phase1-legal-clauses-autofill-kimi-cr.md
  - src/components/ui/Button.tsx
  - src-tauri/icons/ios/AppIcon-76x76@2x.png
  - src/components/ux/EmptyState.tsx
  - src/components/ui/dialog.tsx
  - src/lib/pdf-layout.ts
  - src/lib/pdf-blocks/basic-info.tsx
  - docs/phase4-cr-reports/aire-phase1-html-pdf-renderer-kimi-cr.md
  - src-tauri/src/land_registry/time_sync/mod.rs
  - src/components/ui/card.tsx
  - src-tauri/src/crypto/recovery_code.rs
  - src-tauri/src/crypto/mod.rs
  - src/components/ApiKeySettings.tsx
  - src-tauri/src/encryption/tests.rs
  - src/app/(dashboard)/settings/branding/page.tsx
tests:
  - e2e/license-verification.spec.ts
  - docs/data-recovery-guide.test.ts
  - src/components/__tests__/LogoUploader.test.tsx
  - e2e/theme-selector.spec.ts
  - src/components/settings/__tests__/LandApiSection.test.tsx
  - src/lib/__tests__/cases-api.test.ts
  - docs/__tests__/pdf-theme-pack-spec.test.ts
  - src/app/(dashboard)/settings/logs/__tests__/page.test.tsx
  - src/lib/pdf-themes/__tests__/registry.test.ts
  - e2e/pdf-legal-notice-position.spec.ts
  - src/lib/pdf-blocks/__tests__/legal-notice.test.tsx
  - src/lib/pdf-themes/__tests__/persistence.test.ts
  - src/lib/__tests__/mock-backend.test.ts
  - src/components/__tests__/sidebar.test.tsx
  - src/components/__tests__/RealtorLicenseField.test.tsx
  - e2e/sync-status-page.spec.ts
  - src/app/(dashboard)/__tests__/layout.test.tsx
  - src-tauri/tests/e2e_smoke.rs
  - e2e/pdf-theme-a-visual.spec.ts
  - src/components/__tests__/AppSidebar.test.tsx
  - src/components/settings/__tests__/LicenseSection.test.tsx
  - src/app/activation/__tests__/page.test.tsx
  - src/lib/__tests__/auth.test.ts
  - e2e/smoke.spec.ts
  - src/app/(dashboard)/settings/sync-status/__tests__/page.test.tsx
  - src/app/(dashboard)/__tests__/layout-sidebar.test.tsx
  - e2e/pdf-theme-c-visual.spec.ts
  - src/app/(dashboard)/settings/branding/__tests__/branding-content.test.tsx
  - src/lib/pdf-blocks/__tests__/legal-notice-theme.test.tsx
  - src/app/(dashboard)/cases/__tests__/page.test.tsx
  - src/lib/pdf-blocks/__tests__/legal-notice-wrap.test.tsx
  - src/components/__tests__/RecoveryCodeModal.test.tsx
  - e2e/legal-clauses-sync.spec.ts
  - src/lib/__tests__/log.test.ts
  - src/lib/__tests__/tauri-bridge.test.ts
  - e2e/data-portability.spec.ts
  - src/components/settings/__tests__/PremiumUnlockSection.test.tsx
  - src/components/settings/__tests__/DevSuperAdmin.test.tsx
  - src/app/(dashboard)/settings/__tests__/page.test.tsx
  - src/app/login/__tests__/page.test.tsx
  - e2e/recovery-reset.spec.ts
  - src/lib/__tests__/date-format-twn.test.ts
  - src/lib/pdf-blocks/__tests__/legal-notice-empty.test.tsx
  - src/components/__tests__/ThemeSelector.test.tsx
  - src/lib/pdf-engine/__tests__/render-with-legal.test.tsx
  - src/components/__tests__/TauriRequired.test.tsx
  - src/hooks/__tests__/useAuth.test.tsx
-->

---
### Requirement: Property type selection
The case detail page SHALL use tab-based switching ("成屋資訊" / "土地資訊") for property type display. The system SHALL NOT render a separate dropdown select for property type. The tab selection SHALL reflect the case's `property_type` value.

#### Scenario: Residential case loads
- **WHEN** user opens a case with `property_type='residential'`
- **THEN** the "成屋資訊" tab is active and the dropdown select is absent


<!-- @trace
source: aire-ux-wizard-refactor
updated: 2026-05-16
code:
  - src/components/OwnerAuthorizationDialog.tsx
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src/lib/pdf-engine/document.tsx
  - src/components/DeleteConfirmDialog.tsx
  - src/app/(dashboard)/cases/new/page.tsx
  - src/components/CaseListActions.tsx
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/lib/mock-backend.ts
  - src/app/(dashboard)/cases/page.tsx
  - src/components/case-wizard/CaseWizardStep1.tsx
  - src/components/CaseSupplementDialog.tsx
  - src/components/PullParcelDataButton.tsx
  - src/components/case-wizard/CaseWizardStep4.tsx
  - src/components/case-wizard/CaseWizardStep2.tsx
  - src/lib/cases-api.ts
  - src/components/case-wizard/CaseWizardStep3.tsx
  - src/lib/land-registry-api.ts
  - src/components/case-wizard/CaseWizard.tsx
-->

---
### Requirement: Auto-fill land lot and building lot numbers
For residential cases, the `land_lot_no` and `building_lot_no` fields SHALL NOT appear in the Step 1 form. These fields SHALL be auto-populated from the land registry query result in Step 2. After Step 2 completion, the values SHALL be visible as read-only fields.

#### Scenario: Step 1 form fields
- **WHEN** user is on Step 1 for a residential case
- **THEN** the form shows "所有權人", "地址", and other basic fields but NOT "土地地號" or "建物地號"

#### Scenario: After land registry pull
- **WHEN** user completes Step 2 and land registry returns `lot_number='大安段1234'`
- **THEN** the case record's `land_lot_no` is set to "大安段1234" and displays as read-only in the form


<!-- @trace
source: aire-ux-wizard-refactor
updated: 2026-05-16
code:
  - src/components/OwnerAuthorizationDialog.tsx
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src/lib/pdf-engine/document.tsx
  - src/components/DeleteConfirmDialog.tsx
  - src/app/(dashboard)/cases/new/page.tsx
  - src/components/CaseListActions.tsx
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/lib/mock-backend.ts
  - src/app/(dashboard)/cases/page.tsx
  - src/components/case-wizard/CaseWizardStep1.tsx
  - src/components/CaseSupplementDialog.tsx
  - src/components/PullParcelDataButton.tsx
  - src/components/case-wizard/CaseWizardStep4.tsx
  - src/components/case-wizard/CaseWizardStep2.tsx
  - src/lib/cases-api.ts
  - src/components/case-wizard/CaseWizardStep3.tsx
  - src/lib/land-registry-api.ts
  - src/components/case-wizard/CaseWizard.tsx
-->

---
### Requirement: Typo correction in placeholder text
The placeholder text for the notes field SHALL read "其他備註事項" (correct Traditional Chinese). The system SHALL NOT display "其他備注事項".

#### Scenario: Notes field placeholder
- **WHEN** user views the notes field in the case detail form
- **THEN** the placeholder reads "其他備註事項"

<!-- @trace
source: aire-ux-wizard-refactor
updated: 2026-05-16
code:
  - src/components/OwnerAuthorizationDialog.tsx
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src/lib/pdf-engine/document.tsx
  - src/components/DeleteConfirmDialog.tsx
  - src/app/(dashboard)/cases/new/page.tsx
  - src/components/CaseListActions.tsx
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/lib/mock-backend.ts
  - src/app/(dashboard)/cases/page.tsx
  - src/components/case-wizard/CaseWizardStep1.tsx
  - src/components/CaseSupplementDialog.tsx
  - src/components/PullParcelDataButton.tsx
  - src/components/case-wizard/CaseWizardStep4.tsx
  - src/components/case-wizard/CaseWizardStep2.tsx
  - src/lib/cases-api.ts
  - src/components/case-wizard/CaseWizardStep3.tsx
  - src/lib/land-registry-api.ts
  - src/components/case-wizard/CaseWizard.tsx
-->