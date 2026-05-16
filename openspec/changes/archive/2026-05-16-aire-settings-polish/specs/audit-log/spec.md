## ADDED Requirements

### Requirement: Real operation log recording
The mock-backend SHALL record operation logs for case CRUD actions (create, update, delete) and PDF export. Each log entry SHALL contain: `id` (auto-generated UUID), `timestamp` (ISO 8601), `action` (string describing the operation type), `detail` (string with operation specifics), and `user_email` (current logged-in user).

#### Scenario: Case creation log
- **WHEN** a new case is created via `create_case`
- **THEN** an operation log entry is recorded with `action='建立案件'` and `detail` containing the case address

#### Scenario: Case deletion log
- **WHEN** a case is deleted via `delete_case`
- **THEN** an operation log entry is recorded with `action='刪除案件'` and `detail` containing the deleted case identifier

### Requirement: Log list display
The operation log page (`/settings/logs`) SHALL call `list_logs` to retrieve all operation logs and display them in a table sorted by timestamp DESC. Each row SHALL show: timestamp (formatted as `YYYY/MM/DD HH:mm`), action type, detail description. The page SHALL NOT display hardcoded mock data.

#### Scenario: Logs after operations
- **WHEN** user creates a case, then navigates to `/settings/logs`
- **THEN** the log table shows at least one entry with `action='建立案件'` and a recent timestamp

#### Scenario: Empty log state
- **WHEN** no operations have been performed and user views `/settings/logs`
- **THEN** the page displays "尚無操作紀錄"
