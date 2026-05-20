## ADDED Requirements

### Requirement: Floor-plan photo appears in dossier data
The system SHALL include a direct-upload floor-plan/planning-map image in `CaseDossierData.floorPlanPhoto` when image bytes are available.

#### Scenario: IPC floor-plan photo exists
- **WHEN** `get_floor_plan_photo` returns bytes for the case
- **THEN** `assembleDossierData` returns `floorPlanPhoto` as a matching `Uint8Array`

##### Example:
- GIVEN IPC returns `{ bytes: [1, 2, 3], mime: "image/png" }`
- WHEN `assembleDossierData(caseRow)` completes
- THEN `floorPlanPhoto` equals `Uint8Array([1, 2, 3])`

#### Scenario: web/mock base64 fallback exists
- **WHEN** IPC read fails and `land_registry_data.floor_plan_photo.base64` exists
- **THEN** `assembleDossierData` decodes the base64 value into `floorPlanPhoto`

##### Example:
- GIVEN `floor_plan_photo.base64 = "AQID"`
- WHEN `assembleDossierData(caseRow)` completes after IPC failure
- THEN `floorPlanPhoto` equals `Uint8Array([1, 2, 3])`

#### Scenario: no floor-plan photo exists
- **WHEN** IPC read fails and no base64 fallback exists
- **THEN** `assembleDossierData` returns `floorPlanPhoto = null`

##### Example:
- GIVEN `land_registry_data` has no `floor_plan_photo`
- WHEN `assembleDossierData(caseRow)` completes after IPC failure
- THEN `floorPlanPhoto` is `null`

### Requirement: Floor-plan photo page renders in PDF
The system SHALL render a dedicated PDF page for direct-upload floor-plan/planning-map images.

#### Scenario: residential PDF shows floor-plan page
- **WHEN** a residential dossier renders
- **THEN** the PDF includes a `FloorPlanPhotoPage` titled `格局圖` after the exterior photo page

##### Example:
- GIVEN `CaseDossierData.propertyType = "building"`
- WHEN `PdfDocument` renders
- THEN `FloorPlanPhotoPage` receives title `格局圖`

#### Scenario: land PDF shows planning-map page
- **WHEN** a land dossier renders
- **THEN** the PDF includes a `FloorPlanPhotoPage` titled `土地規劃圖` after the exterior photo page

##### Example:
- GIVEN `CaseDossierData.propertyType = "land"`
- WHEN `PdfDocument` renders
- THEN `FloorPlanPhotoPage` receives title `土地規劃圖`

#### Scenario: missing upload does not block PDF
- **WHEN** `floorPlanPhoto` is `null`
- **THEN** the PDF still renders and shows a title-specific upload placeholder

##### Example:
- GIVEN `floorPlanPhoto = null` and title `格局圖`
- WHEN `FloorPlanPhotoPage` renders
- THEN it shows `請上傳格局圖`
