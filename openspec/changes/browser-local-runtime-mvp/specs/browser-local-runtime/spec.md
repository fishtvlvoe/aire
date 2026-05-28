## ADDED Requirements

### Requirement: Windows local runtime delivery

The system SHALL provide a Windows installer that installs AIRE without requiring source code, package managers, or terminal commands on the customer's machine.

#### Scenario: Customer launches AIRE from desktop shortcut

- **GIVEN** AIRE is installed on Windows
- **WHEN** the customer double-clicks the AIRE shortcut
- **THEN** the launcher SHALL start the bundled local runtime
- **AND** the runtime SHALL bind only to `127.0.0.1`
- **AND** the launcher SHALL open the system default browser to the local AIRE URL.

#### Scenario: Customer machine does not have Node installed

- **GIVEN** the customer has no system Node.js installation
- **WHEN** AIRE starts
- **THEN** it SHALL use the Node runtime bundled by the installer.

### Requirement: Local data retention

The system SHALL keep customer case data on the local machine by default.

#### Scenario: Case data persists after restart

- **GIVEN** the customer creates or updates a case
- **WHEN** the customer closes AIRE and launches it again
- **THEN** the case data SHALL still be available from the local data store.

#### Scenario: Uninstall preserves customer data

- **GIVEN** AIRE is uninstalled
- **WHEN** the uninstaller runs with default options
- **THEN** it SHALL NOT delete customer case data.

#### Scenario: COP credentials persist across restart

- **GIVEN** the customer has saved valid COP credentials
- **WHEN** the customer closes AIRE and launches it again
- **THEN** AIRE SHALL load the stored COP credentials from the local secure store without re-entry
- **AND** the credentials SHALL NOT be stored in plain text.

### Requirement: MVP land-registry workflow

The local runtime SHALL support the MVP land-registry workflow without Tauri/Rust IPC.

#### Scenario: Address discovery returns local candidates

- **GIVEN** the runtime is running locally
- **WHEN** the customer enters a known supported address
- **THEN** AIRE SHALL return the matched section, land number, and building number from the local server workflow.

#### Scenario: Formal pull requires COP settings

- **GIVEN** COP credentials are not configured
- **WHEN** the customer attempts formal registry import
- **THEN** AIRE SHALL show a clear local settings error
- **AND** it SHALL NOT show raw object serialization errors such as `[object Object]`.

### Requirement: Local PDF generation

The local runtime SHALL generate the property description document on the local machine. The draft and the official document are the SAME document produced at different points in time, not two separate templates.

#### Scenario: Draft generated from registry lookup

- **GIVEN** the customer has run a land-registry lookup via the local convenience-system API
- **WHEN** the customer generates the draft document
- **THEN** AIRE SHALL render the draft PDF from the looked-up data snapshot
- **AND** it SHALL write the PDF atomically to the local data directory.

#### Scenario: Official document continues from the draft

- **GIVEN** a draft exists and the customer has manually entered supplementary post-signing data
- **WHEN** the customer generates the official document
- **THEN** AIRE SHALL keep the earlier draft content unchanged
- **AND** it SHALL append the supplementary materials as embedded pages, not popups
- **AND** it SHALL append the customer signature page
- **AND** it SHALL write the official PDF atomically to the local data directory.

#### Scenario: PDF generation does not depend on Tauri/Rust

- **GIVEN** the Tauri build is parked
- **WHEN** any PDF is generated
- **THEN** both rendering and the atomic file write SHALL be performed by the Node runtime
- **AND** it SHALL NOT require the Rust `export_pdf` IPC command.

### Requirement: Local API security boundary

The local runtime SHALL protect its `/api/local/*` endpoints so that other web pages running on the same machine cannot invoke AIRE APIs or exfiltrate stored COP credentials.

#### Scenario: Local API requires session token

- **GIVEN** the runtime is bound to `127.0.0.1`
- **WHEN** a request to a `/api/local/*` endpoint arrives without a valid local session token
- **THEN** the runtime SHALL reject the request with HTTP 401
- **AND** it SHALL NOT execute the requested local action.

#### Scenario: Legitimate browser session carries the token

- **GIVEN** the launcher started the runtime and opened the system browser
- **WHEN** the AIRE page issues a `/api/local/*` request
- **THEN** the request SHALL carry the per-launch session token issued by the launcher
- **AND** the runtime SHALL accept it.
