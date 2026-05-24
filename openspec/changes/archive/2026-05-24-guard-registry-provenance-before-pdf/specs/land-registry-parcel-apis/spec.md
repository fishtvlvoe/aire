## ADDED Requirements

### Requirement: Live MOI runner SHALL separate candidate inputs from official API results

The live MOI validation runner SHALL clearly separate public candidate inputs from official MOI/COP API results.

#### Scenario: Public candidate building numbers are not official address lookup output

- **GIVEN** the address lookup API returns no successful parcel rows
- **AND** the runner uses public candidate building numbers for downstream API validation
- **WHEN** the runner writes JSON output
- **THEN** those building numbers SHALL be recorded as candidate inputs
- **AND** SHALL NOT be recorded as official address lookup results

#### Scenario: Raw endpoint probes are not product data

- **GIVEN** the runner tries undocumented or not-yet-productized endpoint paths
- **WHEN** the runner writes JSON output
- **THEN** those responses SHALL be grouped as raw probe evidence
- **AND** SHALL NOT be merged into formal registry data used by the product
