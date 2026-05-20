## ADDED Requirements

### Requirement: Step 3 floor-plan upload persists one image
The system SHALL let the user upload one JPG or PNG floor-plan/planning-map image from Wizard Step 3 and persist it with the case in browser/dev mode.

#### Scenario: Residential floor-plan upload control
- **WHEN** Step 3 renders for a residential case
- **THEN** it shows a floor-plan upload control with `data-testid="floor-plan-file-input"`

##### Example:
- GIVEN `caseData.property_type = "residential"`
- WHEN `CaseWizardStep3Disclosure` renders
- THEN `floor-plan-file-input` exists

#### Scenario: Land planning-map upload control
- **WHEN** Step 3 renders for a land case
- **THEN** it shows a planning-map upload control with `data-testid="planning-map-file-input"`

##### Example:
- GIVEN `caseData.property_type = "land"`
- WHEN `CaseWizardStep3Disclosure` renders
- THEN `planning-map-file-input` exists

#### Scenario: oversized upload rejected
- **WHEN** the user selects a JPG or PNG larger than 10MB
- **THEN** the system displays `圖片大小不超過 10MB` and does not persist the file

##### Example:
- GIVEN a PNG file of 10MB + 1 byte
- WHEN the user selects it in Step 3
- THEN the error message is visible and `casesApi.update` is not called for `floor_plan_photo`

#### Scenario: uploaded image restored after refresh
- **WHEN** `caseData.land_registry_data.floor_plan_photo` contains `{ base64, mime }`
- **THEN** Step 3 restores the thumbnail preview with `data-testid="floor-plan-preview"`

##### Example:
- GIVEN `land_registry_data.floor_plan_photo.mime = "image/png"`
- WHEN Step 3 loads
- THEN `floor-plan-preview` is visible without selecting a new file
