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

The PDF renderer SHALL parse the markdown using a token-based approach (marked.lexer) and render each token type with formal typesetting rules: headings centered at 16pt Bold, paragraphs at 12pt Regular with 1.5x line height, label-value pairs with fixed-width labels. All text SHALL be rendered within the content margin boundaries of each page.

#### Scenario: Building version chapter structure

WHEN property type is one of 公寓/大樓華廈/透天別墅/套房/店面/廠房/農舍
THEN the generated document SHALL contain chapters 1–16 as defined in the building version spec, with chapter 8 covering 建物現況調查

##### Example:
GIVEN property type is 公寓
WHEN disclosure document is generated
THEN output contains exactly 16 chapters with chapter 8 titled 建物現況調查

#### Scenario: Land version chapter structure

WHEN property type is one of 農地/建地/商業地/工業地/鄉村區建地/其他土地
THEN the generated document SHALL contain chapters 1–16 as defined in the land version spec, with chapters 8–11 covering 基地/土地現況調查表 p1–p4

##### Example:
GIVEN property type is 農地
WHEN disclosure document is generated
THEN output contains exactly 16 chapters with chapters 8-11 covering 基地/土地現況調查表

#### Scenario: PDF renders markdown with formal typesetting

WHEN the markdown content is converted to PDF
THEN chapter headings (level-2 and level-4) SHALL render centered with enlarged Bold font, paragraphs SHALL render with 1.5x line spacing and 12pt paragraph spacing, and all text SHALL stay within the defined content margin area.

##### Example:
GIVEN markdown containing `## 章節 2：重要告知` and paragraph text
WHEN converted to PDF
THEN pdftotext output contains "章節 2：重要告知" and visual inspection shows centered heading at 16pt


<!-- @trace
source: disclosure-pdf-typesetting
updated: 2026-05-10
code:
  - package.json
  - public/branding/backgrounds/cover.png
  - src/lib/pdf-generator/pdflib-dossier.ts
  - src/lib/pdf-generator/typesetting.ts
  - .agents/skills/spectra-apply/SKILL.md
  - .agents/skills/spectra-ingest/SKILL.md
  - .agents/skills/spectra-discuss/SKILL.md
  - public/fonts/NotoSansTC-Regular.ttf
  - src/lib/pdf-generator/dossier.ts
  - .agents/skills/spectra-commit/SKILL.md
  - docs/demo/不動產說明書-樣本.pdf
  - .agents/skills/spectra-ask/SKILL.md
  - .agents/skills/spectra-archive/SKILL.md
  - .agents/skills/spectra-debug/SKILL.md
  - public/fonts/NotoSansTC-Bold.ttf
  - public/branding/backgrounds/content.png
  - .agents/skills/spectra-audit/SKILL.md
  - docs/demo/不動產說明書-測試.pdf
  - .agents/skills/spectra-propose/SKILL.md
  - .agents/skills/spectra-drift/SKILL.md
tests:
  - src/app/api/__tests__/listings-pdf-route.test.ts
  - src/lib/pdf-generator/__tests__/dossier.test.ts
  - src/lib/pdf-generator/__tests__/pdflib-dossier.test.ts
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
  - AIRE.db
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

---
### Requirement: no-personal-greeting

The LLM prompt for disclosure document generation SHALL NOT produce any personal greeting, name, or salutation. The output SHALL begin directly with the chapter structure.

#### Scenario: no greeting in output

- **WHEN** a disclosure document is generated for any listing
- **THEN** the output does NOT contain any form of "您好", "老魚", personal name, or greeting sentence before the chapter content


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
### Requirement: waiting-fields-as-blank-underline-in-html

In the Puppeteer HTML template, all placeholder markers for unfilled fields SHALL render as `<span data-field-id="[id]" class="pdf-blank">______</span>` instead of the text "{{待補}}", so that:
1. The PDF visually shows an underline for missing data
2. The AcroForm overlay can locate the field by data-field-id

#### Scenario: blank field renders as underline

- **WHEN** company_name is absent from supplementary_data
- **THEN** the PDF cover shows "______" (underline) in the company name position, and an AcroForm text field is overlaid at that position

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
### Requirement: no-internal-annotations-in-pdf

The generated PDF SHALL NOT contain any internal system annotation text. Specifically, the following strings MUST NOT appear anywhere in the final PDF output:
- 「OCR讀取，請確認」
- 「（OCR讀取，請確認）」
- 「資料不足」
- 「待補」
- 「待系統計算」

All data fields that lack a value SHALL be rendered as a blank cell or empty string. No explanatory phrase SHALL substitute for missing data.

#### Scenario: field_visit_data is partially empty

- **WHEN** field_visit_data does not include a value for a Chapter 8 survey item
- **THEN** the corresponding Chapter 8 table row has an empty status cell and an empty notes cell

#### Scenario: system_computed tax field is absent

- **WHEN** system_computed does not include computed_deed_tax
- **THEN** Chapter 10 契稅 cell is empty — no text appears

#### Scenario: OCR data is used

- **WHEN** extracted_data provides a value not present in supplementary_data
- **THEN** the value appears in the PDF without any annotation suffix

##### Example: building_number from OCR

| Field | supplementary_data | extracted_data | PDF output |
|-------|--------------------|----------------|------------|
| building_number | (empty) | "建號 12345" | "建號 12345" (no suffix) |


<!-- @trace
source: pdf-tax-and-field-fixes
updated: 2026-05-03
code:
  - src/lib/document-generator/tax-calculator.ts
  - src/lib/document-generator/build-input.ts
  - src/lib/pdf-generator/dossier.ts
  - src/lib/document-generator/pdf/dossier-building.ts
  - src/lib/parsers/transcript-parser.ts
  - scripts/e2e-verify-pdf.mjs
  - src/lib/pdf-generator/templates/dossier.html
tests:
  - src/lib/parsers/__tests__/transcript-parser.test.ts
  - src/lib/document-generator/pdf/__tests__/dossier-building.test.ts
  - src/lib/document-generator/__tests__/tax-calculator.test.ts
-->

---
### Requirement: no-json-key-leak-in-output

The LLM SHALL NOT output JSON field name identifiers in the PDF. Specifically, any pattern matching `（英文key：值）` or `（英文key：英文key）` SHALL NOT appear in the generated PDF.

Chapter 4 output SHALL contain only Chinese prose. Internal field names such as `transaction_type`, `deed_fee_split`, and similar identifiers MUST NOT appear in any form in the final PDF.

#### Scenario: transaction type display

- **WHEN** pre_commission_data.transaction_type = "買賣"
- **THEN** Chapter 4 shows「交易方式：買賣。」with no parenthetical key suffix

##### Example: correct vs incorrect Chapter 4 output

| Incorrect (current) | Correct (expected) |
|--------------------|--------------------|
| 交易方式：買賣（transaction_type：買賣）。 | 交易方式：買賣。 |
| 代書費分擔：雙方各半（deed_fee_split：雙方各半）。 | 代書費分擔：雙方各半。 |


<!-- @trace
source: pdf-tax-and-field-fixes
updated: 2026-05-03
code:
  - src/lib/document-generator/tax-calculator.ts
  - src/lib/document-generator/build-input.ts
  - src/lib/pdf-generator/dossier.ts
  - src/lib/document-generator/pdf/dossier-building.ts
  - src/lib/parsers/transcript-parser.ts
  - scripts/e2e-verify-pdf.mjs
  - src/lib/pdf-generator/templates/dossier.html
tests:
  - src/lib/parsers/__tests__/transcript-parser.test.ts
  - src/lib/document-generator/pdf/__tests__/dossier-building.test.ts
  - src/lib/document-generator/__tests__/tax-calculator.test.ts
-->

---
### Requirement: no-placeholder-distance-in-chapter14

