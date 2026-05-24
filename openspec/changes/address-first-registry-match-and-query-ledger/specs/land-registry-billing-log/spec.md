## MODIFIED Requirements

### Requirement: Every call SHALL be recorded with cost and transaction ID

The billing log SHALL persist one row per upstream API call or cache-mediated formal query event. Each row SHALL contain query run id, timestamp, `api_id`, registry key, HTTP method, endpoint, HTTP status, `TRANSACTIONID` from the platform response when available, COP code, COP message, cost in cents, redacted request summary, redacted response summary, and the error message on failure.

#### Scenario: Successful call writes a log row with cost

- **WHEN** a successful call to `MOI_API_001` returns
- **THEN** the billing log SHALL contain a new row with `api_id = MOI_API_001`, `status = 200`, `transaction_id` populated from the response, `run_id` populated, and `cost_cents` derived from the API unit price

#### Scenario: Failed call still writes a log row with error

- **WHEN** a call returns HTTP 503 after all retries
- **THEN** the billing log SHALL contain a new row with `status = 503`, `cost_cents = 0`, `run_id` populated, and `error` populated with the captured error message
- **AND** the system SHALL NOT silently drop the failure

#### Scenario: COP application error writes a traceable log row

- **WHEN** COP returns HTTP 200 with business code `COP317`
- **THEN** the billing log SHALL contain `http_status = 200`, `cop_code = COP317`, COP message, `cost_cents = 0`, and redacted request summary
- **AND** the associated query run SHALL expose the same COP code in Settings

## ADDED Requirements

### Requirement: Billing log SHALL aggregate per-run total cost

The system SHALL aggregate API call costs into each query run. The internal endpoint `GET /api/settings/land-registry-records/{runId}` SHALL return HTTP 200 with `apiCalls`, `totalCostCents`, `paidCallCount`, `freeCallCount`, and `cacheHit`.

#### Scenario: Land-only pull costs two units

- **WHEN** a land-only formal pull calls two paid COP services successfully
- **THEN** the query run SHALL show two paid API call rows
- **AND** `totalCostCents` SHALL equal the sum of the two service prices

#### Scenario: Land and building pull costs six units

- **WHEN** a land-and-building formal pull calls six paid COP services successfully
- **THEN** the query run SHALL show six paid API call rows
- **AND** `totalCostCents` SHALL equal the sum of the six service prices
