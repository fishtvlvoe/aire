## ADDED Requirements

### Requirement: Land registry billing log totals align with MOI usage ledger

The land registry billing log SHALL calculate unpaid amount totals from billable MOI usage ledger rows and SHALL exclude non-billable failure rows.

#### Scenario: Non-billable failures are excluded from unpaid total

- **WHEN** the ledger contains one successful billable row charged `27.00` and one failed `COP309` row charged `0.00`
- **THEN** the billing log unpaid total SHALL be `27.00`
- **THEN** the failure count SHALL still include the `COP309` row