Chapter 14 (周邊機能) SHALL NOT output the literal string「（距離）」when no specific distance value is available. If a specific distance (e.g., "300公尺", "步行5分鐘") is known, it SHALL be included. If unknown, the location name SHALL appear without any distance annotation.

#### Scenario: distance unknown

- **WHEN** external_data lists a nearby location without a distance value
- **THEN** Chapter 14 shows the location name only, with no distance annotation

##### Example: distance rendering

| external_data distance field | Chapter 14 output |
|-----------------------------|-------------------|
| null or absent | 大灣市場、全聯福利中心 |
| "300公尺" | 大灣市場（300公尺） |


<!-- @trace
source: pdf-tax-and-field-fixes
updated: 2026-05-03
code:
  - src/lib/document-generator/tax-calculator.ts
  - src/lib/document-generator/build-input.ts
  - src/lib/pdf-generator/dossier.ts
  - src/lib/document-generator/pdf/dossier-building.ts
  - src/lib/parsers/transcript-parser.ts
  - scripts/e2e-verify-pdf.mjs
  - src/lib/pdf-generator/templates/dossier.html
tests:
  - src/lib/parsers/__tests__/transcript-parser.test.ts
  - src/lib/document-generator/pdf/__tests__/dossier-building.test.ts
  - src/lib/document-generator/__tests__/tax-calculator.test.ts
-->

---
### Requirement: no-confirmed-marker-in-chapter14

Chapter 14 (周邊機能) SHALL NOT output「（已確認）」or any confirmation marker. Confirmed facilities SHALL be listed by name only.

#### Scenario: confirmed facility

- **WHEN** a Chapter 14 facility entry is marked as confirmed
- **THEN** the PDF shows only the facility name with no confirmation annotation

##### Example: confirmed facility rendering

| LLM internal state | Chapter 14 output |
|-------------------|-------------------|
| 社區小公園（已確認） | 社區小公園 |
| 北灣大灣生活圈（已確認） | 北灣大灣生活圈 |


<!-- @trace
source: pdf-tax-and-field-fixes
updated: 2026-05-03
code:
  - src/lib/document-generator/tax-calculator.ts
  - src/lib/document-generator/build-input.ts
  - src/lib/pdf-generator/dossier.ts
  - src/lib/document-generator/pdf/dossier-building.ts
  - src/lib/parsers/transcript-parser.ts
  - scripts/e2e-verify-pdf.mjs
  - src/lib/pdf-generator/templates/dossier.html
tests:
  - src/lib/parsers/__tests__/transcript-parser.test.ts
  - src/lib/document-generator/pdf/__tests__/dossier-building.test.ts
  - src/lib/document-generator/__tests__/tax-calculator.test.ts
-->

---
### Requirement: disclosed-land-value-semantics

In Chapter 7 (他項權利/限制登記), the field labelled「公告現值」SHALL refer exclusively to the 公告土地現值（每平方公尺，土地專屬，不含建物評定現值）. The LLM prompt MUST include this clarification to prevent the LLM from conflating it with 房屋評定現值.

#### Scenario: Chapter 7 public value field

- **WHEN** supplementary_data includes announced_land_value (土地公告現值)
- **THEN** Chapter 7 displays this value labelled as「公告土地現值（每平方公尺）」, not as a combined land+building value


<!-- @trace
source: pdf-tax-and-field-fixes
updated: 2026-05-03
code:
  - src/lib/document-generator/tax-calculator.ts
  - src/lib/document-generator/build-input.ts
  - src/lib/pdf-generator/dossier.ts
  - src/lib/document-generator/pdf/dossier-building.ts
  - src/lib/parsers/transcript-parser.ts
  - scripts/e2e-verify-pdf.mjs
  - src/lib/pdf-generator/templates/dossier.html
tests:
  - src/lib/parsers/__tests__/transcript-parser.test.ts
  - src/lib/document-generator/pdf/__tests__/dossier-building.test.ts
  - src/lib/document-generator/__tests__/tax-calculator.test.ts
-->

---
### Requirement: chapter12-land-increment-display

Chapter 12 (土地增值稅概算) SHALL display system-computed approximate values when available.

- 一般稅率試算 cell ← `system_computed.computed_land_increment_general_approx`
- 自用稅率試算 cell ← `system_computed.computed_land_increment_self_use_approx`
- All cells with no value SHALL be empty (no "待補", no explanatory text).
- A footnote SHALL state:「以上土地增值稅為試算近似值，以主管機關核定為準」.

#### Scenario: land increment values available

- **WHEN** system_computed includes computed_land_increment_general_approx = 500000 and computed_land_increment_self_use_approx = 400000
- **THEN** Chapter 12 一般稅率 cell shows 500,000 and 自用稅率 cell shows 400,000

#### Scenario: land increment values absent

- **WHEN** system_computed does not include land increment fields
- **THEN** Chapter 12 cells are empty; footnote still appears

<!-- @trace
source: pdf-tax-and-field-fixes
updated: 2026-05-03
code:
  - src/lib/document-generator/tax-calculator.ts
  - src/lib/document-generator/build-input.ts
  - src/lib/pdf-generator/dossier.ts
  - src/lib/document-generator/pdf/dossier-building.ts
  - src/lib/parsers/transcript-parser.ts
  - scripts/e2e-verify-pdf.mjs
  - src/lib/pdf-generator/templates/dossier.html
tests:
  - src/lib/parsers/__tests__/transcript-parser.test.ts
  - src/lib/document-generator/pdf/__tests__/dossier-building.test.ts
  - src/lib/document-generator/__tests__/tax-calculator.test.ts
-->

---
### Requirement: Document generation pipeline SHALL embed legal notice block

The system SHALL inject the `<LegalNoticeBlock>` component from the `legal-clauses-pdf-block` capability into the PDF render pipeline as the final block of the fixed 4-page section, after Cover / Basic Info / Location Map. The block SHALL not interfere with the existing 16-chapter Markdown disclosure document structure.

#### Scenario: Generated PDF contains legal notice block before dynamic pages

- **WHEN** a PDF is generated for any case (residential or land)
- **THEN** the legal notice block appears in the resulting PDF before the first dynamic page (photo gallery / condition survey / life amenities) AND the chapter-5 / chapter-6 / chapter-14 content remains intact in their existing positions

#### Scenario: PDF generation does not duplicate the legal notice block

- **WHEN** the same PDF is rendered multiple times for the same case
- **THEN** the legal notice block appears exactly once in each generated PDF

##### Example: Count law-title occurrences per render

- **GIVEN** the same case `C0001` rendered 3 times via `renderDisclosurePdf(...)`
- **WHEN** each rendered PDF is parsed and the string "不動產經紀業管理條例" is counted across all pages
- **THEN** every one of the 3 renders contains exactly 1 occurrence of "不動產經紀業管理條例" (proving the block is not injected twice in any single render and not accumulated across renders)


