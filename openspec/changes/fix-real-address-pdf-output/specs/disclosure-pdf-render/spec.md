## ADDED Requirements

### Requirement: Real-address PDF output avoids stale demo data

The system SHALL render customer-facing PDF data from the case and verified dossier source, and SHALL NOT leak known browser-dev placeholder values into exported PDFs.

#### Scenario: Case name is used as PDF property name

- **GIVEN** a building case with `case_name` set to `裕農路測試案`
- **AND** the address is `台南市東區裕農路288巷17號8樓之1`
- **WHEN** the PDF dossier is assembled
- **THEN** the cover property name is `裕農路測試案`
- **AND** the address remains available as the property address.

#### Scenario: Known mock official values are not exported as facts

- **GIVEN** the registry payload contains the known browser-dev certificate placeholder `北松字第012345號`
- **WHEN** the PDF dossier is assembled
- **THEN** the building certificate number is blank.

#### Scenario: Address floor overrides known mock floor placeholder

- **GIVEN** the case address contains `8樓之1`
- **AND** the registry payload floor is the known browser-dev placeholder `013層`
- **WHEN** the PDF dossier is assembled
- **THEN** the property sheet floor is `8樓之1`.

### Requirement: PDF preview waits for a generated blob URL

The PDF preview page SHALL NOT render an iframe with an empty `src` value.

#### Scenario: Preview is still loading

- **GIVEN** the PDF preview blob URL is not ready
- **WHEN** the preview page renders
- **THEN** the page shows a loading placeholder
- **AND** no iframe with an empty `src` is mounted.
