# sr-step3-floor-plan-photo-upload Specification

## Purpose

TBD - created by archiving change 'sr-pdf-browser-images-floor-plan-upload'. Update Purpose after archive.

## Requirements

### Requirement: Step 3 floor-plan upload persists one image
The system SHALL let the user upload one JPG or PNG floor-plan/planning-map image from Wizard Step 3 and persist it with the case in browser/dev mode.

#### Scenario: Residential floor-plan upload control
- **WHEN** Step 3 renders for a residential case
- **THEN** it shows a floor-plan upload control with `data-testid="floor-plan-file-input"`

##### Example:
- GIVEN `caseData.property_type = "residential"`
- WHEN `CaseWizardStep3Disclosure` renders
- THEN `floor-plan-file-input` exists

#### Scenario: Land planning-map upload control
- **WHEN** Step 3 renders for a land case
- **THEN** it shows a planning-map upload control with `data-testid="planning-map-file-input"`

##### Example:
- GIVEN `caseData.property_type = "land"`
- WHEN `CaseWizardStep3Disclosure` renders
- THEN `planning-map-file-input` exists

#### Scenario: oversized upload rejected
- **WHEN** the user selects a JPG or PNG larger than 10MB
- **THEN** the system displays `圖片大小不超過 10MB` and does not persist the file

##### Example:
- GIVEN a PNG file of 10MB + 1 byte
- WHEN the user selects it in Step 3
- THEN the error message is visible and `casesApi.update` is not called for `floor_plan_photo`

#### Scenario: uploaded image restored after refresh
- **WHEN** `caseData.land_registry_data.floor_plan_photo` contains `{ base64, mime }`
- **THEN** Step 3 restores the thumbnail preview with `data-testid="floor-plan-preview"`

##### Example:
- GIVEN `land_registry_data.floor_plan_photo.mime = "image/png"`
- WHEN Step 3 loads
- THEN `floor-plan-preview` is visible without selecting a new file

<!-- @trace
source: sr-pdf-browser-images-floor-plan-upload
updated: 2026-05-19
code:
  - src/components/case-wizard/CaseWizardStep3Disclosure.tsx
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/lib/pdf-blocks/image-data-url.ts
  - src/lib/pdf-engine/document.tsx
  - src/lib/pdf-blocks/exterior-photo-page.tsx
  - src/lib/pdf-blocks/floor-plan-photo-page.tsx
  - src/lib/pdf-blocks/location-map.tsx
  - src/lib/pdf-blocks/aerial-photo-page.tsx
tests:
  - src/lib/pdf-blocks/__tests__/floor-plan-photo-page.test.tsx
  - src/lib/pdf-blocks/__tests__/uint8-to-data-url.test.ts
  - src/components/case-wizard/__tests__/step3-photo-upload.test.tsx
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
-->