<!-- @trace
source: aire-phase1-legal-clauses-autofill
updated: 2026-05-15
code:
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--5d251-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/theme-c-basic-info-actual.png
  - src-tauri/src/data_portability/conflict.rs
  - e2e/results/test-artifacts/.last-run.json
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-27d84-etch-→-sync-→-DB-→-PDF-全鏈一致-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-舊電腦：建立-3-個案件後應顯示於案件清單-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-82a7d-PDF-渲染-PDF-渲染應嵌入新版法規條文與版本日期-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--77e13-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-9921b-COS-endpoint-應回傳新版三條法規與版本日期-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--ae8ef-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/theme-a-photos-actual.png
  - src-tauri/icons/Square142x142Logo.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-2：使用救援碼驗證應回傳重設-token-chromium-tauri/test-failed-1.png
  - src-tauri/icons/StoreLogo.png
  - src-tauri/src/data_portability/import.rs
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--8110a--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - src-tauri/src/crypto/mod.rs
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-匯出備份：應產生-aire-檔案並回報案件數-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-2：新密碼解鎖應成功-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-跨機完整流程：建立-→-匯出-→-匯入-→-比對案件數一致-chromium-tauri/test-failed-1.png
  - src/components/ThemeSelector.tsx
  - e2e/results/test-artifacts/license-verification-經紀人證號-48d27-he-expired-態：過期證號應回-expired-chromium-tauri/test-failed-1.png
  - src/assets/icon-dark.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-1：設定主密碼後應取得救援碼-chromium-tauri/error-context.md
  - docs/phase4-cr-reports/aire-land-registry-foundation-kimi-cr.md
  - src/lib/pdf-blocks/ai-badge.tsx
  - e2e/results/test-artifacts/license-verification-經紀人證號-5ddad--500ms-debounce-後回-verified-chromium-tauri/test-failed-1.png
  - src-tauri/src/crypto/vault.rs
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-完整救援碼重置流程：設密碼-→-取救援碼-→-忘記-→-重設-→-三斷言-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--cf4e0-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - src-tauri/src/land_registry/time_sync/tests.rs
  - src/lib/pdf-blocks/photo-gallery.tsx
  - src/components/RealtorLicenseField.tsx
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-27d84-etch-→-sync-→-DB-→-PDF-全鏈一致-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-完整救援碼重置流程：設密碼-→-取救援碼-→-忘記-→-重設-→-三斷言-chromium-tauri/test-failed-1.png
  - e2e/.gitkeep
  - e2e/pdf-theme-c-visual.spec.ts-snapshots/theme-c-photos-chromium-tauri-darwin.png
  - src-tauri/Cargo.toml
  - .env.example
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-1：設定主密碼後應取得救援碼-chromium-tauri/test-failed-1.png
  - e2e/pdf-theme-a-visual.spec.ts-snapshots/theme-a-cover-chromium-tauri-darwin.png
  - src-tauri/src/realtor_license/client/tests.rs
  - src-tauri/icons/icon.icns
  - e2e/pdf-theme-a-visual.spec.ts-snapshots/theme-a-basic-info-chromium-tauri-darwin.png
  - e2e/results/test-artifacts/license-verification-經紀人證號-5ddad--500ms-debounce-後回-verified-chromium-tauri/trace.zip
  - src-tauri/src/land_registry/client/mod.rs
  - src-tauri/src/land_registry/errors/mod.rs
  - src/lib/pdf-blocks/life-amenities.tsx
  - docs/phase4-cr-reports/aire-phase1-legal-clauses-autofill-kimi-cr.md
  - src-tauri/icons/64x64.png
  - src-tauri/src/realtor_license/mod.rs
  - e2e/results/test-artifacts/license-verification-經紀人證號-97213-che-7-天-cache：第二次填同證號不打-API-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-舊電腦：建立-3-個案件後應顯示於案件清單-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-27d84-etch-→-sync-→-DB-→-PDF-全鏈一致-chromium-tauri/trace.zip
  - src/app/settings/sync-status/page.tsx
  - scripts/phase4-kimi-cr.sh
  - src-tauri/icons/Square284x284Logo.png
  - docs/data-recovery-guide.md
  - src/components/PdfPreviewer.tsx
  - src-tauri/src/data_portability/aire_format/tests.rs
  - src/lib/pdf-engine/react-pdf-init.ts
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--77e13-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-2：新密碼解鎖應成功-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/license-verification-經紀人證號-7973a-t-found-態：未登錄證號應回-not-found-chromium-tauri/error-context.md
  - src-tauri/icons/Square71x71Logo.png
  - src-tauri/migrations/003_legal_clauses.sql
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--bf32e--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/theme-c-cover-actual.png
  - src-tauri/src/encryption/tests.rs
  - src-tauri/src/data_portability/mod.rs
  - src/lib/pdf-blocks/legal-notice.tsx
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--ae8ef-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-bb38e-legal-clauses-後應回報同步成功與版本日期-chromium-tauri/trace.zip
  - src-tauri/src/encryption/mod.rs
  - docs/pdf-theme-pack-spec.md
  - src-tauri/src/crypto/recovery_code/tests.rs
  - src/lib/pdf-blocks/condition-survey.tsx
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--cf4e0-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-3：使用-token-設定新密碼應成功-chromium-tauri/trace.zip
  - src/lib/pdf-themes/theme-a-minimal/index.tsx
  - e2e/pdf-theme-a-visual.spec.ts-snapshots/theme-a-photos-chromium-tauri-darwin.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-3：解鎖後資料完整（案件數不變）-chromium-tauri/error-context.md
  - src-tauri/icons/128x128.png
  - src/app/page.tsx
  - src/components/ux/MasterPasswordPrompt.tsx
  - src/lib/pdf-engine/index.ts
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-新電腦：匯入備份後案件數應與備份一致-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-跨機完整流程：建立-→-匯出-→-匯入-→-比對案件數一致-chromium-tauri/error-context.md
  - src-tauri/src/land_registry/field_mapping/tests.rs
  - src/lib/pdf-themes/theme-provider.tsx
  - src-tauri/src/data_portability/export/tests.rs
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-3：使用-token-設定新密碼應成功-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/license-verification-經紀人證號-7973a-t-found-態：未登錄證號應回-not-found-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-2：使用救援碼驗證應回傳重設-token-chromium-tauri/trace.zip
  - src/components/ux/ImportConflictDialog.tsx
  - src-tauri/src/legal_clauses/sync/tests.rs
  - src-tauri/migrations/004_master_password_rekey.rs
  - src-tauri/src/data_portability/aire_format.rs
  - src-tauri/src/legal_clauses/cache/tests.rs
  - src-tauri/src/realtor_license/cache/tests.rs
  - src/lib/pdf-blocks/location-map.tsx
  - src-tauri/src/legal_clauses/scheduler.rs
  - src/app/(dashboard)/settings/branding/page.tsx
  - src/app/cases/[id]/preview/page.tsx
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-bb38e-legal-clauses-後應回報同步成功與版本日期-chromium-tauri/test-failed-1.png
  - src-tauri/src/land_registry/mod.rs
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-41aa9--渲染-同步後本地-DB-應含三條法規且版本日期為新版-chromium-tauri/test-failed-1.png
  - src-tauri/icons/icon.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-2：使用救援碼驗證應回傳重設-token-chromium-tauri/error-context.md
  - src-tauri/migrations/002_branding.sql
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-82a7d-PDF-渲染-PDF-渲染應嵌入新版法規條文與版本日期-chromium-tauri/error-context.md
  - src/lib/pdf-layout.ts
  - e2e/pdf-theme-c-visual.spec.ts-snapshots/theme-c-basic-info-chromium-tauri-darwin.png
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-82a7d-PDF-渲染-PDF-渲染應嵌入新版法規條文與版本日期-chromium-tauri/trace.zip
  - src-tauri/src/data_portability/conflict/tests.rs
  - src/lib/pdf-themes/registry.ts
  - e2e/results/test-artifacts/license-verification-經紀人證號-97213-che-7-天-cache：第二次填同證號不打-API-chromium-tauri/test-failed-1.png
  - src/lib/pdf-engine/document.tsx
  - src-tauri/src/land_registry/cache/tests.rs
  - src-tauri/src/crypto/vault/tests.rs
  - src-tauri/src/land_registry/batch/mod.rs
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-匯出備份：應產生-aire-檔案並回報案件數-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--bf32e--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - src-tauri/src/land_registry/time_sync/mod.rs
  - src-tauri/src/crypto/master_password/tests.rs
  - src-tauri/src/land_registry/disk_resilience/mod.rs
  - src-tauri/src/land_registry/billing_log/mod.rs
  - src-tauri/src/land_registry/errors/tests.rs
  - src-tauri/src/legal_clauses/sync.rs
  - scripts/phase5-smoke-2a.sh
  - vitest.config.ts
  - src-tauri/src/land_registry/billing_log/tests.rs
  - src/lib/pdf-blocks/basic-info.tsx
  - src/app/(dashboard)/settings/branding/branding-content.tsx
  - src-tauri/src/realtor_license/client.rs
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-1：舊密碼解鎖應失敗（密碼已被重設）-chromium-tauri/trace.zip
  - src-tauri/src/land_registry/migration_rollback/tests.rs
  - src/lib/pdf-themes/persistence.ts
  - src-tauri/src/crypto/recovery_code.rs
  - src-tauri/icons/Square310x310Logo.png
  - src-tauri/migrations/004_land_registry.sql
  - src-tauri/icons/Square89x89Logo.png
  - src/lib/pdf-blocks/conditional-section.tsx
  - docs/phase4-cr-reports/aire-phase1-data-portability-kimi-cr.md
  - src/components/LogoUploader.tsx
  - e2e/results/license-verification.json
  - src-tauri/icons/icon.ico
  - e2e/results/test-artifacts/license-verification-經紀人證號-97213-che-7-天-cache：第二次填同證號不打-API-chromium-tauri/error-context.md
  - src/lib/pdf-blocks/cover.tsx
  - src/lib/pdf-themes/index.ts
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-41aa9--渲染-同步後本地-DB-應含三條法規且版本日期為新版-chromium-tauri/trace.zip
  - src-tauri/src/branding/logo.rs
  - e2e/results/test-artifacts/license-verification-經紀人證號-59275-allback：應顯示「（最後驗證日期，目前離線中）」-chromium-tauri/trace.zip
  - src-tauri/icons/Square150x150Logo.png
  - src-tauri/src/land_registry/cache/mod.rs
  - src-tauri/src/land_registry/field_mapping/mod.rs
  - playwright.config.ts
  - src-tauri/src/realtor_license/cache.rs
  - src-tauri/src/legal_clauses/scheduler/tests.rs
  - e2e/results/test-artifacts/license-verification-經紀人證號-7973a-t-found-態：未登錄證號應回-not-found-chromium-tauri/test-failed-1.png
  - src-tauri/src/land_registry/opcos_offline_grace/mod.rs
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-9921b-COS-endpoint-應回傳新版三條法規與版本日期-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--77e13-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/theme-c-photos-actual.png
  - src-tauri/src/land_registry/migration_rollback/mod.rs
  - src/lib/pdf-blocks/logo-anchors.tsx
  - src/lib/pdf-renderer.ts
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-新電腦：匯入備份後案件數應與備份一致-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--ae8ef-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - src/components/ux/RecoveryCodeModal.tsx
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-41aa9--渲染-同步後本地-DB-應含三條法規且版本日期為新版-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--8110a--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--5d251-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - e2e/results/test-artifacts/license-verification-經紀人證號-48d27-he-expired-態：過期證號應回-expired-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/license-verification-經紀人證號-59275-allback：應顯示「（最後驗證日期，目前離線中）」-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-匯出備份：應產生-aire-檔案並回報案件數-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--8110a--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/theme-a-cover-actual.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-1：設定主密碼後應取得救援碼-chromium-tauri/trace.zip
  - src-tauri/src/legal_clauses/cache.rs
  - src-tauri/icons/Square44x44Logo.png
  - docs/phase4-cr-reports/aire-phase1-html-pdf-renderer-kimi-cr.md
  - .github/copilot-instructions.md
  - src-tauri/src/db/mod.rs
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-3：使用-token-設定新密碼應成功-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--5d251-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--cf4e0-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/theme-a-basic-info-actual.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-2：新密碼解鎖應成功-chromium-tauri/error-context.md
  - src-tauri/src/data_portability/import/tests.rs
  - src-tauri/src/branding/tests.rs
  - src-tauri/src/land_registry/client/tests.rs
  - src/lib/pdf-blocks/dynamic-composition.tsx
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--77e13-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-1：舊密碼解鎖應失敗（密碼已被重設）-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-3：解鎖後資料完整（案件數不變）-chromium-tauri/trace.zip
  - src/assets/icon-light.png
  - src-tauri/icons/Square30x30Logo.png
  - src-tauri/icons/128x128@2x.png
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-跨機完整流程：建立-→-匯出-→-匯入-→-比對案件數一致-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--ae8ef-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - e2e/results/legal-sync.json
  - src/components/disclosure-form-land.tsx
  - src-tauri/src/land_registry/disk_resilience/tests.rs
  - docs/legal-clauses-sync-spec.md
  - src/components/disclosure-form-residential.tsx
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-9921b-COS-endpoint-應回傳新版三條法規與版本日期-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--5d251-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--bf32e--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - src-tauri/src/branding/mod.rs
  - src-tauri/src/land_registry/opcos_offline_grace/tests.rs
  - src-tauri/src/land_registry/batch/tests.rs
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-3：解鎖後資料完整（案件數不變）-chromium-tauri/test-failed-1.png
  - package.json
  - e2e/pdf-theme-c-visual.spec.ts-snapshots/theme-c-cover-chromium-tauri-darwin.png
  - docs/ux-patterns.md
  - src/lib/pdf-blocks/logo-upload.ts
  - src/lib/pdf-themes/theme-b-professional/index.tsx
  - src/lib/date-format-twn.ts
  - src-tauri/src/data_portability/export.rs
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-新電腦：匯入備份後案件數應與備份一致-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-舊電腦：建立-3-個案件後應顯示於案件清單-chromium-tauri/trace.zip
  - src-tauri/icons/Square107x107Logo.png
  - e2e/results/test-artifacts/license-verification-經紀人證號-59275-allback：應顯示「（最後驗證日期，目前離線中）」-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--bf32e--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-完整救援碼重置流程：設密碼-→-取救援碼-→-忘記-→-重設-→-三斷言-chromium-tauri/trace.zip
  - src-tauri/src/branding/theme.rs
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-1：舊密碼解鎖應失敗（密碼已被重設）-chromium-tauri/test-failed-1.png
  - src-tauri/src/legal_clauses/mod.rs
  - src-tauri/src/lib.rs
  - src/lib/pdf-engine/engine.ts
  - src/lib/pdf-themes/types.ts
  - src/lib/pdf-themes/theme-c-tech-elegant/index.tsx
  - e2e/results/test-artifacts/license-verification-經紀人證號-5ddad--500ms-debounce-後回-verified-chromium-tauri/error-context.md
  - src/lib/pdf-blocks/page-footer.tsx
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--cf4e0-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - src/app/cases/[id]/page.tsx
  - scripts/phase5-smoke.sh
  - e2e/results/test-artifacts/license-verification-經紀人證號-48d27-he-expired-態：過期證號應回-expired-chromium-tauri/trace.zip
  - src-tauri/src/crypto/master_password.rs
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--8110a--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-bb38e-legal-clauses-後應回報同步成功與版本日期-chromium-tauri/error-context.md
  - src-tauri/icons/32x32.png
