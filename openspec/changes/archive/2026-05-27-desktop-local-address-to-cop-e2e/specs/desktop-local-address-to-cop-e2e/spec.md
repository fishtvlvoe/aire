## ADDED Requirements

### Requirement: Local Web SHALL gate Desktop App parity

AIRE SHALL complete the local Web address-to-COP E2E flow before Desktop App packaging acceptance, Windows acceptance, or auto-update implementation is allowed. Desktop App behavior SHALL match the local Web flow except that Desktop App login uses a SaaS-issued AIRE authorization code instead of the local Web login entry.

#### Scenario: App work starts before local Web E2E passes

- **GIVEN** local Web address-to-COP E2E evidence is missing or failing
- **WHEN** an implementer attempts Desktop App packaging acceptance, Windows acceptance, or auto-update implementation
- **THEN** the work SHALL stop
- **AND** this SR SHALL be completed first.

#### Scenario: Desktop App wraps the completed Web flow

- **GIVEN** local Web E2E proves R02 discovery, confirmed registry key, formal COP pull, local DB persistence, cache hit, cost records, error records, and PDF generation from saved data
- **WHEN** the Mac or Windows App is built
- **THEN** the App SHALL reuse the same post-login flow and contracts
- **AND** the only allowed behavior difference SHALL be obtaining an AIRE authorization code from SaaS for login.

### Requirement: Address-to-COP E2E SHALL preserve evidence

The E2E SHALL produce local evidence for discovery, confirmation, formal query, cost, cache, source run id, errors, saved JSON, and generated PDF artifacts.

#### Scenario: Address-to-COP E2E passes

- **GIVEN** an address is entered in local Web
- **AND** R02 discovery returns candidates or a manual-required state
- **AND** the user confirms section, land number, and building number when required
- **WHEN** formal COP pull is executed
- **THEN** the run SHALL save raw JSON, parsed JSON, total cost, API call rows, cache state, sourceRunId, and readable errors when present
- **AND** HTML preview and PDF SHALL use saved data without triggering another paid query.

#### Scenario: Discovery matrix is verified before paid COP

- **GIVEN** local Web E2E is running on `localhost:1420`
- **WHEN** the test matrix submits doorplate addresses, land descriptor inputs, suspected typo inputs, no-match inputs, and multiple-candidate inputs
- **THEN** every unconfirmed or ambiguous result SHALL preserve discovery evidence
- **AND** every unconfirmed or ambiguous result SHALL keep paid API call count at 0
- **AND** only a user-confirmed single registry target SHALL be allowed to proceed to formal COP.
