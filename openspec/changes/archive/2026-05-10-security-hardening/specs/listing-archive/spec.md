## MODIFIED Requirements

### Requirement: Archive listing
The system SHALL allow users to archive a completed listing, hiding it from the main list while preserving all data. The public listing DELETE API SHALL be mapped to this archive behavior to prevent accidental data loss. Hard deletion is forbidden for regular agent users.

#### Scenario: Delete API triggers archive
- **WHEN** a client sends DELETE /api/listings/5
- **THEN** the system SHALL set archived_at for listing #5
- **THEN** an audit log entry SHALL be recorded
- **THEN** the row SHALL NOT be removed from the listings table

#### Scenario: Archive a listing
- **WHEN** user clicks "封存" on a listing
- **THEN** the listing SHALL have archived_at set to current timestamp
- **THEN** the listing SHALL no longer appear in the main listings view

#### Scenario: Archived listing data preservation
- **WHEN** a listing is archived
- **THEN** all listing data (forms, documents, attachments) SHALL remain intact and accessible
