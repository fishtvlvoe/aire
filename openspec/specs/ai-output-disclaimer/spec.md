# ai-output-disclaimer Specification

## Purpose

TBD - created by archiving change 'user-management'. Update Purpose after archive.

## Requirements

### Requirement: AI disclaimer on all generated documents

Every document produced by an AI generator (disclosure-document, property-sheet, marketing materials) SHALL include a visible disclaimer indicating the content was AI-assisted and requires human verification.

#### Scenario: Disclaimer in markdown output

- **WHEN** a generator function produces markdown output
- **THEN** the output SHALL end with a separator line followed by the disclaimer text

##### Example: Disclosure document footer

- **GIVEN** agent generates a disclosure document for listing id=10
- **WHEN** the generator returns markdown content
- **THEN** the last lines SHALL be:
  ```
  ---
  ⚠️ 本文件由 AI 輔助產出，請務必確認內容正確後再使用。
  ```

#### Scenario: Disclaimer in PDF output

- **WHEN** a generator function produces PDF output via Puppeteer
- **THEN** the PDF SHALL include the disclaimer as grey small text in the page footer area

##### Example: PDF page footer

- **GIVEN** agent generates a PDF disclosure document
- **WHEN** PDF is rendered
- **THEN** each page footer SHALL contain "本文件由 AI 輔助產出，請務必確認內容正確後再使用" in grey (#999) 8pt font


<!-- @trace
source: user-management
updated: 2026-05-04
code:
  - package.json
  - src/app/admin/audit-logs/page.tsx
  - src/lib/db/schema.ts
  - src/lib/db/index.ts
  - src/app/api/auth/logout/route.ts
  - src/lib/audit.ts
  - src/app/api/admin/users/[id]/reset-password/route.ts
  - src/app/admin/users/page.tsx
  - src/app/api/listings/[id]/route.ts
  - src/app/api/listings/route.ts
  - src/lib/pdf-generator/dossier.ts
  - src/app/api/admin/audit-logs/route.ts
  - src/app/admin/transfer/page.tsx
  - src/app/api/admin/users/route.ts
  - src/app/login/page.tsx
  - src/lib/generators/disclosure-document.ts
  - src/proxy.ts
  - src/lib/db/list-recent-helper.ts
  - src/lib/pdf-generator/survey-sales.ts
  - src/app/api/admin/transfer-cases/route.ts
  - src/app/api/admin/users/[id]/disable/route.ts
  - src/app/api/auth/login/route.ts
  - src/lib/auth.ts
  - src/lib/generators/disclaimer.ts
  - src/lib/generators/property-sheet.ts
tests:
  - e2e/user-management.spec.ts
-->

---
### Requirement: Disclaimer cannot be removed by users

The disclaimer text SHALL be hardcoded in the generator output and not editable or removable through the application UI.

#### Scenario: Disclaimer persists through re-generation

- **WHEN** a user re-generates a document
- **THEN** the disclaimer SHALL always be present in the new output regardless of any user settings

##### Example: Re-generate preserves disclaimer

- **GIVEN** agent previously generated a disclosure document
- **WHEN** agent clicks "重新產生" to regenerate the document
- **THEN** the new output SHALL still contain the disclaimer footer

<!-- @trace
source: user-management
updated: 2026-05-04
code:
  - package.json
  - src/app/admin/audit-logs/page.tsx
  - src/lib/db/schema.ts
  - src/lib/db/index.ts
  - src/app/api/auth/logout/route.ts
  - src/lib/audit.ts
  - src/app/api/admin/users/[id]/reset-password/route.ts
  - src/app/admin/users/page.tsx
  - src/app/api/listings/[id]/route.ts
  - src/app/api/listings/route.ts
  - src/lib/pdf-generator/dossier.ts
  - src/app/api/admin/audit-logs/route.ts
  - src/app/admin/transfer/page.tsx
  - src/app/api/admin/users/route.ts
  - src/app/login/page.tsx
  - src/lib/generators/disclosure-document.ts
  - src/proxy.ts
  - src/lib/db/list-recent-helper.ts
  - src/lib/pdf-generator/survey-sales.ts
  - src/app/api/admin/transfer-cases/route.ts
  - src/app/api/admin/users/[id]/disable/route.ts
  - src/app/api/auth/login/route.ts
  - src/lib/auth.ts
  - src/lib/generators/disclaimer.ts
  - src/lib/generators/property-sheet.ts
tests:
  - e2e/user-management.spec.ts
-->