## ADDED Requirements

### Requirement: Admin can pre-create serial keys

The system SHALL provide an authenticated admin endpoint `POST /api/license/create` that creates pre-issued serial keys before customer activation.

#### Scenario: Create one serial key successfully

- **WHEN** admin calls `POST /api/license/create` with valid `Authorization` token and body `{ "count": 1, "expiresAt": "2026-12-31T15:59:59.000Z", "features": ["disclosure-document"] }`
- **THEN** server SHALL return HTTP 201 with one generated serial key and `status: "issued"`

##### Example: single create response

- **GIVEN** `LICENSE_ADMIN_TOKEN` is configured and request token is valid
- **WHEN** count is `1`
- **THEN** response body contains `items` with length `1` and each item contains `licenseKey`, `status`, `createdAt`, `expiresAt`

#### Scenario: Reject unauthenticated create request

- **WHEN** request to `POST /api/license/create` has no valid admin token
- **THEN** server SHALL return HTTP 401 with `{ "error": "unauthorized" }`

#### Scenario: Reject invalid create payload

- **WHEN** request body has `count` less than `1` or greater than `500`
- **THEN** server SHALL return HTTP 400 with `{ "error": "invalid_count" }`

### Requirement: Admin can list serial key inventory

The system SHALL provide an authenticated admin endpoint `GET /api/license/list` that returns serial inventory with pagination and status filter.

#### Scenario: List issued serial keys

- **WHEN** admin calls `GET /api/license/list?status=issued&page=1&pageSize=20` with valid admin token
- **THEN** server SHALL return HTTP 200 with `items`, `total`, `page`, `pageSize`
- **THEN** every returned item SHALL have `status = "issued"`

#### Scenario: List request uses invalid pagination

- **WHEN** admin calls `GET /api/license/list?page=0&pageSize=1000`
- **THEN** server SHALL return HTTP 400 with `{ "error": "invalid_pagination" }`

### Requirement: Admin can revoke serial keys

The system SHALL provide an authenticated admin endpoint `POST /api/license/revoke` to revoke issued or activated serial keys.

#### Scenario: Revoke an issued serial key

- **WHEN** admin calls `POST /api/license/revoke` with body `{ "licenseKey": "THREE-ABCD-EFGH-IJKL", "reason": "customer-cancelled" }`
- **THEN** server SHALL return HTTP 200 with `{ "ok": true, "status": "revoked" }`
- **THEN** record SHALL contain `revokedAt` and `revokedReason`

#### Scenario: Revoke request for missing key

- **WHEN** admin calls `POST /api/license/revoke` with unknown `licenseKey`
- **THEN** server SHALL return HTTP 404 with `{ "error": "license_not_found" }`
