## ADDED Requirements

### Requirement: All write paths SHALL check disk space before persisting
The crate SHALL expose `disk_resilience::check_writable(min_bytes: u64) -> Result<(), LandRegistryError>` and every SQLite write, cache write, billing log write, and file dump SHALL call it before issuing the write.

#### Scenario: Write blocked when free space below threshold
- **GIVEN** the data directory has only 5 MB of free space
- **WHEN** a caller invokes `check_writable(min_bytes = 10 * 1024 * 1024)`
- **THEN** the function SHALL return `Err(LandRegistryError::DiskFull { available_bytes: 5_242_880 })`

#### Scenario: Write proceeds when free space sufficient
- **WHEN** the data directory has 500 MB of free space and `check_writable(min_bytes = 10 MB)` is called
- **THEN** the function SHALL return `Ok(())`

### Requirement: Disk-full failures SHALL be graceful, never panicking
No write site in the `land_registry` module or `encryption` module SHALL `panic!`, `unwrap()`, or `expect()` on disk-full errors. All such failures SHALL bubble up as `LandRegistryError::DiskFull`.

#### Scenario: SQLite write under tmpfs space limit returns typed error
- **GIVEN** the SQLite DB lives on a filesystem with 1 MB free
- **WHEN** a cache write of 2 MB is attempted
- **THEN** the operation SHALL return `Err(LandRegistryError::DiskFull { .. })`
- **AND** the host process SHALL remain running
