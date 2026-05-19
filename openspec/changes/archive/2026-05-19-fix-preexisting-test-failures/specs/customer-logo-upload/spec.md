# Customer Logo Upload

## MODIFIED Requirements

### Requirement: Test Mock Layer for safeInvoke

**Status**: Modified

**Previously**: Tests for `logo-upload.ts` (CLU-005, CLU-009) mocked `@tauri-apps/api/core` `invoke` directly.

**Updated**: Tests for `uploadLogo` and `deleteLogo` SHALL mock `@/lib/tauri-bridge` `safeInvoke` since those functions call `safeInvoke` internally, not the raw Tauri core `invoke`.

**Acceptance Criteria**:
- `vi.mock("@/lib/tauri-bridge", ...)` is present in `logo-anchors.test.tsx`
- `safeInvoke` is stubbed to resolve with the expected metadata fixture
- CLU-005 (4 tests): `uploadLogo` returns `{ success: true, metadata: { filename, mimeType, sizeBytes, uploadedAt } }`
- CLU-009 (2 tests): `deleteLogo` calls `safeInvoke("delete_logo", { preserve_theme_id: true })` and returns `{ success: true }`
- All 4 CLU-005 tests and 2 CLU-009 tests pass without `NotInTauriError`

### Requirement: Font Registration Before PDF Rendering in Tests

**Status**: Modified

**Previously**: Tests for `PdfHeaderWithLogo` (CLU-007, CLU-008) rendered PDF components without registering the NotoSansTC font, causing `Font family not registered` errors.

**Updated**: Tests that call `@react-pdf/renderer` `pdf(...).toBlob()` or render `PdfHeaderWithLogo` SHALL call `createPdfEngine()` in a `beforeAll` block to ensure NotoSansTC is registered before any PDF rendering occurs.

**Acceptance Criteria**:
- `beforeAll(() => createPdfEngine())` is present in `logo-anchors.test.tsx`
- CLU-007: 12-page PDF with `logoDataUrl` contains logo image in every page header
- CLU-008: `PdfHeaderWithLogo` with `logoDataUrl = undefined` renders the placeholder text `（未設定 LOGO）`
- No `Font family not registered: NotoSansTC` error
