## ADDED Requirements

### Requirement: MOI cost policy calculates billable amounts from catalog rules

The system SHALL calculate MOI API billable amounts from service-specific catalog rules instead of a single fixed unit cost. The cost policy SHALL support row-based, location-based, duration-based, free, authenticated-free, restricted, and unknown pricing models.

#### Scenario: Row-based successful response is billed by return rows

- **GIVEN** `MOI_API_005` is cataloged as `price_by_row` with unit price 1 NTD
- **WHEN** a successful response has `RETURNROWS = 3`
- **THEN** the billable amount SHALL be 3 NTD

#### Scenario: Location-based service uses location count

- **GIVEN** `MOI_API_007` is cataloged as `price_by_location` with unit price 10 NTD per section
- **WHEN** a request bills 2 sections
- **THEN** the billable amount SHALL be 20 NTD

#### Scenario: Free service does not increase unpaid amount

- **WHEN** a service is cataloged as `free` or `auth_free`
- **THEN** the billable amount SHALL be 0 NTD

#### Scenario: Unknown pricing blocks production billing

- **WHEN** a service pricing model is `unknown`
- **THEN** production billing SHALL NOT charge the customer automatically
- **AND** the call SHALL be visible as a pricing gap for admin review
