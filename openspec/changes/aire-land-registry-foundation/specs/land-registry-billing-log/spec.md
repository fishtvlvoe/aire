## ADDED Requirements

### Requirement: Every call SHALL be recorded with cost and transaction ID
The billing log SHALL persist one row per upstream API call (success or failure) containing: timestamp, `api_id`, `parcel_id`, HTTP status, `TRANSACTIONID` from the platform response (when available), cost in cents, and the error message on failure.

#### Scenario: Successful call writes a log row with cost
- **WHEN** a successful call to `MOI_API_001` returns
- **THEN** the billing log SHALL contain a new row with `api_id = MOI_API_001`, `status = 200`, `transaction_id` populated from the response, and `cost_cents` derived from the API's unit price

#### Scenario: Failed call still writes a log row with error
- **WHEN** a call returns HTTP 503 after all retries
- **THEN** the billing log SHALL contain a new row with `status = 503`, `cost_cents = 0`, and `error` populated with the captured error message
- **AND** SHALL NOT silently drop the failure

### Requirement: Billing log SHALL support monthly cost aggregation
The crate SHALL expose `billing_log::sum_cost_cents(start: NaiveDate, end: NaiveDate) -> u64` that returns the total cost within an inclusive date range.

#### Scenario: Monthly aggregation returns sum of successful calls
- **GIVEN** the log contains rows for 2026-05-01 through 2026-05-31 with costs of 100, 200, and 300 cents
- **WHEN** `sum_cost_cents(2026-05-01, 2026-05-31)` is called
- **THEN** the function SHALL return `600`
