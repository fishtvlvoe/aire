## MODIFIED Requirements

### Requirement: Middleware license cache
The system SHALL check license validity in Next.js middleware on every HTTP request. The middleware SHALL use getCachedLicense() from src/lib/license/server-verify.ts which caches the server response for 24 hours locally. When the cache is expired or missing, the middleware SHALL call the License Server API. When the license is invalid or expired, the middleware SHALL redirect to /setup. The middleware SHALL execute license checks before auth checks.

#### Scenario: Valid cached license
- **WHEN** a request arrives and getCachedLicense() returns a valid, non-expired license
- **THEN** the middleware SHALL pass the request to the auth layer without calling the License Server API

##### Example: Cached license hit
- **GIVEN** license LIC-001 was verified 2 hours ago (within 24h TTL) and stored in local cache
- **WHEN** GET /listings is requested
- **THEN** getCachedLicense() returns cached {valid: true, expires: "2027-12-31"} without HTTP call
- **THEN** middleware proceeds to auth layer

#### Scenario: Expired cache triggers server call
- **WHEN** a request arrives and the local cache is older than 24 hours
- **THEN** the middleware SHALL call the License Server API to re-validate
- **THEN** the middleware SHALL update the local cache with the response

#### Scenario: Invalid license redirects to setup
- **WHEN** the License Server returns invalid or the license has expired
- **THEN** the middleware SHALL redirect the user to /setup with HTTP 302

#### Scenario: Exempt paths bypass license check
- **WHEN** the request path matches /setup/*, /api/setup/*, /_next/*, or /favicon.ico
- **THEN** the middleware SHALL skip the license check entirely

##### Example: Setup page accessible without license
- **GIVEN** no license has been activated yet
- **WHEN** GET /setup is requested
- **THEN** middleware skips license check, setup page renders for first-time activation
