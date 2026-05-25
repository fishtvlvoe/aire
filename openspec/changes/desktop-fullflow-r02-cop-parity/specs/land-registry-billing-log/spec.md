## ADDED Requirements

### Requirement: Billing log records and cache hits

Every formal registry lookup, candidate discovery, cache hit and lookup error SHALL create a visible query record. Query records SHALL support cost audit and support debugging without becoming the customer-facing lookup entry.

#### Scenario: Cache hit creates zero-cost record

- **WHEN** the same organization queries an already-confirmed registry key with valid stored formal data
- **THEN** the system SHALL reuse the stored result
- **AND** the new query record SHALL have `cacheHit = true`
- **AND** the new query record SHALL have `totalCostCents = 0`
- **AND** the new query record SHALL point to the original source run

#### Scenario: Query records expose management details

- **WHEN** an administrator opens a query record detail
- **THEN** the detail SHALL show stored candidate/formal data, cost, cache status, error information and call rows
- **AND** these details SHALL be available for support and audit
- **AND** the default customer workflow SHALL NOT require reading these details
