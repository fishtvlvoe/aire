## ADDED Requirements

### Requirement: Case floor plan assets are stored locally
The system SHALL store every case floor plan asset as local application data linked to a case record, with metadata that records asset kind, source, MIME type, file name, byte size, storage path, review status, and creation/update timestamps.

#### Scenario: accepted raster floor plan import
- **WHEN** an assistant imports a PNG, JPEG, or WebP floor plan for an existing case
- **THEN** the system stores the file under the local application data directory and creates a case asset record with review status `pending`

#### Scenario: rejected unsupported floor plan import
- **WHEN** an assistant imports a DOCX, executable, or unsupported file type as a floor plan asset
- **THEN** the system rejects the import and returns a validation error without creating a case asset record

#### Scenario: deleted floor plan asset
- **WHEN** an assistant deletes a floor plan asset from a case
- **THEN** the system removes the metadata record and removes the stored local file when it exists

### Requirement: Source trust and review status are explicit
The system SHALL assign every floor plan asset a source value, trust tier, and review status so generated schematic images cannot be confused with measured or owner-provided plans.

#### Scenario: measured external tool import
- **WHEN** an assistant imports an image exported from Magicplan, Homestyler, CubiCasa, RoomSketcher, Apple RoomPlan, or another measured floor plan tool
- **THEN** the asset metadata records the named source and classifies the asset as an external measured plan pending human review

#### Scenario: AI schematic draft creation
- **WHEN** the system receives a floor plan image generated from an OpenAI or ChatGPT image workflow
- **THEN** the asset metadata records source `openai_image`, classifies the asset as an AI schematic draft, and keeps review status `pending`

#### Scenario: approved floor plan asset
- **WHEN** an authorized user approves a pending floor plan asset
- **THEN** the system records review status `approved`, reviewer identity when available, and the Asia/Taipei review timestamp

### Requirement: Uploaded or imported floor plan appears in disclosure PDF
The system SHALL include the approved primary floor plan asset in the generated real estate disclosure PDF and SHALL omit pending or rejected floor plan assets from the PDF.

#### Scenario: approved primary floor plan exists
- **WHEN** the case has one approved primary floor plan asset and the assistant generates the disclosure PDF
- **THEN** the PDF includes a dedicated floor plan page with the image, source label, review timestamp, and disclaimer text

#### Scenario: no approved primary floor plan exists
- **WHEN** the case has no approved primary floor plan asset and the assistant generates the disclosure PDF
- **THEN** the PDF generation completes without a floor plan page and without failing the entire dossier

#### Scenario: AI schematic disclaimer
- **WHEN** the approved primary floor plan source is `openai_image`
- **THEN** the PDF page labels the image as a schematic floor plan and states that it is generated from survey or verbal input for layout reference only

### Requirement: AI schematic floor plan generation uses structured briefs
The system SHALL generate or accept AI schematic floor plan drafts only from a structured floor plan brief that records rooms, approximate dimensions, adjacency, entrance, balcony, kitchen, bathrooms, windows, orientation, and uncertainty notes.

#### Scenario: complete structured brief
- **WHEN** an assistant submits a structured brief with room names, approximate dimensions, and adjacency information
- **THEN** the system produces or records an AI schematic floor plan draft request with source metadata, prompt fingerprint, model identifier, and review status `pending`

#### Scenario: incomplete structured brief
- **WHEN** an assistant submits an AI schematic request without room list or adjacency information
- **THEN** the system blocks the generation request and returns a missing-field validation error

#### Scenario: generated draft requires review
- **WHEN** an AI schematic floor plan image is created successfully
- **THEN** the system stores it as a pending floor plan asset and requires human approval before PDF inclusion

### Requirement: External floor plan integrations are import-first
The system SHALL support Magicplan, Homestyler, CubiCasa, RoomSketcher, and Apple RoomPlan as import-first sources by preserving source metadata and imported output files before any vendor-specific API automation is added.

#### Scenario: external PNG export import
- **WHEN** an assistant imports a PNG exported from Magicplan or Homestyler
- **THEN** the system stores the image, records the selected external source, and makes the asset available for review

#### Scenario: external metadata captured
- **WHEN** an assistant supplies external project metadata such as project ID, export URL, or capture date
- **THEN** the system stores that metadata with the floor plan asset record without exposing it in the PDF unless explicitly mapped

#### Scenario: vendor API unavailable
- **WHEN** Magicplan, Homestyler, CubiCasa, RoomSketcher, or Apple RoomPlan API automation is unavailable
- **THEN** the system still supports manual export/import of floor plan image files for the case
