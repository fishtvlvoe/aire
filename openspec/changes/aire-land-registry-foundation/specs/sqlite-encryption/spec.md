## ADDED Requirements

### Requirement: All SQLite connections SHALL go through an encrypted channel
The crate SHALL link `rusqlite` with the `bundled-sqlcipher` feature, and every connection opened against the AIRE data DB SHALL apply the per-installation encryption key via `PRAGMA key`. The plain-text DB SHALL NOT be readable by external tools without the key.

#### Scenario: External sqlite3 cannot open encrypted DB
- **GIVEN** the AIRE DB has been initialized with the encryption layer enabled
- **WHEN** an external `sqlite3` CLI is pointed at the DB file without supplying the key
- **THEN** any query SHALL fail with a "file is not a database" or equivalent error

### Requirement: Encryption key SHALL be generated on first run and persisted in OS keychain
On first run with no existing key in keychain, the App SHALL generate a 32-byte random key, persist it via the existing `keyring`-based secret storage (reusing the Phase 1 `secure-credential-storage` integration), and apply it to the DB. On subsequent runs the App SHALL read the key from keychain.

#### Scenario: First run generates and stores key
- **GIVEN** no encryption key exists in the OS keychain
- **WHEN** the App starts for the first time
- **THEN** the encryption layer SHALL generate a 32-byte random key
- **AND** SHALL store the key via `keyring` under a stable service / account identifier
- **AND** SHALL apply the key to the SQLite connection

#### Scenario: Subsequent run reuses stored key
- **GIVEN** the encryption key exists in the OS keychain from a previous run
- **WHEN** the App starts
- **THEN** the encryption layer SHALL read the key from keychain
- **AND** SHALL NOT generate a new key

### Requirement: Existing plaintext DB from Phase 1 SHALL be migrated to encrypted on first encrypted boot
On the first boot after the encryption layer is enabled, the crate SHALL detect whether the existing DB file is plain-text. If so, it SHALL one-time-migrate the contents into a freshly created encrypted DB, then atomically replace the old file. The migration SHALL preserve all rows in `cases`, `disclosure_drafts`, `settings`, and any other Phase 1 tables.

#### Scenario: Plain-text DB upgraded to encrypted
- **GIVEN** a Phase 1 plain-text DB exists at the data directory
- **WHEN** the App starts for the first time with the encryption layer enabled
- **THEN** the encryption layer SHALL create a new encrypted DB
- **AND** SHALL copy all rows from each Phase 1 table into the encrypted DB
- **AND** SHALL atomically replace the old plain-text file with the encrypted file
- **AND** SHALL surface no data loss to the caller

#### Scenario: Already-encrypted DB skips migration
- **GIVEN** the DB file is already encrypted (detected by failing to open without a key)
- **WHEN** the App starts
- **THEN** the encryption layer SHALL skip the plain-text migration step