tests:
  - e2e/data-portability.spec.ts
  - src/lib/pdf-themes/__tests__/registry.test.ts
  - src/lib/pdf-engine/__tests__/engine.test.ts
  - e2e/pdf-theme-c-visual.spec.ts
  - e2e/pdf-theme-a-visual.spec.ts
  - src/components/__tests__/MasterPasswordPrompt.test.tsx
  - src/lib/__tests__/date-format-twn.test.ts
  - src/lib/pdf-blocks/__tests__/legal-notice.test.tsx
  - e2e/license-verification.spec.ts
  - src/app/settings/sync-status/__tests__/page.test.tsx
  - e2e/smoke.spec.ts
  - src/components/__tests__/RecoveryCodeModal.test.tsx
  - src/lib/pdf-blocks/__tests__/legal-notice-wrap.test.tsx
  - e2e/legal-clauses-sync.spec.ts
  - src/lib/pdf-blocks/__tests__/logo-anchors.test.tsx
  - src/components/__tests__/LogoUploader.test.tsx
  - src/components/__tests__/PdfPreviewer.test.tsx
  - src/components/__tests__/ImportConflictDialog.test.tsx
  - docs/__tests__/pdf-theme-pack-spec.test.ts
  - src/components/__tests__/ThemeSelector.test.tsx
  - src/lib/pdf-blocks/__tests__/legal-notice-theme.test.tsx
  - e2e/recovery-reset.spec.ts
  - docs/data-recovery-guide.test.ts
  - src/lib/pdf-themes/__tests__/persistence.test.ts
  - src/lib/pdf-themes/__tests__/theme-provider.test.tsx
  - src/lib/pdf-blocks/__tests__/dynamic-composition.test.tsx
  - src/components/__tests__/RealtorLicenseField.test.tsx
  - docs/__tests__/no-tofu-sample.test.ts
  - src/lib/pdf-blocks/__tests__/legal-notice-empty.test.tsx
  - src/lib/pdf-engine/__tests__/render-with-legal.test.tsx
