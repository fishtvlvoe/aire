# react-pdf-render-engine Specification

## Purpose

Initialize the `@react-pdf/renderer` engine, register Traditional Chinese fonts, and provide a single render entry that turns a case data document into a PDF Blob suitable for in-memory preview and disk download.

## ADDED Requirements

### Requirement: System SHALL register NotoSansTC subset font with @react-pdf/font

The system SHALL register the existing `src/resources/fonts/NotoSansTC-Subset.ttf` subset font with `@react-pdf/font` at engine initialization, mapping family name "NotoSansTC" to that file. The system SHALL register both regular and bold weights using the same subset file (synthetic bold acceptable for Phase 1).

#### Scenario: Engine initialization registers the font family

- **WHEN** the engine module first imports
- **THEN** `Font.getRegisteredFontFamilies()` returns an array containing "NotoSansTC"

#### Scenario: Rendered Traditional Chinese characters do not show tofu boxes

- **WHEN** a PDF containing the Traditional Chinese sample "不動產說明書" is rendered to a Buffer
- **THEN** the rendered PDF Buffer contains glyph data for every character in the sample (verified via pdf-parse text extraction matching the input)

### Requirement: Engine SHALL expose a single render entry returning a Blob

The system SHALL expose a function `renderDisclosurePdf(caseData, theme, logo) -> Promise<Blob>` in `src/lib/pdf-engine/index.ts`. The function SHALL not write to disk and SHALL return a Blob whose `type` is `application/pdf`.

#### Scenario: Render returns an application/pdf Blob

- **WHEN** `renderDisclosurePdf(validCaseData, themeA, null)` is called
- **THEN** the returned Promise resolves to a Blob whose `type` equals "application/pdf" and whose `size` is greater than 1000 bytes

#### Scenario: Render does not write to disk

- **WHEN** the render entry executes against a clean tmp directory
- **THEN** no new files appear under any tmp or app local data directory after the Promise resolves

##### Example: Filesystem snapshot before and after

- **GIVEN** snapshot `before = new Set(fs.readdirSync(tmpDir))` and `before_app = new Set(fs.readdirSync(appDataDir))` captured prior to invocation
- **WHEN** `await renderDisclosurePdf(validCaseData, themeA, null)` resolves
- **THEN** `Array.from(new Set(fs.readdirSync(tmpDir))).filter(x => !before.has(x)).length === 0` AND `Array.from(new Set(fs.readdirSync(appDataDir))).filter(x => !before_app.has(x)).length === 0`

### Requirement: Engine SHALL surface a typed error when rendering fails

The system SHALL wrap internal `@react-pdf/renderer` exceptions in a typed `PdfRenderError::EngineFailure` error with the original message attached, and SHALL never let the underlying exception escape unannotated.

#### Scenario: Invalid case data produces typed error

- **WHEN** the render entry is called with case data missing the required `caseId` field
- **THEN** the Promise rejects with `PdfRenderError::EngineFailure` whose `cause` field contains the original validation message

### Requirement: Engine SHALL output PDF version 1.4 compatible files

The system SHALL configure `@react-pdf/renderer` to emit PDF version 1.4 (or whichever version the library defaults to in v4.x) and SHALL document the chosen version in the engine entry file so downstream consumers can rely on it.

#### Scenario: Rendered PDF header declares PDF-1.4 or PDF-1.7

- **WHEN** the render entry produces a Blob
- **THEN** the first 8 bytes of the Blob decoded as ASCII match the pattern `%PDF-1.[4-7]`
