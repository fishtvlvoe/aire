# land-registry-billing-log Specification

## MODIFIED Requirements

### Requirement: Every call SHALL be recorded with cost and transaction ID

The billing log SHALL persist one row per upstream API call attempt, whether success or failure.

Each row SHALL contain timestamp, service code, local API id when different from service code, parcel or building reference when available, HTTP status, MOI status, MOI code, MOI message, `TRANSACTIONID` from the platform response when available, return rows, outcome, cost policy, billable amount in cents, and error summary on failure.

Cost SHALL be derived from the MOI service catalog and outcome classifier, not from a fixed default unit cost in endpoint wrappers.

#### Scenario: Successful call writes a log row with catalog-derived cost

- **WHEN** a successful call to a row-priced MOI service returns 3 rows
- **THEN** the billing log SHALL contain a new row with service code, transaction id, `outcome = moi_success`, `return_rows = 3`, and cost derived from the service catalog unit price

#### Scenario: Failed call still writes a log row with error and zero default cost

- **WHEN** a call returns a domain failure such as `COP309`
- **THEN** the billing log SHALL contain a new row with `outcome = domain_failure`
- **AND** the MOI code and message SHALL be preserved
- **AND** the default billable amount SHALL be 0 unless the catalog explicitly marks that failure billable
