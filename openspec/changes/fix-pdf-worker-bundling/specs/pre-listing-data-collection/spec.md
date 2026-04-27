## ADDED Requirements

### Requirement: PDF OCR worker resolution

PDF OCR pipeline SHALL successfully load `pdfjs-dist` worker module in both Next.js development (Turbopack) and production (webpack) builds. The worker resolution SHALL NOT depend on Next.js internal chunk paths (`.next/dev/server/chunks/...`).

#### Scenario: Upload transcript PDF in dev mode triggers successful OCR

- **WHEN** a user uploads a transcript PDF via `/api/listings/{id}/attachments` in `npm run dev` mode
- **THEN** the extract pipeline SHALL complete with status `done` within 60 seconds
- **THEN** `extract-status` SHALL return `done >= 1` and `failed == 0`
- **THEN** `extracted_data.merged_fields` SHALL contain at least 1 field

#### Scenario: Worker module not lost during Turbopack bundling

- **WHEN** the OCR pipeline imports `pdfjs-dist`
- **THEN** the worker module SHALL be resolved via `import.meta.url` or external package configuration
- **THEN** no `Cannot find module 'pdf.worker.mjs'` error SHALL appear in the failed extract record
