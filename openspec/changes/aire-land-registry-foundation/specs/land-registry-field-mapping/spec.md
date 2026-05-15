## ADDED Requirements

### Requirement: Field mapping SHALL be config-driven, not hard-coded in Rust
The crate SHALL load a per-API field mapping configuration from a structured file (JSON or TOML) at startup, and SHALL apply that configuration when translating raw API responses into AIRE's disclosure-document field shape. Adding a new API endpoint SHALL require only adding a new config entry, NOT touching Rust source.

#### Scenario: Adding a new API only touches config
- **GIVEN** a new platform API `MOI_API_999` whose response shape mirrors an existing endpoint
- **WHEN** a developer adds a new entry under the field mapping config keyed by `MOI_API_999`
- **THEN** the crate SHALL pick up the mapping on next startup with no Rust source edits
- **AND** the existing `field_mapping::map` function SHALL translate `MOI_API_999` responses using the new entry

### Requirement: Unknown API IDs SHALL produce typed errors, not silent fallbacks
If `field_mapping::map` is invoked with an `api_id` absent from the config, it SHALL return `LandRegistryError::FieldSchemaChanged` carrying the missing `api_id`. It SHALL NOT return an empty mapping or `None`.

#### Scenario: Missing config entry surfaces as schema-changed error
- **WHEN** the caller invokes `field_mapping::map("MOI_API_999", response)` and no config entry exists for `MOI_API_999`
- **THEN** the function SHALL return `Err(LandRegistryError::FieldSchemaChanged { api_id: "MOI_API_999" })`