-->

---
### Requirement: Page numbering SHALL account for the embedded legal notice block

The system SHALL include the legal notice block's pages in the total page count and per-page numbering displayed in the page footer. The block's pages SHALL participate in the auto-paginated counter exposed by `@react-pdf`.

#### Scenario: Legal notice block pages count toward total

- **WHEN** the legal notice block renders across 2 pages and the case has 8 dynamic pages
- **THEN** the total page count reflects all fixed pages + 2 legal pages + 8 dynamic pages AND the page footer shows the correct "第 X 頁 / 共 Y 頁" format on every page

<!-- @trace
source: aire-phase1-legal-clauses-autofill
updated: 2026-05-15
code:
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--5d251-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/theme-c-basic-info-actual.png
  - src-tauri/src/data_portability/conflict.rs
  - e2e/results/test-artifacts/.last-run.json
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-27d84-etch-→-sync-→-DB-→-PDF-全鏈一致-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-舊電腦：建立-3-個案件後應顯示於案件清單-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-82a7d-PDF-渲染-PDF-渲染應嵌入新版法規條文與版本日期-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--77e13-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-9921b-COS-endpoint-應回傳新版三條法規與版本日期-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--ae8ef-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/theme-a-photos-actual.png
  - src-tauri/icons/Square142x142Logo.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-2：使用救援碼驗證應回傳重設-token-chromium-tauri/test-failed-1.png
  - src-tauri/icons/StoreLogo.png
  - src-tauri/src/data_portability/import.rs
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--8110a--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - src-tauri/src/crypto/mod.rs
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-匯出備份：應產生-aire-檔案並回報案件數-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-2：新密碼解鎖應成功-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-跨機完整流程：建立-→-匯出-→-匯入-→-比對案件數一致-chromium-tauri/test-failed-1.png
  - src/components/ThemeSelector.tsx
  - e2e/results/test-artifacts/license-verification-經紀人證號-48d27-he-expired-態：過期證號應回-expired-chromium-tauri/test-failed-1.png
  - src/assets/icon-dark.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-1：設定主密碼後應取得救援碼-chromium-tauri/error-context.md
  - docs/phase4-cr-reports/aire-land-registry-foundation-kimi-cr.md
  - src/lib/pdf-blocks/ai-badge.tsx
  - e2e/results/test-artifacts/license-verification-經紀人證號-5ddad--500ms-debounce-後回-verified-chromium-tauri/test-failed-1.png
  - src-tauri/src/crypto/vault.rs
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-完整救援碼重置流程：設密碼-→-取救援碼-→-忘記-→-重設-→-三斷言-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--cf4e0-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - src-tauri/src/land_registry/time_sync/tests.rs
  - src/lib/pdf-blocks/photo-gallery.tsx
  - src/components/RealtorLicenseField.tsx
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-27d84-etch-→-sync-→-DB-→-PDF-全鏈一致-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-完整救援碼重置流程：設密碼-→-取救援碼-→-忘記-→-重設-→-三斷言-chromium-tauri/test-failed-1.png
  - e2e/.gitkeep
  - e2e/pdf-theme-c-visual.spec.ts-snapshots/theme-c-photos-chromium-tauri-darwin.png
  - src-tauri/Cargo.toml
  - .env.example
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-1：設定主密碼後應取得救援碼-chromium-tauri/test-failed-1.png
  - e2e/pdf-theme-a-visual.spec.ts-snapshots/theme-a-cover-chromium-tauri-darwin.png
  - src-tauri/src/realtor_license/client/tests.rs
  - src-tauri/icons/icon.icns
  - e2e/pdf-theme-a-visual.spec.ts-snapshots/theme-a-basic-info-chromium-tauri-darwin.png
  - e2e/results/test-artifacts/license-verification-經紀人證號-5ddad--500ms-debounce-後回-verified-chromium-tauri/trace.zip
  - src-tauri/src/land_registry/client/mod.rs
  - src-tauri/src/land_registry/errors/mod.rs
  - src/lib/pdf-blocks/life-amenities.tsx
  - docs/phase4-cr-reports/aire-phase1-legal-clauses-autofill-kimi-cr.md
  - src-tauri/icons/64x64.png
  - src-tauri/src/realtor_license/mod.rs
  - e2e/results/test-artifacts/license-verification-經紀人證號-97213-che-7-天-cache：第二次填同證號不打-API-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-舊電腦：建立-3-個案件後應顯示於案件清單-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-27d84-etch-→-sync-→-DB-→-PDF-全鏈一致-chromium-tauri/trace.zip
  - src/app/settings/sync-status/page.tsx
  - scripts/phase4-kimi-cr.sh
  - src-tauri/icons/Square284x284Logo.png
  - docs/data-recovery-guide.md
  - src/components/PdfPreviewer.tsx
  - src-tauri/src/data_portability/aire_format/tests.rs
  - src/lib/pdf-engine/react-pdf-init.ts
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--77e13-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-2：新密碼解鎖應成功-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/license-verification-經紀人證號-7973a-t-found-態：未登錄證號應回-not-found-chromium-tauri/error-context.md
  - src-tauri/icons/Square71x71Logo.png
  - src-tauri/migrations/003_legal_clauses.sql
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--bf32e--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/theme-c-cover-actual.png
  - src-tauri/src/encryption/tests.rs
  - src-tauri/src/data_portability/mod.rs
  - src/lib/pdf-blocks/legal-notice.tsx
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--ae8ef-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-bb38e-legal-clauses-後應回報同步成功與版本日期-chromium-tauri/trace.zip
  - src-tauri/src/encryption/mod.rs
  - docs/pdf-theme-pack-spec.md
  - src-tauri/src/crypto/recovery_code/tests.rs
  - src/lib/pdf-blocks/condition-survey.tsx
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--cf4e0-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-3：使用-token-設定新密碼應成功-chromium-tauri/trace.zip
  - src/lib/pdf-themes/theme-a-minimal/index.tsx
  - e2e/pdf-theme-a-visual.spec.ts-snapshots/theme-a-photos-chromium-tauri-darwin.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-3：解鎖後資料完整（案件數不變）-chromium-tauri/error-context.md
  - src-tauri/icons/128x128.png
  - src/app/page.tsx
  - src/components/ux/MasterPasswordPrompt.tsx
  - src/lib/pdf-engine/index.ts
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-新電腦：匯入備份後案件數應與備份一致-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-跨機完整流程：建立-→-匯出-→-匯入-→-比對案件數一致-chromium-tauri/error-context.md
  - src-tauri/src/land_registry/field_mapping/tests.rs
  - src/lib/pdf-themes/theme-provider.tsx
  - src-tauri/src/data_portability/export/tests.rs
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-3：使用-token-設定新密碼應成功-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/license-verification-經紀人證號-7973a-t-found-態：未登錄證號應回-not-found-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-2：使用救援碼驗證應回傳重設-token-chromium-tauri/trace.zip
  - src/components/ux/ImportConflictDialog.tsx
  - src-tauri/src/legal_clauses/sync/tests.rs
  - src-tauri/migrations/004_master_password_rekey.rs
  - src-tauri/src/data_portability/aire_format.rs
  - src-tauri/src/legal_clauses/cache/tests.rs
  - src-tauri/src/realtor_license/cache/tests.rs
  - src/lib/pdf-blocks/location-map.tsx
  - src-tauri/src/legal_clauses/scheduler.rs
  - src/app/(dashboard)/settings/branding/page.tsx
  - src/app/cases/[id]/preview/page.tsx
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-bb38e-legal-clauses-後應回報同步成功與版本日期-chromium-tauri/test-failed-1.png
  - src-tauri/src/land_registry/mod.rs
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-41aa9--渲染-同步後本地-DB-應含三條法規且版本日期為新版-chromium-tauri/test-failed-1.png
  - src-tauri/icons/icon.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-2：使用救援碼驗證應回傳重設-token-chromium-tauri/error-context.md
  - src-tauri/migrations/002_branding.sql
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-82a7d-PDF-渲染-PDF-渲染應嵌入新版法規條文與版本日期-chromium-tauri/error-context.md
  - src/lib/pdf-layout.ts
  - e2e/pdf-theme-c-visual.spec.ts-snapshots/theme-c-basic-info-chromium-tauri-darwin.png
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-82a7d-PDF-渲染-PDF-渲染應嵌入新版法規條文與版本日期-chromium-tauri/trace.zip
  - src-tauri/src/data_portability/conflict/tests.rs
  - src/lib/pdf-themes/registry.ts
  - e2e/results/test-artifacts/license-verification-經紀人證號-97213-che-7-天-cache：第二次填同證號不打-API-chromium-tauri/test-failed-1.png
  - src/lib/pdf-engine/document.tsx
  - src-tauri/src/land_registry/cache/tests.rs
  - src-tauri/src/crypto/vault/tests.rs
  - src-tauri/src/land_registry/batch/mod.rs
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-匯出備份：應產生-aire-檔案並回報案件數-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--bf32e--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - src-tauri/src/land_registry/time_sync/mod.rs
  - src-tauri/src/crypto/master_password/tests.rs
  - src-tauri/src/land_registry/disk_resilience/mod.rs
  - src-tauri/src/land_registry/billing_log/mod.rs
  - src-tauri/src/land_registry/errors/tests.rs
  - src-tauri/src/legal_clauses/sync.rs
  - scripts/phase5-smoke-2a.sh
  - vitest.config.ts
  - src-tauri/src/land_registry/billing_log/tests.rs
  - src/lib/pdf-blocks/basic-info.tsx
  - src/app/(dashboard)/settings/branding/branding-content.tsx
  - src-tauri/src/realtor_license/client.rs
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-1：舊密碼解鎖應失敗（密碼已被重設）-chromium-tauri/trace.zip
  - src-tauri/src/land_registry/migration_rollback/tests.rs
  - src/lib/pdf-themes/persistence.ts
  - src-tauri/src/crypto/recovery_code.rs
  - src-tauri/icons/Square310x310Logo.png
  - src-tauri/migrations/004_land_registry.sql
  - src-tauri/icons/Square89x89Logo.png
  - src/lib/pdf-blocks/conditional-section.tsx
  - docs/phase4-cr-reports/aire-phase1-data-portability-kimi-cr.md
  - src/components/LogoUploader.tsx
  - e2e/results/license-verification.json
  - src-tauri/icons/icon.ico
  - e2e/results/test-artifacts/license-verification-經紀人證號-97213-che-7-天-cache：第二次填同證號不打-API-chromium-tauri/error-context.md
  - src/lib/pdf-blocks/cover.tsx
  - src/lib/pdf-themes/index.ts
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-41aa9--渲染-同步後本地-DB-應含三條法規且版本日期為新版-chromium-tauri/trace.zip
  - src-tauri/src/branding/logo.rs
  - e2e/results/test-artifacts/license-verification-經紀人證號-59275-allback：應顯示「（最後驗證日期，目前離線中）」-chromium-tauri/trace.zip
  - src-tauri/icons/Square150x150Logo.png
  - src-tauri/src/land_registry/cache/mod.rs
  - src-tauri/src/land_registry/field_mapping/mod.rs
  - playwright.config.ts
  - src-tauri/src/realtor_license/cache.rs
  - src-tauri/src/legal_clauses/scheduler/tests.rs
  - e2e/results/test-artifacts/license-verification-經紀人證號-7973a-t-found-態：未登錄證號應回-not-found-chromium-tauri/test-failed-1.png
  - src-tauri/src/land_registry/opcos_offline_grace/mod.rs
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-9921b-COS-endpoint-應回傳新版三條法規與版本日期-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--77e13-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/theme-c-photos-actual.png
  - src-tauri/src/land_registry/migration_rollback/mod.rs
  - src/lib/pdf-blocks/logo-anchors.tsx
  - src/lib/pdf-renderer.ts
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-新電腦：匯入備份後案件數應與備份一致-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--ae8ef-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - src/components/ux/RecoveryCodeModal.tsx
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-41aa9--渲染-同步後本地-DB-應含三條法規且版本日期為新版-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--8110a--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--5d251-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - e2e/results/test-artifacts/license-verification-經紀人證號-48d27-he-expired-態：過期證號應回-expired-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/license-verification-經紀人證號-59275-allback：應顯示「（最後驗證日期，目前離線中）」-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-匯出備份：應產生-aire-檔案並回報案件數-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--8110a--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/theme-a-cover-actual.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-1：設定主密碼後應取得救援碼-chromium-tauri/trace.zip
  - src-tauri/src/legal_clauses/cache.rs
  - src-tauri/icons/Square44x44Logo.png
  - docs/phase4-cr-reports/aire-phase1-html-pdf-renderer-kimi-cr.md
  - .github/copilot-instructions.md
  - src-tauri/src/db/mod.rs
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-3：使用-token-設定新密碼應成功-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--5d251-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--cf4e0-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/theme-a-basic-info-actual.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-2：新密碼解鎖應成功-chromium-tauri/error-context.md
  - src-tauri/src/data_portability/import/tests.rs
  - src-tauri/src/branding/tests.rs
  - src-tauri/src/land_registry/client/tests.rs
  - src/lib/pdf-blocks/dynamic-composition.tsx
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--77e13-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-1：舊密碼解鎖應失敗（密碼已被重設）-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-3：解鎖後資料完整（案件數不變）-chromium-tauri/trace.zip
  - src/assets/icon-light.png
  - src-tauri/icons/Square30x30Logo.png
  - src-tauri/icons/128x128@2x.png
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-跨機完整流程：建立-→-匯出-→-匯入-→-比對案件數一致-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--ae8ef-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - e2e/results/legal-sync.json
  - src/components/disclosure-form-land.tsx
  - src-tauri/src/land_registry/disk_resilience/tests.rs
  - docs/legal-clauses-sync-spec.md
  - src/components/disclosure-form-residential.tsx
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-9921b-COS-endpoint-應回傳新版三條法規與版本日期-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--5d251-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--bf32e--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - src-tauri/src/branding/mod.rs
  - src-tauri/src/land_registry/opcos_offline_grace/tests.rs
  - src-tauri/src/land_registry/batch/tests.rs
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-3：解鎖後資料完整（案件數不變）-chromium-tauri/test-failed-1.png
  - package.json
  - e2e/pdf-theme-c-visual.spec.ts-snapshots/theme-c-cover-chromium-tauri-darwin.png
  - docs/ux-patterns.md
  - src/lib/pdf-blocks/logo-upload.ts
  - src/lib/pdf-themes/theme-b-professional/index.tsx
  - src/lib/date-format-twn.ts
  - src-tauri/src/data_portability/export.rs
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-新電腦：匯入備份後案件數應與備份一致-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-舊電腦：建立-3-個案件後應顯示於案件清單-chromium-tauri/trace.zip
  - src-tauri/icons/Square107x107Logo.png
  - e2e/results/test-artifacts/license-verification-經紀人證號-59275-allback：應顯示「（最後驗證日期，目前離線中）」-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--bf32e--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-完整救援碼重置流程：設密碼-→-取救援碼-→-忘記-→-重設-→-三斷言-chromium-tauri/trace.zip
  - src-tauri/src/branding/theme.rs
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-1：舊密碼解鎖應失敗（密碼已被重設）-chromium-tauri/test-failed-1.png
  - src-tauri/src/legal_clauses/mod.rs
  - src-tauri/src/lib.rs
  - src/lib/pdf-engine/engine.ts
  - src/lib/pdf-themes/types.ts
  - src/lib/pdf-themes/theme-c-tech-elegant/index.tsx
  - e2e/results/test-artifacts/license-verification-經紀人證號-5ddad--500ms-debounce-後回-verified-chromium-tauri/error-context.md
  - src/lib/pdf-blocks/page-footer.tsx
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--cf4e0-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - src/app/cases/[id]/page.tsx
  - scripts/phase5-smoke.sh
  - e2e/results/test-artifacts/license-verification-經紀人證號-48d27-he-expired-態：過期證號應回-expired-chromium-tauri/trace.zip
  - src-tauri/src/crypto/master_password.rs
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--8110a--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-bb38e-legal-clauses-後應回報同步成功與版本日期-chromium-tauri/error-context.md
  - src-tauri/icons/32x32.png
