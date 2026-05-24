## ADDED Requirements

### Requirement: Every registry workflow step SHALL create a query run

The system SHALL persist a query run for every address resolution, land resolution, candidate comparison, confirmation, COP pull, cache hit, failed COP call, and fixture test execution. The internal endpoint `GET /api/settings/land-registry-records` SHALL return HTTP 200 with paginated query runs sorted by newest first.

#### Scenario: Address resolution creates a run

- **WHEN** the user resolves an address through `POST /api/registry/resolve-address`
- **THEN** the system SHALL create one query run
- **AND** `GET /api/settings/land-registry-records` SHALL return HTTP 200 with that run
- **AND** the run SHALL include input address, normalized address, registry key when available, status, total cost, cache-hit flag, and created time rendered in Asia/Taipei

#### Scenario: Cache hit creates a run linked to the source

- **WHEN** a confirmed registry key is already cached and the user pulls registry data for a new case
- **THEN** the system SHALL create a new query run with `cacheHit = true`
- **AND** the run SHALL include `sourceRunId`
- **AND** the run SHALL have `totalCostCents = 0`

### Requirement: Query run detail SHALL expose JSON cost and errors

The system SHALL expose stored query run detail through `GET /api/settings/land-registry-records/{runId}`. The endpoint SHALL return HTTP 200 with parsed JSON, raw stored JSON, API calls, total cost, error summary, confirmation state, and export links. It SHALL return HTTP 404 when the run id does not exist.

#### Scenario: Successful detail request returns parsed JSON and API calls

- **WHEN** the Settings UI opens a query run detail drawer
- **THEN** `GET /api/settings/land-registry-records/{runId}` SHALL return HTTP 200
- **AND** the response SHALL include `parsedJson`, `rawJson`, `apiCalls`, `totalCostCents`, `errors`, and `confirmation`

#### Scenario: Missing run id returns not found

- **WHEN** the Settings UI requests `GET /api/settings/land-registry-records/unknown-run`
- **THEN** the system SHALL return HTTP 404
- **AND** the response SHALL include error code `query_run_not_found`

### Requirement: Query records SHALL be searchable in Settings UI

The Settings UI SHALL allow users to search query records by address, normalized address, section, land number, building number, case id, status, COP error code, and date range. Search SHALL call `GET /api/settings/land-registry-records` with query parameters and SHALL update the table without requiring AI or local file inspection.

#### Scenario: Search by address

- **WHEN** the user searches for `裕農路288巷17號`
- **THEN** the Settings UI SHALL show only matching query runs
- **AND** each row SHALL display status, registry key, classification, cache-hit flag, total cost, and created time

#### Scenario: Search by COP error code

- **WHEN** the user filters records by COP code `COP317`
- **THEN** the Settings UI SHALL show only runs with at least one API call containing `copCode = COP317`
- **AND** each matching row SHALL provide a detail action for the error log

### Requirement: Query records SHALL export JSON and CSV

The system SHALL export selected or filtered query records through `GET /api/settings/land-registry-records/export?format=json` and `GET /api/settings/land-registry-records/export?format=csv`. Successful exports SHALL return HTTP 200. Unsupported formats SHALL return HTTP 400.

#### Scenario: Export filtered JSON

- **WHEN** the user exports filtered records as JSON
- **THEN** the system SHALL return HTTP 200
- **AND** the downloaded JSON SHALL include runs, API calls, cost summary, error summary, and fixture labels when present

#### Scenario: Unsupported export format

- **WHEN** the user requests `GET /api/settings/land-registry-records/export?format=xlsx`
- **THEN** the system SHALL return HTTP 400
- **AND** the response SHALL include error code `unsupported_export_format`
