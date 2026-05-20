## ADDED Requirements

### Requirement: Browser PDF image pages render actual images
The system SHALL render location map, aerial photo, and exterior photo bytes as browser-safe image sources in generated PDF documents.

#### Scenario: PNG location map bytes
- **WHEN** the PDF image helper receives bytes beginning with `89 50 4E 47`
- **THEN** it returns a data URL beginning with `data:image/png;base64,`

##### Example:
- GIVEN `Uint8Array([0x89, 0x50, 0x4E, 0x47])`
- WHEN `uint8ToDataUrl()` is called
- THEN the result prefix is `data:image/png;base64,`

#### Scenario: JPEG street-view bytes
- **WHEN** the PDF image helper receives bytes beginning with `FF D8`
- **THEN** it returns a data URL beginning with `data:image/jpeg;base64,`

##### Example:
- GIVEN `Uint8Array([0xFF, 0xD8, 0xFF])`
- WHEN `uint8ToDataUrl()` is called
- THEN the result prefix is `data:image/jpeg;base64,`

#### Scenario: Browser PDF export uses image bytes
- **WHEN** a browser/dev case preview exports a PDF and dossier data contains non-empty `locationMapImage`, `aerialPhoto`, or `exteriorPhoto`
- **THEN** the exported PDF uses image sources for those pages instead of showing the known placeholder text for that page

##### Example:
- GIVEN case `b24e336a-46db-4cf4-845d-cbd95abee3f8`
- WHEN `/cases/b24e336a-46db-4cf4-845d-cbd95abee3f8/preview` exports a PDF
- THEN at least one of the three image pages contains an actual image and not only placeholder text
