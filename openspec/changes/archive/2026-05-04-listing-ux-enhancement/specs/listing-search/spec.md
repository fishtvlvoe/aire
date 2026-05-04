## ADDED Requirements

### Requirement: Full-text search

The system SHALL provide full-text search across listing fields using SQLite FTS5.

#### Scenario: Search by keyword

- **WHEN** user enters "信義" in the search bar
- **THEN** all listings whose address, case_name, owner_name, or property_type contain "信義" SHALL be returned

#### Scenario: No results

- **WHEN** user searches for a term that matches no listings
- **THEN** system SHALL display "查無結果" message

### Requirement: Search with folder filter

The system SHALL allow combining search with folder selection.

#### Scenario: Search within a folder

- **WHEN** user selects folder "VIP客戶" and enters search term "套房"
- **THEN** only listings in folder "VIP客戶" matching "套房" SHALL be returned

### Requirement: Search archived listings opt-in

The system SHALL exclude archived listings from search by default, with an option to include them.

#### Scenario: Default search excludes archived

- **WHEN** user searches without checking "包含封存"
- **THEN** archived listings SHALL NOT appear in search results

#### Scenario: Include archived in search

- **WHEN** user checks "包含封存" and searches
- **THEN** both active and archived listings matching the query SHALL be returned

### Requirement: Search API

The system SHALL expose a search API endpoint with filtering parameters.

#### Scenario: API call with parameters

- **WHEN** client calls GET /api/listings?q=信義&folder_id=1&archived=false
- **THEN** system SHALL return listings matching all provided filters

##### Example: Filter combinations

| q | folder_id | archived | Result |
|---|-----------|----------|--------|
| "信義" | null | false | All non-archived listings matching "信義" |
| "信義" | 1 | false | Non-archived listings in folder 1 matching "信義" |
| "" | 1 | false | All non-archived listings in folder 1 |
| "信義" | null | all | All listings (including archived) matching "信義" |
