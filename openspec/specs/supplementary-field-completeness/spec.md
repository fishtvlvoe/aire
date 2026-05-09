# supplementary-field-completeness Specification

## Purpose

TBD - created by archiving change 'disclosure-complete-and-fillable'. Update Purpose after archive.

## Requirements

### Requirement: agent-identity-fields

The supplementary form SHALL include company_name, property_name, case_number, agent_name, and agent_phone fields.

#### Scenario: fill agent identity fields

- **WHEN** the user fills in company_name, property_name, case_number, agent_name, agent_phone in the supplementary form and saves
- **THEN** these values are persisted in supplementary_data JSON and appear in the generated disclosure PDF header table

##### Example: header population

| Field | Input | PDF Header Cell |
|-------|-------|-----------------|
| company_name | "建安不動產" | renders in PDF header replacing {{COMPANY_NAME}} |
| property_name | "台南網寮電梯大樓" | fills 物件名稱 cell |
| case_number | "TN-2026-001" | fills 案件編號 cell |
| agent_name | "王小明" | fills 承辦人 field in Chapter 1 |
| agent_phone | "0912-345-678" | appended after agent_name as "王小明/0912-345-678" |


<!-- @trace
source: disclosure-complete-and-fillable
updated: 2026-05-03
code:
  - AIRE.db
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
### Requirement: transaction-fields

The supplementary form SHALL include sale_price, transaction_type, deed_fee_split, and other_terms fields for Chapter 4 (成交條件).

#### Scenario: fill transaction terms

- **WHEN** the user enters transaction_type = "一般買賣", deed_fee_split = "雙方各半", other_terms = "無" and saves
- **THEN** Chapter 4 of the generated PDF shows these values instead of {{待補}}


<!-- @trace
source: disclosure-complete-and-fillable
updated: 2026-05-03
code:
  - AIRE.db
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
### Requirement: building-supplement-fields

The supplementary form SHALL include ancillary_building_area, common_area_ping, land_use_zone, and announced_land_value fields for Chapters 5–6.

#### Scenario: fill building supplement

- **WHEN** the user enters ancillary_building_area = "3.12", common_area_ping = "8.45", land_use_zone = "住宅區", announced_land_value = "85000" and saves
- **THEN** Chapter 5 附屬建物坪數 = "3.12"、公設坪數 = "8.45" and Chapter 6 使用分區 = "住宅區"、公告現值 = "85000" appear in generated PDF


<!-- @trace
source: disclosure-complete-and-fillable
updated: 2026-05-03
code:
  - AIRE.db
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
### Requirement: surrounding-facility-fields

The supplementary form SHALL include school_distance, park_distance, transport_description, and shopping_description for Chapter 14 (周遭機能).

#### Scenario: fill surrounding facilities

- **WHEN** the user enters school_distance = "步行5分鐘", transport_description = "距台南火車站10分鐘車程" and saves
- **THEN** Chapter 14 shows these values instead of "距離待補" and {{待補}}

<!-- @trace
source: disclosure-complete-and-fillable
updated: 2026-05-03
code:
  - AIRE.db
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
### Requirement: Three-state completeness calculation for list icon

The supplementary field completeness module SHALL provide a three-state status value for use in the listing list icon display.

#### Scenario: Calculate status for list icon

- **WHEN** system evaluates supplementary completeness for a listing
- **THEN** it SHALL return one of three states: "missing" (has unfilled required fields), "complete" (all required fields filled), or "not-started" (listing in draft status)

##### Example: State determination

| Listing Status | Required Fields Filled | Result |
|---|---|---|
| draft | 0/5 | not-started |
| in-progress | 3/5 | missing |
| in-progress | 5/5 | complete |
| completed | 4/5 | missing |
| completed | 5/5 | complete |

<!-- @trace
source: supplementary-independence
updated: 2026-05-04
code:
  - src/lib/listings/supplementary-status.ts
  - src/app/listings/page.tsx
  - package.json
  - src/components/listings/SupplementStatusIcon.tsx
  - src/app/api/listings/[id]/restore/route.ts
  - src/app/api/listings/[id]/archive/route.ts
  - src/app/listings/[id]/generating/page.tsx
  - src/app/api/admin/users/[id]/reset-password/route.ts
  - src/app/admin/transfer/page.tsx
  - src/lib/db/schema.ts
  - src/lib/generators/disclaimer.ts
  - src/app/listings/[id]/supplementary/page.tsx
  - src/app/login/page.tsx
  - src/components/FolderSidebar.tsx
  - src/app/api/listings/[id]/route.ts
  - src/proxy.ts
  - src/app/admin/users/page.tsx
  - src/app/api/listings/route.ts
  - src/app/listings/[id]/documents/page.tsx
  - src/components/Stepper.tsx
  - src/app/api/admin/audit-logs/route.ts
  - src/lib/db/list-recent-helper.ts
  - src/lib/pdf-generator/dossier.ts
  - src/app/admin/audit-logs/page.tsx
  - src/lib/audit.ts
  - src/app/listings/[id]/fill/page.tsx
  - src/lib/pdf-generator/survey-sales.ts
  - src/app/api/listings/folders/[id]/route.ts
  - src/lib/generators/disclosure-document.ts
  - src/app/listings/[id]/supplement/page.tsx
  - src/lib/auth.ts
  - src/lib/db/index.ts
  - src/app/api/auth/login/route.ts
  - src/components/SearchBar.tsx
  - src/app/api/admin/transfer-cases/route.ts
  - src/lib/generators/property-sheet.ts
  - src/app/api/listings/[id]/folder/route.ts
  - src/app/api/listings/folders/route.ts
  - src/app/api/admin/users/[id]/disable/route.ts
  - src/app/api/admin/users/route.ts
  - src/app/api/auth/logout/route.ts
tests:
  - e2e/user-management.spec.ts
  - src/components/__tests__/Stepper.test.tsx
  - e2e/listing-ux.spec.ts
-->