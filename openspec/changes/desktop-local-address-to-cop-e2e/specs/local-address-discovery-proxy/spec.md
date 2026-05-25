## ADDED Requirements

### Requirement: Local Web SHALL use a localhost discovery proxy

Development local Web SHALL perform address discovery through a same-origin localhost proxy or Desktop bridge. The browser SHALL NOT call COP, NLSC, public cadastral, or convenience-service endpoints directly. The proxy SHALL normalize every result into the shared discovery result shape and preserve zero-cost diagnostics.

#### Scenario: Development browser requests discovery

- **GIVEN** the user opens `/cases/new` on `localhost:1420` in development mode
- **WHEN** the user requests address discovery
- **THEN** the browser SHALL call the local discovery proxy endpoint or Desktop bridge
- **AND** external discovery credentials SHALL remain server-side
- **AND** the response SHALL include status, source, candidates, errors, and `totalCostCents = 0`.

#### Scenario: External source is unavailable

- **GIVEN** the local discovery proxy cannot use COP address lookup or public cadastral lookup for the submitted address
- **WHEN** discovery completes
- **THEN** the proxy SHALL return `manual_required`
- **AND** it SHALL include diagnostic errors such as `local_fixture_not_found`, `cop_address_no_match`, or `public_cadastral_denied`
- **AND** it SHALL NOT return generic mock registry keys.

#### Scenario: Production browser build requests local discovery

- **GIVEN** the app is running as a production browser build outside Desktop App
- **WHEN** the browser requests local address discovery
- **THEN** the proxy SHALL reject the request with `local_proxy_unavailable` or equivalent
- **AND** no external discovery request SHALL be made from the browser.
