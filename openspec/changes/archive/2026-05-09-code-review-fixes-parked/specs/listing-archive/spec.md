## MODIFIED Requirements

### Requirement: DELETE endpoint performs soft-delete (was: hard delete)

The DELETE /api/listings/[id] route SHALL set `archived_at` timestamp instead of removing the row from the database.

#### Scenario: Agent deletes a listing

- **WHEN** an agent calls DELETE /api/listings/[id] on their own listing
- **THEN** the listing row remains in the database with `archived_at` set to the current timestamp
- **THEN** the listing no longer appears in GET /api/listings results
- **THEN** an audit log entry is created with action "archive"

#### Scenario: Hard delete is rejected

- **WHEN** any user calls DELETE /api/listings/[id]
- **THEN** the row is NOT physically removed from the database
