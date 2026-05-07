# admin-session-auth Specification

## Purpose

TBD - created by archiving change 'admin-ui-migration-to-license-server'. Update Purpose after archive.

## Requirements

### Requirement: Password verification with bcrypt

The system SHALL verify the admin password using `bcrypt.compare()` against the hash stored in environment variable `LICENSE_ADMIN_PASSWORD`. The plaintext password MUST NOT be stored or logged.

#### Scenario: correct password is accepted

- **GIVEN** `LICENSE_ADMIN_PASSWORD` contains a bcrypt hash of password `"correct-password"`
- **WHEN** a client sends `POST /api/admin/session` with body `{ "password": "correct-password" }`
- **THEN** the system returns HTTP 200 with body `{ "ok": true }`
- **AND** sets `Set-Cookie: admin_session=<token>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=43200`

#### Scenario: incorrect password is rejected

- **WHEN** a client sends `POST /api/admin/session` with body `{ "password": "wrong-password" }`
- **THEN** the system returns HTTP 401 with body `{ "error": "invalid_password" }`
- **AND** does not set a cookie

#### Scenario: missing env var fails closed

- **GIVEN** `LICENSE_ADMIN_PASSWORD` is unset or empty
- **WHEN** a client sends `POST /api/admin/session` with any password
- **THEN** the system returns HTTP 503 with body `{ "error": "admin_not_configured" }`


<!-- @trace
source: admin-ui-migration-to-license-server
updated: 2026-05-07
code:
  - license-server/vercel.json
  - license-server/next.config.mjs
  - license-server/app/api/license/create/route.ts
  - license-server/app/api/features/route.ts
  - license-server/app/api/updates/check/route.ts
  - license-server/lib/admin-auth.ts
  - license-server/app/api/admin/licenses/unbind-machine/route.ts
  - license-server/package.json
  - license-server/app/api/license/revoke/route.ts
  - license-server/app/admin/login/page.tsx
  - license-server/app/api/license/list/route.ts
  - .open-design/scanner-cache.json
  - license-server/scripts/smoke-admin.sh
  - license-server/middleware.ts
  - license-server/app/admin/licenses/page.tsx
  - license-server/app/api/license/verify/route.ts
  - license-server/app/api/admin/licenses/route.ts
  - license-server/lib/store.ts
  - license-server/app/globals.css
  - license-server/app/api/license/activate/route.ts
  - license-server/app/layout.tsx
  - license-server/app/api/license/update-info/route.ts
  - license-server/app/api/admin/licenses/transfer/route.ts
  - license-server/app/api/admin/licenses/update-info/route.ts
  - license-server/.vercelignore
  - license-server/lib/admin-session-edge.ts
  - license-server/app/api/admin/session/route.ts
  - license-server/app/api/license/transfer/route.ts
  - license-server/lib/admin-session.ts
  - license-server/app/api/admin/licenses/revoke/route.ts
  - license-server/tsconfig.json
tests:
  - license-server/app/api/admin/session/__tests__/route.test.ts
  - license-server/lib/__tests__/admin-session.test.ts
  - license-server/app/api/admin/licenses/__tests__/route.test.ts
-->

---
### Requirement: Session token format

The session token MUST be `<base64url(payload)>.<base64url(signature)>` where payload is JSON `{ "sub": "admin", "iat": <epoch_seconds>, "exp": <iat + 43200> }` and signature is HMAC-SHA256 of the payload base64url string using `ADMIN_SESSION_SECRET`.

#### Scenario: token is signed deterministically

- **GIVEN** `ADMIN_SESSION_SECRET = "test-secret"`
- **AND** the system generates a token at `iat=1700000000`
- **WHEN** the same payload is signed twice
- **THEN** both tokens have identical signature segments

##### Example: token shape

- **GIVEN** payload = `{"sub":"admin","iat":1700000000,"exp":1700043200}`
- **AND** secret = `"test-secret"`
- **WHEN** the token is generated
- **THEN** the token has the form `<27-char-payload>.<43-char-signature>` (lengths approximate, base64url without padding)


