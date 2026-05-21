## ADDED Requirements

### Requirement: Users can audit MOI API usage and cost totals

The system SHALL display MOI API usage totals with date range, service code, status, and request id filters. Totals SHALL include return row count, success count, failure count, and unpaid amount derived from billable ledger rows.

#### Scenario: Dashboard displays official-style totals

- **WHEN** the user opens the MOI API usage dashboard for `2026-05-14` through `2026-05-21`
- **THEN** the dashboard displays return row count, success count, failure count, success/failure ratio, and unpaid amount for that date range

#### Scenario: Dashboard filters by failed service

- **WHEN** the user filters the dashboard to failures for `MOI_API_005`
- **THEN** the dashboard displays only failed `MOI_API_005` ledger rows and preserves the original error code and sanitized message summary

### Requirement: Admin can review customer MOI API ledger rows

The system SHALL allow an admin support user to inspect customer MOI API ledger rows without exposing owner personal data, full property addresses, PDF content, or dossier payloads.

#### Scenario: Admin ledger view excludes sensitive case payloads

- **WHEN** admin opens a customer's MOI API ledger row
- **THEN** the row displays service metadata, status, counts, and cost fields
- **THEN** the row SHALL NOT display owner name, full property address, PDF content, or raw dossier payload

##### Example: sanitized admin ledger row

- **GIVEN** a ledger row has `serviceCode = "MOI_API_005"`, `status = "failed"`, `errorCode = "COP309"`, `returnRows = 0`, `chargedAmount = "0.00"`, and the original case contains owner name `"陳小美"` and address `"台北市大安區和平東路一段 100 號"`
- **WHEN** admin opens the ledger row
- **THEN** the view includes `"MOI_API_005"`, `"failed"`, `"COP309"`, `0`, and `"0.00"`
- **THEN** the view excludes `"陳小美"` and `"台北市大安區和平東路一段 100 號"`
