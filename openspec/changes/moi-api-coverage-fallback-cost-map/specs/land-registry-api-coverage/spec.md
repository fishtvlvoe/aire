## ADDED Requirements

### Requirement: AIRE maintains a MOI API coverage matrix

The system SHALL maintain a coverage matrix that maps scraped MOI services to AIRE workflow needs and implementation status. The matrix SHALL identify whether each service is wired, missing, fallback-only, free enrichment, restricted, or deferred.

#### Scenario: Existing AIRE endpoints are mapped to official service codes

- **WHEN** the coverage matrix is generated
- **THEN** current AIRE endpoints such as `land_registry`, `building_registry`, `building_ownership`, `building_other_rights`, and `address_to_parcel` SHALL be mapped to their official MOI service code when known
- **AND** any endpoint without a verified service code SHALL be marked `needs_verification`

#### Scenario: Required workflow gaps are visible

- **WHEN** a disclosure workflow requires a data field that no wired AIRE endpoint can provide
- **THEN** the matrix SHALL mark the corresponding MOI service or manual fallback as `missing_required`
- **AND** the report SHALL show why the field matters to the workflow

### Requirement: AIRE required disclosure workflows map to required and fallback MOI services

The system SHALL classify MOI services by workflow priority before implementation. Required services SHALL be separated from fallback, free enrichment, billing-only, restricted, and deferred services.

#### Scenario: Free enrichment service is visible but not forced

- **WHEN** a MOI service is free and improves dossier quality but is not legally required for the current disclosure workflow
- **THEN** the service SHALL be classified as `free_enrichment`
- **AND** implementation SHALL be optional unless Fish promotes it to required
