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

### Requirement: Raw registry JSON SHALL remain local and non-downloadable

Raw and parsed registry JSON SHALL remain in the customer local AIRE DB and SHALL be viewable only through App/local Web management detail, not exported as a customer download by default.

#### Scenario: Customer views query evidence

- **GIVEN** a case has saved R02 or COP raw JSON
- **WHEN** the user opens customer-facing case, preview, or PDF screens
- **THEN** the UI SHALL show customer-readable case data
- **AND** it SHALL NOT expose raw JSON download controls.

### Requirement: Supplement image assets SHALL belong to the current case object

Cadastral map, aerial map, floor plan, and landmark map uploads SHALL be supplement assets owned by the current case object. They SHALL NOT be stored as global PDF assets that are reused across unrelated cases or properties.

#### Scenario: User uploads supplement image assets

- **GIVEN** a case object is open in the supplement flow
- **WHEN** the user uploads cadastral map, aerial map, floor plan, or landmark map assets
- **THEN** each uploaded asset SHALL be stored with the current case object
- **AND** the PDF generator SHALL read only assets owned by that case object.

#### Scenario: Another case generates PDF

- **GIVEN** case A has uploaded cadastral map, aerial map, floor plan, or landmark map assets
- **AND** case B has no uploaded assets
- **WHEN** the user generates preview or PDF for case B
- **THEN** case B SHALL NOT reuse case A assets
- **AND** missing image sections SHALL remain blank or show a customer-readable missing-asset state.

### Requirement: PDF SHALL reflect the confirmed object path

PDF assembly SHALL map saved formal registry data and supplement assets according to the confirmed object type. Building PDFs SHALL use building survey fields and building formal data. Land PDFs SHALL use land survey fields and land formal data. Candidate-only or unselected discovery data SHALL NOT be rendered as trusted formal content.

#### Scenario: Building case PDF is generated

- **GIVEN** a building case has confirmed registry key, saved formal COP data, and case-owned supplement assets
- **WHEN** the user generates PDF
- **THEN** the PDF SHALL use building ownership/building fields, building survey fields, and the current case object's floor plan when provided
- **AND** paid call count SHALL not increase.

#### Scenario: Land case PDF is generated

- **GIVEN** a land case has confirmed registry key, saved formal COP data, and case-owned supplement assets
- **WHEN** the user generates PDF
- **THEN** the PDF SHALL use land ownership/land fields, land survey fields, and the current case object's cadastral, aerial, or landmark images when provided
- **AND** paid call count SHALL not increase.

### Requirement: Formal import results SHALL be visible before PDF

After a paid formal registry import completes, the case workbench SHALL show what was acquired, what was not acquired, the fee evidence, and the PDF/object section each acquired field will populate. The main customer UI SHALL use customer-readable labels and SHALL NOT require raw JSON inspection to understand the import result.

#### Scenario: Formal import returns building registry fields

- **GIVEN** a building case has a confirmed building registry key
- **WHEN** paid formal import succeeds
- **THEN** the UI SHALL list acquired fields such as registered area, main building area, auxiliary area, common area, parking area, legal use, construction date, owner, ownership scope, and registration date when present
- **AND** each listed field SHALL show the target object or PDF section
- **AND** missing fields SHALL show a reason such as upstream not returned, needs supplement, or needs official data.

#### Scenario: Formal import completes with no visible mapped fields

- **GIVEN** a formal import run completed and charged a fee
- **WHEN** no acquired field can be mapped into the case or PDF
- **THEN** the UI SHALL show a failure or unmapped-data state
- **AND** it SHALL NOT only show a generic completed state.

### Requirement: PDF SHALL include imported building detail fields or explain missing reasons

Building PDF generation SHALL include saved imported building details when they exist. The generated PDF and the PDF check step SHALL cover registered area, main building area, auxiliary building area, common facility area, parking area, building condition, legal use, owner comparison, logo, real-price summary, life amenities, land value increment tax estimate, and exterior photo state. Missing values SHALL be represented by customer-readable missing reasons in the PDF check step.

#### Scenario: Imported building area breakdown is available

- **GIVEN** saved formal data contains registered area, main building area, auxiliary area, common area, and parking area
- **WHEN** the user opens PDF check or exports PDF
- **THEN** the PDF check SHALL show all five building area fields
- **AND** the generated PDF text SHALL contain the corresponding field labels and values.

#### Scenario: Imported building area breakdown is unavailable

- **GIVEN** saved formal data contains registered area but not main building area, auxiliary area, common area, or parking area
- **WHEN** the user opens PDF check
- **THEN** the missing breakdown fields SHALL be listed as not returned by the upstream or needing official transcript data
- **AND** the user SHALL NOT have to infer the missing state from blank PDF cells.

#### Scenario: Logo and life amenities are available

- **GIVEN** brand logo, nearby amenities, and real-price records are saved for the case
- **WHEN** the user previews or exports PDF
- **THEN** the PDF SHALL include the logo
- **AND** the PDF SHALL include market, park, school, transit, and real-price summary content when present.

#### Scenario: Exterior photo is auto-located incorrectly

- **GIVEN** automatic street-view or exterior-photo generation points to a basement, garage, wrong side, or wrong entrance
- **WHEN** the user uploads a case-owned exterior photo in supplements
- **THEN** the PDF SHALL prefer the uploaded exterior photo over the automatic reference
- **AND** the PDF check SHALL show that the automatic image was overridden by the case-owned supplement.

### Requirement: Land value increment tax SHALL have an estimate mode

The system SHALL provide a first-pass land value increment tax estimate when enough local data exists, while clearly marking that the result is an estimate and listing missing inputs when precision is not possible.

#### Scenario: Estimate can be calculated from available data

- **GIVEN** the case has asking price or comparable real-price data, land share or area, and announced or previous transfer values
- **WHEN** the user opens PDF check or exports PDF
- **THEN** the system SHALL show an estimated land value increment tax
- **AND** it SHALL show the estimate basis rather than presenting it as a final tax authority amount.

#### Scenario: Estimate lacks required inputs

- **GIVEN** the case lacks announced value, previous transfer value, transaction price, or share data
- **WHEN** the user opens PDF check
- **THEN** the tax estimate section SHALL list the missing inputs
- **AND** the PDF SHALL not silently leave the tax section blank.
