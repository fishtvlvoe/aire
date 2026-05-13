# local-database Specification

## Purpose

TBD - created by archiving change 'aire-desktop-phase1'. Update Purpose after archive.

## Requirements

### Requirement: SQLite database initialization

The system SHALL initialize a SQLite database file at the OS application data directory on first launch and apply pending migrations from `src-tauri/migrations/` in filename order.

#### Scenario: Fresh installation creates database

- **WHEN** the application launches with no existing `aire.db`
- **THEN** an empty `aire.db` is created at the application data directory and `001_initial.sql` is applied, setting `PRAGMA user_version = 1`

#### Scenario: Existing database with current schema is left untouched

- **WHEN** the application launches with `aire.db` already at `user_version = 1` and no newer migrations exist
- **THEN** no migrations are applied and the application proceeds to the main window

---
### Requirement: Cases table schema

The system SHALL persist case records in a `cases` table with the following columns: `id TEXT PRIMARY KEY`, `case_no TEXT`, `property_type TEXT NOT NULL CHECK(property_type IN ('residential','land'))`, `land_lot_no TEXT NOT NULL`, `address TEXT NOT NULL`, `owner_name TEXT`, `status TEXT NOT NULL CHECK(status IN ('draft','completed','exported')) DEFAULT 'draft'`, `created_at INTEGER NOT NULL`, `updated_at INTEGER NOT NULL`.

The table SHALL include an index `idx_cases_updated_at` on `updated_at DESC` for list ordering.

#### Scenario: Insert valid case

- **WHEN** the system inserts a row with `property_type='residential'`, `land_lot_no='台南市東區大同段123-4'`, `address='台南市東區大同路100號'`
- **THEN** the row is persisted with auto-populated `created_at` and `updated_at` and `status='draft'`

#### Scenario: Insert rejects invalid property_type

- **WHEN** the system attempts to insert a row with `property_type='commercial'`
- **THEN** SQLite rejects the insert with a CHECK constraint violation

##### Example: list ordering uses index

- **GIVEN** three cases with `updated_at = 1700000000, 1700001000, 1700000500`
- **WHEN** the system queries `SELECT id FROM cases ORDER BY updated_at DESC LIMIT 50`
- **THEN** results return in order of `updated_at` values 1700001000, 1700000500, 1700000000

---
### Requirement: Disclosure drafts table schema

The system SHALL persist disclosure form drafts in a `disclosure_drafts` table with columns: `case_id TEXT PRIMARY KEY REFERENCES cases(id) ON DELETE CASCADE`, `payload_json TEXT NOT NULL`, `schema_version INTEGER NOT NULL DEFAULT 1`, `saved_at INTEGER NOT NULL`.

#### Scenario: Draft is removed when parent case is deleted

- **WHEN** a case with id `X` is deleted from `cases`
- **THEN** the corresponding row in `disclosure_drafts` where `case_id='X'` is also removed due to CASCADE

#### Scenario: Draft upsert overwrites previous draft

- **WHEN** a draft already exists for `case_id='X'` and the system performs INSERT OR REPLACE
- **THEN** the existing row is replaced and `saved_at` reflects the new timestamp

---
### Requirement: Settings key-value store

The system SHALL persist application settings in a `settings` table with columns `key TEXT PRIMARY KEY`, `value TEXT NOT NULL`, `updated_at INTEGER NOT NULL`.

The known keys MUST include: `license_status`, `license_key`, `license_verified_at`, `device_id`, `company_name`, `company_address`, `company_phone`.

#### Scenario: Setting upsert preserves history through updated_at

- **WHEN** `set_setting('company_name', 'X 不動產')` is called and then `set_setting('company_name', 'Y 不動產')` is called
- **THEN** the final row contains `value='Y 不動產'` with a newer `updated_at`

---
### Requirement: Boundary handling on database errors

The system SHALL surface SQLite errors to the caller as a structured `DbError` IPC response with at minimum `code` and `message`, and SHALL NOT crash the application on disk-full or read-only errors.

#### Scenario: Disk full during write

- **WHEN** the disk is full and the system attempts to insert a case
- **THEN** the IPC handler returns `Err(DbError { code: 'IO_ERROR', message: <SQLite message> })` and the frontend displays a non-blocking error message

#### Scenario: Empty database query

- **WHEN** the `cases` table is empty and the frontend calls `list_cases`
- **THEN** the handler returns `Ok([])` (empty array), not an error
