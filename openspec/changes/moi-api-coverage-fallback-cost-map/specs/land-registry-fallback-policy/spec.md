## ADDED Requirements

### Requirement: MOI API outcome classifier distinguishes transport, domain, empty, and restricted failures

The system SHALL classify each MOI API response using HTTP status, MOI `STATUS`, `CODE`, `MESSAGE`, `RETURNROWS`, and payload shape. HTTP 2xx SHALL NOT be sufficient to classify a call as business success.

#### Scenario: COP309 is a domain failure

- **WHEN** a MOI response contains `CODE = "COP309"` and `RETURNROWS = 0`
- **THEN** the outcome SHALL be classified as `domain_failure`
- **AND** the error code and sanitized message SHALL be preserved for ledger and UI review

#### Scenario: Empty but valid response can be usable

- **WHEN** a service's documented no-data state returns `STATUS = 0` or a null payload
- **AND** the service policy marks no-data as acceptable
- **THEN** the outcome SHALL be classified as `empty_success`
- **AND** the downstream workflow SHALL continue with empty data instead of treating it as a crash

### Requirement: AIRE fallback policy handles unavailable or no-data MOI responses

The system SHALL define fallback behavior for primary MOI API failures. Fallback behavior SHALL distinguish retryable transport errors, no-data outcomes, restricted service responses, unsupported county/city ranges, and parse failures.

#### Scenario: Primary service unavailable falls back to manual or alternate data

- **WHEN** a required primary MOI service fails with a non-retryable domain error
- **THEN** AIRE SHALL either call an approved fallback service from the coverage matrix or mark the field for manual completion
- **AND** the UI SHALL show a clear Traditional Chinese status that the data was not automatically retrieved

##### Example: Unsupported county/city range becomes manual completion

- **GIVEN** `MOI_API_005` is the primary service for building ownership data
- **AND** the response contains `CODE = "COP309"` and `MESSAGE` says the input county/city range is not open for query
- **WHEN** no approved fallback service exists in the coverage matrix
- **THEN** AIRE SHALL mark the building ownership field as manual completion required
- **AND** the ledger SHALL record `COP309`, `RETURNROWS = 0`, and non-billable outcome

#### Scenario: Restricted service is not called for normal users

- **WHEN** a service is classified as `restricted`
- **THEN** normal user workflows SHALL NOT call that service automatically
- **AND** the coverage matrix SHALL keep the service visible as unavailable evidence instead of silently omitting it
