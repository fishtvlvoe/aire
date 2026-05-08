# Listing Domain

Use this guide for listing records, workflow state, field visit forms, dossier pages, ownership, search, and listing UI.

## Primary Code

- `src/app/listings/`
- `src/lib/listings/`
- Listing-related API routes under `src/app/api/`
- Shared schemas under `src/lib/schemas/`

## Specs to Open as Needed

- `openspec/specs/listing-workflow/spec.md`
- `openspec/specs/listing-ui-flow/spec.md`
- `openspec/specs/field-visit-form/spec.md`
- `openspec/specs/property-dossier/spec.md`
- `openspec/specs/listing-ownership/spec.md`
- `openspec/specs/listing-search/spec.md`
- `openspec/specs/listing-attachments-api/spec.md`
- `openspec/specs/listing-folders/spec.md`

## Rules

- Do not delete listing data without an audit trail.
- Preserve the three-stage listing workflow unless the relevant spec/change updates it.
- Keep complex form state in React state or project state helpers, not URL query strings.
- Use toast-style user feedback for UI errors; avoid `alert()`.
- When auto-filled data appears in listing forms, preserve source metadata and edited state indicators.

## Verification

- For business logic changes, add or update Vitest coverage.
- For navigation or form-flow changes, run focused Playwright coverage when available.
- For data mutations, verify audit-log behavior.
