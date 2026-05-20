# sr-browser-pdf-image-rendering Specification

## Purpose

TBD - created by archiving change 'sr-pdf-browser-images-floor-plan-upload'. Update Purpose after archive.

## Requirements

### Requirement: Browser PDF image pages render actual images
The system SHALL render location map, aerial photo, and exterior photo bytes as browser-safe image sources in generated PDF documents.

#### Scenario: PNG location map bytes
- **WHEN** the PDF image helper receives bytes beginning with `89 50 4E 47`
- **THEN** it returns a data URL beginning with `data:image/png;base64,`

##### Example:
- GIVEN `Uint8Array([0x89, 0x50, 0x4E, 0x47])`
- WHEN `uint8ToDataUrl()` is called
- THEN the result prefix is `data:image/png;base64,`

#### Scenario: JPEG street-view bytes
- **WHEN** the PDF image helper receives bytes beginning with `FF D8`
- **THEN** it returns a data URL beginning with `data:image/jpeg;base64,`

##### Example:
- GIVEN `Uint8Array([0xFF, 0xD8, 0xFF])`
- WHEN `uint8ToDataUrl()` is called
- THEN the result prefix is `data:image/jpeg;base64,`

#### Scenario: Browser PDF export uses image bytes
- **WHEN** a browser/dev case preview exports a PDF and dossier data contains non-empty `locationMapImage`, `aerialPhoto`, or `exteriorPhoto`
- **THEN** the exported PDF uses image sources for those pages instead of showing the known placeholder text for that page

##### Example:
- GIVEN case `b24e336a-46db-4cf4-845d-cbd95abee3f8`
- WHEN `/cases/b24e336a-46db-4cf4-845d-cbd95abee3f8/preview` exports a PDF
- THEN at least one of the three image pages contains an actual image and not only placeholder text

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