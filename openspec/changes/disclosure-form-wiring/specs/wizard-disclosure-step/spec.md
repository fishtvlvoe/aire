## ADDED Requirements

### Requirement: Step rendering by property type

CaseWizard SHALL render a new Step 3 labelled "揭露資料". When `propertyType === "residential"`, Step 3 SHALL render `DisclosureFormResidential`. When `propertyType === "land"`, Step 3 SHALL render `DisclosureFormLand`. All prior steps SHALL remain unchanged; the former Step 3 (實價登錄) becomes Step 4 and the former Step 4 (預覽匯出) becomes Step 5.

#### Scenario: Residential case reaches Step 3

- **WHEN** a user navigates to Step 3 of a case with `property_type = "residential"`
- **THEN** the residential disclosure form is displayed with at least the fields 建物面積, 屋齡, and 建物現況 visible

#### Scenario: Land case reaches Step 3

- **WHEN** a user navigates to Step 3 of a case with `property_type = "land"`
- **THEN** the land disclosure form is displayed with at least the fields 地號, 地目, and 土地面積 visible

### Requirement: Draft load on mount

On Step 3 mount, the component SHALL call `get_draft(caseId)`. If the result is non-null, the form SHALL be pre-populated with the deserialized `payload_json`. If the result is null, all form fields SHALL render empty without error.

#### Scenario: Returning to Step 3 with existing data

- **WHEN** a user previously filled disclosure fields, navigated away, and returns to Step 3
- **THEN** all previously entered values are restored in the form

#### Scenario: First visit to Step 3 on a new case

- **WHEN** a user reaches Step 3 for the first time on a new case with no prior draft
- **THEN** all form fields are empty and no error is shown

### Requirement: Autosave on field change

The step SHALL use `use-draft-autosave` with a 1-second debounce. Every field change SHALL trigger a debounced `save_draft(caseId, payload, schemaVersion)` call. Cmd/Ctrl+S SHALL flush the save immediately.

#### Scenario: Field change triggers autosave

- **WHEN** the user changes any field value in Step 3
- **THEN** `save_draft` is called within 1 second with the updated payload

### Requirement: Navigation does not block on empty fields

"上一步" SHALL navigate to Step 2. "下一步" SHALL navigate to Step 4. Navigation SHALL NOT be blocked by empty or invalid disclosure fields. Current form state SHALL be saved before any navigation.

#### Scenario: Advancing with empty fields

- **WHEN** the user clicks "下一步" while all disclosure fields are empty
- **THEN** navigation proceeds to Step 4 without any validation error
