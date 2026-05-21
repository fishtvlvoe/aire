## ADDED Requirements

### Requirement: MOI API attempts are recorded in a usage ledger

The system SHALL record every MOI API call attempt in an append-only usage ledger with service code, request id, status, error code, message summary, return row count, billable flag, charged amount, started timestamp, and finished timestamp.

#### Scenario: Successful MOI API call is recorded

- **WHEN** `MOI_API_005` returns success with `RETURNROWS = 3`
- **THEN** the ledger contains one success row with `serviceCode = "MOI_API_005"`, `returnRows = 3`, `billable = true`, and charged amount from the pricing table

#### Scenario: COP309 failure is recorded without successful billable rows

- **WHEN** a MOI API response contains `{ "CODE": "COP309", "RETURNROWS": 0 }`
- **THEN** the ledger contains one failed row with `errorCode = "COP309"`, `returnRows = 0`, and `billable = false`

### Requirement: MOI API pricing table exists for audited services

The system SHALL maintain a pricing table keyed by MOI service code and SHALL include entries for `MOI_API_005` and `MOI_API_037`.

#### Scenario: Pricing table returns service cost

- **WHEN** the cost calculator receives a successful `MOI_API_037` ledger row
- **THEN** the charged amount SHALL be calculated from the `MOI_API_037` pricing table entry
