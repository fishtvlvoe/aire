## MODIFIED Requirements

### Requirement: Cache SHALL store API responses keyed by parcel and query date

The land registry cache SHALL persist API responses in encrypted SQLite using confirmed registry key, API id, payload version, fetched timestamp, and expiration timestamp. Building registry keys SHALL use `officeCode + sectionCode + landNo + buildingNo`. Land-only registry keys SHALL use `officeCode + sectionCode + landNo`. Cache entries SHALL NOT be scoped to any case ID, so the same confirmed registry key queried from multiple cases reuses one stored response until expiration.

#### Scenario: Same confirmed building queried from two cases

- **GIVEN** case A queried building registry key `DC-1556-00700000-00204000` for API `MOI_API_004` and the result is cached
- **WHEN** case B queries the same registry key for `MOI_API_004` before expiration
- **THEN** the cache SHALL return the stored payload
- **AND** the system SHALL NOT issue a network request to COP
- **AND** the new query run SHALL record `cacheHit = true`, `sourceRunId`, and `totalCostCents = 0`

#### Scenario: Same raw address with confirmed registry key reuses cache

- **GIVEN** registry key `DC-1556-00700000-00204000` was cached from address `台南市東區裕農路288巷17號8樓之1`
- **WHEN** another case enters the same address with different spacing or `臺南市` spelling and confirms the same registry key
- **THEN** the cache SHALL return the stored payload
- **AND** the system SHALL NOT call COP again

#### Scenario: Explicit refresh creates a paid run

- **GIVEN** a valid cache entry exists for registry key `DC-1556-00700000-00204000`
- **WHEN** the user chooses explicit refresh and confirms the estimated cost and refresh reason
- **THEN** the system SHALL call COP
- **AND** the query run SHALL record `cacheHit = false`, `refreshReason`, and actual API costs

## ADDED Requirements

### Requirement: Cache SHALL reject unconfirmed candidate keys

The land registry cache SHALL serve formal COP payloads only for confirmed registry keys. Candidate keys with `confirmation_status = candidate_unconfirmed` or `needs_selection` SHALL NOT be used for formal cache lookup.

#### Scenario: Candidate key is not confirmed

- **WHEN** the system has address candidates but no confirmed registry key
- **THEN** formal cache lookup SHALL return error `registry_key_not_confirmed`
- **AND** formal COP pull SHALL remain disabled
