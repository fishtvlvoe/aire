# license-server-admin-ui Specification

## Purpose

TBD - created by archiving change 'admin-ui-migration-to-license-server'. Update Purpose after archive.

## Requirements

### Requirement: Admin login page

The system SHALL serve a login page at `GET /admin/login` that prompts for a single password and submits credentials to the session API.

#### Scenario: unauthenticated visitor requests login page

- **WHEN** an unauthenticated browser navigates to `GET /admin/login`
- **THEN** the system returns HTTP 200 with an HTML page containing a password input and submit button
- **AND** no session cookie is set

#### Scenario: already authenticated visitor requests login page

- **WHEN** a browser carrying a valid `admin_session` cookie navigates to `GET /admin/login`
- **THEN** the system returns HTTP 200 with the login page
- **AND** the page SHALL auto-redirect the browser to `/admin/licenses` via client-side script


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
### Requirement: Admin licenses page lists licenses

The system SHALL serve `GET /admin/licenses` as the primary management view, displaying a paginated table of license records pulled from `GET /api/admin/licenses`.

#### Scenario: authenticated visitor opens the page

- **WHEN** a browser with a valid `admin_session` cookie requests `GET /admin/licenses`
- **THEN** the system returns HTTP 200 with the licenses HTML
- **AND** the page fetches `/api/admin/licenses?page=1&pageSize=20` with `credentials: 'same-origin'`
- **AND** renders the returned licenses in a table

#### Scenario: unauthenticated visitor opens the page

- **WHEN** a browser without a valid `admin_session` cookie requests `GET /admin/licenses`
- **THEN** the system returns HTTP 307 redirect to `/admin/login`

##### Example: pagination defaults

- **GIVEN** KV contains 50 license records
- **WHEN** the page first loads
- **THEN** the request is `GET /api/admin/licenses?page=1&pageSize=20`
- **AND** the response shows `{ items: [20 rows], total: 50, page: 1, pageSize: 20 }`


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
### Requirement: Admin UI calls admin proxy endpoints

The admin UI page MUST call only `/api/admin/licenses*` endpoints (never `/api/license/*` directly), and MUST NOT include an `Authorization` header in those requests.

#### Scenario: list licenses

- **WHEN** the page issues the list request
- **THEN** the URL is `/api/admin/licenses?page=<n>&pageSize=<n>&status=<status>&search=<query>`
- **AND** the request omits the `Authorization` header
- **AND** sets `credentials: 'same-origin'` so the session cookie is attached

#### Scenario: create license

- **WHEN** the user submits the create form with `count`, `expiresAt`, `issuedBy`, `features`
- **THEN** the page issues `POST /api/admin/licenses` with JSON body `{ count, expiresAt, issuedBy, features }`
- **AND** on HTTP 200 displays generated license keys in a list


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
### Requirement: Admin UI handles 401 by redirecting to login

When any admin proxy endpoint returns HTTP 401, the page MUST redirect the browser to `/admin/login` instead of displaying a permission error.

#### Scenario: session expires while browsing

- **GIVEN** the session cookie has expired
- **WHEN** the page calls `GET /api/admin/licenses`
- **AND** the response is HTTP 401
- **THEN** the page navigates the browser to `/admin/login`


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
### Requirement: Admin UI is responsive on mobile

The admin licenses page MUST be usable on viewports as narrow as 360 px without horizontal scrolling.

#### Scenario: mobile viewport renders card layout

- **WHEN** the page is rendered with viewport width less than 768 px
- **THEN** the licenses table is replaced with a stacked card layout where each card shows index, license key, status, contact name, company, email, and action buttons
- **AND** no horizontal scrollbar appears on the page body

##### Example: card layout breakpoint

| Viewport Width | Layout         | Notes                              |
| -------------- | -------------- | ---------------------------------- |
| 1280 px        | table          | desktop                            |
| 768 px         | table          | tablet boundary, table fits        |
| 767 px         | card           | mobile transition                  |
| 360 px         | card           | small phones, no horizontal scroll |


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
### Requirement: Admin UI provides license actions

The admin UI MUST provide UI controls for the following actions, each routed to the corresponding admin proxy endpoint:

| Action            | UI Control            | Endpoint                                      | HTTP Method |
| ----------------- | --------------------- | --------------------------------------------- | ----------- |
| Copy license key  | Copy icon button      | (clipboard, no API)                           | n/a         |
| Revoke            | Ban icon button       | `/api/admin/licenses/revoke`                  | POST        |
| Transfer          | Transfer icon button  | `/api/admin/licenses/transfer`                | POST        |
| Unbind machine    | Unlink icon button    | `/api/admin/licenses/unbind-machine`          | POST        |
| Update info       | Inline-edit cell      | `/api/admin/licenses/update-info`             | PATCH       |
| Create batch      | Top-right form        | `/api/admin/licenses`                         | POST        |
| Logout            | Top-right button      | `/api/admin/session`                          | DELETE      |

#### Scenario: revoke a license

- **WHEN** the user clicks the ban icon for a license row
- **THEN** the page opens a confirmation dialog asking for an optional reason
- **AND** on confirm, issues `POST /api/admin/licenses/revoke` with body `{ licenseKey, reason }`
- **AND** on HTTP 200 refreshes the list and shows a success toast

#### Scenario: logout

- **WHEN** the user clicks the logout button
- **THEN** the page issues `DELETE /api/admin/session`
- **AND** on HTTP 200 navigates to `/admin/login`

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