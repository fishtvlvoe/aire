## ADDED Requirements

### Requirement: All state-changing operations are logged

The system SHALL write an audit log entry for every state-changing operation, recording who did what, to which target, and when.

#### Scenario: Listing creation logged

- **WHEN** a user creates a new listing
- **THEN** audit_logs SHALL contain an entry with action="create_listing", user_id=current user, target_type="listing", target_id=new listing id

##### Example: Agent creates listing

- **GIVEN** agent "王小明" (user_id=2) is logged in
- **WHEN** 王小明 creates a listing that gets id=45
- **THEN** audit_logs SHALL contain: user_id=2, action="create_listing", target_type="listing", target_id=45, detail="物件名稱: 信義路三段100號"

#### Scenario: Document generation logged

- **WHEN** a user generates a document (disclosure, property-sheet, etc.)
- **THEN** audit_logs SHALL contain an entry with action="generate_document" and the listing id as target

##### Example: Generate disclosure

- **GIVEN** agent "李大華" (user_id=3) is logged in
- **WHEN** 李大華 generates disclosure document for listing id=12
- **THEN** audit_logs SHALL contain: user_id=3, action="generate_document", target_type="listing", target_id=12, detail="disclosure-document"

#### Scenario: Case transfer logged

- **WHEN** admin transfers cases from agent A to agent B
- **THEN** audit_logs SHALL contain an entry with action="transfer_cases" and detail describing the transfer

##### Example: Transfer 8 cases

- **GIVEN** admin transfers from user_id=2 (王小明) to user_id=4 (張三)
- **WHEN** 8 listings are affected
- **THEN** audit_logs SHALL contain: user_id=1 (admin), action="transfer_cases", target_type="user", target_id=2, detail="轉移 8 筆物件給 張三 (user_id=4)"

### Requirement: Audit log is append-only

The audit_logs table SHALL NOT support UPDATE or DELETE operations through the application API. Logs are permanent records.

#### Scenario: No delete endpoint

- **WHEN** any user attempts to delete or modify an audit log entry via API
- **THEN** the system SHALL return 405 Method Not Allowed

##### Example: Reject deletion attempt

- **GIVEN** any authenticated user
- **WHEN** user sends DELETE /api/audit-logs/1
- **THEN** response SHALL be 405 with body { "error": "Audit logs cannot be modified" }

### Requirement: Admin can view audit logs

The admin user SHALL be able to view all audit log entries, filtered by user, action type, or date range.

#### Scenario: View all logs

- **WHEN** admin navigates to /admin/audit-logs
- **THEN** system SHALL display a paginated list of all audit entries, newest first

##### Example: Filter by user

- **GIVEN** admin is on /admin/audit-logs
- **WHEN** admin selects filter user="王小明"
- **THEN** list SHALL only show entries where user_id matches 王小明's id
