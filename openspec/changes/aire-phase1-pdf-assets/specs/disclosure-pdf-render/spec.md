## ADDED Requirements

### Requirement: Disclosure template PDF assets SHALL exist on disk
The disclosure PDF renderer SHALL find both residential and land disclosure template PDF files at fixed paths under the application resources directory. The files SHALL be readable by `pdf-lib`'s `PDFDocument.load()` without throwing.

#### Scenario: Residential template is present and loadable
- **WHEN** the renderer initializes for a residential case
- **THEN** the file at `src/resources/templates/residential.pdf` SHALL exist
- **AND** `pdf-lib` SHALL load it without throwing `TemplateNotFoundError`

#### Scenario: Land template is present and loadable
- **WHEN** the renderer initializes for a land case
- **THEN** the file at `src/resources/templates/land.pdf` SHALL exist
- **AND** `pdf-lib` SHALL load it without throwing `TemplateNotFoundError`

#### Scenario: Missing template surfaces a typed error
- **WHEN** a template file is absent at runtime
- **THEN** the renderer SHALL throw `TemplateNotFoundError` with `code: TEMPLATE_MISSING`
- **AND** SHALL NOT crash the host process

### Requirement: Subsetted Traditional Chinese font SHALL exist and stay under the size budget
The disclosure PDF renderer SHALL load a Noto Sans TC subset font for embedding into generated PDFs. The font SHALL cover every character listed in the project character inventory and SHALL stay below the size budget so that bundled installers remain compact.

#### Scenario: Subset font asset is present and loadable
- **WHEN** the renderer initializes
- **THEN** the file at `src/resources/fonts/NotoSansTC-Subset.ttf` SHALL exist
- **AND** `@pdf-lib/fontkit` SHALL register it without throwing `FontNotFoundError`

#### Scenario: Subset font respects the 2 MB upper bound
- **WHEN** the subset font asset is built from `scripts/subset-font.py` and `scripts/real-estate-chars.txt`
- **THEN** the produced TTF file size SHALL be strictly less than 2,097,152 bytes (2 MB)

#### Scenario: Subset font covers every required glyph
- **WHEN** the renderer draws any character listed in `scripts/real-estate-chars.txt`
- **THEN** the glyph SHALL render without falling back to a tofu (missing-glyph) box

### Requirement: Existing PDF renderer test suite SHALL pass after assets land
The existing test suite at `src/lib/pdf-renderer.test.ts` SHALL pass without modification once the template PDFs and the subset font asset are in place.

#### Scenario: Renderer test suite turns green
- **WHEN** the developer runs the project test command targeting `src/lib/pdf-renderer.test.ts`
- **THEN** every test case SHALL pass
- **AND** the test file itself SHALL NOT have been edited as part of this change
