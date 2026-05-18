# asking-price-field Specification

## Purpose

TBD - created by archiving change 'case-form-fields-expansion'. Update Purpose after archive.

## Requirements

### Requirement: asking_price persisted in cases table
The system SHALL store asking price as an integer column `asking_price` (NULL-able) in the `cases` SQLite table, representing the value in NTD units (1 unit = 1 NTD). The wizard UI SHALL display and accept the value in 萬元 (10,000 NTD units) and convert on read/write.

#### Scenario: Create case with asking price
- **WHEN** user fills in 售價（萬元）as 3000 and submits the wizard Step 1 form
- **THEN** `cases.asking_price` is stored as 30000000 (3000 × 10000) in the database

#### Scenario: Case with no asking price
- **WHEN** user leaves 售價 field empty
- **THEN** `cases.asking_price` is stored as NULL and no value appears in the disclosure document asking price field

#### Scenario: Asking price flows to dossier
- **WHEN** `assembleDossierData()` is called for a case where `asking_price` is 30000000
- **THEN** `CaseDossierData.propertySheet.askingPrice` equals 30000000

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