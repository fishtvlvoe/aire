## ADDED Requirements

### Requirement: Windows Desktop installer smoke evidence

Windows Desktop installer smoke evidence SHALL be generated from the current workflow run and archived with release verification artifacts.

#### Scenario: Installer smoke artifacts are archived

- **GIVEN** a Windows CI run builds the AIRE Desktop installer
- **WHEN** the installer smoke job completes
- **THEN** the artifact set SHALL include installer files, install log, process metadata, window metadata and launch screenshot
- **AND** the smoke report SHALL identify the workflow run as Windows CI/VM evidence
