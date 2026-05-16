# dossier-land-document Specification Delta

## MODIFIED Requirements

### Requirement: LandPages Cover SHALL NOT render raw CaseDossierData JSON

The Cover component of each PDF theme SHALL NOT render `JSON.stringify(caseData)` or any raw data dump on the cover page. The cover page SHALL display only structured fields: case number, property address, company name, property type label, and generation date.

#### Scenario: Cover page renders without JSON dump

- **WHEN** `PdfDocument` is rendered with any theme and `propertyType: 'land'`
- **THEN** the cover page SHALL NOT contain any JSON-formatted text block
- **AND** the cover page SHALL display the case number, address, and generation date in their designated layout positions
