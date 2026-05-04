## ADDED Requirements

### Requirement: Listing status includes archived state

The listing workflow SHALL support an "archived" state in addition to existing states (draft, in-progress, completed).

#### Scenario: Transition to archived

- **WHEN** a completed listing is archived by the user
- **THEN** the listing status remains "completed" but archived_at timestamp is set
- **THEN** the listing SHALL be excluded from default list queries

### Requirement: Listing API supports folder and archive filtering

The listings API SHALL accept folder_id and archived parameters for filtering.

#### Scenario: Filter by folder

- **WHEN** API receives request with folder_id=1
- **THEN** only listings belonging to folder 1 SHALL be returned

##### Example: Filter results

- **GIVEN** 10 listings total, 3 in folder_id=1
- **WHEN** GET /api/listings?folder_id=1
- **THEN** 3 listings SHALL be returned

#### Scenario: Filter archived

- **WHEN** API receives request with archived=false (default)
- **THEN** listings with non-null archived_at SHALL be excluded

##### Example: Archived exclusion

- **GIVEN** 10 listings, 2 are archived
- **WHEN** GET /api/listings?archived=false
- **THEN** 8 listings SHALL be returned
