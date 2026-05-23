## ADDED Requirements

### Requirement: Address lookup supports pre-owner-talk reference candidates

The system SHALL preserve address lookup candidates as usable pre-owner-talk reference sources when formal land or building identifiers are unavailable. Candidate reference data SHALL remain marked unconfirmed and SHALL NOT be promoted to formal registry data without user confirmation or trusted registry evidence.

#### Scenario: Candidate data remains available before owner commitment

- **WHEN** a user enters `台南市東區裕農路288巷17號8樓之1`
- **AND** formal address lookup cannot produce a single confirmed building number
- **THEN** the system preserves available land and building candidates for pre-owner-talk use
- **AND** each candidate remains marked as unconfirmed
- **AND** the source diagnostics keep COP failure codes when official lookup fails

#### Scenario: Single land candidate is available as reference

- **WHEN** address lookup finds exactly one land candidate
- **AND** the user has not explicitly selected a land candidate
- **THEN** downstream dossier assembly SHALL use that single land candidate as a pre-owner-talk reference source
- **AND** the system SHALL keep the candidate marked unconfirmed

##### Example: Yunong single land candidate

- **GIVEN** address `台南市東區裕農路288巷17號8樓之1`
- **AND** candidate list contains only land candidate `DC-1556-00700000`
- **WHEN** the pre-owner-talk dossier is assembled
- **THEN** land section `富強段`, land number `00700000`, zoning `住宅區`, and land area `120.50` are available as candidate reference values
- **AND** the land candidate remains unconfirmed
