## ADDED Requirements

### Requirement: Local Web SHALL use same-origin discovery proxy

Development local Web SHALL perform R02 discovery through a same-origin localhost proxy. The browser SHALL NOT call EasyMap R02, COP, NLSC, public cadastral, or convenience-service endpoints directly.

#### Scenario: Development browser requests discovery

- **GIVEN** the user opens `/cases/new` on `localhost:1420` in development mode
- **WHEN** the user requests address discovery
- **THEN** the browser SHALL call the local discovery proxy endpoint or Desktop bridge
- **AND** external service credentials SHALL remain server-side
- **AND** the response SHALL include status, source, candidates, errors, normalized address, and `totalCostCents = 0`.

#### Scenario: Production browser build requests local discovery

- **GIVEN** the app is running as a production browser build outside Desktop App
- **WHEN** the browser requests local address discovery
- **THEN** the proxy SHALL reject the request with `local_proxy_unavailable` or equivalent
- **AND** no external discovery request SHALL be made from the browser.

### Requirement: Web and Desktop SHALL share discovery contract

Local Web proxy responses and Desktop Tauri/Rust discovery responses SHALL use the same normalized contract so the UI and E2E tests do not fork between Web and App.

#### Scenario: Desktop App performs discovery

- **GIVEN** the same address is submitted in Desktop App after AIRE authorization login
- **WHEN** Tauri/Rust completes discovery
- **THEN** the UI SHALL receive the same status, candidate, error, cache, and cost fields as local Web
- **AND** the post-login user flow SHALL match local Web behavior.

### Requirement: Discovery contract SHALL expose input kind and selection gate

Local Web proxy and Desktop discovery responses SHALL include the classified input kind, intended object type, parsed fields, candidate confidence, whether candidate selection is required, suggested corrections when available, and a zero-cost marker. The contract SHALL allow the UI and backend to distinguish confirmed registry keys from discovery-only candidates.

#### Scenario: Doorplate and land descriptor share one contract

- **GIVEN** one user enters a doorplate address
- **AND** another user enters a section and land number
- **WHEN** local Web or Desktop discovery completes
- **THEN** both responses SHALL use the same `DiscoveryResult` shape
- **AND** each response SHALL identify `inputKind`
- **AND** each response SHALL identify intended object type as building, land, or unknown
- **AND** each response SHALL set `totalCostCents = 0`.

#### Scenario: Discovery needs user selection

- **GIVEN** discovery returns more than one possible registry target
- **WHEN** the proxy returns the discovery result
- **THEN** the result SHALL set `requiresCandidateSelection = true`
- **AND** it SHALL NOT contain `confirmed_registry_match`.
