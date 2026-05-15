# disclosure-form-land Specification

## Purpose

TBD - created by archiving change 'aire-desktop-phase1'. Update Purpose after archive.

## Requirements

### Requirement: Land disclosure form fields

The system SHALL provide a multi-tab form for cases where `property_type='land'`, organized into 4 tabs in this order: `標示` (identification), `權利` (rights), `稅費` (tax & fees), `現況` (current condition).

The form SHALL include at minimum the following field groups, each persisted as keys in `disclosure_drafts.payload_json`:

##### Example: land field groups by tab

| Tab | Field keys (subset) | Type |
| --- | --- | --- |
| 標示 | `land_lot_no`, `land_area`, `zoning_use`, `urban_district`, `land_category` | text, number |
| 權利 | `ownership_type`, `share_ratio`, `mortgage_status`, `other_rights` | enum, text |
| 稅費 | `tax_land_value`, `tax_announced_present_value`, `tax_land_value_tax_annual` | number |
| 現況 | `condition_access`, `condition_boundary_clear`, `condition_tenant_present`, `condition_defects_notes` | boolean, text |

#### Scenario: Form renders all tabs on initial load

- **WHEN** the user opens a land case edit page
- **THEN** four tab triggers are visible with labels `標示`, `權利`, `稅費`, `現況`, and the `標示` tab is selected by default

#### Scenario: Switch tabs preserves entered values

- **WHEN** the user enters `land_area=120.5` in `標示`, switches to `現況`, then switches back to `標示`
- **THEN** the value `120.5` is still present in the `land_area` input

---
### Requirement: Field validation rules

The system SHALL validate land fields on blur and before save:

- Number fields (`land_area`, `share_ratio`, `tax_*`) MUST accept positive numbers; `share_ratio` MUST be between `0` and `1` inclusive (e.g., `0.25` for 1/4 share).
- Text field `land_lot_no` MUST NOT be empty for `status='completed'` transition.
- Tri-state booleans accept `true`, `false`, `unknown`.

##### Example: validation results

| Field | Input | Result |
| --- | --- | --- |
| `land_area` | `120.5` | accept |
| `land_area` | `0` | accept |
| `share_ratio` | `0.5` | accept |
| `share_ratio` | `1.5` | reject: `持分比例需介於 0 到 1` |
| `share_ratio` | `-0.1` | reject: `持分比例需介於 0 到 1` |
| `land_lot_no` | empty (status=completed) | reject: `地號為必填` |

#### Scenario: Share ratio outside range rejected

- **WHEN** the user types `1.5` in `share_ratio` and blurs the field
- **THEN** the field displays `持分比例需介於 0 到 1` and the value is not saved to draft

#### Scenario: Empty required field blocks completion transition

- **WHEN** the user clicks `標示為完成` on a land case where `land_lot_no` is empty
- **THEN** the system blocks the transition and displays an inline error on the missing field

---
### Requirement: Draft autosave

The system SHALL debounce field changes by 1000 milliseconds and call the IPC command `save_draft(case_id, payload)` to upsert into `disclosure_drafts`. The form SHALL flush a final save when the window emits a close event before unmount.

#### Scenario: Save status indicator

- **WHEN** an autosave completes successfully
- **THEN** the top-right status indicator displays `已儲存 HH:mm:ss` in Asia/Taipei time

#### Scenario: Save failure does not block input

- **WHEN** `save_draft` fails with a DB error
- **THEN** the indicator displays `儲存失敗，已保留輸入` in red and the user can continue editing

---
### Requirement: Form reload from saved draft

The system SHALL hydrate the land form from `disclosure_drafts.payload_json` when the user opens an existing land case, using `schema_version` to apply forward-compatible defaults for any future fields.

#### Scenario: Reopen case with saved draft

- **WHEN** the user reopens a land case where a draft was saved with two fields filled
- **THEN** the form displays the two field values exactly as last saved, with all other fields at their default (empty for text, null for number, `unknown` for tri-state booleans)

---
### Requirement: Land form SHALL include realtor license verification field

The system SHALL add the same `RealtorLicenseField` component (as defined for residential) to the land disclosure form. The field SHALL behave identically to the residential version, using the same `realtor-license-verification` capability.

#### Scenario: License field appears in land form

- **WHEN** the user opens the land disclosure form for a case
- **THEN** the form contains a labeled field "經紀人證號" with a text input AND inline space for the verification state indicator

#### Scenario: Land form verification reuses residential implementation

- **WHEN** the same `RealtorLicenseField` component is mounted in both residential and land forms
- **THEN** both forms invoke the same `verify_realtor_license` IPC with identical 500ms debounce behavior AND both forms display the identical three-state UI


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
### Requirement: Land form license state SHALL persist with case draft

The system SHALL save the verification state alongside the land case draft using the same autosave mechanism described for the residential form, ensuring symmetric behavior between the two form types.

#### Scenario: Reopening land case preserves verification state

- **WHEN** a land case has been saved with a verified license and the user reopens the form
- **THEN** the verification state indicator shows the previously stored state immediately AND the cache freshness check still runs

##### Example: Land draft round-trip

- **GIVEN** a land case `L0001` saved with `licenseNumber: "ABC123"`, `licenseStatus: "verified"`, `licenseVerifiedAt: "2026-05-14T10:00:00Z"`
- **WHEN** the user closes the form and reopens it at `2026-05-15T10:00:00Z` (1 day later, within 7-day cache window)
- **THEN** on the initial render the field shows "✓ 已驗證" within 100ms (before any IPC call returns) AND the IPC `verify_realtor_license("ABC123")` is invoked AND returns `source: "cache"` (because the 7-day cache window is not yet expired)

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