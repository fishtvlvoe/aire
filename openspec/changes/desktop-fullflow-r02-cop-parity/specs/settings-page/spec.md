## ADDED Requirements

### Requirement: Settings page

系統設定 SHALL own entitlement, trial, authorization and customer COP credential status. Registry query records SHALL NOT show trial status cards or lookup helper forms. Customer-facing settings copy SHALL use account and authorization language rather than implementation service names.

#### Scenario: Trial and authorization status appear in system settings

- **WHEN** the user opens system settings
- **THEN** the page SHALL display plan/trial status, authorization status and customer credential state
- **AND** the page SHALL NOT require the user to understand registry discovery implementation details

#### Scenario: Query records do not show trial card or helper form

- **WHEN** the user opens the query records section
- **THEN** the page SHALL NOT display a SaaS trial status card
- **AND** the page SHALL NOT display an R02/便民系統 helper form
- **AND** the page SHALL show only searchable records, costs, cache status, errors and expandable management details

### Requirement: Customer-facing language guard

Customer-facing AIRE pages SHALL avoid exposing technical implementation terms that increase cognitive load. Forbidden terms in normal customer operation copy include R02, 便民系統, COP, API, Helper, adapter, parser, payload and JSON. Management-only expanded details SHALL be allowed to show JSON and API rows only when explicitly opened from query-record detail.

#### Scenario: Customer operation pages are scanned for forbidden terms

- **WHEN** automated UI text checks run against `/cases`, `/cases/new`, case detail, supplement workbench and default settings sections
- **THEN** forbidden implementation terms SHALL NOT appear in visible customer operation copy
- **AND** management-only expanded detail panels SHALL be excluded only when the test explicitly opens them
