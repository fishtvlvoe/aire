## MODIFIED Requirements

### Requirement: Pull parcel data button integration

The residential disclosure form SHALL include a "拉謄本" button next to the property address field. Clicking the button SHALL trigger the owner-authorization-consent flow, then pre-charge-confirmation, then data pull. Pulled data SHALL auto-fill the corresponding form fields.

#### Scenario: Pull button fills form fields

- **WHEN** user clicks "拉謄本" and completes consent + confirmation
- **THEN** form fields (building area, purpose, ownership info) are populated from API results with source "api"

#### Scenario: Pull failure shows manual fallback

- **WHEN** pull fails for some endpoints
- **THEN** failed fields show ManualFallbackInput; successfully pulled fields remain filled
