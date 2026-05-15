# disclosure-pdf-render (delta)

## REMOVED Requirements

### Requirement: PDF template overlay rendering

**Reason**: The previous renderer used `pdf-lib` to overlay text onto a 19-page PNG-backed PDF template. This direction failed two rounds of coordinate calibration and could not handle the 5-19 page dynamic case data the disclosure document actually requires. The new direction switches to `@react-pdf/renderer` with React-driven dynamic composition.

**Migration**: All template overlay logic moves to `react-pdf-render-engine`, `dynamic-page-composition`, and `pdf-theme-system` capabilities. The `src/resources/templates/{residential,land}.pdf` PNG-backed template files are removed; their visual elements are now reproduced as React components inside theme packs (`src/lib/pdf-themes/theme-a-minimal/`, `src/lib/pdf-themes/theme-c-tech-elegant/`). Existing call sites in `src/lib/pdf-renderer.ts` switch to a thin wrapper that delegates to `renderDisclosurePdf` in the new engine.

#### Scenario: Removed — pdf-lib overlay path no longer exists

- **WHEN** the codebase is grepped for `pdf-lib` imports after this change is applied
- **THEN** no source module under `src/lib/` or `src/components/` imports `pdf-lib` for disclosure rendering (the entire overlay path has been removed)

### Requirement: Output file path and post-export behavior

**Reason**: The previous requirement assumed a synchronous "render-then-write-file" pipeline. The new flow renders to a Blob in memory for live preview first, then writes only when the user confirms a save path; the original requirement's behavior is fully covered by `pdf-live-preview` capability's download requirement.

**Migration**: All callers of the previous `exportPdfToPath(path)` interface migrate to the two-step flow exposed by `pdf-live-preview`: `renderDisclosurePdf(...) -> Blob` followed by user-confirmed `writeBlobToPath(blob, userChosenPath)`. The thin wrapper in `src/lib/pdf-renderer.ts` preserves the old `exportPdfToPath` signature by chaining these two calls internally so call sites compile unchanged during migration.

#### Scenario: Removed — direct exportPdfToPath signature is deprecated

- **WHEN** any caller invokes the legacy `exportPdfToPath(path)` interface after this change is applied
- **THEN** the wrapper internally chains `renderDisclosurePdf(...)` followed by `writeBlobToPath(blob, path)` and the synchronous "render-then-write" behavior no longer exists as a primary code path

### Requirement: Failure modes during export

**Reason**: The previous failure modes (font missing on disk, template PDF missing on disk, write permission denied) are obsolete now that fonts register via `@react-pdf/font`, templates are React components compiled into the bundle, and writes happen via Tauri dialog-confirmed paths (which inherently have permission).

**Migration**: New failure modes are defined in `react-pdf-render-engine` (`PdfRenderError::EngineFailure`), `customer-logo-upload` (`LogoUploadError::*`), and `pdf-live-preview` (typed error UI with retry). Any caller previously catching the old error types maps them to the new typed errors via the thin wrapper in `src/lib/pdf-renderer.ts`.

#### Scenario: Removed — old "font missing on disk" / "template missing" failure paths

- **WHEN** the codebase is inspected after this change is applied
- **THEN** no code path returns the legacy error variants `FontMissingOnDisk`, `TemplateMissingOnDisk`, or `WritePermissionDenied`; all rendering failures surface as the new typed errors `PdfRenderError::EngineFailure`, `LogoUploadError::*`, or `BrandingError::*`

## MODIFIED Requirements

### Requirement: Embedded Traditional Chinese font

The system SHALL embed the NotoSansTC subset font through `@react-pdf/font` registration at engine initialization. The system SHALL register family name "NotoSansTC" mapped to `src/resources/fonts/NotoSansTC-Subset.ttf` for both regular and bold weights and SHALL be used as the default font for all PDF text content.

#### Scenario: NotoSansTC family is the default for PDF text

- **WHEN** any block component renders text without an explicit `fontFamily` style override
- **THEN** the rendered PDF uses NotoSansTC glyphs (verified by extracting font info from the PDF with pdf-parse — the default font family resolves to "NotoSansTC")

#### Scenario: Traditional Chinese sample renders without tofu

- **WHEN** a PDF containing the sample "不動產說明書 — 大林新城三房平車" renders
- **THEN** every Traditional Chinese character in the sample has a corresponding glyph in the embedded subset (no missing-glyph boxes in the rendered output, verified by visual diff against a known-good fixture image with tolerance < 1% pixel diff)

## ADDED Requirements

### Requirement: disclosure-pdf-render SHALL delegate to react-pdf-render-engine

The system SHALL move all rendering invocations through the entry point `renderDisclosurePdf` defined by the `react-pdf-render-engine` capability. The existing module `src/lib/pdf-renderer.ts` SHALL act as a thin wrapper that forwards calls to the new engine without performing any rendering work of its own.

#### Scenario: Legacy callers reach the new engine

- **WHEN** any existing call site (e.g., `src/components/disclosure-form-residential.tsx`) invokes the legacy `renderDisclosurePdf` export from `src/lib/pdf-renderer.ts`
- **THEN** the call is forwarded to `src/lib/pdf-engine/index.ts` `renderDisclosurePdf` AND the legacy wrapper itself does not import `pdf-lib`
