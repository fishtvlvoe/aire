## ADDED Requirements

### Requirement: License activation calls backend API

The activation page SHALL call the OPCOS backend `POST /api/v1/licenses/activate` with `{ serialKey: string, deviceId: string }` when the user clicks the activate button. The system SHALL NOT perform client-side string comparison to determine activation success or failure. A successful HTTP 2xx response SHALL trigger a success toast and redirect to the dashboard. An HTTP 4xx response SHALL display an error toast "序號無效，請確認後重試". An HTTP 5xx or network error SHALL display "伺服器錯誤，請稍後再試".

#### Scenario: Backend API called on activate

- **WHEN** user enters a serial key and clicks 啟用
- **THEN** the system SHALL issue an HTTP POST request to `/api/v1/licenses/activate`
- **THEN** no client-side serial key string comparison logic SHALL execute

#### Scenario: Valid serial key activates successfully

- **WHEN** POST `/api/v1/licenses/activate` returns HTTP 200
- **THEN** a success toast SHALL appear
- **THEN** the system SHALL redirect to the dashboard

#### Scenario: Invalid serial key shows error

- **WHEN** POST `/api/v1/licenses/activate` returns HTTP 400 or 422
- **THEN** the error toast "序號無效，請確認後重試" SHALL appear
- **THEN** the user remains on the activation page

#### Scenario: Server error handled gracefully

- **WHEN** POST `/api/v1/licenses/activate` returns HTTP 500 or times out
- **THEN** the error toast "伺服器錯誤，請稍後再試" SHALL appear

##### Example: API call verification

- **GIVEN** serial key "AIRE-TEST-2026-ADMIN" is entered
- **WHEN** user clicks 啟用
- **THEN** a network request to `/api/v1/licenses/activate` with body `{ serialKey: "AIRE-TEST-2026-ADMIN", deviceId: "<device-id>" }` SHALL be recorded in the browser network log
- **THEN** no hardcoded string such as "AIRE-TEST" SHALL appear in client-side activation handler code
