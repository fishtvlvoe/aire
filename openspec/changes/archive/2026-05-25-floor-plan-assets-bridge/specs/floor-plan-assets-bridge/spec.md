## ADDED Requirements

### Requirement: Floor plan raster assets are stored locally
The system SHALL store newly uploaded case floor plan raster images as local application data linked to a case asset record.

#### Scenario: accepted raster import
- **WHEN** an assistant uploads a PNG, JPEG, or WebP floor plan image with size greater than 0 bytes and at most 10 MB
- **THEN** the system SHALL copy the file into the local application data case-assets directory
- **THEN** the system SHALL create a `case_assets` record with kind `floor_plan`, source `manual_upload`, review_status `approved`, and is_primary `1`

#### Scenario: unsupported raster import
- **WHEN** an assistant uploads a DOCX, executable, SVG, PDF, or unsupported MIME type as a floor plan image
- **THEN** the system SHALL reject the import with error code `unsupported_mime`
- **THEN** the system SHALL NOT create a `case_assets` record

#### Scenario: oversized raster import
- **WHEN** an assistant uploads a supported raster image larger than 10 MB
- **THEN** the system SHALL reject the import with error code `file_too_large`
- **THEN** the system SHALL NOT create a `case_assets` record

### Requirement: Step 3 writes floor plan uploads through case assets
The system SHALL write new Step 3 floor plan uploads through the case asset IPC instead of writing base64 data into the case `land_registry_data` JSON.

#### Scenario: residential Step 3 upload
- **WHEN** an assistant uploads a residential case floor plan from Step 3
- **THEN** the system SHALL call `import_case_asset` with kind `floor_plan` and source `manual_upload`
- **THEN** the preview SHALL show the uploaded image after the import succeeds

#### Scenario: land Step 3 upload
- **WHEN** an assistant uploads a land planning map from Step 3
- **THEN** the system SHALL call `import_case_asset` with kind `floor_plan` and source `manual_upload`
- **THEN** the preview SHALL show the uploaded image after the import succeeds

#### Scenario: legacy preview restore
- **WHEN** a case has no imported case asset but has legacy `land_registry_data.floor_plan_photo`
- **THEN** Step 3 SHALL restore the preview from the legacy field

### Requirement: Disclosure PDF uses case asset before legacy photo
The system SHALL use the approved primary case asset floor plan before falling back to legacy `land_registry_data.floor_plan_photo` when assembling disclosure PDF data.

#### Scenario: case asset exists
- **WHEN** a case has an approved primary floor plan asset
- **THEN** `assembleDossierData` SHALL read the asset bytes through `read_case_asset_bytes`
- **THEN** `floorPlanPhoto` SHALL equal the case asset bytes

#### Scenario: case asset read fails and legacy photo exists
- **WHEN** a case asset exists but reading the bytes fails and legacy `land_registry_data.floor_plan_photo` exists
- **THEN** `assembleDossierData` SHALL set `floorPlanPhoto` from the legacy base64 data
- **THEN** the disclosure PDF generation SHALL continue

#### Scenario: no floor plan image exists
- **WHEN** a case has no floor plan case asset and no legacy floor plan photo
- **THEN** `assembleDossierData` SHALL set `floorPlanPhoto` to null
- **THEN** disclosure PDF generation SHALL continue with a placeholder page
