# brand-settings-persistence Specification

## Purpose

TBD - created by archiving change 'case-form-fields-expansion'. Update Purpose after archive.

## Requirements

### Requirement: Brand text fields stored and retrievable
The system SHALL persist 7 brand identity text fields in the singleton `branding` table: `agent_name` (業務員姓名), `agent_cert_no` (業務員證號), `company_name` (公司名稱), `company_license_no` (公司牌照號), `company_address` (公司地址), `company_phone` (公司電話), `realtor_name` (不動產經紀人姓名). All fields are TEXT NULL-able. The system SHALL expose Tauri IPC commands `get_brand_text_settings` and `save_brand_text_settings`.

#### Scenario: Save and retrieve brand text settings
- **WHEN** user fills 公司名稱 as "大安不動產" and clicks 儲存
- **THEN** `save_brand_text_settings` IPC is called with `company_name: "大安不動產"` and the value is persisted to the branding singleton row
- **AND WHEN** `get_brand_text_settings` IPC is called later
- **THEN** it returns `{ company_name: "大安不動產", ... }` with the saved value


<!-- @trace
source: case-form-fields-expansion
updated: 2026-05-18
code:
  - src-tauri/src/db/cases.rs
  - src/components/case-wizard/CaseWizardStep2.tsx
  - src-tauri/src/lib.rs
  - src-tauri/src/commands/cases.rs
  - src/app/(dashboard)/settings/branding/branding-content.tsx
  - src/lib/mock-backend.ts
  - src-tauri/src/db/drafts.rs
  - src/lib/cases-api.ts
  - src-tauri/src/branding/mod.rs
  - src-tauri/migrations/006_case_fields.sql
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/lib/branding-api.ts
  - src-tauri/src/db/mod.rs
  - src/components/case-wizard/CaseWizardStep1.tsx
tests:
  - src/components/__tests__/CaseWizardStep1.test.tsx
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - src-tauri/tests/e2e_smoke.rs
  - src/components/__tests__/CaseWizardStep2.test.tsx
  - src/app/(dashboard)/settings/branding/__tests__/branding-content.test.tsx
-->

---
### Requirement: 品牌設定 page renders brand text form
The 品牌設定 settings tab SHALL render a form with 7 labelled text inputs for the brand identity fields, a 儲存 button, and a success toast on save. The form SHALL pre-populate with values returned by `get_brand_text_settings` on mount.

#### Scenario: Page loads with saved data
- **WHEN** user navigates to 品牌設定 tab
- **THEN** all 7 text inputs are pre-populated with the values retrieved from `get_brand_text_settings` IPC

#### Scenario: Empty state
- **WHEN** brand settings have never been saved
- **THEN** all 7 text inputs render empty (not null or undefined) and the user can fill them in

<!-- @trace
source: case-form-fields-expansion
updated: 2026-05-18
code:
  - src-tauri/src/db/cases.rs
  - src/components/case-wizard/CaseWizardStep2.tsx
  - src-tauri/src/lib.rs
  - src-tauri/src/commands/cases.rs
  - src/app/(dashboard)/settings/branding/branding-content.tsx
  - src/lib/mock-backend.ts
  - src-tauri/src/db/drafts.rs
  - src/lib/cases-api.ts
  - src-tauri/src/branding/mod.rs
  - src-tauri/migrations/006_case_fields.sql
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/lib/branding-api.ts
  - src-tauri/src/db/mod.rs
  - src/components/case-wizard/CaseWizardStep1.tsx
tests:
  - src/components/__tests__/CaseWizardStep1.test.tsx
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - src-tauri/tests/e2e_smoke.rs
  - src/components/__tests__/CaseWizardStep2.test.tsx
  - src/app/(dashboard)/settings/branding/__tests__/branding-content.test.tsx
-->