## MODIFIED Requirements

### Requirement: disclosure cover page renders brand text fields
The disclosure cover page (`CoverPage` component) SHALL render the following fields using values from `CaseDossierData.cover`: `brokerageCompanyName` (公司名稱), `brokerageLicenseNo` (牌照號), `companyAddress` (公司地址), `companyPhone` (公司電話), `handlingAgent` (業務員姓名), `licensedAgentName` (不動產經紀人), `licensedAgentCertNo` (業務員證號). When a field value is empty string, the field SHALL render as a blank printable line.

#### Scenario: Cover page with full brand data
- **WHEN** `CaseDossierData.cover.brokerageCompanyName` is "大安不動產" and the PDF is generated
- **THEN** the cover page renders "大安不動產" in the brokerage company name position

#### Scenario: Cover page with no brand data
- **WHEN** all `CaseDossierData.cover` text fields are empty string
- **THEN** the cover page renders blank fields suitable for manual completion
