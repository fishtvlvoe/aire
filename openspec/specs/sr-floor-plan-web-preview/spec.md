# sr-floor-plan-web-preview Specification

## Purpose

TBD - created by archiving change 'sr-floor-plan-web-preview'. Update Purpose after archive.

## Requirements

### Requirement: Web preview shows uploaded floor-plan photo
The system SHALL render the direct-upload floor-plan or planning-map image in the web HTML preview when dossier data contains `floorPlanPhoto`.

#### Scenario: residential web preview shows floor-plan image
- **WHEN** a residential dossier has non-empty `floorPlanPhoto`
- **THEN** `renderDisclosureHtml()` includes a `格局圖` page with an image using a browser-safe data URL

##### Example:
- GIVEN `CaseDossierData.propertyType = "building"`
- AND `floorPlanPhoto` contains PNG bytes
- WHEN `renderDisclosureHtml()` runs
- THEN the HTML contains `alt="格局圖"` and a `data:image/png;base64,` image source

#### Scenario: land web preview shows planning-map placeholder when missing
- **WHEN** a land dossier has no `floorPlanPhoto`
- **THEN** `renderDisclosureHtml()` includes a `土地規劃圖` page with the placeholder `請上傳規劃圖`

##### Example:
- GIVEN `CaseDossierData.propertyType = "land"`
- AND `floorPlanPhoto = null`
- WHEN `renderDisclosureHtml()` runs
- THEN the HTML contains `土地規劃圖` and `請上傳規劃圖`

<!-- @trace
source: sr-floor-plan-web-preview
updated: 2026-05-20
code:
  - src/lib/pdf-blocks/exterior-photo-page.tsx
  - src/lib/pdf-blocks/aerial-photo-page.tsx
  - src/lib/pdf-blocks/image-data-url.ts
  - src/lib/pdf-blocks/floor-plan-photo-page.tsx
  - src/components/case-wizard/CaseWizardStep3Disclosure.tsx
  - src/lib/pdf-engine/document.tsx
  - src/lib/pdf-engine/assemble-dossier-data.ts
  - src/lib/pdf-engine/html-renderer.tsx
  - src/lib/pdf-blocks/location-map.tsx
  - src/lib/pdf-engine/html-blocks/location-and-exterior.tsx
tests:
  - src/components/case-wizard/__tests__/step3-photo-upload.test.tsx
  - src/lib/pdf-engine/__tests__/html-renderer-floor-plan-photo.test.tsx
  - src/lib/pdf-blocks/__tests__/uint8-to-data-url.test.ts
  - src/lib/pdf-blocks/__tests__/floor-plan-photo-page.test.tsx
  - src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
-->