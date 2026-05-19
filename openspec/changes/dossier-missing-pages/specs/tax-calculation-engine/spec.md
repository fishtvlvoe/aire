## ADDED Requirements

### Requirement: tax-calculation-engine provides pure functions for AIRE tax types

The system SHALL export from `src/lib/tax-calculator.ts` pure calculation functions for stamp tax, deed tax, building tax, and land price tax, all tested against known input/output pairs.

#### Scenario: stampTax calculation
- GIVEN contractPrice=1000000, officialValue=800000, shareRatio=1.0
- WHEN stampTax is called
- THEN returns 1800

#### Scenario: deedTax calculation
- GIVEN contractPrice=1000000
- WHEN deedTax is called
- THEN returns 60000

#### Scenario: buildingTax residential
- GIVEN buildingCurrentValue=200000, usage="residential"
- WHEN buildingTax is called
- THEN returns 2400

#### Scenario: buildingTax commercial
- GIVEN buildingCurrentValue=200000, usage="commercial"
- WHEN buildingTax is called
- THEN returns 6000

#### Scenario: zero input returns zero
- GIVEN any numeric input is 0
- WHEN any tax function is called
- THEN returns 0 without throwing
