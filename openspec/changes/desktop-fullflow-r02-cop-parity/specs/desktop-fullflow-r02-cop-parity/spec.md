## ADDED Requirements

### Requirement: Desktop fullflow is the release surface

The Desktop App SHALL be the complete release surface for this change. The complete workflow SHALL include case creation, address data completion, registry-field confirmation, formal lookup, supplement workbench, HTML preview and PDF export.

#### Scenario: Desktop fullflow smoke covers the complete workflow

- **WHEN** the release verification runs for this change
- **THEN** the smoke test SHALL create a case from an address
- **AND** confirm section, land number and building number
- **AND** run formal lookup or a deterministic formal lookup fixture
- **AND** update supplement fields and HTML preview
- **AND** export PDF
- **AND** save a verification report for the run

### Requirement: SaaS parity is not claimed for this release

The product SHALL NOT claim that the SaaS route has feature parity with the Desktop App for this release. SaaS SHALL remain an account, authorization and entry surface unless a separate SaaS parity change is implemented.

#### Scenario: Release copy identifies Desktop as complete

- **WHEN** product copy or release notes describe this change
- **THEN** the copy SHALL identify Desktop App as the complete workflow surface
- **AND** SHALL NOT claim that `aire.opcos.me` supports the same complete registry lookup and PDF workflow
