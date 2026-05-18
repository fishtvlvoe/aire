# cover-auto-fill Specification

## Purpose

TBD - created by archiving change 'case-form-fields-expansion'. Update Purpose after archive.

## Requirements

### Requirement: assembleDossierData populates cover from brand settings
`assembleDossierData()` SHALL call `get_brand_text_settings` IPC at assembly time and use the returned values to populate `CaseDossierData.cover`: `handlingAgent` from `agent_name`, `licensedAgentName` from `realtor_name`, `licensedAgentCertNo` from `agent_cert_no`, `brokerageCompanyName` from `company_name`, `brokerageLicenseNo` from `company_license_no`, `companyAddress` from `company_address`, `companyPhone` from `company_phone`. `cover.propertyName` SHALL be set from `caseRow.address`. `cover.caseNumber` SHALL be set from `caseRow.case_no` if non-null, otherwise from the first 8 characters of `caseRow.id`.

#### Scenario: Brand settings present
- **WHEN** brand settings contain `company_name: "大安不動產"` and `assembleDossierData()` is called
- **THEN** `CaseDossierData.cover.brokerageCompanyName` equals "大安不動產" and the disclosure cover page renders that company name

#### Scenario: Brand settings empty (first run)
- **WHEN** brand settings have never been configured and `assembleDossierData()` is called
- **THEN** all `cover` text fields default to empty string (`""`) and the cover page renders with blank fields for manual completion

#### Scenario: IPC call fails (dev/mock mode)
- **WHEN** `get_brand_text_settings` IPC throws an error (e.g., in browser dev mode)
- **THEN** `assembleDossierData()` catches the error silently and uses empty string defaults for all cover fields, without throwing

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