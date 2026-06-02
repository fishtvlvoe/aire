# customer-delivery-e2e

## ADDED Requirements

### Requirement: Customer Delivery E2E Gate

The system SHALL provide a customer-delivery E2E gate whose assertions match the current product contract.

#### Scenario: Canonical Case Route

- **GIVEN** an existing case id
- **WHEN** the user opens the case from the case list
- **THEN** the browser lands on `/cases/<caseId>`
- **AND** the test does not require the retired `/cases/_?caseId=<caseId>` route.

#### Scenario: Current Workbench Tabs

- **GIVEN** the user is on a case workbench
- **WHEN** the E2E navigates between workbench areas
- **THEN** it uses current tab labels such as `補件與現場` and `物件資料總覽`
- **AND** it does not require retired labels such as `補件/現場` or a case-level `資料來源` tab.

### Requirement: Free Pre-Survey E2E

The free pre-survey E2E SHALL verify that the user can complete discovery and create a case from visible result data.

#### Scenario: Discovery Result

- **GIVEN** a supported real address fixture
- **WHEN** the user runs free pre-survey discovery
- **THEN** the page shows the property data completion area and land/building result information
- **AND** the case can be created and opened.

### Requirement: Paid Formal Pull E2E

The paid formal pull E2E SHALL verify visible consent, successful import, and visible actual charge.

#### Scenario: Actual Charge

- **GIVEN** the user confirms a paid formal pull
- **WHEN** the import succeeds
- **THEN** the UI shows an `實際扣款` amount
- **AND** the test accepts the current pricing amount from the UI rather than a retired hard-coded amount.
