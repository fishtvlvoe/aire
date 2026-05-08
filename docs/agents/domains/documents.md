# Documents Domain

Use this guide for generated PDFs, disclosure documents, document templates, document versions, and post-listing marketing output.

## Primary Code

- `src/lib/document-generator/`
- `src/app/api/listings/[id]/documents/`
- Template and prompt files referenced by the document generator.

## Specs to Open as Needed

- `openspec/specs/document-generation/spec.md`
- `openspec/specs/disclosure-document-generation/spec.md`
- `openspec/specs/five-documents-generator/spec.md`
- `openspec/specs/fillable-pdf-output/spec.md`
- `openspec/specs/serverless-pdf/spec.md`
- `openspec/specs/post-listing-marketing/spec.md`

## Rules

- Never modify a document template without versioning or preserving traceability.
- Generated legal/transaction documents need stable, reproducible input mapping.
- Do not silently drop unknown fields from OCR/listing data if the output depends on them.
- Keep API errors in the shared shape: `{ error: string, code?: string, details?: any }`.

## Verification

- Document-generation changes need focused tests for mapping/rendering logic.
- PDF output changes should be checked with Playwright or an equivalent rendered-output verification.
- If layout is changed, verify representative property types, not only one happy path.
