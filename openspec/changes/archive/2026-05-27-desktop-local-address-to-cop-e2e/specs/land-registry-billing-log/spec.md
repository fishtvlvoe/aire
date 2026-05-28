## ADDED Requirements

### Requirement: Formal COP requires confirmed registry key

Formal COP lookup SHALL only run after the user confirms section, land number, and building number when applicable. Raw addresses, unconfirmed candidates, mock data, and development fixtures SHALL be rejected before any paid query.

#### Scenario: Formal pull requested from raw address

- **GIVEN** a case has only a raw address and no confirmed registry key
- **WHEN** formal COP pull is requested
- **THEN** the request SHALL fail with `registry_match_required`
- **AND** `totalCostCents` SHALL be 0
- **AND** no paid API call row SHALL be created.

#### Scenario: Formal pull requested from multiple unselected candidates

- **GIVEN** discovery found multiple possible registry targets
- **AND** no single candidate has been confirmed by the user
- **WHEN** formal COP pull is requested
- **THEN** the request SHALL fail with `registry_match_required`
- **AND** `totalCostCents` SHALL be 0
- **AND** paid API call count SHALL remain 0.

#### Scenario: Formal pull requested after correction suggestion

- **GIVEN** discovery produced only an address correction suggestion
- **AND** the user has not rerun discovery or manually confirmed the corrected target
- **WHEN** formal COP pull is requested
- **THEN** the request SHALL fail with `registry_match_required`
- **AND** no paid API call row SHALL be created.

#### Scenario: Paid resolver result is not a formal registry key

- **GIVEN** a paid address-to-parcel resolver run has returned one or more candidates
- **AND** the user has not confirmed exactly one candidate
- **WHEN** formal COP pull is requested
- **THEN** the request SHALL fail with `registry_match_required`
- **AND** no formal COP API call row SHALL be created.

### Requirement: Formal COP runs preserve cost, cache, source, and errors

Formal COP lookup SHALL create a local query run that records confirmed input, selected API set, API call rows, total cost, cache hit status, source run id, error code, error message, raw response JSON, and normalized response JSON. Repeating the same confirmed registry key and same API set SHALL use cache and SHALL NOT create a second paid call.

#### Scenario: First formal pull succeeds

- **GIVEN** a case has confirmed registry key and customer COP credentials
- **WHEN** formal COP pull succeeds
- **THEN** the query run SHALL store formal response JSON
- **AND** total cost and API call rows SHALL be visible in local query records.

#### Scenario: Repeated formal pull uses cache

- **GIVEN** a successful formal query run exists for the same confirmed registry key and same API set
- **WHEN** the user runs formal pull again
- **THEN** the new run SHALL be `cacheHit = true`
- **AND** `totalCostCents = 0`
- **AND** `sourceRunId` SHALL reference the original paid run.

#### Scenario: Formal pull fails

- **WHEN** formal COP pull fails due to credentials, upstream response, or invalid confirmed key
- **THEN** the query run SHALL record error code and message
- **AND** the customer UI SHALL show a readable failure state
- **AND** management detail SHALL preserve raw diagnostics.

##### Example: Invalid COP credentials

- **GIVEN** a case has confirmed registry key `DC-1556-00700000`
- **AND** the stored customer COP credential is invalid or missing
- **WHEN** formal COP pull runs
- **THEN** the query run SHALL record `cop_credential_required` or equivalent credential failure
- **AND** `totalCostCents` SHALL be 0 if no paid service succeeds.

### Requirement: Formal query cost SHALL be estimated before paid pull

The system SHALL estimate formal query cost from confirmed property type and selected API set before triggering COP.

#### Scenario: Building number is confirmed

- **GIVEN** a confirmed registry key includes building number
- **WHEN** the system prepares formal COP pull
- **THEN** it SHALL select the minimal building-related API set
- **AND** it SHALL show the estimated cost before the user confirms paid lookup.

#### Scenario: No building number is confirmed

- **GIVEN** a confirmed registry key has section and land number but no building number
- **WHEN** the system prepares formal COP pull
- **THEN** it SHALL select the minimal land-related API set
- **AND** it SHALL show the estimated cost before the user confirms paid lookup.

### Requirement: Paid resolver cost SHALL be explicit and separately logged

Paid address-to-parcel resolver runs SHALL be logged separately from formal COP runs. A resolver run SHALL record run type, target normalized address, API id, total cost when known, transaction id when present, raw response, parsed candidates, readable error state, and source run id. Resolver success SHALL NOT be counted as formal COP success.

#### Scenario: User confirms paid resolver cost

- **GIVEN** zero-cost discovery cannot resolve a building number
- **WHEN** the UI offers paid address-to-parcel resolution
- **THEN** the UI SHALL show the estimated or possible resolver fee before the user starts it
- **AND** the system SHALL not call the resolver until the user explicitly confirms.

#### Scenario: Paid resolver succeeds

- **GIVEN** the user confirmed the paid resolver
- **WHEN** the resolver returns land or building candidates
- **THEN** a resolver query run SHALL be saved with paid resolver run type
- **AND** candidates SHALL be linked to the case as unconfirmed candidate evidence
- **AND** formal COP cost SHALL remain 0 until a later confirmed formal pull.

#### Scenario: Paid resolver fails but may have cost

- **GIVEN** the user confirmed the paid resolver
- **WHEN** the resolver is denied, fails upstream, or returns no candidate
- **THEN** the resolver query run SHALL preserve the readable error and raw diagnostics
- **AND** the fee SHALL be recorded as returned by the upstream billing evidence
- **AND** the case SHALL remain unconfirmed.

### Requirement: Billing records SHALL be grouped and drillable by registry object type

Billing records SHALL show the registry object type, query target, service, status, transaction id, and fee for each formal registry query. The billing UI SHALL support opening a record detail that shows the saved run, API call rows, cache status, source run id, and readable error diagnostics.

#### Scenario: Building and land records appear in billing log

- **GIVEN** a case has formal building and land registry query runs
- **WHEN** the user opens billing records
- **THEN** the billing log SHALL show object type labels for building and land records
- **AND** each row SHALL show query target, status, transaction id when present, and fee.

#### Scenario: User opens a billing detail

- **GIVEN** a billing row is visible
- **WHEN** the user opens the detail for that row
- **THEN** the detail SHALL show the saved query run, API call rows, cache hit status, source run id when present, and readable error diagnostics when present
- **AND** raw diagnostics SHALL remain inside the management detail instead of the main customer-facing table.
