# desktop-fullflow-release-acceptance-gate Specification

## ADDED Requirements

### Requirement: Desktop fullflow release gate blocks downstream work

AIRE SHALL require a passing Desktop fullflow release acceptance gate before customer trial rollout or desktop auto-update implementation.

#### Scenario: Auto-update starts before desktop fullflow acceptance

- **GIVEN** the desktop fullflow acceptance report does not show passing macOS and Windows results
- **WHEN** an implementer starts desktop auto-update work
- **THEN** implementation SHALL stop before changing updater behavior
- **AND** the implementer SHALL complete the desktop fullflow acceptance gate first

### Requirement: P0 validates the product workflow

The P0 acceptance gate SHALL validate the complete product workflow from address input to PDF output.

#### Scenario: P0 desktop fullflow passes

- **GIVEN** a test case with an address or fixture property is available
- **WHEN** the user runs the Desktop App workflow
- **THEN** the app SHALL support address entry, registry field confirmation, formal lookup gate, supplement entry, HTML preview, and PDF output
- **AND** the acceptance report SHALL link to screenshots, Playwright artifacts, or equivalent evidence

### Requirement: P1 validates entitlement and installability

The P1 acceptance gate SHALL validate account entitlement, customer COP credential setup, and platform installability.

#### Scenario: P1 acceptance passes

- **GIVEN** the P0 product workflow has passing evidence
- **WHEN** P1 validation is performed
- **THEN** OO account status, AIRE entitlement, trial or plan status, and customer COP credential status SHALL be visible in system settings
- **AND** macOS and Windows Desktop App builds SHALL install, launch, and run the P0 workflow

### Requirement: P2 starts only after P0/P1 pass

P2 work, including desktop auto-update implementation, SHALL start only after P0 and P1 acceptance pass.

#### Scenario: P0 or P1 has unresolved blockers

- **GIVEN** any P0 or P1 acceptance item is failed or blocked
- **WHEN** the team reviews the next work
- **THEN** desktop auto-update SHALL remain blocked
- **AND** the unresolved blocker SHALL be recorded in the acceptance report

### Requirement: Evidence must be product-visible or artifact-visible

Every release acceptance item SHALL have visible evidence in the product, an artifact, or a report.

#### Scenario: Acceptance item is marked pass

- **GIVEN** an acceptance item is marked pass
- **WHEN** the report is reviewed
- **THEN** it SHALL include evidence such as screenshot, Playwright artifact, query JSON, billing row, cache-hit row, error log, PDF artifact, installer smoke report, or entitlement status
- **AND** it SHALL include the tested branch and commit
