# nationwide-free-pre-survey Specification Delta

## ADDED Requirements

### Requirement: Free pre-survey error states SHALL distinguish incomplete address from unavailable provider

The free pre-survey UI SHALL distinguish incomplete-address failures from provider failures and candidate conflicts.

#### Scenario: Missing district shows incomplete-address state

- **WHEN** a doorplate input is missing district information and autofill cannot uniquely resolve it
- **THEN** the UI SHALL show an incomplete-address message
- **THEN** it SHALL NOT present the state as generic no-data

##### Example: `台南市永華路580號5樓之3` 缺行政區

- **GIVEN** input `台南市永華路580號5樓之3`
- **WHEN** the system cannot uniquely infer the district
- **THEN** the UI SHALL explain that district information is missing
- **THEN** it SHALL NOT say the property itself has no data

#### Scenario: Provider timeout shows retryable provider failure

- **WHEN** the provider fails after the input has already been classified as a complete doorplate
- **THEN** the UI SHALL show a retryable provider-failure state with a trace id
- **THEN** it SHALL preserve building-first fallback semantics rather than dropping to generic no-data

##### Example: `台南市永康區永華路580號5樓之3` provider timeout

- **GIVEN** input `台南市永康區永華路580號5樓之3`
- **AND** the system already classified it as a complete doorplate building address
- **WHEN** Z10Web or another secondary provider times out
- **THEN** the UI SHALL show a retryable provider-failure state with a trace id
- **THEN** it SHALL keep building-first fallback semantics instead of generic no-data
