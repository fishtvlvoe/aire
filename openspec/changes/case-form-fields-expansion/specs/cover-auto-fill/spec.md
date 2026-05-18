## ADDED Requirements

### Requirement: assembleDossierData populates cover from brand settings
`assembleDossierData()` SHALL call `get_brand_text_settings` IPC at assembly time and use the returned values to populate `CaseDossierData.cover`: `handlingAgent` from `agent_name`, `licensedAgentName` from `realtor_name`, `licensedAgentCertNo` from `agent_cert_no`, `brokerageCompanyName` from `company_name`, `brokerageLicenseNo` from `company_license_no`, `companyAddress` from `company_address`, `companyPhone` from `company_phone`. `cover.propertyName` SHALL be set from `caseRow.address`. `cover.caseNumber` SHALL be set from `caseRow.case_no` if non-null, otherwise from the first 8 characters of `caseRow.id`.

#### Scenario: Brand settings present
- **WHEN** brand settings contain `company_name: "大安不動產"` and `assembleDossierData()` is called
- **THEN** `CaseDossierData.cover.brokerageCompanyName` equals "大安不動產" and the disclosure cover page renders that company name

#### Scenario: Brand settings empty (first run)
- **WHEN** brand settings have never been configured and `assembleDossierData()` is called
- **THEN** all `cover` text fields default to empty string (`""`) and the cover page renders with blank fields for manual completion

#### Scenario: IPC call fails (dev/mock mode)
- **WHEN** `get_brand_text_settings` IPC throws an error (e.g., in browser dev mode)
- **THEN** `assembleDossierData()` catches the error silently and uses empty string defaults for all cover fields, without throwing
