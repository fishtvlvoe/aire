# tax-fee-auto-calculation Specification

## Purpose

TBD - created by archiving change 'disclosure-complete-and-fillable'. Update Purpose after archive.

## Requirements

### Requirement: tax-calculation-from-inputs

When sale_price and house_assessed_value are present in supplementary_data, the system SHALL automatically calculate: 契稅, 印花稅 (buyer + seller), 登記規費, and 履保費.

#### Scenario: calculate all computable taxes

- **WHEN** sale_price = 8000000 and house_assessed_value = 1200000
- **THEN** the system computes:

##### Example: tax calculation results

| 稅費項目 | 公式 | 計算結果 |
|----------|------|----------|
| 契稅 | house_assessed_value × 6% | 72,000 |
| 印花稅（買方） | sale_price × 0.05‰ | 400 |
| 印花稅（賣方） | sale_price × 0.05‰ | 400 |
| 登記規費 | sale_price × 0.1% | 8,000 |
| 履保費（各半） | sale_price × 0.06% ÷ 2 | 2,400 |


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
### Requirement: null-output-for-missing-inputs

When sale_price or house_assessed_value is absent, the system SHALL output null for the corresponding computed fields; those fields SHALL appear as empty cells in the PDF (no placeholder text, no "待補" label).

#### Scenario: missing sale_price

- **WHEN** sale_price is empty and house_assessed_value = 1200000
- **THEN** 契稅 = 72000 (computed from house_assessed_value only), but 登記規費, 印花稅, 履保費 fields in the PDF are completely empty (no text)

#### Scenario: all tax inputs missing

- **WHEN** both sale_price and house_assessed_value are absent
- **THEN** all Chapter 10 tax fields in the PDF are empty — no placeholder text, no explanatory phrases appear


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
### Requirement: manual-tax-fields

地價稅, 房屋稅, and 代書費 SHALL always be rendered as AcroForm editable fields in the PDF, regardless of input, because their values require pro-rated calculation by transaction date or agent negotiation.

#### Scenario: manual fields always blank in PDF

- **WHEN** any disclosure PDF is generated
- **THEN** 地價稅, 房屋稅, 代書費 cells in Chapter 10 are AcroForm text fields with empty default value

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
### Requirement: land-value-increment-approximation

When `announced_land_price`, `previous_transfer_value`, `land_area`, and `rights_range` are all present and valid, the system SHALL compute approximate land value increment tax values and store them in `system_computed`:

- `computed_land_increment_general_approx` — 一般稅率試算（previous_transfer_value × 0.1）
- `computed_land_increment_self_use_approx` — 自用稅率試算（previous_transfer_value × 0.08）

If any required input is missing or non-numeric, BOTH fields SHALL be omitted from `system_computed` (not null, not zero — simply absent).

These values are approximations. The LLM prompt SHALL label them as「試算近似值，以主管機關核定為準」.

#### Scenario: all inputs present

- **WHEN** previous_transfer_value = 5000000, announced_land_price = 10188, land_area = 50, rights_range = "1/1"
- **THEN** system_computed includes computed_land_increment_general_approx = 500000 and computed_land_increment_self_use_approx = 400000

#### Scenario: previous_transfer_value absent

- **WHEN** previous_transfer_value is undefined
- **THEN** computed_land_increment_general_approx and computed_land_increment_self_use_approx are NOT present in system_computed

##### Example: absent field produces no keys

| Input | system_computed result |
|-------|----------------------|
| previous_transfer_value = undefined | computed_land_increment_general_approx key does not exist; computed_land_increment_self_use_approx key does not exist |

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