<!-- @trace
source: admin-ui-migration-to-license-server
updated: 2026-05-07
code:
  - license-server/vercel.json
  - license-server/next.config.mjs
  - license-server/app/api/license/create/route.ts
  - license-server/app/api/features/route.ts
  - license-server/app/api/updates/check/route.ts
  - license-server/lib/admin-auth.ts
  - license-server/app/api/admin/licenses/unbind-machine/route.ts
  - license-server/package.json
  - license-server/app/api/license/revoke/route.ts
  - license-server/app/admin/login/page.tsx
  - license-server/app/api/license/list/route.ts
  - .open-design/scanner-cache.json
  - license-server/scripts/smoke-admin.sh
  - license-server/middleware.ts
  - license-server/app/admin/licenses/page.tsx
  - license-server/app/api/license/verify/route.ts
  - license-server/app/api/admin/licenses/route.ts
  - license-server/lib/store.ts
  - license-server/app/globals.css
  - license-server/app/api/license/activate/route.ts
  - license-server/app/layout.tsx
  - license-server/app/api/license/update-info/route.ts
  - license-server/app/api/admin/licenses/transfer/route.ts
  - license-server/app/api/admin/licenses/update-info/route.ts
  - license-server/.vercelignore
  - license-server/lib/admin-session-edge.ts
  - license-server/app/api/admin/session/route.ts
  - license-server/app/api/license/transfer/route.ts
  - license-server/lib/admin-session.ts
  - license-server/app/api/admin/licenses/revoke/route.ts
  - license-server/tsconfig.json
tests:
  - license-server/app/api/admin/session/__tests__/route.test.ts
  - license-server/lib/__tests__/admin-session.test.ts
  - license-server/app/api/admin/licenses/__tests__/route.test.ts
-->

---
### Requirement: Session validation on every protected request

The middleware MUST validate the `admin_session` cookie on every request to paths matching `/admin/*` (excluding `/admin/login`) and `/api/admin/*` (excluding `POST /api/admin/session`).

#### Scenario: valid token grants access

- **WHEN** a request to `/admin/licenses` carries a valid, non-expired `admin_session` cookie
- **THEN** the middleware passes the request through to the handler

#### Scenario: invalid signature is rejected

- **WHEN** a request carries `admin_session=tampered.token`
- **AND** the signature does not match HMAC-SHA256 of the payload using `ADMIN_SESSION_SECRET`
- **THEN** the middleware returns HTTP 307 redirect to `/admin/login` for `/admin/*` paths
- **AND** returns HTTP 401 JSON `{ "error": "unauthorized" }` for `/api/admin/*` paths

#### Scenario: expired token is rejected

- **GIVEN** the token's `exp` field is less than current epoch seconds
- **WHEN** a request carries this token
- **THEN** the middleware treats it as unauthorized using the same redirect/401 behavior as invalid signature

##### Example: protected path matrix

| Path                              | No Cookie               | Invalid Cookie          | Valid Cookie  |
| --------------------------------- | ----------------------- | ----------------------- | ------------- |
| `/admin/login`                    | 200                     | 200                     | 200           |
| `/admin/licenses`                 | 307 → `/admin/login`    | 307 → `/admin/login`    | 200           |
| `POST /api/admin/session`         | 200/401 (depends on pw) | 200/401 (depends on pw) | 200           |
| `GET /api/admin/licenses`         | 401 JSON                | 401 JSON                | 200           |
| `DELETE /api/admin/session`       | 401 JSON                | 401 JSON                | 200 + clear   |


<!-- @trace
source: admin-ui-migration-to-license-server
updated: 2026-05-07
code:
  - license-server/vercel.json
  - license-server/next.config.mjs
  - license-server/app/api/license/create/route.ts
  - license-server/app/api/features/route.ts
  - license-server/app/api/updates/check/route.ts
  - license-server/lib/admin-auth.ts
  - license-server/app/api/admin/licenses/unbind-machine/route.ts
  - license-server/package.json
  - license-server/app/api/license/revoke/route.ts
  - license-server/app/admin/login/page.tsx
  - license-server/app/api/license/list/route.ts
  - .open-design/scanner-cache.json
  - license-server/scripts/smoke-admin.sh
  - license-server/middleware.ts
  - license-server/app/admin/licenses/page.tsx
  - license-server/app/api/license/verify/route.ts
  - license-server/app/api/admin/licenses/route.ts
  - license-server/lib/store.ts
  - license-server/app/globals.css
  - license-server/app/api/license/activate/route.ts
  - license-server/app/layout.tsx
  - license-server/app/api/license/update-info/route.ts
  - license-server/app/api/admin/licenses/transfer/route.ts
  - license-server/app/api/admin/licenses/update-info/route.ts
  - license-server/.vercelignore
  - license-server/lib/admin-session-edge.ts
  - license-server/app/api/admin/session/route.ts
  - license-server/app/api/license/transfer/route.ts
  - license-server/lib/admin-session.ts
  - license-server/app/api/admin/licenses/revoke/route.ts
  - license-server/tsconfig.json
tests:
  - license-server/app/api/admin/session/__tests__/route.test.ts
  - license-server/lib/__tests__/admin-session.test.ts
  - license-server/app/api/admin/licenses/__tests__/route.test.ts
-->

---
### Requirement: Logout clears the session cookie

