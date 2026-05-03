## MODIFIED Requirements

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
