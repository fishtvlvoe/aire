# fillable-pdf-output Specification

## Purpose

TBD - created by archiving change 'disclosure-complete-and-fillable'. Update Purpose after archive.

## Requirements

### Requirement: acroform-overlay-for-blank-fields

The disclosure PDF SHALL contain AcroForm text fields at the position of every remaining blank (unfilled) field so that users can type directly in Acrobat Reader or macOS Preview.

#### Scenario: blank fields become editable

- **WHEN** a disclosure PDF is downloaded and opened in Acrobat Reader
- **THEN** every field that has no value shows as an interactive text input box; completed fields show as static text


<!-- @trace
source: disclosure-complete-and-fillable
updated: 2026-05-03
code:
  - three-ai.db
  - src/lib/pdf-generator/dossier.ts
  - kimi-usage-ux-issue-body.md
  - src/lib/document-generator/build-input.ts
  - src/lib/pdf-generator/templates/dossier.html
  - src/lib/schemas/supplementary-schema.ts
  - src/app/api/listings/[id]/pdf/route.ts
  - src/lib/document-generator/tax-calculator.ts
  - src/app/listings/[id]/supplementary/page.tsx
  - package.json
  - src/lib/document-generator/pdf/dossier-building.ts
  - src/lib/document-generator/pdf/acroform-overlay.ts
tests:
  - src/lib/document-generator/__tests__/tax-calculator.test.ts
  - src/lib/codex-client/__tests__/adapters/gemini.test.ts
  - src/lib/pdf-generator/__tests__/dossier.test.ts
  - src/lib/document-generator/__tests__/acroform-overlay.test.ts
-->

---
### Requirement: coordinate-extraction-via-puppeteer

The system SHALL extract field bounding box coordinates from the rendered HTML before generating the PDF, using Puppeteer's page.evaluate() and getBoundingClientRect() on elements marked with data-field-id attributes.

#### Scenario: coordinate map generation

- **WHEN** the PDF generation pipeline runs
- **THEN** a JSON map of { fieldId: { x, y, width, height, page } } is produced and passed to the AcroForm overlay function

##### Example: coordinate map structure

| Field ID | x | y | width | height | page |
|----------|---|---|-------|--------|------|
| "chapter1-case-number" | 320 | 145 | 180 | 18 | 0 |
| "chapter5-building-number" | 180 | 88 | 200 | 18 | 1 |
| "chapter10-deed-tax" | 280 | 210 | 160 | 18 | 2 |


<!-- @trace
source: disclosure-complete-and-fillable
updated: 2026-05-03
code:
  - three-ai.db
  - src/lib/pdf-generator/dossier.ts
  - kimi-usage-ux-issue-body.md
  - src/lib/document-generator/build-input.ts
  - src/lib/pdf-generator/templates/dossier.html
  - src/lib/schemas/supplementary-schema.ts
  - src/app/api/listings/[id]/pdf/route.ts
  - src/lib/document-generator/tax-calculator.ts
  - src/app/listings/[id]/supplementary/page.tsx
  - package.json
  - src/lib/document-generator/pdf/dossier-building.ts
  - src/lib/document-generator/pdf/acroform-overlay.ts
tests:
  - src/lib/document-generator/__tests__/tax-calculator.test.ts
  - src/lib/codex-client/__tests__/adapters/gemini.test.ts
  - src/lib/pdf-generator/__tests__/dossier.test.ts
  - src/lib/document-generator/__tests__/acroform-overlay.test.ts
-->

---
### Requirement: filled-fields-are-static

Fields that already have a value from supplementary_data or extracted_data SHALL be rendered as static text in the PDF (not as AcroForm fields).

#### Scenario: filled field is not interactive

- **WHEN** company_name = "建安不動產" is present in supplementary_data
- **THEN** the company name in the PDF header is static text, not an editable text box


<!-- @trace
source: disclosure-complete-and-fillable
updated: 2026-05-03
code:
  - three-ai.db
  - src/lib/pdf-generator/dossier.ts
  - kimi-usage-ux-issue-body.md
  - src/lib/document-generator/build-input.ts
  - src/lib/pdf-generator/templates/dossier.html
  - src/lib/schemas/supplementary-schema.ts
  - src/app/api/listings/[id]/pdf/route.ts
  - src/lib/document-generator/tax-calculator.ts
  - src/app/listings/[id]/supplementary/page.tsx
  - package.json
  - src/lib/document-generator/pdf/dossier-building.ts
  - src/lib/document-generator/pdf/acroform-overlay.ts
tests:
  - src/lib/document-generator/__tests__/tax-calculator.test.ts
  - src/lib/codex-client/__tests__/adapters/gemini.test.ts
  - src/lib/pdf-generator/__tests__/dossier.test.ts
  - src/lib/document-generator/__tests__/acroform-overlay.test.ts
-->

---
### Requirement: pdf-header-table-population

The PDF cover page header table (物件名稱 / 案件編號 / 地址) SHALL be populated from the listing's address and supplementary_data fields, not left blank.

#### Scenario: header table filled

- **WHEN** property_name = "台南網寮電梯大樓", case_number = "TN-2026-001", address = "台南市永康區網寮里永華路580號五樓之3"
- **THEN** the PDF header table shows these three values in their designated cells

<!-- @trace
source: disclosure-complete-and-fillable
updated: 2026-05-03
code:
  - three-ai.db
  - src/lib/pdf-generator/dossier.ts
  - kimi-usage-ux-issue-body.md
  - src/lib/document-generator/build-input.ts
  - src/lib/pdf-generator/templates/dossier.html
  - src/lib/schemas/supplementary-schema.ts
  - src/app/api/listings/[id]/pdf/route.ts
  - src/lib/document-generator/tax-calculator.ts
  - src/app/listings/[id]/supplementary/page.tsx
  - package.json
  - src/lib/document-generator/pdf/dossier-building.ts
  - src/lib/document-generator/pdf/acroform-overlay.ts
tests:
  - src/lib/document-generator/__tests__/tax-calculator.test.ts
  - src/lib/codex-client/__tests__/adapters/gemini.test.ts
  - src/lib/pdf-generator/__tests__/dossier.test.ts
  - src/lib/document-generator/__tests__/acroform-overlay.test.ts
-->