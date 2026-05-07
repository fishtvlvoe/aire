## ADDED Requirements

### Requirement: Admin proxy list endpoint

The system SHALL provide `GET /api/admin/licenses` that returns the same payload shape as `GET /api/license/list` but accepts authentication via the `admin_session` cookie instead of `Authorization: Bearer`. Authorization is enforced by middleware; the route handler itself MUST NOT inspect any `Authorization` header.

#### Scenario: list licenses with cookie session

- **GIVEN** the request carries a valid `admin_session` cookie
- **WHEN** a client sends `GET /api/admin/licenses?page=1&pageSize=20`
- **THEN** the system returns HTTP 200 with body `{ items: [...], total: <n>, page: 1, pageSize: 20 }`
- **AND** each item includes fields `index`, `licenseKey`, `status`, `email`, `contactName`, `company`, `machineId`, `createdAt`, `activatedAt`, `expiresAt`, `features`

#### Scenario: pagination boundary

- **WHEN** the client requests `pageSize=0` or `pageSize=101`
- **THEN** the system returns HTTP 400 with body `{ "error": "invalid_pagination" }`

##### Example: query parameter validation

| Query                          | Status | Body                                  |
| ------------------------------ | ------ | ------------------------------------- |
| `page=1&pageSize=20`           | 200    | normal listing                        |
| `page=0&pageSize=20`           | 400    | `{"error":"invalid_pagination"}`      |
| `page=1&pageSize=101`          | 400    | `{"error":"invalid_pagination"}`      |
| `status=invalid`               | 400    | `{"error":"invalid_status"}`          |
| `search=fish&page=1&pageSize=20` | 200  | filtered by haystack match            |

### Requirement: Admin proxy create endpoint

The system SHALL provide `POST /api/admin/licenses` that accepts JSON body `{ count, expiresAt, issuedBy, features }` and returns the generated license keys.

#### Scenario: create batch of licenses

- **GIVEN** the request carries a valid `admin_session` cookie
- **WHEN** a client sends `POST /api/admin/licenses` with body `{ "count": 3, "expiresAt": null, "issuedBy": "fish", "features": ["disclosure-document"] }`
- **THEN** the system returns HTTP 200 with body `{ "items": [{licenseKey, status:"issued", createdAt, expiresAt, features}, ...] }` containing exactly 3 items
- **AND** each `licenseKey` is unique and persisted to KV

#### Scenario: count boundary

- **WHEN** `count` is less than 1 or greater than 100
- **THEN** the system returns HTTP 400 with body `{ "error": "invalid_count" }`

### Requirement: Admin proxy revoke endpoint

The system SHALL provide `POST /api/admin/licenses/revoke` that accepts JSON body `{ licenseKey, reason }` and marks the license as revoked.

#### Scenario: revoke an active license

- **WHEN** a client sends `POST /api/admin/licenses/revoke` with body `{ "licenseKey": "ABCD-1234", "reason": "client churn" }`
- **AND** the license exists with status `activated`
- **THEN** the system returns HTTP 200 with body `{ "ok": true }`
- **AND** the KV record's status becomes `revoked` with `revokedAt` set to current ISO timestamp and `revokedReason` set to `"client churn"`

#### Scenario: revoke unknown license

- **WHEN** a client sends `POST /api/admin/licenses/revoke` with `{ "licenseKey": "UNKNOWN" }`
- **THEN** the system returns HTTP 404 with body `{ "error": "not_found" }`

### Requirement: Admin proxy transfer endpoint

The system SHALL provide `POST /api/admin/licenses/transfer` that revokes the source license and issues a new license bound to a new contact, atomically.

#### Scenario: transfer to new company

- **WHEN** a client sends `POST /api/admin/licenses/transfer` with body `{ "licenseKey": "OLD-1234", "newContactName": "Mary", "newCompany": "Acme Inc.", "newEmail": "mary@acme.com", "reason": "company sold" }`
- **THEN** the system returns HTTP 200 with body `{ "ok": true, "newLicenseKey": "NEW-5678" }`
- **AND** the old license has status `revoked`
- **AND** a new license record is created with status `issued` and the supplied contact info

### Requirement: Admin proxy update-info endpoint

The system SHALL provide `PATCH /api/admin/licenses/update-info` that updates `contactName`, `company`, or `email` on an existing license.

#### Scenario: update contact name

- **WHEN** a client sends `PATCH /api/admin/licenses/update-info` with body `{ "licenseKey": "ABCD-1234", "field": "contactName", "value": "John" }`
- **AND** `field` is one of `contactName`, `company`, `email`
- **THEN** the system returns HTTP 200 with the updated license record
- **AND** the KV record reflects the change

#### Scenario: invalid field is rejected

- **WHEN** the request body contains `{ "field": "machineId" }`
- **THEN** the system returns HTTP 400 with body `{ "error": "invalid_field" }`

### Requirement: Admin proxy unbind-machine endpoint

The system SHALL provide `POST /api/admin/licenses/unbind-machine` that clears the `machineId` field on a license, allowing reactivation on a different machine.

#### Scenario: unbind machine id

- **WHEN** a client sends `POST /api/admin/licenses/unbind-machine` with body `{ "licenseKey": "ABCD-1234" }`
- **AND** the license has a non-null `machineId`
- **THEN** the system returns HTTP 200 with body `{ "ok": true }`
- **AND** the KV record's `machineId` becomes `null`

### Requirement: Existing client API endpoints remain unchanged

All endpoints under `/api/license/*` (`activate`, `verify`, `list`, `create`, `revoke`, `transfer`, `update-info`) MUST continue to authenticate via `Authorization: Bearer <LICENSE_ADMIN_TOKEN>` and MUST NOT require the `admin_session` cookie.

#### Scenario: client app verify still works

- **WHEN** the Electron client sends `POST /api/license/verify` with body `{ "licenseKey": "ABCD-1234", "machineId": "<sha256>" }` and no cookie
- **THEN** the system returns HTTP 200 with the verification result
- **AND** the request flow does not invoke the admin session middleware

#### Scenario: bearer-protected admin endpoint still works

- **WHEN** a CLI tool sends `GET /api/license/list?page=1&pageSize=20` with header `Authorization: Bearer <correct-token>`
- **THEN** the system returns HTTP 200 with the licenses payload
- **AND** the request does not require an `admin_session` cookie

### Requirement: Vercel rewrite changes preserve legacy paths

The Vercel rewrite configuration MUST continue to route the following legacy short paths to the original `api/*.ts` handlers:

| Source             | Destination               |
| ------------------ | ------------------------- |
| `/license/:path*`  | `/api/license/:path*`     |
| `/features/:path*` | `/api/features/:path*`    |
| `/updates/:path*`  | `/api/updates/:path*`     |

The catch-all rewrite `"/(.*)" → "/api/$1"` MUST be removed so that Next.js App Router can serve `/admin/*` and `/api/admin/*` natively.

#### Scenario: legacy path still resolves

- **WHEN** a client sends `GET /license/list?page=1&pageSize=20` with `Authorization: Bearer <token>`
- **THEN** the system returns HTTP 200 with the same payload as `GET /api/license/list`

#### Scenario: admin path is not rewritten

- **WHEN** a browser requests `GET /admin/licenses`
- **THEN** the system serves the Next.js page (HTTP 200 or 307 to login depending on session)
- **AND** the request does not match any rewrite rule
