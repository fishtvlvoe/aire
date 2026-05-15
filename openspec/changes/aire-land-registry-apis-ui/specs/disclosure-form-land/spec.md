## ADDED Requirements

### Requirement: Pull parcel data button integration

The land disclosure form SHALL include a "拉謄本" button next to the lot number field. Clicking the button SHALL trigger the owner-authorization-consent flow, then pre-charge-confirmation, then data pull. Pulled data SHALL auto-fill the corresponding form fields.

#### Scenario: Pull button fills land form fields

- **WHEN** user clicks "拉謄本" and completes consent + confirmation
- **THEN** form fields (land area, zoning, land value, co-owners) are populated from API results with source "api"

##### Example: Successful land pull

- **GIVEN** parcel "0501-0002" exists in sandbox, user consented, user confirmed charge
- **WHEN** pull completes for land_registry + zoning + land_value + co_owners
- **THEN** land_area field = "150.0", zoning field = "住宅區", all with source "api"

#### Scenario: Pull failure shows manual fallback

- **WHEN** pull fails for some endpoints
- **THEN** failed fields show ManualFallbackInput; successfully pulled fields remain filled

##### Example: Partial failure with fallback

- **GIVEN** land_registry succeeded but zoning returned timeout error
- **WHEN** pull result renders in form
- **THEN** land fields are filled (source "api"), zoning section shows ManualFallbackInput (empty, editable)
