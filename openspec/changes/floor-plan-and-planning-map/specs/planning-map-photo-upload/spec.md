## ADDED Requirements

### Requirement: planning-map-upload-ui

The CaseWizardStep3 component for land-type cases SHALL render a "規劃圖上傳" block at the bottom of the disclosure form. The block SHALL contain a file input (`accept="image/jpeg,image/png"`) and a thumbnail preview area. When no photo is stored, the block SHALL display "尚未上傳規劃圖" placeholder text. The file input SHALL have `data-testid="planning-map-file-input"`.

#### Scenario: upload planning map photo

- **GIVEN** a land-type case wizard at Step 3 with no planning map uploaded
- **WHEN** the agent selects a valid PNG file (≤ 10MB)
- **THEN** a thumbnail preview is displayed and `data-testid="planning-map-preview"` is visible

#### Scenario: reject oversized file

- **GIVEN** a land-type case wizard at Step 3
- **WHEN** the agent selects a file larger than 10MB
- **THEN** an error message "圖片大小不超過 10MB" is shown and no photo is stored

### Requirement: planning-map-pdf-page

When `CaseDossierData.floorPlanPhoto` is a non-empty `Uint8Array` and `propertyType === "land"`, the `LandPages` component SHALL render a `FloorPlanPhotoPage` after `ExteriorPhotoPage` with `title="土地規劃圖"`. When `floorPlanPhoto` is null, the page SHALL show placeholder text "請上傳規劃圖" and SHALL NOT throw.

#### Scenario: PDF contains planning map

- **GIVEN** a land case with `floorPlanPhoto` set to valid image bytes
- **WHEN** PDF is exported
- **THEN** the exported PDF contains a page with heading "土地規劃圖" and the actual image

#### Scenario: PDF shows placeholder when no map

- **GIVEN** a land case with `floorPlanPhoto` null
- **WHEN** PDF is exported
- **THEN** no exception is thrown and the page shows "請上傳規劃圖"
