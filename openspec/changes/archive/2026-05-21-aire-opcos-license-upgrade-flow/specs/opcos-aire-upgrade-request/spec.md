## ADDED Requirements

### Requirement: Authenticated users can request AIRE upgrade

OPCOS SHALL allow an authenticated user without an active AIRE license to create an AIRE upgrade request for the user's current organization and SHALL persist the request with `productId = "aire"`, `planId = "vip"`, and `status = "PENDING"`.

#### Scenario: Create pending upgrade request

- **WHEN** an authenticated user sends POST `/api/aire/upgrade-request` with an active organization and no active AIRE license
- **THEN** the system returns HTTP 200 with `{ "status": "PENDING", "productId": "aire", "planId": "vip" }`
- **THEN** the database contains one pending AIRE upgrade request for that user and organization

#### Scenario: Duplicate pending request is reused

- **WHEN** an authenticated user sends POST `/api/aire/upgrade-request` twice for the same organization, product, and plan before admin decision
- **THEN** the second response returns HTTP 200 with the same request id
- **THEN** the database contains one pending request for that user, organization, product, and plan

#### Scenario: Active license skips request creation

- **WHEN** an authenticated user with an active AIRE license sends POST `/api/aire/upgrade-request`
- **THEN** the system returns HTTP 200 with `{ "status": "FULFILLED" }`
- **THEN** the system SHALL NOT create a new pending request

#### Scenario: Missing organization is rejected

- **WHEN** an authenticated user with no active organization and no organization membership sends POST `/api/aire/upgrade-request`
- **THEN** the system returns HTTP 400 with `{ "error": "organization_required" }`

### Requirement: AIRE product page displays upgrade request state

The OPCOS AIRE product page SHALL display license and upgrade states from backend data and SHALL NOT expose the installer direct link or license key until an active AIRE license exists.

#### Scenario: No request and no license

- **WHEN** an authenticated user without an AIRE license opens GET `/products/aire`
- **THEN** the page displays `尚未開通 AIRE`
- **THEN** the page displays an enabled `申請升級或 VIP 測試` action
- **THEN** the page SHALL NOT display the restricted installer direct link

#### Scenario: Pending request

- **WHEN** an authenticated user with a pending AIRE upgrade request opens GET `/products/aire`
- **THEN** the page displays `審核中`
- **THEN** the page SHALL NOT display the restricted installer direct link

#### Scenario: Fulfilled request or active license

- **WHEN** an authenticated user with an active AIRE license opens GET `/products/aire`
- **THEN** the page displays `已開通`
- **THEN** the page displays a masked AIRE license key
- **THEN** the page displays the Mac installer download action

#### Scenario: Rejected request

- **WHEN** an authenticated user with the latest AIRE upgrade request status `REJECTED` opens GET `/products/aire`
- **THEN** the page displays `申請未通過`
- **THEN** the page displays an enabled `重新申請` action
