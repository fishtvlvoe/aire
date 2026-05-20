## ADDED Requirements

### Requirement: Web preview shows uploaded floor-plan photo
The system SHALL render the direct-upload floor-plan or planning-map image in the web HTML preview when dossier data contains `floorPlanPhoto`.

#### Scenario: residential web preview shows floor-plan image
- **WHEN** a residential dossier has non-empty `floorPlanPhoto`
- **THEN** `renderDisclosureHtml()` includes a `格局圖` page with an image using a browser-safe data URL

##### Example:
- GIVEN `CaseDossierData.propertyType = "building"`
- AND `floorPlanPhoto` contains PNG bytes
- WHEN `renderDisclosureHtml()` runs
- THEN the HTML contains `alt="格局圖"` and a `data:image/png;base64,` image source

#### Scenario: land web preview shows planning-map placeholder when missing
- **WHEN** a land dossier has no `floorPlanPhoto`
- **THEN** `renderDisclosureHtml()` includes a `土地規劃圖` page with the placeholder `請上傳規劃圖`

##### Example:
- GIVEN `CaseDossierData.propertyType = "land"`
- AND `floorPlanPhoto = null`
- WHEN `renderDisclosureHtml()` runs
- THEN the HTML contains `土地規劃圖` and `請上傳規劃圖`
