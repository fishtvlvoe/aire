## ADDED Requirements

### Requirement: Transfer API atomically revokes old and creates new license

The system SHALL provide POST /api/license/transfer that revokes the old license key and creates a new one in a single request. The old key status SHALL change to "revoked" with a reason and revokedAt timestamp. The new key SHALL be created with status "issued" and optionally pre-filled contactName, company, and email.

#### Scenario: Successful transfer
- **WHEN** admin sends POST /api/license/transfer with { oldKey: "ABCD-1234", reason: "公司轉讓", newCompany: "新公司", newContactName: "新負責人" }
- **THEN** the system returns 200 with { revokedKey: "ABCD-1234", newKey: "<generated>", newLicense: {...} }
- **THEN** the old license status is "revoked" with revokedReason "公司轉讓"
- **THEN** the new license status is "issued" with company "新公司" and contactName "新負責人"

#### Scenario: Transfer requires admin token
- **WHEN** request is sent without Authorization header
- **THEN** the system returns 401 { error: "未授權" }

#### Scenario: Old key not found
- **WHEN** oldKey does not exist in Vercel KV
- **THEN** the system returns 404 { error: "舊序號不存在" }

#### Scenario: Old key already revoked
- **WHEN** oldKey has status "revoked"
- **THEN** the system returns 400 { error: "舊序號已停用" }

### Requirement: Transfer API handles creation failure gracefully

If the new license creation fails after the old license has been revoked, the system SHALL restore the old license status to its previous value and return a 500 error.

#### Scenario: Rollback on creation failure
- **WHEN** revoke succeeds but new key creation fails
- **THEN** the old license status is restored to its pre-revoke value
- **THEN** the system returns 500 { error: "轉讓失敗，舊序號已復原" }
