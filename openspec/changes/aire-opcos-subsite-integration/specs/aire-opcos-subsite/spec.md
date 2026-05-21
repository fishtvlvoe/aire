## ADDED Requirements

### Requirement: AIRE subsite public positioning

The AIRE public subsite SHALL present AIRE as a desktop application for Taiwanese real estate agents that creates property disclosure documents while keeping case data on the local device.

#### Scenario: Public homepage loads with AIRE-specific positioning

- **WHEN** a visitor opens `GET https://aire.opcos.me/`
- **THEN** the page SHALL return HTTP 200
- **THEN** the first viewport SHALL show the AIRE name, the official AIRE icon, and Traditional Chinese copy describing AIRE as a real estate disclosure document desktop application
- **THEN** the first viewport SHALL NOT show generic SaaS dashboard metrics, unrelated AI assistant copy, or placeholder template text

#### Scenario: Local data boundary is visible

- **WHEN** a visitor reads the AIRE public homepage
- **THEN** the page SHALL state that case data and owner personal data stay in the AIRE desktop application local storage
- **THEN** the page SHALL state that OPCOS manages account, license, download, and update entry points

##### Example: accepted boundary copy

- **GIVEN** homepage copy contains "案件資料留在本機" and "OPCOS 管理帳號與授權"
- **WHEN** the copy regression test scans the rendered AIRE homepage
- **THEN** the test SHALL pass the local-data boundary assertion

### Requirement: AIRE subsite OPCOS account and license routing

The AIRE public subsite SHALL route account, registration, license, and product-management actions through OPCOS using HTTPS URLs that preserve the AIRE product context.

#### Scenario: Visitor starts from AIRE subsite

- **WHEN** a visitor clicks the primary start or login action on `https://aire.opcos.me/`
- **THEN** the browser SHALL navigate to an HTTPS URL on `opcos.me`
- **THEN** the URL SHALL preserve the AIRE product context through a redirect or product path
- **THEN** the URL SHALL NOT contain newline characters, stale OAuth error query parameters, or an unapproved host

#### Scenario: Authenticated user opens OPCOS AIRE product page

- **WHEN** an authenticated user opens `GET https://opcos.me/products/aire`
- **THEN** the page SHALL return HTTP 200
- **THEN** the page SHALL display AIRE product-management content rather than the generic OPCOS account homepage
- **THEN** actions that return to the public product site SHALL navigate to `https://aire.opcos.me/`

### Requirement: AIRE subsite official assets

The AIRE public subsite SHALL serve the official light and dark AIRE icon assets directly from public URLs.

#### Scenario: Dark icon asset is served

- **WHEN** a client requests `GET https://aire.opcos.me/aire-icon-dark.png`
- **THEN** the response SHALL return HTTP 200
- **THEN** the response SHALL be an image response and SHALL NOT be handled by a locale catch-all route

#### Scenario: Light icon asset is served

- **WHEN** a client requests `GET https://aire.opcos.me/aire-icon-light.png`
- **THEN** the response SHALL return HTTP 200
- **THEN** the response SHALL be an image response and SHALL NOT be handled by a locale catch-all route

### Requirement: AIRE subsite production smoke coverage

The AIRE public subsite SHALL have automated production smoke tests that verify deployed behavior after each handoff.

#### Scenario: Production smoke succeeds after deployment

- **WHEN** the production smoke suite runs against `https://aire.opcos.me` and `https://opcos.me`
- **THEN** it SHALL verify AIRE homepage HTTP 200 rendering
- **THEN** it SHALL verify official icon asset HTTP 200 responses
- **THEN** it SHALL verify OPCOS AIRE product routing and allowed login redirects
- **THEN** it SHALL fail if blocked template copy or broken CTA URLs are present
