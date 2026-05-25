## ADDED Requirements

### Requirement: Formal COP runs preserve cost, cache, source, and errors

Formal COP lookup SHALL create a query run that records confirmed input, API call rows, total cost, cache hit status, source run id, error code, error message, raw response JSON, and normalized response JSON. Repeating the same confirmed registry key SHALL use cache and SHALL NOT create a second paid call.

#### Scenario: First formal pull succeeds

- **GIVEN** a case has confirmed registry key and customer COP credentials
- **WHEN** formal COP pull succeeds
- **THEN** the query run SHALL store formal response JSON
- **AND** total cost and API call rows SHALL be visible in query records.

#### Scenario: Repeated formal pull uses cache

- **GIVEN** a successful formal query run exists for the same confirmed registry key and query date
- **WHEN** the user runs formal pull again
- **THEN** the new run SHALL be `cacheHit = true`
- **AND** `totalCostCents = 0`
- **AND** `sourceRunId` SHALL reference the original paid run.

#### Scenario: Formal pull fails

- **WHEN** formal COP pull fails due to credentials, upstream response, or invalid confirmed key
- **THEN** the query run SHALL record error code and message
- **AND** the customer UI SHALL show a readable failure state
- **AND** management detail SHALL preserve raw diagnostics.

##### Example: Invalid credentials

- **GIVEN** confirmed registry key `DC-1556-00700000` exists for a case
- **AND** the stored COP credential is invalid
- **WHEN** formal COP pull runs
- **THEN** the query run records `error_code = cop_credential_required` or equivalent credential failure
- **AND** `totalCostCents = 0` if no paid service succeeds.
