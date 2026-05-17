## MODIFIED Requirements

### Requirement: Render exterior photo in PDF

The system SHALL render an exterior photo page in the PDF unconditionally (regardless of whether a photo exists). When exteriorPhoto is null or empty, the page SHALL display a gray placeholder box with text instructing the agent to take a photo. When exteriorPhoto contains image bytes, the page SHALL render the photo scaled to fit the page width with aspect ratio preserved. The html-renderer SHALL NOT skip the exterior photo page when exteriorPhoto is null.

#### Scenario: Draft mode with no photo shows placeholder page

- **WHEN** exteriorPhoto is null and the PDF is generated
- **THEN** the PDF SHALL include the exterior photo page with placeholder text visible in the rendered HTML

#### Scenario: Complete mode with photo shows image

- **WHEN** exteriorPhoto contains valid image bytes
- **THEN** the PDF SHALL render the photo scaled to fit within the page
