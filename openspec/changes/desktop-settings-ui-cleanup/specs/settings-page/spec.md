## ADDED Requirements

### Requirement: Desktop settings visible scope

Desktop settings SHALL only show controls for capabilities that are available in the current Desktop release or required to explain account, trial, authorization, and land-query credential status. Unreleased plan tiers and feature switches SHALL NOT be visible to customers.

#### Scenario: Personal settings does not duplicate branding

- **WHEN** the user opens `/settings`
- **THEN** the page SHALL show personal name and Email controls
- **AND** it SHALL NOT show brand color or Logo upload controls

##### Example: Personal settings fields

- **GIVEN** the active settings section is `profile`
- **WHEN** the page renders
- **THEN** `個人名稱與 Email` SHALL be visible
- **AND** `品牌色與 Logo` SHALL NOT be visible

#### Scenario: PDF password is separate from login password

- **WHEN** the user opens `/settings`
- **THEN** the password area SHALL be labelled as PDF opening password
- **AND** the copy SHALL NOT say it is used for Desktop login

##### Example: PDF password copy

- **GIVEN** the active settings section is `profile`
- **WHEN** the password form renders
- **THEN** `PDF 開啟密碼` SHALL be visible
- **AND** `用於登入 AIRE 與開啟加密 PDF` SHALL NOT be visible

#### Scenario: Plans page only shows current basic plan

- **WHEN** the user opens `/settings?section=plans`
- **THEN** the page SHALL show the current basic plan and account status
- **AND** it SHALL NOT show advanced tier, premium tier, upgrade buttons, or unreleased feature switches

##### Example: Basic-only plans page

- **GIVEN** the active settings section is `plans`
- **WHEN** the page renders
- **THEN** `基本款` SHALL be visible
- **AND** `進階款`, `高級款`, `前往升級`, and `預留功能` SHALL NOT be visible
