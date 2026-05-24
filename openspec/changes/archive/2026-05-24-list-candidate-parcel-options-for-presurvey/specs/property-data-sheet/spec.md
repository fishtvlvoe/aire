## ADDED Requirements

### Requirement: Property data sheet displays candidate values with warnings

The system SHALL display candidate-derived property values in the property data sheet when trusted values are unavailable. Every candidate-derived value SHALL be visually labeled as candidate data and the page SHALL include a confirmation warning.

#### Scenario: Building sheet uses selected candidate values

- **WHEN** a building case has selected candidate data with registered area, main building area, legal use, construction date, floor, and age
- **THEN** the PDF property data sheet displays those values
- **AND** the PDF marks the section as `候選資料，待屋主/權狀確認`

#### Scenario: No candidate selected

- **WHEN** a building case has multiple candidate buildings and no selected candidate
- **THEN** the PDF property data sheet displays a candidate comparison section instead of silently leaving all building fields blank
- **AND** the PDF instructs the user to confirm the matching building number before formal delivery

##### Example: Candidate comparison replaces blank building fields

- **GIVEN** address `台南市東區裕農路288巷17號8樓之1`
- **AND** building candidates `DC-1556-00165000` and `DC-1556-00167000` exist
- **AND** no `selected_candidate_ids.building` is set
- **WHEN** the PDF is exported
- **THEN** the property data sheet includes a candidate comparison section
- **AND** the detailed building fields are not presented as silently final blank values

### Requirement: Candidate comparison appears in pre-survey PDF

The system SHALL include a candidate comparison table in the pre-survey PDF when more than one land or building candidate exists. The comparison table SHALL list candidate id, source, query status, available fields, and confirmation state.

#### Scenario: Four building candidates appear in PDF

- **WHEN** a case has four building candidates and one land candidate
- **THEN** the pre-survey PDF lists all four building candidates and the land candidate
- **AND** no candidate is hidden because another candidate has more complete data

##### Example: Yunong candidate table

- **GIVEN** land candidate `DC-1556-00700000`
- **AND** building candidates `DC-1556-00165000`, `DC-1556-00167000`, `DC-1556-00229000`, and `DC-1556-00230000`
- **WHEN** the pre-survey PDF renders candidate comparison
- **THEN** all five normalized parcel ids appear in the PDF text
- **AND** each row shows source, query status, and confirmation state

### Requirement: Property data sheet displays inferred reference values

The system SHALL display inferred reference values in the property data sheet when no selected or trusted candidate value exists and same-building unit analysis can produce a reference estimate. Inferred values SHALL be labeled `推測資料，非登記資料` and SHALL include the source unit list or value range.
Every candidate or inferred pre-survey PDF SHALL include the disclaimer text `地政資料，最終以正式謄本為主；本說明書不代表完整資訊。`

#### Scenario: Same suffix estimate fills otherwise blank area fields

- **WHEN** the target unit is `8樓之1`
- **AND** same-suffix reference units provide registered area and main building area estimates
- **THEN** the PDF property data sheet displays the estimated registered area and main building area instead of blank fields
- **AND** the PDF labels those fields as inferred reference values
- **AND** the PDF displays `地政資料，最終以正式謄本為主；本說明書不代表完整資訊。`

#### Scenario: Inferred values never replace trusted values

- **WHEN** trusted registry data exists for registered area and main building area
- **THEN** the property data sheet displays trusted registry values
- **AND** inferred reference values appear only in the source note or comparison section

##### Example: Trusted area wins over same-suffix estimate

- **GIVEN** trusted building registry area is `32.80坪`
- **AND** same-suffix inferred reference area is `31.25坪`
- **WHEN** the property data sheet renders registered area
- **THEN** it displays `32.80坪`
- **AND** `31.25坪` appears only as inferred reference context, not as the official field value
