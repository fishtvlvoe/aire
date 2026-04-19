## ADDED Requirements

### Requirement: Recent listings sidebar filters out empty drafts

The system SHALL filter listings displayed in the sidebar `最近物件` section to exclude listings that meet BOTH of the following conditions:

1. `status === 'draft'`
2. `field_visit_data` IS NULL, empty string, or an empty JSON object (`{}`)

Listings with any filled data (even a single field) SHALL remain visible so partial drafts are recoverable.

A DB query helper `listRecentListings(limit: number)` in `src/lib/db/index.ts` SHALL encapsulate this filter so the sidebar and any other consumer produce consistent results.

#### Scenario: Empty draft hidden from sidebar

- **WHEN** a listing exists with `status='draft'` and `field_visit_data='{}'`
- **AND** the sidebar queries recent listings via `listRecentListings(10)`
- **THEN** the empty draft SHALL NOT appear in the returned array

#### Scenario: Partial draft remains visible

- **WHEN** a listing exists with `status='draft'` and `field_visit_data='{"address":"台南市"}'`
- **AND** the sidebar queries recent listings
- **THEN** the partial draft SHALL appear in the returned array

#### Scenario: Non-draft listing always visible

- **WHEN** a listing exists with `status='documents-ready'` and `field_visit_data=NULL`
- **THEN** it SHALL appear in the sidebar (filter applies only to draft + empty combination)

### Requirement: One-time cleanup script removes pre-existing empty drafts

A one-time maintenance script at `scripts/cleanup-empty-drafts.ts` SHALL execute a DELETE statement removing listings matching BOTH criteria above. The script SHALL:

1. Print the count of listings to be deleted before deletion.
2. Print the resulting row count after deletion.
3. Exit with code 0 on success, non-zero on failure.

The script SHALL NOT touch listings that have any field data or non-draft status.

#### Scenario: Script run on DB with 5 empty drafts

- **WHEN** the script executes on a DB containing 5 empty drafts and 3 non-empty listings
- **THEN** it SHALL print `found 5 empty drafts, deleting...`
- **AND** 5 rows SHALL be deleted
- **AND** remaining total count SHALL be 3
- **AND** exit code SHALL be 0

#### Scenario: Script is idempotent

- **WHEN** the script runs a second time on a DB with no empty drafts
- **THEN** it SHALL print `found 0 empty drafts, nothing to delete`
- **AND** no rows SHALL be modified
- **AND** exit code SHALL be 0
