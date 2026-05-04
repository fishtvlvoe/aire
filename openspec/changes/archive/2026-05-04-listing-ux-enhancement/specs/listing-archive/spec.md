## ADDED Requirements

### Requirement: Archive listing

The system SHALL allow users to archive a completed listing, hiding it from the main list while preserving all data.

#### Scenario: Archive a listing

- **WHEN** user clicks "封存" on a listing
- **THEN** the listing SHALL have archived_at set to current timestamp
- **THEN** the listing SHALL no longer appear in the main listings view

#### Scenario: Archived listing data preservation

- **WHEN** a listing is archived
- **THEN** all listing data (forms, documents, attachments) SHALL remain intact and accessible

##### Example: Data integrity after archive

- **GIVEN** listing #5 has 3 documents and 2 attachments
- **WHEN** listing #5 is archived
- **THEN** listing #5 still has 3 documents and 2 attachments accessible via /listings/5/documents

### Requirement: Restore archived listing

The system SHALL allow users to restore an archived listing back to the main list.

#### Scenario: Restore from archive

- **WHEN** user clicks "還原" on an archived listing
- **THEN** the listing SHALL have archived_at set to NULL
- **THEN** the listing SHALL reappear in the main listings view in its original folder

### Requirement: View archived listings

The system SHALL provide a dedicated view for browsing archived listings.

#### Scenario: Access archive view

- **WHEN** user clicks "封存區" in the sidebar
- **THEN** only listings with archived_at IS NOT NULL SHALL be displayed

#### Scenario: Default list excludes archived

- **WHEN** user views the main listings page without selecting "封存區"
- **THEN** archived listings SHALL NOT appear in the results
