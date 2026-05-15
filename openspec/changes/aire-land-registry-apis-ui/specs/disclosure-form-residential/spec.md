## ADDED Requirements

### Requirement: Pull parcel data button integration

The residential disclosure form SHALL include a "拉謄本" button next to the property address field. Clicking the button SHALL trigger the owner-authorization-consent flow, then pre-charge-confirmation, then data pull. Pulled data SHALL auto-fill the corresponding form fields.

#### Scenario: Pull button fills form fields

- **WHEN** user clicks "拉謄本" and completes consent + confirmation
- **THEN** form fields (building area, purpose, ownership info) are populated from API results with source "api"

##### Example: Successful residential pull

- **GIVEN** parcel "0301-0001" exists in sandbox, user consented, user confirmed charge
- **WHEN** pull completes for building_registry + land_registry + co_owners
- **THEN** building_area field = "120.5", building_purpose field = "住家用", all with source "api"

#### Scenario: Pull failure shows manual fallback

- **WHEN** pull fails for some endpoints
- **THEN** failed fields show ManualFallbackInput; successfully pulled fields remain filled

##### Example: Partial failure with fallback

- **GIVEN** building_registry succeeded but mortgages returned Network error
- **WHEN** pull result renders in form
- **THEN** building fields are filled (source "api"), mortgage section shows ManualFallbackInput (empty, editable)
