# disclosure-cover-page Specification

## Purpose

TBD - created by archiving change 'disclosure-smart-draft'. Update Purpose after archive.

## Requirements

### Requirement: disclosure cover page renders brand text fields
The disclosure cover page (`CoverPage` component) SHALL render the following fields using values from `CaseDossierData.cover`: `brokerageCompanyName` (公司名稱), `brokerageLicenseNo` (牌照號), `companyAddress` (公司地址), `companyPhone` (公司電話), `handlingAgent` (業務員姓名), `licensedAgentName` (不動產經紀人), `licensedAgentCertNo` (業務員證號). When a field value is empty string, the field SHALL render as a blank printable line.

#### Scenario: Cover page with full brand data
- **WHEN** `CaseDossierData.cover.brokerageCompanyName` is "大安不動產" and the PDF is generated
- **THEN** the cover page renders "大安不動產" in the brokerage company name position

#### Scenario: Cover page with no brand data
- **WHEN** all `CaseDossierData.cover` text fields are empty string
- **THEN** the cover page renders blank fields suitable for manual completion

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