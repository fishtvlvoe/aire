## ADDED Requirements

### Requirement: Property type selection
The case detail page SHALL use tab-based switching ("成屋資訊" / "土地資訊") for property type display. The system SHALL NOT render a separate dropdown select for property type. The tab selection SHALL reflect the case's `property_type` value.

#### Scenario: Residential case loads
- **WHEN** user opens a case with `property_type='residential'`
- **THEN** the "成屋資訊" tab is active and the dropdown select is absent

### Requirement: Auto-fill land lot and building lot numbers
For residential cases, the `land_lot_no` and `building_lot_no` fields SHALL NOT appear in the Step 1 form. These fields SHALL be auto-populated from the land registry query result in Step 2. After Step 2 completion, the values SHALL be visible as read-only fields.

#### Scenario: Step 1 form fields
- **WHEN** user is on Step 1 for a residential case
- **THEN** the form shows "所有權人", "地址", and other basic fields but NOT "土地地號" or "建物地號"

#### Scenario: After land registry pull
- **WHEN** user completes Step 2 and land registry returns `lot_number='大安段1234'`
- **THEN** the case record's `land_lot_no` is set to "大安段1234" and displays as read-only in the form

### Requirement: Typo correction in placeholder text
The placeholder text for the notes field SHALL read "其他備註事項" (correct Traditional Chinese). The system SHALL NOT display "其他備注事項".

#### Scenario: Notes field placeholder
- **WHEN** user views the notes field in the case detail form
- **THEN** the placeholder reads "其他備註事項"
