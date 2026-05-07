# license-serial-generator Specification

## Purpose

TBD - created by archiving change 'license-serial-generator-flow'. Update Purpose after archive.

## Requirements

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


<!-- @trace
source: license-serial-generator-flow
updated: 2026-05-07
code:
  - electron/launcher.ts
  - electron/preload.ts
  - license-server/lib/store.ts
  - .vercelignore
  - src/app/setup/admin/page.tsx
  - scripts/fix-standalone-symlinks.js
  - scripts/materialize-standalone-symlinks.js
  - src/app/api/admin/licenses/revoke/route.ts
  - electron/main.ts
  - scripts/generate-license.ts
  - src/lib/admin-auth.ts
  - license-server/api/license/list.ts
  - license-server/vercel.json
  - src/lib/codex-client/key-store.ts
  - src/app/admin/licenses/page.tsx
  - src/app/api/setup/verify-openai/route.ts
  - license-server/lib/machine-id.ts
  - license-server/api/license/revoke.ts
  - src/app/api/admin/licenses/route.ts
  - license-server/api/license/create.ts
  - electron/codex-guide.html
  - license-server/api/license/transfer.ts
  - src/app/api/setup/create-first-admin/route.ts
  - electron/updater.ts
  - .github/workflows/release.yml
  - license-server/lib/admin-auth.ts
  - license-server/lib/serial.ts
  - src/app/setup/codex/page.tsx
  - src/app/api/admin/licenses/update-info/route.ts
  - src/app/api/admin/licenses/transfer/route.ts
  - scripts/generate-icons.ts
  - license-server/api/license/activate.ts
  - src/lib/db/schema.ts
  - license-server/api/license/update-info.ts
  - license-server/api/features/index.ts
  - electron-builder.json
  - license-server/api/license/verify.ts
  - license-server/api/updates/check.ts
  - src/app/api/admin/licenses/unbind-machine/route.ts
  - src/app/setup/page.tsx
  - src/middleware.ts
  - package.json
  - vercel.json
tests:
  - license-server/api/license/__tests__/update-info.test.ts
  - license-server/api/license/__tests__/transfer.test.ts
  - license-server/lib/__tests__/serial.test.ts
  - src/app/api/setup/verify-openai/route.test.ts
  - license-server/api/license/__tests__/end-to-end-flow.test.ts
  - license-server/api/license/__tests__/create.test.ts
  - e2e/admin-licenses.spec.ts
  - license-server/api/license/__tests__/revoke.test.ts
  - scripts/generate-icons.test.ts
  - license-server/api/license/__tests__/list.test.ts
  - license-server/api/license/__tests__/activate-verify.test.ts
  - src/lib/codex-client/__tests__/key-store.test.ts
-->

---
### Requirement: Admin can list serial key inventory

The system SHALL provide an authenticated admin endpoint `GET /api/license/list` that returns serial inventory with pagination and status filter.

#### Scenario: List issued serial keys

- **WHEN** admin calls `GET /api/license/list?status=issued&page=1&pageSize=20` with valid admin token
- **THEN** server SHALL return HTTP 200 with `items`, `total`, `page`, `pageSize`
- **THEN** every returned item SHALL have `status = "issued"`

#### Scenario: List request uses invalid pagination

- **WHEN** admin calls `GET /api/license/list?page=0&pageSize=1000`
- **THEN** server SHALL return HTTP 400 with `{ "error": "invalid_pagination" }`


<!-- @trace
source: license-serial-generator-flow
updated: 2026-05-07
code:
  - electron/launcher.ts
  - electron/preload.ts
  - license-server/lib/store.ts
  - .vercelignore
  - src/app/setup/admin/page.tsx
  - scripts/fix-standalone-symlinks.js
  - scripts/materialize-standalone-symlinks.js
  - src/app/api/admin/licenses/revoke/route.ts
  - electron/main.ts
  - scripts/generate-license.ts
  - src/lib/admin-auth.ts
  - license-server/api/license/list.ts
  - license-server/vercel.json
  - src/lib/codex-client/key-store.ts
  - src/app/admin/licenses/page.tsx
  - src/app/api/setup/verify-openai/route.ts
  - license-server/lib/machine-id.ts
  - license-server/api/license/revoke.ts
  - src/app/api/admin/licenses/route.ts
  - license-server/api/license/create.ts
  - electron/codex-guide.html
  - license-server/api/license/transfer.ts
  - src/app/api/setup/create-first-admin/route.ts
  - electron/updater.ts
  - .github/workflows/release.yml
  - license-server/lib/admin-auth.ts
  - license-server/lib/serial.ts
  - src/app/setup/codex/page.tsx
  - src/app/api/admin/licenses/update-info/route.ts
  - src/app/api/admin/licenses/transfer/route.ts
  - scripts/generate-icons.ts
  - license-server/api/license/activate.ts
  - src/lib/db/schema.ts
  - license-server/api/license/update-info.ts
  - license-server/api/features/index.ts
  - electron-builder.json
  - license-server/api/license/verify.ts
  - license-server/api/updates/check.ts
  - src/app/api/admin/licenses/unbind-machine/route.ts
  - src/app/setup/page.tsx
  - src/middleware.ts
  - package.json
  - vercel.json
