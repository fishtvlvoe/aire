## ADDED Requirements

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
