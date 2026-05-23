## ADDED Requirements

### Requirement: Dossier assembly applies pre-owner-talk trust precedence

The system SHALL resolve pre-owner-talk dossier fields using the precedence trusted registry/manual data, selected candidate, inferred reference, single land candidate, then blank. Candidate and inferred values SHALL be labeled with their source and SHALL NOT overwrite trusted values.

#### Scenario: Reference values fill talk-before-listing fields

- **WHEN** trusted registry data is unavailable
- **AND** selected candidate or inferred reference data contains building area, use, material, completion date, floor, rights scope, or land share fields
- **THEN** dossier assembly fills those fields in the pre-owner-talk dossier
- **AND** each filled value carries a candidate or inferred source label
- **AND** the dossier includes the fixed disclaimer `地政資料，最終以正式謄本為主；本說明書不代表完整資訊。`

#### Scenario: Trusted values override reference values

- **WHEN** trusted registry or manual-confirmed data exists for a field
- **AND** candidate or inferred data also exists for that field
- **THEN** dossier assembly uses the trusted value
- **AND** candidate or inferred data remains only in comparison or source metadata

##### Example: Trusted registered area wins

- **GIVEN** trusted building registry registered area is `32.80坪`
- **AND** selected candidate registered area is `31.25坪`
- **WHEN** the property sheet registered area is resolved
- **THEN** the value is `32.80坪`
- **AND** `31.25坪` remains only in candidate comparison metadata

### Requirement: Unreliable formal-rights fields remain blank

The system SHALL leave formal-rights fields blank when no trusted registry, title, or manual-confirmed source exists. The system SHALL NOT fill those fields with generic waiting text in the PDF data model.

#### Scenario: No ownership-rights source exists

- **WHEN** a pre-owner-talk dossier has no trusted ownership or mortgage source
- **THEN** acquisition date, title certificate number, other-right type, mortgage amount, mortgage duration, and mortgage details remain blank
- **AND** the generated values do not contain `尚待正式謄本或屋主權狀確認`
- **AND** the blank fields remain available for printed handwriting or later supplement entry