The system SHALL provide `DELETE /api/admin/session` that returns HTTP 200 and sets a `Set-Cookie` header that clears the `admin_session` cookie.

#### Scenario: logout removes the cookie

- **WHEN** a client sends `DELETE /api/admin/session` with a valid cookie
- **THEN** the system returns HTTP 200 with body `{ "ok": true }`
- **AND** sets `Set-Cookie: admin_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`


<!-- @trace
source: admin-ui-migration-to-license-server
updated: 2026-05-07
code:
  - license-server/vercel.json
  - license-server/next.config.mjs
  - license-server/app/api/license/create/route.ts
  - license-server/app/api/features/route.ts
  - license-server/app/api/updates/check/route.ts
  - license-server/lib/admin-auth.ts
  - license-server/app/api/admin/licenses/unbind-machine/route.ts
  - license-server/package.json
  - license-server/app/api/license/revoke/route.ts
  - license-server/app/admin/login/page.tsx
  - license-server/app/api/license/list/route.ts
  - .open-design/scanner-cache.json
  - license-server/scripts/smoke-admin.sh
  - license-server/middleware.ts
  - license-server/app/admin/licenses/page.tsx
  - license-server/app/api/license/verify/route.ts
  - license-server/app/api/admin/licenses/route.ts
  - license-server/lib/store.ts
  - license-server/app/globals.css
  - license-server/app/api/license/activate/route.ts
  - license-server/app/layout.tsx
  - license-server/app/api/license/update-info/route.ts
  - license-server/app/api/admin/licenses/transfer/route.ts
  - license-server/app/api/admin/licenses/update-info/route.ts
  - license-server/.vercelignore
  - license-server/lib/admin-session-edge.ts
  - license-server/app/api/admin/session/route.ts
  - license-server/app/api/license/transfer/route.ts
  - license-server/lib/admin-session.ts
  - license-server/app/api/admin/licenses/revoke/route.ts
  - license-server/tsconfig.json
tests:
  - license-server/app/api/admin/session/__tests__/route.test.ts
  - license-server/lib/__tests__/admin-session.test.ts
  - license-server/app/api/admin/licenses/__tests__/route.test.ts
-->

---
### Requirement: Boundary handling

The session module MUST treat the following boundary conditions as authentication failures (not server errors):

| Input                                  | Treatment            |
| -------------------------------------- | -------------------- |
| Cookie value is empty string           | unauthorized         |
| Cookie value missing the `.` separator | unauthorized         |
| Payload is not valid JSON              | unauthorized         |
| Payload missing `exp` field            | unauthorized         |
| `iat` greater than current time + 60s  | unauthorized (clock skew protection) |
| Signature length not 43 chars (base64url of 32 bytes)         | unauthorized         |

#### Scenario: malformed cookie is rejected without 500

- **WHEN** a request carries `admin_session=garbage`
- **THEN** the middleware returns 307/401 (per protected-path rules) and does not return HTTP 500

<!-- @trace
source: admin-ui-migration-to-license-server
updated: 2026-05-07
code:
  - license-server/vercel.json
  - license-server/next.config.mjs
  - license-server/app/api/license/create/route.ts
  - license-server/app/api/features/route.ts
  - license-server/app/api/updates/check/route.ts
  - license-server/lib/admin-auth.ts
  - license-server/app/api/admin/licenses/unbind-machine/route.ts
  - license-server/package.json
  - license-server/app/api/license/revoke/route.ts
  - license-server/app/admin/login/page.tsx
  - license-server/app/api/license/list/route.ts
  - .open-design/scanner-cache.json
  - license-server/scripts/smoke-admin.sh
  - license-server/middleware.ts
  - license-server/app/admin/licenses/page.tsx
  - license-server/app/api/license/verify/route.ts
  - license-server/app/api/admin/licenses/route.ts
  - license-server/lib/store.ts
  - license-server/app/globals.css
  - license-server/app/api/license/activate/route.ts
  - license-server/app/layout.tsx
  - license-server/app/api/license/update-info/route.ts
  - license-server/app/api/admin/licenses/transfer/route.ts
  - license-server/app/api/admin/licenses/update-info/route.ts
  - license-server/.vercelignore
  - license-server/lib/admin-session-edge.ts
  - license-server/app/api/admin/session/route.ts
  - license-server/app/api/license/transfer/route.ts
  - license-server/lib/admin-session.ts
  - license-server/app/api/admin/licenses/revoke/route.ts
  - license-server/tsconfig.json
tests:
  - license-server/app/api/admin/session/__tests__/route.test.ts
  - license-server/lib/__tests__/admin-session.test.ts
  - license-server/app/api/admin/licenses/__tests__/route.test.ts
-->