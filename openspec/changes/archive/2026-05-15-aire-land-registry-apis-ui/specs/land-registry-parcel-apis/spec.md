## ADDED Requirements

### Requirement: Seven parcel data API endpoints

The system SHALL provide 7 parcel data API endpoints: building_registry, land_registry, co_owners, land_value, mortgages, building_ownership, and zoning. Each endpoint SHALL implement the LandRegistryEndpoint trait (endpoint_path, parse_response, field_mappings).

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

#### Scenario: All 7 endpoints callable

- **WHEN** pull_data is called for each of the 7 api_ids with a valid parcel_id
- **THEN** all 7 return successfully with parsed data structures

### Requirement: Billing integration per call

Every API call SHALL be recorded in billing_log via land-registry-billing-log. Success calls SHALL record cost_cents from the API pricing config. Failed calls SHALL record cost=0 with error details.

#### Scenario: Successful call recorded with cost

- **WHEN** building_registry API call succeeds
- **THEN** billing_log contains one row with status=200 and cost_cents matching the building_registry unit price

#### Scenario: Failed call recorded with zero cost

- **WHEN** land_value API call returns 503
- **THEN** billing_log contains one row with status=503, cost_cents=0, error non-empty

### Requirement: Batch support

When pulling data for multiple api_ids in one request, the system SHALL use land-registry-batch to split into max-25 chunks if needed.

#### Scenario: Large batch split into chunks

- **WHEN** pull_data is called with 30 api_id+parcel combinations
- **THEN** the system splits into 2 batches (25 + 5) and aggregates results