tests:
  - e2e/data-portability.spec.ts
  - src/lib/pdf-themes/__tests__/registry.test.ts
  - src/lib/pdf-engine/__tests__/engine.test.ts
  - e2e/pdf-theme-c-visual.spec.ts
  - e2e/pdf-theme-a-visual.spec.ts
  - src/components/__tests__/MasterPasswordPrompt.test.tsx
  - src/lib/__tests__/date-format-twn.test.ts
  - src/lib/pdf-blocks/__tests__/legal-notice.test.tsx
  - e2e/license-verification.spec.ts
  - src/app/settings/sync-status/__tests__/page.test.tsx
  - e2e/smoke.spec.ts
  - src/components/__tests__/RecoveryCodeModal.test.tsx
  - src/lib/pdf-blocks/__tests__/legal-notice-wrap.test.tsx
  - e2e/legal-clauses-sync.spec.ts
  - src/lib/pdf-blocks/__tests__/logo-anchors.test.tsx
  - src/components/__tests__/LogoUploader.test.tsx
  - src/components/__tests__/PdfPreviewer.test.tsx
  - src/components/__tests__/ImportConflictDialog.test.tsx
  - docs/__tests__/pdf-theme-pack-spec.test.ts
  - src/components/__tests__/ThemeSelector.test.tsx
  - src/lib/pdf-blocks/__tests__/legal-notice-theme.test.tsx
  - e2e/recovery-reset.spec.ts
  - docs/data-recovery-guide.test.ts
  - src/lib/pdf-themes/__tests__/persistence.test.ts
  - src/lib/pdf-themes/__tests__/theme-provider.test.tsx
  - src/lib/pdf-blocks/__tests__/dynamic-composition.test.tsx
  - src/components/__tests__/RealtorLicenseField.test.tsx
  - docs/__tests__/no-tofu-sample.test.ts
  - src/lib/pdf-blocks/__tests__/legal-notice-empty.test.tsx
  - src/lib/pdf-engine/__tests__/render-with-legal.test.tsx
