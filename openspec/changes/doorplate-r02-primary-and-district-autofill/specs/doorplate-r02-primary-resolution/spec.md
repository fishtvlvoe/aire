# doorplate-r02-primary-resolution Specification

## ADDED Requirements

### Requirement: Complete doorplate building inputs SHALL use R02 as the primary building-resolution source

For complete doorplate building inputs that include a house number, the system SHALL use R02 as the primary building-resolution source. Z10Web SHALL be used only for verification, conflict diagnostics, or additional evidence.

#### Scenario: R02 primary returns a building candidate

- **WHEN** a complete doorplate address with `號` is submitted
- **THEN** the system SHALL query R02 before Z10Web
- **THEN** if R02 returns a usable building candidate, the candidate SHALL remain the primary result

#### Scenario: Z10 verification timeout does not erase R02 primary candidate

- **WHEN** R02 returns a usable building candidate
- **AND** Z10Web times out or is unavailable
- **THEN** the system SHALL return a candidate or low-confidence candidate state
- **THEN** the system SHALL NOT collapse the result into `no_data`

#### Scenario: R02 and Z10 conflict remains unresolved

- **WHEN** R02 and Z10Web return conflicting building candidates
- **THEN** the system SHALL return `low_confidence_unresolved`
- **THEN** the UI SHALL explain that candidates conflict and require confirmation

#### Scenario: Non-doorplate land-descriptor input stays outside this rule

- **WHEN** the input is a land descriptor rather than a doorplate address
- **THEN** this R02-primary doorplate rule SHALL NOT apply
