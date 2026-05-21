# disclosure-form-residential Specification

## MODIFIED Requirements

### Requirement: Residential disclosure form fields

The system SHALL provide a multi-tab form for cases where `property_type='residential'`, organized into the existing residential disclosure tabs and field groups.

For building and attached-land fields backed by the disclosure field-source matrix, the form SHALL render registry-fill metadata when available.

The form SHALL distinguish values filled from registry data, fields waiting for manual confirmation, fields blocked by missing API integration, fields blocked by mapping gaps, and fields unsupported by current data sources.

#### Scenario: Form renders all tabs on initial load

- **GIVEN** a `townhouse` case has a draft with `building_lot_no = 456-1`
- **AND** registry metadata marks `building_ownership` as `filled_from_registry`
- **WHEN** the user opens the residential case edit page
- **THEN** the residential disclosure tabs SHALL be visible
- **AND** the `building_ownership` field SHALL expose registry-fill status metadata

#### Scenario: Building ownership value shows registry source

- **GIVEN** the autofill engine fills a building ownership field from a MOI building ownership service
- **WHEN** the residential form renders that field
- **THEN** the UI SHALL show the filled value
- **AND** the field metadata SHALL include the source service code and lookup timestamp

#### Scenario: Physical condition field remains manual

- **GIVEN** a leakage or illegal-addition field is marked `manual_required`
- **WHEN** the residential form renders that field
- **THEN** the UI SHALL indicate that the value must be confirmed manually
- **AND** registry autofill SHALL NOT mark the field as complete