tests:
  - license-server/api/license/__tests__/update-info.test.ts
  - license-server/api/license/__tests__/transfer.test.ts
  - license-server/lib/__tests__/serial.test.ts
  - src/app/api/setup/verify-openai/route.test.ts
  - license-server/api/license/__tests__/end-to-end-flow.test.ts
  - license-server/api/license/__tests__/create.test.ts
  - e2e/admin-licenses.spec.ts
  - license-server/api/license/__tests__/revoke.test.ts
  - scripts/generate-icons.test.ts
  - license-server/api/license/__tests__/list.test.ts
  - license-server/api/license/__tests__/activate-verify.test.ts
  - src/lib/codex-client/__tests__/key-store.test.ts
-->

---
### Requirement: Admin can revoke serial keys

The system SHALL provide an authenticated admin endpoint `POST /api/license/revoke` to revoke issued or activated serial keys.

#### Scenario: Revoke an issued serial key

- **WHEN** admin calls `POST /api/license/revoke` with body `{ "licenseKey": "THREE-ABCD-EFGH-IJKL", "reason": "customer-cancelled" }`
- **THEN** server SHALL return HTTP 200 with `{ "ok": true, "status": "revoked" }`
- **THEN** record SHALL contain `revokedAt` and `revokedReason`

#### Scenario: Revoke request for missing key

- **WHEN** admin calls `POST /api/license/revoke` with unknown `licenseKey`
- **THEN** server SHALL return HTTP 404 with `{ "error": "license_not_found" }`

<!-- @trace
source: license-serial-generator-flow
updated: 2026-05-07
code:
  - electron/launcher.ts
  - electron/preload.ts
  - license-server/lib/store.ts
  - .vercelignore
  - src/app/setup/admin/page.tsx
  - scripts/fix-standalone-symlinks.js
  - scripts/materialize-standalone-symlinks.js
  - src/app/api/admin/licenses/revoke/route.ts
  - electron/main.ts
  - scripts/generate-license.ts
  - src/lib/admin-auth.ts
  - license-server/api/license/list.ts
  - license-server/vercel.json
  - src/lib/codex-client/key-store.ts
  - src/app/admin/licenses/page.tsx
  - src/app/api/setup/verify-openai/route.ts
  - license-server/lib/machine-id.ts
  - license-server/api/license/revoke.ts
  - src/app/api/admin/licenses/route.ts
  - license-server/api/license/create.ts
  - electron/codex-guide.html
  - license-server/api/license/transfer.ts
  - src/app/api/setup/create-first-admin/route.ts
  - electron/updater.ts
  - .github/workflows/release.yml
  - license-server/lib/admin-auth.ts
  - license-server/lib/serial.ts
  - src/app/setup/codex/page.tsx
  - src/app/api/admin/licenses/update-info/route.ts
  - src/app/api/admin/licenses/transfer/route.ts
  - scripts/generate-icons.ts
  - license-server/api/license/activate.ts
  - src/lib/db/schema.ts
  - license-server/api/license/update-info.ts
  - license-server/api/features/index.ts
  - electron-builder.json
  - license-server/api/license/verify.ts
  - license-server/api/updates/check.ts
  - src/app/api/admin/licenses/unbind-machine/route.ts
  - src/app/setup/page.tsx
  - src/middleware.ts
  - package.json
  - vercel.json
tests:
  - license-server/api/license/__tests__/update-info.test.ts
  - license-server/api/license/__tests__/transfer.test.ts
  - license-server/lib/__tests__/serial.test.ts
  - src/app/api/setup/verify-openai/route.test.ts
  - license-server/api/license/__tests__/end-to-end-flow.test.ts
  - license-server/api/license/__tests__/create.test.ts
  - e2e/admin-licenses.spec.ts
  - license-server/api/license/__tests__/revoke.test.ts
  - scripts/generate-icons.test.ts
  - license-server/api/license/__tests__/list.test.ts
  - license-server/api/license/__tests__/activate-verify.test.ts
  - src/lib/codex-client/__tests__/key-store.test.ts
-->