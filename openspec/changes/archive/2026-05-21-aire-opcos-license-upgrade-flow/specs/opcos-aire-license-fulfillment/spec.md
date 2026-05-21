## ADDED Requirements

### Requirement: Admin can list pending AIRE upgrade requests

OPCOS admin license management SHALL display pending AIRE upgrade requests with requester email, organization name, product id, plan id, requested timestamp, and available fulfillment actions.

#### Scenario: Pending requests are visible to admin

- **WHEN** an admin opens GET `/admin/licenses` or the AIRE requests section under license administration
- **THEN** the page displays every `PENDING` AIRE upgrade request ordered by `requestedAt` ascending
- **THEN** each row displays requester email, organization name, `aire`, `vip`, and zh-TW formatted request date

#### Scenario: Non-admin cannot list requests

- **WHEN** a non-admin user calls the admin AIRE upgrade request list API
- **THEN** the system returns HTTP 403

### Requirement: Admin approval fulfills AIRE upgrade request

OPCOS admin fulfillment SHALL create a real AIRE license for the request organization and atomically mark the request as fulfilled.

#### Scenario: Approve pending request

- **WHEN** an admin sends POST `/api/admin/aire-upgrade-requests/{requestId}/approve` with `{ "maxDevices": 1 }` for a `PENDING` request
- **THEN** the system creates a `License` with `productId = "aire"`, `planId = "vip"`, `status = "ACTIVE"`, and `maxDevices = 1`
- **THEN** the system sets the request status to `FULFILLED`, links `licenseId`, and stores `decidedAt` and `decidedByUserId`
- **THEN** the response returns HTTP 200 with the new masked license metadata and the full key only for the immediate admin response

#### Scenario: Reject pending request

- **WHEN** an admin sends POST `/api/admin/aire-upgrade-requests/{requestId}/reject` for a `PENDING` request
- **THEN** the system sets the request status to `REJECTED`
- **THEN** the system stores `decidedAt` and `decidedByUserId`
- **THEN** the system SHALL NOT create a license

#### Scenario: Already decided request cannot be approved again

- **WHEN** an admin approves a request whose status is `FULFILLED`, `APPROVED`, or `REJECTED`
- **THEN** the system returns HTTP 409 with `{ "error": "request_already_decided" }`
- **THEN** the system SHALL NOT create another license

#### Scenario: Manual license grant remains available

- **WHEN** an admin opens GET `/admin/licenses/new`
- **THEN** the existing manual AIRE VIP license grant form remains available
- **THEN** licenses created by manual grant continue to appear in the license list
