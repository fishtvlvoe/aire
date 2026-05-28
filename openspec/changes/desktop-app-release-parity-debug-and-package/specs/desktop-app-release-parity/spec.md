## ADDED Requirements

### Requirement: Formal import SHALL not use browser mock data as release evidence

The system SHALL treat Tauri/Rust IPC as the authoritative formal registry import path. In browser development mode, formal import SHALL either use a real formal import source or return an explicit blocking error. Browser mock data SHALL NOT be saved as trusted formal registry data.

#### Scenario: Browser development blocks formal import without real source

- **WHEN** a browser development session requests formal registry import for a confirmed case
- **THEN** the system returns a customer-readable error requiring AIRE Desktop App formal import
- **THEN** the case record remains unchanged with no new trusted formal registry entries

#### Scenario: Mock formal payload is rejected from release evidence

- **WHEN** a formal import response contains mock or dev fixture data
- **THEN** the system SHALL NOT mark that data as trusted for PDF
- **THEN** release evidence SHALL mark the run as blocked instead of accepted

### Requirement: Desktop release parity SHALL include runtime evidence per platform

The system SHALL require macOS Desktop App runtime evidence and Windows runtime evidence before desktop fullflow is marked release-ready. Build success alone SHALL NOT satisfy runtime acceptance.

#### Scenario: macOS App runtime evidence is captured

- **WHEN** the macOS Desktop App is built or launched for release verification
- **THEN** evidence SHALL include launch state, address lookup result, case creation result, and formal import gate result

#### Scenario: Windows runtime evidence is captured

- **WHEN** a Windows installer is selected for release verification
- **THEN** evidence SHALL include commit SHA, installer checksum, install or launch result, screenshot or report artifact, and runtime smoke outcome
