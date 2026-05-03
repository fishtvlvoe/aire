## ADDED Requirements

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

### Requirement: disclosed-land-value-semantics

In Chapter 7 (他項權利/限制登記), the field labelled「公告現值」SHALL refer exclusively to the 公告土地現值（每平方公尺，土地專屬，不含建物評定現值）. The LLM prompt MUST include this clarification to prevent the LLM from conflating it with 房屋評定現值.

#### Scenario: Chapter 7 public value field

- **WHEN** supplementary_data includes announced_land_value (土地公告現值)
- **THEN** Chapter 7 displays this value labelled as「公告土地現值（每平方公尺）」, not as a combined land+building value

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
