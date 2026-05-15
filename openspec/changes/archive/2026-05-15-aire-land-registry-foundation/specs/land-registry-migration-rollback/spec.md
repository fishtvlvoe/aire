## ADDED Requirements

### Requirement: SQLite migrations SHALL be preceded by a full-file backup
Before applying any migration SQL, the crate SHALL produce a complete SQLite backup using `VACUUM INTO 'backup-<timestamp>.db'` at the same directory as the live DB. The migration SHALL NOT proceed until the backup file exists and its size matches a successful `VACUUM INTO`.

#### Scenario: Backup file created prior to migration
- **WHEN** the migration runner detects pending migrations
- **THEN** the runner SHALL first create `backup-<unix_ts>.db` adjacent to the live DB
- **AND** SHALL verify the backup file size is non-zero before applying migration SQL

### Requirement: Failed migrations SHALL be rolled back from the pre-migration backup
If any migration statement raises an error, the runner SHALL replace the now-corrupt live DB with the backup file and SHALL surface `LandRegistryError::MigrationFailed` to the caller. The half-applied DB SHALL NOT be left in place.

#### Scenario: Mid-migration SQL error triggers rollback
- **GIVEN** a migration script with three statements where the second raises a constraint violation
- **WHEN** the migration runner executes the script
- **THEN** the runner SHALL restore the backup file as the live DB
- **AND** SHALL return `Err(LandRegistryError::MigrationFailed { failed_statement, source })`

### Requirement: Migration backups SHALL be retained for 7 days then deleted
Successful and failed backups SHALL be retained in the data directory for 7 days after creation, then removed by a cleanup pass that runs at App startup.

#### Scenario: Backup older than 7 days is removed at startup
- **GIVEN** the data directory contains `backup-1716480000.db` whose mtime is 8 days old
- **WHEN** the App starts up
- **THEN** the cleanup pass SHALL delete that backup file

#### Scenario: Backup younger than 7 days is preserved
- **GIVEN** the data directory contains a backup whose mtime is 3 days old
- **WHEN** the App starts up
- **THEN** the cleanup pass SHALL NOT delete that backup file
