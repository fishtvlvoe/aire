# listing-attachments-api Specification

## Purpose

TBD - created by archiving change 'fix-upload-extract-wiring'. Update Purpose after archive.

## Requirements

### Requirement: Expanded ALLOWED_TYPES for OCR document uploads

The attachments API SHALL accept the following additional `type` values for OCR-relevant document categories:

| New Type | Description |
|----------|-------------|
| `transcript` | 謄本（地籍/建物登記） |
| `title-deed` | 權狀 |
| `contract` | 合約 |
| `cadastral-map` | 地籍圖 |

#### Scenario: Transcript upload accepted

- **WHEN** client POSTs to `/api/listings/{id}/attachments` with `type: 'transcript'`
- **THEN** server SHALL return 200 and store the attachment
- **THEN** server SHALL trigger the extract pipeline for that attachment

#### Scenario: Unknown type still rejected

- **WHEN** client POSTs with `type: 'unknown_type'`
- **THEN** server SHALL return 400

<!-- @trace
source: fix-upload-extract-wiring
updated: 2026-05-03
code:
  - src/lib/codex-client/index.ts
  - src/components/forms/FieldVisitForm.tsx
  - Dockerfile
  - src/lib/pdf-generator/templates/dossier.html
  - src/lib/document-generator/build-input.ts
  - listings.db
  - src/lib/pdf-generator/templates/sales-dm.html
  - src/lib/pdf-generator/dossier.ts
  - src/lib/ocr/field-mapping.ts
  - src/components/Sidebar.tsx
  - src/lib/document-generator/pdf/dossier-land.ts
  - src/app/api/listings/[id]/regenerate/route.ts
  - src/components/PhotoUploadClassifier.tsx
  - src/lib/ocr/parsers/land-parser.ts
  - package.json
  - src/lib/codex-client/adapters/gemini.ts
  - src/lib/pdf-generator/survey-sales.ts
  - next.config.ts
  - src/lib/ocr/parsers/building-parser.ts
  - src/lib/pdf-generator/templates/survey.html
  - kimi-statusline-feature-request.md
  - kimi-usage-ux-issue-body.md
  - AIRE.db
  - src/lib/codex-client/types.ts
  - src/lib/document-generator/pdf/dossier-building.ts
  - src/app/layout.tsx
  - src/lib/db/index.ts
  - src/lib/document-generator/types.ts
  - docs/kimi-prompts-wave1-fix-disclosure.md
  - src/app/api/listings/[id]/generate/route.ts
  - src/lib/ocr/pdf-text-layer.ts
  - src/lib/ocr/normalize.ts
  - vitest.config.ts
  - src/app/api/listings/[id]/attachments/route.ts
  - kimi-statusline-issue-body.md
tests:
  - src/lib/ocr/__tests__/normalize.test.ts
  - src/lib/codex-client/__tests__/fallback-chain.test.ts
  - src/lib/ocr/__tests__/land-parser.test.ts
  - e2e/autofill-upload.spec.ts
  - src/lib/ocr/__tests__/e2e-autofill.spec.ts
  - src/lib/ocr/__tests__/building-parser.test.ts
  - src/lib/document-generator/__tests__/build-input.test.ts
  - src/lib/document-generator/pdf/__tests__/dossier-building.test.ts
  - src/app/api/__tests__/listings-delete.test.ts
-->