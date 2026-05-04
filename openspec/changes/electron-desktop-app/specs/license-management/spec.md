## ADDED Requirements

### Requirement: License verification moved to server-side

The license validation SHALL be performed by the remote server instead of local Ed25519 verification. The local middleware SHALL call the server API and act on the response.

#### Scenario: Middleware calls server for verification

- **WHEN** any HTTP request hits Next.js Middleware
- **THEN** middleware SHALL check cached verification result (valid for current session)
- **THEN** if no cached result, middleware SHALL call POST /api/license/verify on the license server

##### Example: First request in session

- **GIVEN** user opens the app and no cached verification exists
- **WHEN** browser requests GET /listings
- **THEN** middleware SHALL POST to https://license.vercel.app/api/license/verify with body { email: "agent@realty.com", license_key: "LIC-001", client_ip: "192.168.1.50" }
- **THEN** server returns 200 → middleware caches "valid" for the session and allows the request

#### Scenario: Server returns invalid

- **WHEN** server returns non-200 response for license verification
- **THEN** middleware SHALL redirect to a "授權失敗" page showing the error reason

### Requirement: License includes IP CIDR field

The license record SHALL include an allowed_cidr field that restricts which IP addresses can use the license.

#### Scenario: License with CIDR restriction

- **WHEN** a license is activated with allowed_cidr "192.168.1.0/24"
- **THEN** only requests from IPs within that CIDR range SHALL pass verification
