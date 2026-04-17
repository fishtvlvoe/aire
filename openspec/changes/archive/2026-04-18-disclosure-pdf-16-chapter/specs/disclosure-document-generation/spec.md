## ADDED Requirements

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

### Requirement: Disclosure document prompt accepts structured data inputs

The system SHALL pass the following data to the LLM prompt when generating the disclosure document:
- `pre_commission_data`: owner name, phone, listing price, commission type, property address
- `field_visit_data`: all property field visit answers organized by section
- `supplementary_data`: cadastral numbers, area breakdown, encumbrances, zoning data
- `property_type`: used to select building or land variant

The prompt SHALL explicitly enumerate all 16 chapter headings and their required content fields so the LLM can fill in each chapter.

#### Scenario: Full data available

- **WHEN** field_visit_data, supplementary_data, and pre_commission_data are all present
- **THEN** the generated Markdown SHALL contain data-filled entries for all available fields

#### Scenario: Partial data available

- **WHEN** only field_visit_data is present (supplementary_data not yet filled)
- **THEN** the generated Markdown SHALL still contain all 16 chapters
- **THEN** cadastral and legal fields in chapters 5, 6, 7 SHALL show `待補`
