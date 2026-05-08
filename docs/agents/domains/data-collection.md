# Data Collection Domain

Use this guide for upload-first flow, OCR extraction, autofill, source tracking, supplementary forms, and field completeness.

## Primary Code

- `src/lib/schemas/`
- `src/lib/property-types/`
- Upload/OCR/listing API routes under `src/app/api/`
- Listing creation and autofill UI under `src/app/listings/`

## Specs to Open as Needed

- `openspec/specs/upload-first-flow/spec.md`
- `openspec/specs/auto-fill-fields/spec.md`
- `openspec/specs/document-ocr-extraction/spec.md`
- `openspec/specs/pre-listing-data-collection/spec.md`
- `openspec/specs/supplementary-form/spec.md`
- `openspec/specs/supplementary-entry/spec.md`
- `openspec/specs/supplementary-field-completeness/spec.md`

## Rules

- Treat uploaded PDFs as untrusted until validated.
- Do not send raw untrusted PDF input directly to an LLM.
- Preserve field source information for auto-filled values.
- Mark fields edited by the user distinctly from fields imported from documents.
- Do not exceed LLM token limits with raw OCR text; chunk or summarize where the adapter layer expects it.

## Verification

- Add fixtures for OCR/LLM-related behavior when practical.
- Test source tracking and user-edited override behavior.
- For active upload-first work, check `openspec/changes/upload-first-autofill/` if it exists.
