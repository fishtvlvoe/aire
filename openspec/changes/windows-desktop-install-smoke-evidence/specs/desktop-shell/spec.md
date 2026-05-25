## MODIFIED Requirements

### Requirement: Tauri shell with Next.js frontend

The Tauri shell with Next.js frontend SHALL include repeatable Windows installer smoke evidence before Desktop fullflow release acceptance.

#### Scenario: Windows CI installer smoke passes

- **GIVEN** the Windows Desktop installer is produced by the current workflow run
- **WHEN** the installer smoke job installs and launches AIRE on `windows-latest`
- **THEN** the job SHALL record installer log, process metadata, window metadata and launch screenshot
- **AND** the job SHALL upload those files as workflow artifacts
- **AND** the release smoke report SHALL identify this run as the Windows CI/VM evidence source
