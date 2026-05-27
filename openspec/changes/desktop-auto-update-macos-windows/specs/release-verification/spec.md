# release-verification Specification

## ADDED Requirements

### Requirement: Release artifacts include updater metadata

AIRE Desktop release workflow SHALL publish the installer artifacts and updater metadata required for macOS and Windows stable updates.

#### Scenario: Stable release candidate is built

- **GIVEN** a stable release candidate is created
- **WHEN** the release workflow completes
- **THEN** it SHALL produce macOS and Windows installer artifacts
- **AND** it SHALL produce update metadata and signatures for each supported platform
- **AND** it SHALL record artifact names, versions, checksums, and signing status in the release verification report

### Requirement: Desktop update is verified on macOS and Windows

AIRE Desktop release verification SHALL test old-version-to-new-version updates on macOS and Windows before calling the release ready.

#### Scenario: macOS update smoke passes

- **GIVEN** an older signed macOS build is installed with local case data
- **WHEN** the app updates to the new signed macOS build
- **THEN** the updated app SHALL launch successfully
- **AND** the existing local case data SHALL still be visible
- **AND** the user SHALL be able to run the main case workflow after update

#### Scenario: Windows update smoke passes

- **GIVEN** an older signed Windows build is installed with local case data
- **WHEN** the app updates to the new signed Windows build
- **THEN** the updated app SHALL launch successfully
- **AND** the existing local case data SHALL still be visible
- **AND** the user SHALL be able to run the main case workflow after update
