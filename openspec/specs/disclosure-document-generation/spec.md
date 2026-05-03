# disclosure-document-generation Specification

## Purpose

TBD - created by archiving change 'disclosure-pdf-16-chapter'. Update Purpose after archive.

## Requirements

### Requirement: System generates 16-chapter Markdown disclosure document

The system SHALL generate a disclosure document (不動產說明書) in structured Markdown format containing exactly 16 chapters. Each chapter heading SHALL follow the pattern `#### 章節 N：標題` where N is the chapter number (1–16). Chapters SHALL be separated by `---`.

The system SHALL support two document variants:
- **Building version** (建物版): for property types 公寓, 大樓華廈, 透天別墅, 套房, 店面, 廠房, 農舍 (7 types)
- **Land version** (土地版): for property types 農地, 建地, 商業地, 工業地, 鄉村區建地, 其他土地 (6 types)

Chapters 1–4, 10–16 SHALL have identical structure across both versions. Chapters 5–6 and 8–11 differ between building and land versions.

#### Scenario: Building version chapter structure

- **WHEN** property type is one of 公寓/大樓華廈/透天別墅/套房/店面/廠房/農舍
- **THEN** the generated document SHALL contain chapters 1–16 as defined in the building version spec, with chapter 8 covering 建物現況調查

#### Scenario: Land version chapter structure

- **WHEN** property type is one of 農地/建地/商業地/工業地/鄉村區建地/其他土地
- **THEN** the generated document SHALL contain chapters 1–16 as defined in the land version spec, with chapters 8–11 covering 基地/土地現況調查表 p1–p4


<!-- @trace
source: disclosure-pdf-16-chapter
updated: 2026-04-18
code:
  - src/lib/pdf-generator/dossier.ts
  - src/app/listings/[id]/documents/page.tsx
  - src/lib/document-generator/codex-provider.ts
  - src/app/api/listings/[id]/pdf/route.ts
tests:
  - src/lib/pdf-generator/__tests__/dossier.test.ts
  - src/lib/document-generator/__tests__/land-type.test.ts
  - src/lib/document-generator/__tests__/five-documents.test.ts
-->

---
### Requirement: AI-generated chapters contain only allowed content

The system SHALL instruct the LLM to produce AI-generated content ONLY for chapters that have defined AI output: chapters 3 (100–200 word summary), 4 (2–5 bullet points, optional), 7 (risk list), 8 (confirmed/pending/needs-verification summary), 11 (3–6 plain-language points), 13 (one paragraph interpretation), 14 (3–5 points).

The system SHALL instruct the LLM to NOT calculate any tax amounts or fees. Chapters 10 and 12 SHALL contain only field labels with value `待補`.

Missing field values SHALL be represented as `待補`. The LLM SHALL NOT fabricate or estimate missing values.

#### Scenario: Missing field values

- **WHEN** a required data field is absent from field_visit_data, supplementary_data, or pre_commission_data
- **THEN** the generated Markdown SHALL display `待補` for that field value

#### Scenario: Tax calculation fields

- **WHEN** the document includes chapters 10, 11, or 12 (tax/fee chapters)
- **THEN** chapter 10 SHALL list item names with value `待補`
- **THEN** chapter 12 SHALL show calculation parameters but no computed totals
- **THEN** the LLM SHALL NOT produce numeric tax calculations


<!-- @trace
source: disclosure-pdf-16-chapter
updated: 2026-04-18
code:
  - src/lib/pdf-generator/dossier.ts
  - src/app/listings/[id]/documents/page.tsx
  - src/lib/document-generator/codex-provider.ts
  - src/app/api/listings/[id]/pdf/route.ts
tests:
  - src/lib/pdf-generator/__tests__/dossier.test.ts
  - src/lib/document-generator/__tests__/land-type.test.ts
  - src/lib/document-generator/__tests__/five-documents.test.ts
-->

---
### Requirement: Disclosure document prompt accepts structured data inputs

The system SHALL pass the following data to the LLM prompt when generating the disclosure document:
- `pre_commission_data`: owner name, phone, listing price, commission type, property address
- `field_visit_data`: all property field visit answers organized by section
- `supplementary_data`: cadastral numbers, area breakdown, encumbrances, zoning data
- `extracted_data`: OCR-parsed fields from uploaded transcript PDF, including `announced_land_value`, `rights_range`, `land_section`, `building_area`, `floor_total`, `year_built`, and other fields extracted by the OCR engine
- `system_computed`: values calculated by the API layer, including `area_ping` (building_area × 0.3025) and `building_age` (current year minus year_built converted from Minguo calendar)
- `property_type`: used to select building or land variant

The data sources SHALL be applied with the following priority order: `supplementary_data` > `extracted_data` > `field_visit_data`. When the same field exists in multiple sources, the higher-priority source SHALL take precedence.

The prompt SHALL explicitly enumerate all 16 chapter headings and their required content fields so the LLM can fill in each chapter.

Fields sourced from `extracted_data` SHALL be annotated in the output with the label `(OCR讀取，請確認)` to indicate they require human verification.

#### Scenario: Full data available

- **WHEN** field_visit_data, supplementary_data, pre_commission_data, and extracted_data are all present
- **THEN** the generated Markdown SHALL contain data-filled entries for all available fields
- **THEN** fields sourced exclusively from extracted_data SHALL include the annotation `(OCR讀取，請確認)`

#### Scenario: Partial data — only field_visit_data and extracted_data available

