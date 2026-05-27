## ADDED Requirements

### Requirement: Address discovery records source status

The system SHALL represent address discovery as a zero-cost discovery run with explicit source status, not as formal registry data. Discovery results SHALL distinguish at least COP address lookup success, COP address lookup no-match, NLSC/CAD permission denied, development fixture candidate, manual-required, and confirmed registry match states.

#### Scenario: COP address lookup returns no match

- **WHEN** COP address lookup returns zero candidates for an address
- **THEN** the discovery run SHALL be saved with `totalCostCents = 0`
- **AND** the customer UI SHALL ask for manual section, land number, and building number confirmation
- **AND** the management detail SHALL retain the COP address lookup diagnostic.

#### Scenario: NLSC permission denied

- **WHEN** NLSC/CAD returns permission denied for address discovery
- **THEN** the system SHALL NOT treat it as successful address completion
- **AND** the discovery run SHALL save `public_cadastral_denied` or equivalent diagnostic state
- **AND** the customer UI SHALL show a readable manual-completion message.

### Requirement: Local Web uses safe discovery path

Development browser mode SHALL support local E2E by saving discovery attempts and explicit dev fixtures, but SHALL NOT use generic mock placeholder values as confirmed registry data. Dev fixture candidates SHALL be marked untrusted for PDF until user confirmation and formal COP pull succeed.

#### Scenario: Local Web uses localhost proxy

- **GIVEN** the user opens `/cases/new` on `localhost:1420` in development mode
- **WHEN** the user requests address discovery
- **THEN** the browser SHALL call a same-origin localhost discovery proxy or Tauri bridge
- **AND** the browser SHALL NOT call COP, NLSC, or public cadastral external services directly.

#### Scenario: Local proxy has no source for address

- **GIVEN** local Web discovery has no explicit fixture and no available external discovery source for an address
- **WHEN** the user requests address discovery
- **THEN** the discovery result SHALL be saved as `manual_required` with `totalCostCents = 0`
- **AND** the confirmation fields SHALL remain blank
- **AND** the UI SHALL explain that local discovery could not find covered data and manual confirmation or Desktop App lookup is required.

#### Scenario: Production browser cannot use local proxy

- **GIVEN** the app is running as a production browser build outside Desktop App
- **WHEN** address discovery is requested
- **THEN** the local discovery proxy SHALL return `local_proxy_unavailable` or equivalent
- **AND** no external COP/NLSC request SHALL be sent from the browser.

#### Scenario: Generic mock placeholder appears

- **GIVEN** address lookup returns parcel `0001-0001` with land number `0001`, building number `0001`, and source `mock`
- **WHEN** the user runs address discovery in `/cases/new`
- **THEN** the UI SHALL keep section, land number, and building number confirmation fields blank
- **AND** the case SHALL NOT be created as auto-completed.

#### Scenario: Dev fixture candidate appears

- **GIVEN** development mode has an explicit address fixture
- **WHEN** local Web discovery returns that fixture
- **THEN** the candidate SHALL be saved with `source = dev_fixture` or equivalent
- **AND** `trustedForPdf` SHALL be false
- **AND** formal COP pull SHALL still require confirmed registry key.
