# land-registry-field-mapping Specification

## MODIFIED Requirements

### Requirement: Field mapping SHALL be config-driven, not hard-coded in Rust

The crate SHALL load per-service field mapping configuration from a structured source at startup, and SHALL apply that configuration when translating raw API responses into AIRE's disclosure-document field shape.

Each mapping entry SHALL reference the MOI/COP service code, source payload path, target disclosure `field_key`, field-source matrix row, and automation state.

Adding a new API endpoint or mapping a newly discovered response field SHALL require updating mapping configuration and tests, NOT hard-coding target fields inside the Rust API wrapper.

#### Scenario: Adding a new API only touches config

- **GIVEN** a new platform API `MOI_API_999` whose response shape mirrors an existing endpoint
- **WHEN** a developer adds a new mapping entry keyed by `MOI_API_999`
- **THEN** the crate SHALL pick up the mapping on next startup with no Rust source edits
- **AND** the field mapping function SHALL translate `MOI_API_999` responses using the new entry
- **AND** mapped target fields SHALL reference field-source matrix rows

#### Scenario: Mapping gap is surfaced instead of silently dropping data

- **GIVEN** a service response includes a source payload field that is known in the service catalog
- **AND** no mapping entry points that source payload field to a disclosure field
- **WHEN** the field mapping function processes the response
- **THEN** it SHALL return a mapping gap record
- **AND** the autofill engine SHALL be able to expose that gap to the UI
