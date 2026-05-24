# land-registry-parcel-apis Specification

## MODIFIED Requirements

### Requirement: Seven parcel data API endpoints

The system SHALL provide parcel data API endpoints for the AIRE-supported MOI/COP service clients: building_registry, land_registry, co_owners, land_value, mortgages, building_ownership, building_other_rights, and zoning. Each endpoint SHALL implement the LandRegistryEndpoint trait (endpoint_path, parse_response, field_mappings) when it owns a structured parser.

Live full-pull validation SHALL cover all supported endpoint ids and SHALL record per endpoint success, parsed data, error details, and cost/billing entries. Building-scoped endpoint ids SHALL be run against discovered building numbers. Land-scoped endpoint ids SHALL be run against discovered land numbers when available, or SHALL record a failed fallback attempt when land numbers cannot be discovered.

Live full-pull validation SHALL also attempt every input-available MOI/COP endpoint from the local scraped documentation using raw endpoint calls when AIRE does not yet have a structured parser. The output SHALL include the endpoint path, payload, HTTP status, COP status/code/message, and raw response for each attempt. Endpoints that require unavailable private owner inputs SHALL be listed as skipped with a human-readable reason.

#### Scenario: Building registry data retrieval

- **WHEN** a configured user calls pull_data with api_id "building_registry" and a valid parcel_id
- **THEN** the system returns parsed building registration data with fields mapped per land-registry-field-mapping config

##### Example: Building registry pull

- **GIVEN** API key configured, parcel_id "0301-0001" exists in sandbox
- **WHEN** api_id is "building_registry"
- **THEN** result contains building_area, building_purpose, construction_date fields

#### Scenario: Land registry data retrieval

- **WHEN** a configured user calls pull_data with api_id "land_registry" and a valid parcel_id
- **THEN** the system returns parsed land registration data

#### Scenario: All supported endpoints are represented in live full-pull output

- **GIVEN** a configured live COP account
- **AND** address lookup returns at least one building number for a real address
- **WHEN** the full-pull validation runs
- **THEN** the output SHALL include results for `building_registry`, `building_ownership`, and `building_other_rights`
- **AND** the output SHALL include results for `land_registry`, `zoning`, `land_value`, `co_owners`, and `mortgages` when land numbers are discovered
- **AND** each result SHALL include success or failure state, parsed data or error details, and cost/billing entries

#### Scenario: Input-available MOI endpoints are attempted in raw live output

- **GIVEN** a configured live COP account
- **AND** the 裕農路測試案 has address, coordinate, land number, and building number candidates
- **WHEN** the full-pull validation runs
- **THEN** the output SHALL include raw attempts for address, land-number, building-number, coordinate, division-merge, three-dimensional building, parking, and billing endpoints that can be called with those inputs
- **AND** the output SHALL list owner-comparison endpoints as skipped when owner name or identity input is not available