-->

---
### Requirement: pdf-export-button

The PDF preview page SHALL include an "匯出 PDF" ST Button that triggers the export_pdf Tauri IPC command and provides feedback via Toast.

#### Scenario: successful PDF export

- **WHEN** the user clicks the "匯出 PDF" Button on the preview page
- **THEN** the system SHALL call the export_pdf Tauri IPC command with the current case ID
- **THEN** on success, the system SHALL display a success Toast "PDF 已匯出" with the file path
- **THEN** the Button SHALL show a loading spinner during export and be disabled to prevent double-click

#### Scenario: PDF export failure

- **WHEN** the export_pdf IPC command returns an error
- **THEN** the system SHALL display an error Toast with the error message
- **THEN** the Button SHALL return to its default enabled state

##### Example: IPC error response

- **GIVEN** the user is on /cases/abc-123/preview and clicks "匯出 PDF"
- **WHEN** export_pdf returns error with message "missing required field: caseId"
- **THEN** the Toast SHALL display "匯出失敗：missing required field: caseId"
- **THEN** the Button SHALL return to enabled state with text "匯出 PDF"

#### Scenario: preview page layout

- **WHEN** the user navigates to /cases/[id]/preview
- **THEN** the page SHALL display the PDF preview in the main content area with the "匯出 PDF" Button positioned at the top-right

