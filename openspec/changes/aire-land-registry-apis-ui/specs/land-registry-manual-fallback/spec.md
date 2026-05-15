## ADDED Requirements

### Requirement: Manual fallback input UI

When an API call fails or user chooses manual entry, the system SHALL display a form with the same fields as the API response. Each field SHALL accept free text input.

#### Scenario: API failure triggers fallback

- **WHEN** pull_data returns an error for a specific api_id
- **THEN** the system shows ManualFallbackInput for that api_id with empty fields

##### Example: Building registry manual entry

- **GIVEN** building_registry API returned Network error
- **WHEN** fallback UI renders
- **THEN** form shows fields: building_area, building_purpose, construction_date (all empty, editable)

### Requirement: Source tagging

Manual entries SHALL be tagged with source "manual". API entries SHALL be tagged with source "api". The PDF renderer SHALL display "手動填寫（非系統查詢）" for manual-sourced fields.

#### Scenario: PDF shows manual tag

- **WHEN** a field has source "manual" and PDF is generated
- **THEN** the field value in PDF is followed by "手動填寫（非系統查詢）" annotation

### Requirement: Mixed sources per case

A single case MAY have some fields from API and others manually entered. The system SHALL preserve source tags per field, not per case.

#### Scenario: Partial manual entry

- **WHEN** building_registry succeeded but land_value failed and was manually entered
- **THEN** building_registry fields have source "api", land_value fields have source "manual"
