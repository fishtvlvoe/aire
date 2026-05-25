# release-verification Specification

## ADDED Requirements

### Requirement: Desktop fullflow release report is required

AIRE Desktop release verification SHALL include a fullflow acceptance report before the release is marked ready for customer trial.

#### Scenario: Release candidate is reviewed

- **GIVEN** a Desktop App release candidate exists
- **WHEN** the release is reviewed
- **THEN** `docs/release/desktop-fullflow-acceptance-report.md` SHALL identify the tested branch and commit
- **AND** it SHALL include macOS and Windows validation results
- **AND** it SHALL include known blockers and unresolved risks

### Requirement: SaaS parity is not claimed without evidence

Release verification SHALL prevent copy or handoff notes from claiming that the SaaS site has the same complete workflow as Desktop unless separately validated.

#### Scenario: Release copy mentions online use

- **GIVEN** release copy or handoff notes mention `aire.opcos.me`
- **WHEN** the copy is reviewed
- **THEN** it SHALL describe SaaS as account, authorization, plan, or entry surface only
- **AND** it SHALL NOT claim complete Desktop registry lookup and PDF workflow parity unless a separate SaaS acceptance report exists
