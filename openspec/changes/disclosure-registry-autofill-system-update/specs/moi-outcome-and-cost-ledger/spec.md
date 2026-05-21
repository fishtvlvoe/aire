# moi-outcome-and-cost-ledger Specification

## Purpose

Defines the outcome classifier, cost calculation rules, and usage ledger needed to reconcile AIRE land registry calls with customer/admin audit views.

## ADDED Requirements

### Requirement: Outcome classifier SHALL classify transport, MOI, empty, domain, restricted, and parse results

The system SHALL classify every MOI/COP service call into one outcome before calculating cost.

Allowed outcomes SHALL include `transport_failure`, `moi_success`, `empty_success`, `domain_failure`, `restricted_failure`, and `parse_failure`.

The classifier SHALL use HTTP status, timeout/network errors, MOI `STATUS`, MOI `CODE`, MOI `MESSAGE`, `RETURNROWS`, response payload presence, and parser result.

#### Scenario: COP309 is classified as domain failure

- **GIVEN** a MOI response includes `STATUS = 0`
- **AND** `CODE = COP309`
- **AND** `RETURNROWS = 0`
- **WHEN** the outcome classifier evaluates the response
- **THEN** the outcome SHALL be `domain_failure`
- **AND** the classifier SHALL preserve `COP309` in the ledger payload

#### Scenario: Empty successful response is not treated as parse failure

- **GIVEN** a MOI response has a successful status
- **AND** `RETURNROWS = 0`
- **AND** the service definition allows no-data results
- **WHEN** the outcome classifier evaluates the response
- **THEN** the outcome SHALL be `empty_success`
- **AND** the failure count SHALL NOT increase

### Requirement: Cost calculator SHALL apply catalog price policy to classified outcomes

The cost calculator SHALL compute billable amount from the service catalog price policy and classified outcome.

`domain_failure`, `restricted_failure`, `parse_failure`, and `transport_failure` SHALL default to 0 billable amount unless the service catalog explicitly marks that outcome as billable.

`moi_success` SHALL calculate amount according to `free`, `auth_free`, `price_by_row`, `price_by_location`, `price_by_duration`, `restricted`, or `unknown`.

#### Scenario: Successful row-based response is charged by return rows

- **GIVEN** a service catalog entry has `price_policy = price_by_row`
- **AND** unit price is 1
- **AND** the outcome is `moi_success`
- **AND** `RETURNROWS = 27`
- **WHEN** cost is calculated
- **THEN** the billable amount SHALL be 27

#### Scenario: Domain failure defaults to zero charge

- **GIVEN** a service response is classified as `domain_failure`
- **AND** the service catalog has no explicit billable failure rule
- **WHEN** cost is calculated
- **THEN** the billable amount SHALL be 0
- **AND** the ledger SHALL record the failure reason

### Requirement: Usage ledger SHALL persist auditable call records

The system SHALL persist one usage ledger record for every MOI/COP service call attempt, whether it succeeds or fails.

Each record SHALL include service code, transaction id when available, request fingerprint, started timestamp, finished timestamp, HTTP status, MOI status, MOI code, MOI message, return rows, outcome, price policy, billable amount, case reference, and local user reference.

#### Scenario: Failed call is still visible in audit records

- **GIVEN** `MOI_API_037` returns `STATUS = 0`, `CODE = COP309`, and `TRANSACTIONID = 08d28190`
- **WHEN** the service call is written to the ledger
- **THEN** the usage ledger SHALL store a record for that call
- **AND** the record SHALL include service code `MOI_API_037`, outcome `domain_failure`, MOI code `COP309`, and transaction id `08d28190`
- **AND** customer/admin audit queries SHALL be able to include it in failure counts

#### Scenario: Audit summary reconciles count and amount

- **GIVEN** a date range contains successful and failed MOI service calls
- **WHEN** the user opens the usage audit summary
- **THEN** the summary SHALL show total calls, successful calls, failed calls, total return rows, and total unpaid amount
- **AND** the unpaid amount SHALL equal the sum of ledger billable amounts in that date range
