## ADDED Requirements

### Requirement: floor-plan-upload-ui

The CaseWizardStep3 component for building-type cases SHALL render a "格局圖上傳" block at the bottom of the disclosure form. The block SHALL contain a file input (`accept="image/jpeg,image/png"`) and a thumbnail preview area. When no photo is stored, the block SHALL display "尚未上傳格局圖" placeholder text. The file input SHALL have `data-testid="floor-plan-file-input"`.

#### Scenario: upload floor plan photo

- **GIVEN** a building-type case wizard at Step 3 with no floor plan uploaded
- **WHEN** the agent selects a valid JPG file (≤ 10MB)
- **THEN** a thumbnail preview is displayed immediately and `data-testid="floor-plan-preview"` is visible

#### Scenario: reject oversized file

- **GIVEN** a building-type case wizard at Step 3
- **WHEN** the agent selects a file larger than 10MB
- **THEN** an error message "圖片大小不超過 10MB" is shown and no photo is stored

### Requirement: floor-plan-persistence

After uploading a floor plan photo, the system SHALL persist the image bytes. In Tauri mode: `save_floor_plan_photo({ case_id, bytes, mime })` IPC command SHALL be called. In web-mock mode: `casesApi.update(id, { land_registry_data: { ...existing, floor_plan_photo: { base64, mime } } })` SHALL be called. On page reload, the thumbnail SHALL still be visible, confirming persistence.

#### Scenario: photo persists after reload

- **GIVEN** a floor plan photo has been uploaded and saved
- **WHEN** the browser page is refreshed and CaseWizardStep3 is opened
- **THEN** `data-testid="floor-plan-preview"` is visible with the previously uploaded image

### Requirement: floor-plan-pdf-page

When `CaseDossierData.floorPlanPhoto` is a non-empty `Uint8Array`, the `BuildingPages` component SHALL render a `FloorPlanPhotoPage` after `ExteriorPhotoPage`. `FloorPlanPhotoPage` SHALL display a "格局圖" heading and the image using a base64 data URL (via `uint8ToDataUrl`). When `floorPlanPhoto` is null or empty, `FloorPlanPhotoPage` SHALL render with placeholder text "請上傳格局圖" and SHALL NOT throw.

#### Scenario: PDF contains floor plan image

- **GIVEN** a building case with `floorPlanPhoto` set to valid JPEG bytes
- **WHEN** PDF is exported via the web browser path
- **THEN** the exported PDF contains a page with heading "格局圖" and the actual image (not placeholder text)

#### Scenario: PDF shows placeholder when no photo

- **GIVEN** a building case with `floorPlanPhoto` null
- **WHEN** PDF is exported
- **THEN** no exception is thrown and the page shows "請上傳格局圖"
