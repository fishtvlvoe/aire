# disclosure-form-land Specification

## MODIFIED Requirements

### Requirement: Land disclosure form fields

The system SHALL provide a multi-tab form for cases where `property_type='land'`, organized into the existing land disclosure tabs and field groups.

For each field backed by the disclosure field-source matrix, the form SHALL render the field value plus registry-fill metadata when available.

The form SHALL distinguish values filled from registry data, fields waiting for manual confirmation, fields blocked by missing API integration, fields blocked by mapping gaps, and fields unsupported by current data sources.

#### Scenario: Form renders all tabs on initial load

- **GIVEN** a `farmland` case has a draft with `land_lot_no = 123-4`
- **AND** registry metadata marks `land_area` as `filled_from_registry`
- **WHEN** the user opens the land case edit page
- **THEN** the land disclosure tabs SHALL be visible
- **AND** the `land_area` field SHALL expose registry-fill status metadata

#### Scenario: Registry-backed blank field shows gap reason

- **GIVEN** a land restriction field is blank
- **AND** the autofill engine returns `integration_gap`
- **WHEN** the land form renders that field
- **THEN** the field SHALL remain editable
- **AND** the UI SHALL show that the data source exists but the API is not yet integrated

#### Scenario: Manual-only field remains user-editable

- **GIVEN** a land road condition field is marked `manual_required`
- **WHEN** the land form renders that field
- **THEN** the UI SHALL indicate that field confirmation is required
- **AND** the user SHALL be able to enter and save the value manually
