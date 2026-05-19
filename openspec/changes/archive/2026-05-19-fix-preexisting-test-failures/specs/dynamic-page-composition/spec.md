# Dynamic Page Composition

## MODIFIED Requirements

### Requirement: Font Registration Before PDF Rendering in Tests

**Status**: Modified

**Previously**: Tests for `buildDisclosureDoc` (DPC-001 to DPC-008) rendered PDF Documents via `pdf(doc).toBlob()` without registering NotoSansTC, causing `Font family not registered` errors on all tests that actually render a Blob.

**Updated**: The `dynamic-composition.test.tsx` SHALL call `createPdfEngine()` in a `beforeAll` block imported from `@/lib/pdf-engine/engine` to register the NotoSansTC font before any `pdf(...).toBlob()` call.

**Acceptance Criteria**:
- `import { createPdfEngine } from "@/lib/pdf-engine/engine"` added to `dynamic-composition.test.tsx`
- `beforeAll(() => createPdfEngine())` added to the test file (top-level, not inside a describe block)
- DPC-001: Rendering `buildDisclosureDoc({ propertyType: "residential", caseId: "T-MIN", sections: [] })` produces a PDF with `>= 5` pages
- DPC-002: Rendering with 20 survey-table sections produces a PDF with `<= 19` pages
- DPC-003: `condition=false` section does not increase page count vs baseline
- DPC-007: Rendered PDF blob text contains `'第 1 頁'` or `'1 / N'` pattern
- DPC-008: `countPages` with a 100-row survey table returns `tableHeaderRepeated = true` AND rendering produces more than 1 page
- No `Font family not registered: NotoSansTC` error
