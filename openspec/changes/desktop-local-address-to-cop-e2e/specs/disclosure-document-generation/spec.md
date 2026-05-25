## ADDED Requirements

### Requirement: Disclosure generation uses saved formal JSON only

Pre-survey, HTML preview, and PDF generation SHALL use already saved case data and formal COP JSON. They SHALL NOT trigger a new paid COP query during document generation.

#### Scenario: PDF generated after formal pull

- **GIVEN** a case has saved formal COP JSON
- **WHEN** the user generates HTML preview or PDF
- **THEN** the document SHALL use saved JSON values
- **AND** paid call count SHALL not increase.

#### Scenario: Only candidate or manual reference exists

- **GIVEN** a case has candidate, dev fixture, or manual reference data but no saved formal COP JSON
- **WHEN** the user generates pre-survey preview
- **THEN** the document SHALL show candidate/manual reference fields with a mandatory warning
- **AND** formal transcript fields SHALL NOT be marked trusted.
