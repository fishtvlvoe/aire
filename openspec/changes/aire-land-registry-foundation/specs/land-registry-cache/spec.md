## ADDED Requirements

### Requirement: Cache SHALL store API responses keyed by parcel and query date
The land registry cache SHALL persist API responses in encrypted SQLite, using a composite primary key of `(parcel_id, query_date, api_id)`. Cache entries SHALL NOT be scoped to any case ID, so the same parcel queried from multiple cases on the same day reuses one stored response.

#### Scenario: Same parcel queried from two cases on the same day
- **GIVEN** case A queried parcel `BA-0001-00010001` for API `MOI_API_001` on 2026-05-14 and the result is cached
- **WHEN** case B queries the same parcel for `MOI_API_001` on 2026-05-14
- **THEN** the cache SHALL return the stored payload
- **AND** SHALL NOT issue a network request to the platform

#### Scenario: Same parcel queried on a different day
- **GIVEN** parcel `BA-0001-00010001` was cached on 2026-05-14
- **WHEN** any case queries the same parcel on 2026-06-15
- **THEN** the cache SHALL treat it as a miss and call the upstream API
- **AND** SHALL insert a new entry keyed by `(BA-0001-00010001, 2026-06-15, ...)`

### Requirement: Cache SHALL support forced refresh by deletion
The cache SHALL expose an explicit invalidation API that deletes entries matching a given parcel ID, allowing the UI in another change to wire a "重新拉取" action.

#### Scenario: Forced refresh deletes stored entry
- **WHEN** the caller invokes `cache::invalidate(parcel_id, api_id)`
- **THEN** the matching cache row SHALL be deleted
- **AND** the next `get_or_fetch` for the same parcel SHALL be a miss

### Requirement: Cache writes SHALL respect disk resilience guard
All cache write paths SHALL consult `disk_resilience` before persisting, and SHALL surface `LandRegistryError::DiskFull` rather than panicking when the guard rejects the write.

#### Scenario: Cache write blocked when disk near full
- **WHEN** a cache write is attempted while available disk space is below the configured threshold
- **THEN** the cache SHALL NOT execute the SQL INSERT
- **AND** SHALL return `LandRegistryError::DiskFull` with the current available bytes attached
