## MODIFIED Requirements

### Requirement: Pull parcel data button integration

The land disclosure form SHALL include a "拉謄本" button next to the lot number field. Clicking the button SHALL trigger the owner-authorization-consent flow, then pre-charge-confirmation, then data pull. Pulled data SHALL auto-fill the corresponding form fields.

#### Scenario: Pull button fills land form fields

- **WHEN** user clicks "拉謄本" and completes consent + confirmation
- **THEN** form fields (land area, zoning, land value, co-owners) are populated from API results with source "api"

#### Scenario: Pull failure shows manual fallback

- **WHEN** pull fails for some endpoints
- **THEN** failed fields show ManualFallbackInput; successfully pulled fields remain filled
