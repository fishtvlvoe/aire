## MODIFIED Requirements

### Requirement: All state-changing operations are logged
The system SHALL write an audit log entry for every state-changing operation, recording who did what, to which target, and when. Database helper functions in src/lib/db/index.ts (e.g., createListing, updateListing, archiveListing) SHALL automatically invoke the writeAuditLog function to ensure consistency.

#### Scenario: Listing creation logged via helper
- **WHEN** the createListing helper is called
- **THEN** audit_logs SHALL contain an entry with action="create_listing", user_id=provided user id, target_type="listing", target_id=new listing id

#### Scenario: Document generation logged
- **WHEN** a user generates a document (disclosure, property-sheet, etc.)
- **THEN** audit_logs SHALL contain an entry with action="generate_document" and the listing id as target

#### Scenario: Case transfer logged
- **WHEN** admin transfers cases from agent A to agent B
- **THEN** audit_logs SHALL contain an entry with action="transfer_cases" and detail describing the transfer