- **WHEN** supplementary_data is empty but extracted_data contains OCR-parsed fields
- **THEN** the generator SHALL use extracted_data values for legal fields such as announced_land_value, rights_range, and land_section
- **THEN** the generated document SHALL NOT show `待補` for fields present in extracted_data

#### Scenario: No transcript uploaded

- **WHEN** extracted_data is null or empty and supplementary_data is also empty
- **THEN** the generated Markdown SHALL still contain all 16 chapters
- **THEN** cadastral and legal fields in chapters 5, 6, 7 SHALL show `待補`

#### Scenario: system_computed values used

- **WHEN** building_area is available in field_visit_data or extracted_data
- **THEN** the system SHALL compute area_ping as building_area × 0.3025 and pass it in system_computed
- **THEN** the generated document SHALL display area in ping (坪) using the computed value

##### Example: area conversion

| building_area (m²) | area_ping (坪) | Notes |
|--------------------|----------------|-------|
| 84.13 | 25.45 | 84.13 × 0.3025 |
| 50.00 | 15.13 | 50.00 × 0.3025 |
| 0 | 0 | edge case: zero area |


<!-- @trace
source: fix-disclosure-extracted-data-pipeline
updated: 2026-05-03
code:
  - src/lib/document-generator/pdf/dossier-land.ts
  - src/lib/document-generator/pdf/dossier-building.ts
  - docs/kimi-prompts-wave1-fix-disclosure.md
  - src/app/api/listings/[id]/generate/route.ts
  - kimi-statusline-feature-request.md
  - src/lib/ocr/field-mapping.ts
  - listings.db
  - src/lib/codex-client/index.ts
  - src/app/api/listings/[id]/regenerate/route.ts
  - kimi-usage-ux-issue-body.md
  - src/lib/document-generator/types.ts
  - src/lib/document-generator/build-input.ts
  - kimi-statusline-issue-body.md
  - src/lib/codex-client/adapters/gemini.ts
  - src/lib/codex-client/types.ts
  - three-ai.db
tests:
  - src/lib/ocr/__tests__/e2e-autofill.spec.ts
  - src/lib/document-generator/pdf/__tests__/dossier-building.test.ts
  - src/lib/document-generator/__tests__/build-input.test.ts
  - src/lib/codex-client/__tests__/fallback-chain.test.ts
-->

---
### Requirement: chapter-5-building-data-from-extracted

Chapter 5（產權調查表：建物標示）SHALL use `extracted_data` with explicit key mappings when `supplementary_data` fields are absent. The prompt MUST list each field's `extracted_data` key name so the LLM can deterministically substitute values.

Mandatory key mappings:
- 建號 ← `extracted_data.building_number`
- 法定用途 ← `extracted_data.current_purpose`
- 主要建材 ← `extracted_data.structure`
- 總樓層 ← `extracted_data.floor_count`
- 主建物坪數 ← `extracted_data.building_area`（㎡ → 坪：× 0.3025，四捨五入兩位）
- 建築完成日 ← `extracted_data.year_built`
- 門牌地址 ← `extracted_data.address`

#### Scenario: known OCR fields populated

- **WHEN** `extracted_data` contains `{ building_area: 84.13, floor_count: 13, year_built: "民國083年" }` and `supplementary_data` is `{}`
- **THEN** Chapter 5 output contains "84.13" (or converted 坪 value), "13", "民國083年" and does NOT contain "待補" for those fields

#### Scenario: extracted_data field missing

- **WHEN** `extracted_data.building_number` is null or undefined
- **THEN** Chapter 5 shows "{{待補}}" for 建號


<!-- @trace
source: disclosure-ocr-field-mapping
updated: 2026-05-03
code:
  - src/lib/codex-client/index.ts
  - kimi-statusline-feature-request.md
  - kimi-statusline-issue-body.md
  - src/app/api/listings/[id]/generate/route.ts
  - src/lib/document-generator/pdf/dossier-building.ts
  - listings.db
  - docs/kimi-prompts-wave1-fix-disclosure.md
  - src/lib/codex-client/types.ts
tests:
  - src/lib/document-generator/pdf/__tests__/dossier-building.test.ts
  - src/lib/codex-client/__tests__/fallback-chain.test.ts
-->

---
### Requirement: chapter-6-land-data-from-extracted

Chapter 6（產權調查表：土地標示）SHALL list explicit `extracted_data` key names for all land fields, removing the ambiguous "改取 extracted_data" instruction that provides no key names.

Mandatory key mappings:
- 地段/地號 ← `extracted_data.land_number`
- 土地面積 ← `extracted_data.land_area`
- 持分比例 ← `extracted_data.rights_range`
- 公告地價 ← `extracted_data.announced_land_value`

#### Scenario: land data from OCR

- **WHEN** `extracted_data` contains `{ land_area: 1223, rights_range: "91/10000", announced_land_value: 71812 }` and `supplementary_data` is `{}`
- **THEN** Chapter 6 output contains "1223", "91/10000", "71812" and does NOT contain "待補" for those fields

<!-- @trace
source: disclosure-ocr-field-mapping
updated: 2026-05-03
code:
  - src/lib/codex-client/index.ts
  - kimi-statusline-feature-request.md
  - kimi-statusline-issue-body.md
  - src/app/api/listings/[id]/generate/route.ts
  - src/lib/document-generator/pdf/dossier-building.ts
  - listings.db
  - docs/kimi-prompts-wave1-fix-disclosure.md
  - src/lib/codex-client/types.ts
tests:
  - src/lib/document-generator/pdf/__tests__/dossier-building.test.ts
  - src/lib/codex-client/__tests__/fallback-chain.test.ts
-->