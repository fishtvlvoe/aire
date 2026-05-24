## ADDED Requirements

### Requirement: Settings SHALL provide registry query records UI

The Settings page SHALL provide a land registry query records area that lists query runs, costs, cache-hit state, status, COP errors, and created time. The UI SHALL read records from `GET /api/settings/land-registry-records`, which SHALL return HTTP 200 on success and HTTP 500 with `query_records_unavailable` when local storage fails.

#### Scenario: Query records list is visible

- **WHEN** the user opens Settings and navigates to the land API section
- **THEN** the UI SHALL show a query records table
- **AND** each row SHALL display input address or land input, registry key, property type, status, cache-hit flag, total cost, and created time in Asia/Taipei

##### Example: Cached address row

- **GIVEN** run `run-yunong-001` has input address `台南市東區裕農路288巷17號8樓之1`, registry key `DC-1556-00700000-00204000`, `cacheHit = true`, and `totalCostCents = 0`
- **WHEN** the query records table renders
- **THEN** the row SHALL show the address, registry key, cache-hit state, and cost `0`

#### Scenario: Local storage failure is visible

- **WHEN** `GET /api/settings/land-registry-records` returns HTTP 500
- **THEN** the UI SHALL show error text containing `query_records_unavailable`
- **AND** the UI SHALL preserve the Land API credential inputs

### Requirement: Settings SHALL show query run JSON and error logs

The Settings query records UI SHALL allow users to open a run detail drawer with parsed JSON, raw JSON, API call rows, cost summary, COP error logs, and export actions. Detail data SHALL come from `GET /api/settings/land-registry-records/{runId}`.

#### Scenario: Detail drawer shows stored JSON

- **WHEN** the user opens a query run detail
- **THEN** the drawer SHALL display parsed basic fields from JSON
- **AND** the drawer SHALL provide collapsible raw JSON
- **AND** the drawer SHALL show API call cost rows and errors

##### Example: Detail drawer basic fields

- **GIVEN** run `run-yunong-001` contains parsed building area `83.61` and floor label `八層`
- **WHEN** the detail drawer opens
- **THEN** the parsed JSON section SHALL show building area `83.61` and floor label `八層`

#### Scenario: COP error is traceable without AI

- **WHEN** a run contains COP code `COP317`
- **THEN** the drawer SHALL show run id, API id, endpoint, HTTP status, COP code, COP message, request summary without secrets, response summary, cost, and suggested next action

### Requirement: Settings SHALL support explicit paid refresh

The Settings query records UI SHALL show an explicit refresh action only for confirmed registry keys. Refresh SHALL require the user to review estimated cost and enter a refresh reason before `POST /api/registry/runs/{runId}/refresh` is called. The refresh endpoint SHALL return HTTP 200 when accepted and HTTP 409 when the run is not confirmed.

#### Scenario: Confirmed run can be refreshed

- **WHEN** the user opens a confirmed query run and clicks refresh
- **THEN** the UI SHALL show estimated cost and a refresh reason field
- **AND** `POST /api/registry/runs/{runId}/refresh` SHALL be called only after confirmation

#### Scenario: Unconfirmed run cannot be refreshed

- **WHEN** the user attempts to refresh an unconfirmed run
- **THEN** `POST /api/registry/runs/{runId}/refresh` SHALL return HTTP 409
- **AND** the UI SHALL show error code `registry_key_not_confirmed`
