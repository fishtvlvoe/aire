## MODIFIED Requirements

### Requirement: DB write helpers auto-log audit entries

All database helper functions that perform INSERT, UPDATE, or DELETE SHALL automatically write an audit log entry.

#### Scenario: Listing created

- **WHEN** `createListing()` is called
- **THEN** an audit log entry with action "create", entity "listing", entity_id, and user_id is written

#### Scenario: Supplementary data updated

- **WHEN** `updateSupplementaryData()` is called
- **THEN** an audit log entry with action "update", entity "supplementary", entity_id, user_id, and changed fields is written

#### Scenario: Listing archived

- **WHEN** a listing is soft-deleted
- **THEN** an audit log entry with action "archive", entity "listing", entity_id, and user_id is written