<!-- @trace
source: aire-mvp-deliverable
updated: 2026-05-15
code:
  - src/app/(dashboard)/dev/ux/page.tsx
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--77e13-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/theme-c-photos-actual.png
  - src/components/ui/label.tsx
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-3：解鎖後資料完整（案件數不變）-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-2：使用救援碼驗證應回傳重設-token-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-匯出備份：應產生-aire-檔案並回報案件數-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--bf32e--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - e2e/pdf-theme-a-visual.spec.ts-snapshots/theme-a-photos-chromium-tauri-darwin.png
  - src/components/disclosure-form-land.tsx
  - src/components/ui/Card.tsx
  - src/app/cases/[id]/page.tsx
  - src/components/ui/sonner.tsx
  - src/components/ui/Dialog.tsx
  - src/app/(dashboard)/dev/components/page.tsx
  - src/app/settings/sync-status/page.tsx
  - src/components/ux/MasterPasswordPrompt.tsx
  - e2e/results/test-artifacts/license-verification-經紀人證號-97213-che-7-天-cache：第二次填同證號不打-API-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--ae8ef-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/theme-a-photos-actual.png
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-41aa9--渲染-同步後本地-DB-應含三條法規且版本日期為新版-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/license-verification-經紀人證號-59275-allback：應顯示「（最後驗證日期，目前離線中）」-chromium-tauri/error-context.md
  - e2e/pdf-theme-c-visual.spec.ts-snapshots/theme-c-cover-chromium-tauri-darwin.png
  - src/components/RealtorLicenseField.tsx
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--5d251-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - e2e/results/test-artifacts/license-verification-經紀人證號-97213-che-7-天-cache：第二次填同證號不打-API-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/license-verification-經紀人證號-5ddad--500ms-debounce-後回-verified-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/license-verification-經紀人證號-97213-che-7-天-cache：第二次填同證號不打-API-chromium-tauri/trace.zip
  - src/components/ux/ImportConflictDialog.tsx
  - e2e/results/legal-sync.json
  - e2e/pdf-theme-a-visual.spec.ts-snapshots/theme-a-basic-info-chromium-tauri-darwin.png
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-舊電腦：建立-3-個案件後應顯示於案件清單-chromium-tauri/error-context.md
  - src/components/ui/input.tsx
  - src/components/ui/separator.tsx
  - src/components/ui/textarea.tsx
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-82a7d-PDF-渲染-PDF-渲染應嵌入新版法規條文與版本日期-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-82a7d-PDF-渲染-PDF-渲染應嵌入新版法規條文與版本日期-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/license-verification-經紀人證號-48d27-he-expired-態：過期證號應回-expired-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-3：使用-token-設定新密碼應成功-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-新電腦：匯入備份後案件數應與備份一致-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-2：使用救援碼驗證應回傳重設-token-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-舊電腦：建立-3-個案件後應顯示於案件清單-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--8110a--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - e2e/pdf-theme-c-visual.spec.ts-snapshots/theme-c-photos-chromium-tauri-darwin.png
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-41aa9--渲染-同步後本地-DB-應含三條法規且版本日期為新版-chromium-tauri/trace.zip
  - e2e/results/license-verification.json
  - src-tauri/Cargo.toml
  - src/app/(dashboard)/cases/[id]/preview/page.tsx
  - src/app/(dashboard)/cases/page.tsx
  - src/app/activation/page.tsx
  - src/app/dev/ux/page.tsx
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--8110a--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--5d251-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/theme-c-basic-info-actual.png
  - src/app/cases/[id]/layout.tsx
  - src/components/ui/tabs.tsx
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--cf4e0-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - src/components/ux/ConfirmDialog.tsx
  - src/components/ux/ErrorState.tsx
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-1：舊密碼解鎖應失敗（密碼已被重設）-chromium-tauri/error-context.md
  - src/components/AppSidebar.tsx
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-3：解鎖後資料完整（案件數不變）-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--5d251-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-完整救援碼重置流程：設密碼-→-取救援碼-→-忘記-→-重設-→-三斷言-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-bb38e-legal-clauses-後應回報同步成功與版本日期-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-匯出備份：應產生-aire-檔案並回報案件數-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--ae8ef-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--bf32e--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--cf4e0-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - e2e/results/test-artifacts/license-verification-經紀人證號-48d27-he-expired-態：過期證號應回-expired-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--cf4e0-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/theme-a-basic-info-actual.png
  - src/app/settings/logs/page.tsx
  - src/components/ui/badge.tsx
  - e2e/results/test-artifacts/license-verification-經紀人證號-5ddad--500ms-debounce-後回-verified-chromium-tauri/test-failed-1.png
  - src/components/disclosure-form-residential.tsx
  - src/components/ui/dialog.tsx
  - src/components/ui/form.tsx
  - e2e/results/test-artifacts/.last-run.json
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-82a7d-PDF-渲染-PDF-渲染應嵌入新版法規條文與版本日期-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/license-verification-經紀人證號-59275-allback：應顯示「（最後驗證日期，目前離線中）」-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-1：舊密碼解鎖應失敗（密碼已被重設）-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--8110a--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--cf4e0-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-舊電腦：建立-3-個案件後應顯示於案件清單-chromium-tauri/test-failed-1.png
  - src/app/(dashboard)/settings/sync-status/page.tsx
  - src/app/cases/new/page.tsx
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--77e13-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/error-context.md
  - src/components/AppTopbar.tsx
  - src/components/ux/RecoveryCodeModal.tsx
  - src/hooks/useLicenseStatus.ts
  - e2e/results/test-artifacts/license-verification-經紀人證號-59275-allback：應顯示「（最後驗證日期，目前離線中）」-chromium-tauri/test-failed-1.png
  - src/components/ui/Input.tsx
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--8110a--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/theme-a-cover-actual.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-3：使用-token-設定新密碼應成功-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-bb38e-legal-clauses-後應回報同步成功與版本日期-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/license-verification-經紀人證號-5ddad--500ms-debounce-後回-verified-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-27d84-etch-→-sync-→-DB-→-PDF-全鏈一致-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-新電腦：匯入備份後案件數應與備份一致-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-新電腦：匯入備份後案件數應與備份一致-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-完整救援碼重置流程：設密碼-→-取救援碼-→-忘記-→-重設-→-三斷言-chromium-tauri/error-context.md
  - src/app/(dashboard)/cases/[id]/layout.tsx
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-2：新密碼解鎖應成功-chromium-tauri/trace.zip
  - src/app/(dashboard)/cases/[id]/page.tsx
  - src/components/ui/card.tsx
  - src/app/cases/[id]/preview/page.tsx
  - src/components/ui/button.tsx
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-1：舊密碼解鎖應失敗（密碼已被重設）-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-9921b-COS-endpoint-應回傳新版三條法規與版本日期-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-2：使用救援碼驗證應回傳重設-token-chromium-tauri/trace.zip
  - src/app/(dashboard)/settings/logs/page.tsx
  - src/app/(dashboard)/layout.tsx
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-27d84-etch-→-sync-→-DB-→-PDF-全鏈一致-chromium-tauri/test-failed-1.png
  - src/components/ui/sheet.tsx
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--77e13-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-3：解鎖後資料完整（案件數不變）-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--bf32e--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/theme-c-cover-actual.png
  - .github/copilot-instructions.md
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--77e13-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/license-verification-經紀人證號-7973a-t-found-態：未登錄證號應回-not-found-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/license-verification-經紀人證號-7973a-t-found-態：未登錄證號應回-not-found-chromium-tauri/trace.zip
  - src/components/ui/Tabs.tsx
  - src/components/ui/select.tsx
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-1：設定主密碼後應取得救援碼-chromium-tauri/test-failed-1.png
  - src/components/ux/EmptyState.tsx
  - src/app/(dashboard)/cases/new/page.tsx
  - e2e/pdf-theme-a-visual.spec.ts-snapshots/theme-a-cover-chromium-tauri-darwin.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-完整救援碼重置流程：設密碼-→-取救援碼-→-忘記-→-重設-→-三斷言-chromium-tauri/trace.zip
  - e2e/pdf-theme-c-visual.spec.ts-snapshots/theme-c-basic-info-chromium-tauri-darwin.png
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--bf32e--—-視覺對比-封面：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-跨機完整流程：建立-→-匯出-→-匯入-→-比對案件數一致-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-跨機完整流程：建立-→-匯出-→-匯入-→-比對案件數一致-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/pdf-theme-c-visual-PDF-主題--5d251-視覺對比-基本資訊頁：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-41aa9--渲染-同步後本地-DB-應含三條法規且版本日期為新版-chromium-tauri/test-failed-1.png
  - src/app/cases/page.tsx
  - src/components/ui/spinner.tsx
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-1：設定主密碼後應取得救援碼-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-bb38e-legal-clauses-後應回報同步成功與版本日期-chromium-tauri/test-failed-1.png
  - src/app/dev/components/page.tsx
  - src/components/ui/table.tsx
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-9921b-COS-endpoint-應回傳新版三條法規與版本日期-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-2：新密碼解鎖應成功-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-9921b-COS-endpoint-應回傳新版三條法規與版本日期-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-3：使用-token-設定新密碼應成功-chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/license-verification-經紀人證號-7973a-t-found-態：未登錄證號應回-not-found-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--ae8ef-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/test-failed-1.png
  - e2e/results/test-artifacts/license-verification-經紀人證號-48d27-he-expired-態：過期證號應回-expired-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/legal-clauses-sync-法規條款同步：-27d84-etch-→-sync-→-DB-→-PDF-全鏈一致-chromium-tauri/trace.zip
  - src/components/ui/Button.tsx
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-Step-1：設定主密碼後應取得救援碼-chromium-tauri/error-context.md
  - package.json
  - e2e/results/test-artifacts/recovery-reset-救援碼重置主密碼-斷言-2：新密碼解鎖應成功-chromium-tauri/error-context.md
  - e2e/results/test-artifacts/pdf-theme-a-visual-PDF-主題--ae8ef-視覺對比-現況照片頁：與-mockup-視覺差異-5--chromium-tauri/trace.zip
  - src/components/ui/skeleton.tsx
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-跨機完整流程：建立-→-匯出-→-匯入-→-比對案件數一致-chromium-tauri/trace.zip
  - e2e/results/test-artifacts/data-portability-資料可攜性：跨機備份與還原-匯出備份：應產生-aire-檔案並回報案件數-chromium-tauri/error-context.md
tests:
  - src/app/(dashboard)/settings/sync-status/__tests__/page.test.tsx
  - src-tauri/tests/e2e_smoke.rs
  - src/app/settings/sync-status/__tests__/page.test.tsx
-->