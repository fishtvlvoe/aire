## ADDED Requirements

### Requirement: Desktop shell

The Desktop shell SHALL be the primary delivery surface for this release. macOS and Windows builds SHALL launch the AIRE app and support the complete case creation, registry confirmation, formal lookup, supplement preview and PDF output workflow.

#### Scenario: macOS desktop smoke passes

- **WHEN** the macOS Desktop App is launched from the release build
- **THEN** the user SHALL be able to create a case, confirm registry fields, run formal lookup, review supplement fields, preview the document and export PDF
- **AND** the verification report SHALL record the build artifact and smoke result

#### Scenario: Windows desktop smoke passes

- **WHEN** the Windows Desktop App is launched from installer or release build
- **THEN** the user SHALL be able to run the same workflow as macOS
- **AND** the verification report SHALL record the build artifact and smoke result

#### Scenario: Desktop release excludes unfinished SaaS parity claims

- **WHEN** release notes or in-app copy describe this release
- **THEN** the copy SHALL identify Desktop as the full workflow surface
- **AND** SHALL NOT claim SaaS has the same complete registry lookup and PDF workflow in this release
