# data-export-import Specification

## Purpose

Provide an encrypted, portable backup file format (`.aire`) that lets a customer export all cases or a single case from one machine and import them on another machine, with conflict detection and corruption protection.

## ADDED Requirements

### Requirement: System SHALL produce a `.aire` ZIP container on export

The system SHALL serialize the encrypted SQLite database, an export metadata document, and a SHA-256 checksum into a single ZIP file with the `.aire` extension. The container SHALL include exactly three entries: `db.sqlite`, `meta.json`, `checksum.sha256`.

#### Scenario: Export all cases succeeds

- **WHEN** the user clicks "Export all cases" on the settings backup page and selects an output path
- **THEN** the system writes a `.aire` file at the chosen path containing the encrypted SQLite snapshot, `meta.json` with `case_count` equal to the total number of cases, and `checksum.sha256` matching the SHA-256 of `db.sqlite` concatenated with `meta.json`

#### Scenario: Export single case succeeds

- **WHEN** the user clicks "Export this case" on a case detail page and selects an output path
- **THEN** the system writes a `.aire` containing only the rows for that `case_id` in `db.sqlite`, with `meta.json.case_count` equal to 1

### Requirement: Export SHALL acquire a write lock to prevent corruption

The system SHALL begin an `IMMEDIATE` SQLite transaction before snapshotting `db.sqlite` and roll back the transaction after the byte-for-byte copy completes, guaranteeing no concurrent writes corrupt the exported snapshot.

#### Scenario: Concurrent write during export does not corrupt output

- **WHEN** the user triggers an export while another part of the app attempts to write a case
- **THEN** the export completes with a consistent snapshot AND the concurrent write is queued behind the export's `IMMEDIATE` lock until rollback

### Requirement: Import SHALL verify checksum and schema before unpacking

The system SHALL compute the SHA-256 of `db.sqlite` and `meta.json` from the imported `.aire` and compare against `checksum.sha256`. The system SHALL also compare `meta.json.schema_version` against the local schema version and reject imports with newer schema versions.

#### Scenario: Corrupted backup file is rejected

- **WHEN** the user attempts to import a `.aire` whose `checksum.sha256` does not match the recomputed SHA-256
- **THEN** the system surfaces `ImportError::CorruptedFile` and the UI displays "備份檔損毀，請重新匯出"

#### Scenario: Newer schema version is rejected

- **WHEN** the user attempts to import a `.aire` whose `meta.json.schema_version` is greater than the local schema version
- **THEN** the system surfaces `ImportError::IncompatibleSchema` and the UI displays "備份檔來自較新版本 AIRE，請升級後再試"

### Requirement: Import SHALL detect case_id conflicts and prompt the user per item

The system SHALL compare every `case_id` in the imported snapshot against the local database. For each conflicting `case_id`, the system SHALL surface a conflict item to the UI with three resolution actions: `Overwrite`, `KeepNewer`, `Skip`. The UI SHALL also offer an "Apply to all" toggle that records the selection for the remaining unresolved conflicts in the same import session.

#### Scenario: Three conflicting cases each resolved individually

- **WHEN** the imported `.aire` contains three `case_id` values that already exist locally and the user selects `Overwrite` / `KeepNewer` / `Skip` for each
- **THEN** the local database reflects the imported row for the first case, the row whose `updated_at` is newer for the second case, and the original local row for the third case

#### Scenario: Apply to all toggle skips remaining conflicts

- **WHEN** the user resolves the first conflict with `Skip` and toggles "Apply to all"
- **THEN** the system applies `Skip` to every remaining conflict in the import session without further prompts

### Requirement: Export SHALL fail loudly when disk space is insufficient

The system SHALL check available disk space at the export target before writing and SHALL refuse to start the export if free space is less than the size of `db.sqlite` plus 64 KiB headroom.

#### Scenario: Insufficient disk space aborts the export

- **WHEN** the user triggers an export to a target volume with less free space than `db.sqlite` + 64 KiB
- **THEN** the system surfaces `ExportError::InsufficientDiskSpace` and the UI displays the required vs available bytes
