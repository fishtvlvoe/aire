# building-condition-survey Specification

## Purpose

TBD - created by archiving change 'disclosure-smart-draft'. Update Purpose after archive.

## Requirements

### Requirement: Render building condition survey pages

The system SHALL render "現況調查表" pages for building-type cases with ~58 questions: client's 38 questions (基地調查 1-35 + 稅費 36-38) PLUS official MOI building-specific supplements (~20 questions covering: 建物瑕疵 7 items, 設備 6 items, 管理 5 items, 停車位 6 items).

#### Scenario: Draft mode — all checkboxes blank

- **WHEN** surveyData is null
- **THEN** all ~58 questions SHALL render with ☐ for all options across 6-7 pages

#### Scenario: Completed mode — filled answers

- **WHEN** surveyData is populated
- **THEN** the system SHALL display ☑/☐ based on answers for all questions

#### Scenario: Building defect section (建物瑕疵)

- **WHEN** rendering building-specific supplement questions
- **THEN** the system SHALL include: 滲漏水, 壁癌, 違建, 火災, 危樓, 裂痕, 鋼筋外露 as separate question rows

#### Scenario: Equipment section (設備)

- **WHEN** rendering equipment questions
- **THEN** the system SHALL include: 電梯, 消防設備, 無障礙設施, 水電管線, 夾層, 居住安全 as separate question rows

#### Scenario: Scope limited to residential buildings

- **WHEN** propertyType is 公寓, 大樓, or 套房
- **THEN** the building condition survey SHALL render
- **WHEN** propertyType is 店面, 廠房, or 農舍
- **THEN** the building condition survey SHALL NOT render (out of scope for this version)

---
### Requirement: Building survey data persistence

The system SHALL persist building survey answers via the `StorageAdapter` interface. In development (browser) environment, `MockStorageAdapter.saveCaseDisclosures(caseId, data)` SHALL write to `localStorage['aire-mock-store'].disclosures[caseId]`. In production (Tauri), `TauriStorageAdapter.saveCaseDisclosures` SHALL write to `disclosure_drafts.survey_data` JSON column in SQLite. Survey data SHALL be restored on page reload: `StorageAdapter.getCaseDisclosures(caseId)` is called on mount and the returned `DisclosureData` pre-populates all checkboxes.

#### Scenario: Distinguish from land survey by property type

- **WHEN** loading survey data for a building-type case
- **THEN** the system SHALL deserialize as BuildingSurveyData (not LandSurveyData)

#### Scenario: Survey answer persisted immediately on change

- **WHEN** user toggles a checkbox (e.g., conditionLeakage) in the 現況 tab
- **THEN** `StorageAdapter.saveCaseDisclosures(caseId, updatedData)` SHALL be called with the updated boolean value
- **THEN** `localStorage['aire-mock-store'].disclosures[caseId].conditionLeakage` SHALL equal true (in dev)

#### Scenario: Survey answers restored on reload

- **WHEN** user reloads the page after having toggled conditionLeakage to true
- **THEN** `StorageAdapter.getCaseDisclosures(caseId)` returns `{ conditionLeakage: true, ... }`
- **THEN** the conditionLeakage checkbox renders as checked

##### Example: Persistence roundtrip

- **GIVEN** case id "9b7db332-6b28-435c-9e50-70ac5696744e"
- **WHEN** user checks conditionLeakage, conditionRenovation
- **THEN** `aire-mock-store.disclosures["9b7db332-6b28-435c-9e50-70ac5696744e"]` equals `{ conditionLeakage: true, conditionRenovation: true, conditionIllegalStructure: false }`
- **WHEN** page reloads
- **THEN** both checkboxes render as checked

<!-- @trace
source: fix-qa-bugs
updated: 2026-05-20
code:
  - src/components/KeyinSplitPage.tsx
  - src/components/case-wizard/CaseWizardStep3Disclosure.tsx
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
  - src/lib/storage/StorageAdapter.ts
  - src/app/api/land-api/test-connection/route.ts
  - src/lib/storage/index.ts
  - src/lib/mock-backend.ts
  - src/lib/pdf-engine/html-renderer.tsx
  - src/components/OwnerAuthorizationDialog.tsx
  - src/app/api/location-map/route.ts
  - src/lib/pdf-blocks/location-map.tsx
  - src/lib/pdf-blocks/exterior-photo-page.tsx
  - src/lib/pdf-engine/react-pdf-init.ts
  - src/app/api/aerial-photo/route.ts
  - src/lib/use-draft-autosave.ts
  - src/app/api/street-view/route.ts
  - src/app/login/page.tsx
  - src/lib/pdf-engine/html-blocks/location-and-exterior.tsx
  - src/components/settings/LicenseSection.tsx
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/lib/storage/MockStorageAdapter.ts
  - src/lib/pdf-blocks/aerial-photo-page.tsx
  - src/lib/nlsc-aerial-map.ts
  - src/components/case-wizard/CaseWizardStep5.tsx
  - src/lib/pdf-blocks/image-data-url.ts
  - src/app/api/v1/licenses/activate/route.ts
  - src/components/settings/LandApiSection.tsx
  - src/lib/pdf-engine/document.tsx
  - public/pdf-fonts/NotoSansTC-Regular.otf
  - src/app/(dashboard)/settings/branding/branding-content.tsx
  - src/app/(dashboard)/layout.tsx
  - src/lib/pdf-blocks/floor-plan-photo-page.tsx
  - src/components/case-wizard/CaseWizard.tsx
tests:
  - src/components/case-wizard/__tests__/CaseWizardStep3Disclosure-storage.test.tsx
  - src/components/__tests__/OwnerAuthorizationDialog-redborder.test.tsx
  - src/components/__tests__/RealtorLicenseField.test.tsx
  - src/components/settings/__tests__/LicenseSection-api.test.tsx
  - src/components/settings/__tests__/LandApiSection-toast.test.tsx
  - src/components/settings/__tests__/LandApiSection.test.tsx
  - src/app/(dashboard)/settings/branding/__tests__/branding-storage.test.tsx
  - src/lib/pdf-blocks/__tests__/floor-plan-photo-page.test.tsx
  - src/components/__tests__/KeyinSplitPage.test.tsx
  - src/lib/pdf-blocks/__tests__/uint8-to-data-url.test.ts
  - src/lib/pdf-blocks/__tests__/dynamic-composition.test.tsx
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - src/app/(dashboard)/settings/sync-status/__tests__/page.test.tsx
  - src/lib/__tests__/use-draft-autosave.test.ts
  - src/lib/storage/__tests__/MockStorageAdapter.test.ts
  - src/lib/pdf-engine/__tests__/document-land-government-format.test.tsx
  - src/lib/__tests__/mock-backend.test.ts
  - src/lib/pdf-blocks/__tests__/logo-anchors.test.tsx
  - src/components/settings/__tests__/LicenseSection.test.tsx
  - src/lib/pdf-engine/__tests__/html-renderer-floor-plan-photo.test.tsx
  - src/app/(dashboard)/cases/__tests__/page.test.tsx
  - src/components/case-wizard/__tests__/step3-photo-upload.test.tsx
-->