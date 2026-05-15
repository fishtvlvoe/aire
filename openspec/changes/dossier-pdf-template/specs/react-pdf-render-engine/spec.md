## ADDED Requirements

### Requirement: Engine render function SHALL accept themeId and render PdfDocument

The `render` method exposed by `PdfEngine` (in `src/lib/pdf-engine/engine.ts`) SHALL accept an extended `RenderOptions` that includes an optional `themeId: string` and optional `caseData: CaseDossierData`. When `caseData` is provided, the engine SHALL render `PdfDocument` from `src/lib/pdf-engine/document.tsx` instead of the inline single-page `Text` stub. When `caseData` is absent, the engine SHALL continue to render the existing inline stub (backward compatible path).

#### Scenario: Engine renders PdfDocument when caseData is provided

- **WHEN** `engine.render({ caseId: "C001", content: "", themeId: "theme-a-minimal", caseData: validCaseDossierData })` is called
- **THEN** the returned Blob SHALL contain a multi-page PDF (byte count greater than the stub's single-page byte count)

#### Scenario: Engine falls back to stub render when caseData is absent

- **WHEN** `engine.render({ caseId: "C001", content: "hello" })` is called with no `caseData` field
- **THEN** the returned Blob SHALL be a valid application/pdf Blob without throwing any error

#### Scenario: Engine passes themeId to PdfDocument

- **WHEN** `engine.render({ caseId: "C001", content: "", themeId: "theme-b-professional", caseData: validCaseDossierData })` is called
- **THEN** `PdfDocument` SHALL receive `themeId="theme-b-professional"` as a prop

### Requirement: RenderOptions SHALL be extended with optional caseData and themeId fields

The `RenderOptions` interface in `src/lib/pdf-engine/engine.ts` SHALL be extended with:
- `themeId?: string` — optional theme identifier; defaults to `"theme-a-minimal"` when absent
- `caseData?: CaseDossierData` — optional structured dossier data; when present, triggers `PdfDocument` rendering

These fields SHALL be optional to maintain backward compatibility with existing callers that only pass `caseId` and `content`.

#### Scenario: Existing callers with only caseId and content compile without error

- **WHEN** TypeScript compiles code that calls `engine.render({ caseId: "X", content: "Y" })` without `themeId` or `caseData`
- **THEN** compilation SHALL succeed with no type errors
