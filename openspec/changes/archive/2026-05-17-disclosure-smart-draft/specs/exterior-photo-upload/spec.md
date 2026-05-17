## ADDED Requirements

### Requirement: Render exterior photo in PDF

The system SHALL render an exterior photo page in the PDF. In draft mode, the page SHALL display a placeholder prompt "請於現場拍攝建物外觀". In complete mode, the page SHALL render the uploaded photo.

#### Scenario: Draft mode — no photo uploaded

- **WHEN** exteriorPhoto is null (draft state, before site visit)
- **THEN** the PDF SHALL render a page with gray placeholder box and text "請於現場拍攝建物外觀"

#### Scenario: Complete mode — photo uploaded

- **WHEN** exteriorPhoto contains image bytes (after user uploads)
- **THEN** the PDF SHALL render the photo scaled to fit the page width with aspect ratio preserved

#### Scenario: Conditional page inclusion

- **WHEN** generating PDF and exteriorPhoto is null AND the case is in draft mode
- **THEN** the placeholder page SHALL still be included (to remind the agent to take a photo)

### Requirement: Exterior photo upload and persistence

The system SHALL allow users to upload a JPEG/PNG photo as the exterior image. The photo SHALL be stored in the disclosure_drafts record (as blob or file path reference).

#### Scenario: Upload photo for a case

- **WHEN** user selects a photo file (JPEG or PNG, max 5MB)
- **THEN** the system SHALL save it and associate it with the current case

#### Scenario: Replace existing photo

- **WHEN** user uploads a new photo for a case that already has one
- **THEN** the new photo SHALL replace the previous one
