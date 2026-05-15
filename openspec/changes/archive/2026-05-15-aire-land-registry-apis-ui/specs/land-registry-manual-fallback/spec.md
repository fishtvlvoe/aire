## ADDED Requirements

### Requirement: Manual fallback input UI

When an API call fails or user chooses manual entry, the system SHALL display a form with the same fields as the API response. Each field SHALL accept free text input.

#### Scenario: API failure triggers fallback

- **WHEN** pull_data returns an error for a specific api_id
- **THEN** the system shows ManualFallbackInput for that api_id with empty fields

##### Example: Building registry manual entry

- **GIVEN** building_registry API returned Network error for parcel "0301-0001"
- **WHEN** fallback UI renders
- **THEN** form shows fields: building_area (empty), building_purpose (empty), construction_date (empty), all editable

### Requirement: Source tagging

Manual entries SHALL be tagged with source "manual". API entries SHALL be tagged with source "api". The PDF renderer SHALL display "手動填寫（非系統查詢）" for manual-sourced fields.

#### Scenario: PDF shows manual tag

- **WHEN** a field has source "manual" and PDF is generated
- **THEN** the field value in PDF is followed by "手動填寫（非系統查詢）" annotation

##### Example: Manual vs API in PDF

| Field | Source | PDF Display |
| ----- | ------ | ----------- |
| building_area = "120.5 坪" | "api" | "120.5 坪" |
| land_value = "NT$5,000,000" | "manual" | "NT$5,000,000 手動填寫（非系統查詢）" |

### Requirement: Mixed sources per case

A single case SHALL support some fields from API and others manually entered. The system SHALL preserve source tags per field, not per case.

#### Scenario: Partial manual entry

- **WHEN** building_registry succeeded but land_value failed and was manually entered
- **THEN** building_registry fields have source "api", land_value fields have source "manual"

##### Example: Mixed source case

- **GIVEN** pull_data for parcel "0301-0001" with api_ids ["building_registry", "land_value"]; building_registry succeeded, land_value returned 503
- **WHEN** user manually enters land_value = "NT$5,000,000"
- **THEN** case data contains: building_area {value: "120.5", source: "api"}, land_value {value: "NT$5,000,000", source: "manual"}
