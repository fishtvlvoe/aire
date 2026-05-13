## ADDED Requirements

### Requirement: Operation log table

The system SHALL persist a per-action audit log in the `operation_log` SQLite table with columns: `id INTEGER PRIMARY KEY AUTOINCREMENT`, `ts INTEGER NOT NULL`, `action TEXT NOT NULL`, `payload TEXT`, `result TEXT NOT NULL CHECK(result IN ('ok','error'))`, and an index `idx_op_log_ts` on `ts DESC`.

The known `action` values for Phase 1 are: `license_activate`, `license_verify`, `case_create`, `case_update`, `case_delete`, `draft_save`, `pdf_export`, `setting_change`.

#### Scenario: Each license activation writes a row

- **WHEN** the user successfully activates with a license key
- **THEN** a new row is inserted with `action='license_activate'`, `result='ok'`, `ts` set to the current Unix timestamp in seconds, and `payload` containing `{ device_id }` as JSON

#### Scenario: Failed verify writes error row

- **WHEN** verification fails due to network error
- **THEN** a new row is inserted with `action='license_verify'`, `result='error'`, payload containing `{ reason: 'network_failed' }`

### Requirement: Log writes are non-blocking

The system SHALL write log rows asynchronously so that a log failure does not block the underlying operation; log write failures SHALL be reported only to stderr and SHALL NOT raise an error to the calling IPC handler.

#### Scenario: Log write failure does not block PDF export

- **WHEN** the `operation_log` insert fails (e.g., disk full on the log path) during a PDF export
- **THEN** the PDF export still completes if the PDF write itself succeeded, and the user sees `匯出成功`

### Requirement: Log retention

The system SHALL retain operation log entries indefinitely in Phase 1 (no rotation). A `LIMIT 1000` query SHALL return the most recent 1000 entries ordered by `ts DESC` in under 100 milliseconds for databases with up to 100000 entries.

#### Scenario: Recent log query

- **WHEN** the system queries `SELECT * FROM operation_log ORDER BY ts DESC LIMIT 1000`
- **THEN** the query uses the `idx_op_log_ts` index and returns within 100 milliseconds for databases up to 100000 rows

### Requirement: No personally identifiable information in payload

The system MUST NOT write owner names, license keys, JWT tokens, or land registry API keys into the `payload` field of `operation_log`. Payloads SHALL contain only IDs, action metadata, and error reasons.

##### Example: allowed vs. disallowed payload fields

| Field in payload | Allowed? |
| --- | --- |
| `case_id` | yes |
| `device_id` | yes |
| `output_path` | yes |
| `reason` | yes (error reasons) |
| `owner_name` | no |
| `license_key` | no |
| `token` | no |
| `api_key` | no |

#### Scenario: Log writer redacts disallowed fields

- **WHEN** a caller invokes the log writer with a payload that includes both `case_id` and `owner_name`
- **THEN** the stored row contains only `case_id` in `payload`, and `owner_name` is omitted
