# desktop-shell Specification

## ADDED Requirements

### Requirement: Desktop shell supports production update lifecycle

The desktop shell SHALL support the production update lifecycle after the full desktop workflow is accepted.

#### Scenario: Full desktop workflow has not been accepted

- **GIVEN** `desktop-fullflow-r02-cop-parity` has not passed macOS and Windows acceptance
- **WHEN** an implementer starts the auto-update SR
- **THEN** implementation SHALL stop before changing release updater behavior
- **AND** the implementer SHALL complete full desktop workflow acceptance first

#### Scenario: App updates after full desktop workflow acceptance

- **GIVEN** the full desktop workflow has passed acceptance on macOS and Windows
- **WHEN** the desktop shell applies a signed update
- **THEN** the app SHALL preserve local storage and desktop data paths
- **AND** it SHALL keep customer COP credentials under the existing credential storage rules
- **AND** it SHALL keep case workflow routes available after restart
