## ADDED Requirements

### Requirement: PDF check SHALL exclude mock formal registry data

PDF check and generated PDF data assembly SHALL exclude mock, dev fixture, public candidate, and raw probe entries from trusted formal PDF fields. These entries SHALL be shown only as candidate or debug context when the UI explicitly supports that state.

#### Scenario: Mock building registry is not listed as imported PDF data

- **WHEN** a case contains mock building registry data for `台北市大安區和平東路`
- **THEN** PDF check SHALL NOT list that data as `已匯入`
- **THEN** the PDF-ready trusted data set SHALL NOT include that building registry entry

#### Scenario: Manual supplement remains eligible for PDF

- **WHEN** a user manually confirms a supplement field
- **THEN** the PDF check SHALL treat the manual confirmed value as trusted user-provided data
