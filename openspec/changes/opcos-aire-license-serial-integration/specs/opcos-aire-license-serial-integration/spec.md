## ADDED Requirements

### Requirement: OPCOS SHALL be the source of truth for AIRE serial keys

OPCOS SHALL be the only production source that creates, stores, displays, revokes, and verifies AIRE license serial keys. AIRE desktop SHALL NOT generate production serial keys locally.

#### Scenario: Admin creates AIRE serial key

- **WHEN** an OPCOS admin creates an AIRE license for an organization
- **THEN** OPCOS stores a license with `productId = "aire"`
- **AND** the serial key matches `AIRE-XXXX-XXXX-XXXX`
- **AND** the license has a plan id and max device count

#### Scenario: Upgrade request approval issues serial key

- **GIVEN** an authenticated user has a pending AIRE upgrade request
- **WHEN** an OPCOS admin approves the request
- **THEN** OPCOS creates an active AIRE license
- **AND** links the license back to the request
- **AND** the user can see the issued serial key from the OPCOS AIRE product page

### Requirement: AIRE desktop SHALL activate and verify OPCOS serial keys

AIRE desktop SHALL activate and verify license serial keys through OPCOS license API endpoints and SHALL persist only local activation state, device id, token, and last verification metadata.

#### Scenario: Desktop activation succeeds

- **GIVEN** OPCOS has an active AIRE serial key with available device quota
- **WHEN** the user enters the serial key in AIRE settings
- **THEN** AIRE sends `license_key`, `device_id`, `device_name`, and `os_version` to OPCOS
- **AND** OPCOS records a device activation
- **AND** AIRE shows active license status

#### Scenario: Desktop verification enforces device and IP

- **GIVEN** AIRE has previously activated a serial key on one device and IP
- **WHEN** AIRE verifies the license from the same device and IP
- **THEN** OPCOS returns active verification
- **WHEN** verification is attempted from a different device or blocked IP
- **THEN** AIRE shows a customer-readable revoked, device mismatch, or IP blocked state

### Requirement: AIRE settings SHALL separate local activation from OPCOS upgrade

AIRE settings SHALL present local serial activation separately from OPCOS plan upgrade. Upgrade actions SHALL route to OPCOS, while activation actions SHALL verify an already issued serial key.

#### Scenario: User without serial key sees acquisition path

- **WHEN** the user opens AIRE settings without an active license
- **THEN** the page shows a serial key input
- **AND** the page shows a CTA to open the OPCOS AIRE product page to request or view a serial key

##### Example: inactive local license

- **GIVEN** AIRE local license status is `not_activated`
- **WHEN** the user opens `/settings`
- **THEN** the page shows `輸入序號`
- **AND** the page shows `前往 OPCOS 取得序號`
- **AND** the OPCOS CTA opens `https://opcos.me/products/aire?intent=request-access`

#### Scenario: User with active license sees status

- **WHEN** the user opens AIRE settings after activation
- **THEN** the page shows active status, plan label, device id, and last verified time
- **AND** the page does not imply local payment is available

##### Example: active OPCOS license

- **GIVEN** AIRE local license status is `active`
- **AND** OPCOS verification returns `planId = "basic"` and `last_verified_at = "2026-05-22T08:00:00.000Z"`
- **WHEN** the user opens `/settings`
- **THEN** the page shows `授權已啟用`
- **AND** the page shows `基本款`
- **AND** the page shows the last verification time

### Requirement: Fake-data E2E tests SHALL start from a clean seeded state

AIRE and OPCOS E2E tests SHALL reset only fake test data before each run and SHALL NOT delete production, developer, or user-created data outside the test namespace.

#### Scenario: AIRE browser E2E clears mock store

- **WHEN** an AIRE browser E2E starts
- **THEN** it clears the AIRE mock store and localStorage keys used by the test
- **AND** seeds deterministic test accounts, cases, and serial state

#### Scenario: OPCOS license E2E uses test namespace

- **WHEN** an OPCOS license E2E starts
- **THEN** it creates or reuses a test organization and test user marked as test data
- **AND** it only cleans records created by the test namespace
- **AND** it never deletes unrelated production licenses or organizations
