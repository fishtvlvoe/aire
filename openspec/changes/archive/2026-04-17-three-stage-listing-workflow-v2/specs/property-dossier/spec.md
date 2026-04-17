## ADDED Requirements

### Requirement: Property dossier is generated as a complete property profile

The system SHALL generate a property dossier (物件調查表) that integrates all data from `field_visit_data` and `supplementary_data` into a single comprehensive property profile document.

The dossier SHALL serve as the authoritative reference for all stakeholders (business agents, managers, owners, buyers) and SHALL include:
- Property identification (address, type, listing number)
- Price and area information
- All field visit data organized by section
- All supplementary data (cadastral, legal, market)
- Pros and cons summary
- Photo checklist status

#### Scenario: Generate dossier for farmland listing

- **WHEN** the system generates a dossier for a `farmland` listing with complete field_visit_data and supplementary_data
- **THEN** the output SHALL include sections: 基本資料、土地資料、農業條件、法規資訊、市場行情、優缺點分析
- **THEN** the output SHALL be a PDF file saved to `output/<listing-id>/dossier.pdf`

#### Scenario: Generate dossier for townhouse listing

- **WHEN** the system generates a dossier for a `townhouse` listing
- **THEN** the output SHALL include sections: 基本資料、建物資料、格局配置、車位資訊、社區資訊、法規資訊、優缺點分析

### Requirement: Dossier generation uses Codex CLI

The system SHALL generate the property dossier by calling Codex CLI with a structured prompt containing all property data. The Codex output SHALL be Markdown, which the system SHALL convert to PDF via Puppeteer.

#### Scenario: Codex generates dossier Markdown

- **WHEN** the dossier generator calls Codex CLI with farmland property data
- **THEN** Codex SHALL return a Markdown document with all property sections filled
- **THEN** the system SHALL convert the Markdown to a styled HTML page
- **THEN** Puppeteer SHALL render the HTML to PDF at A4 size

### Requirement: Dossier is included in the generated documents output

The system SHALL add `property_dossier` as a seventh document type in `GeneratedDocuments`, alongside the existing six types.

The `property_dossier` field SHALL contain the Markdown content of the dossier (PDF is derived from this).

#### Scenario: Documents output includes dossier

- **WHEN** the AI generation completes for any listing
- **THEN** `generated_documents` JSON SHALL contain a `property_dossier` key
- **THEN** the document output page SHALL display a download button for the dossier PDF

### Requirement: Dossier can be regenerated independently

The system SHALL allow regenerating the property dossier independently via the regenerate API endpoint, using document type `property_dossier`.

#### Scenario: Regenerate dossier after data update

- **WHEN** a POST request is made to `/api/listings/{id}/regenerate` with `documentType: "property_dossier"`
- **THEN** the system SHALL regenerate only the dossier and update `generated_documents.property_dossier`
