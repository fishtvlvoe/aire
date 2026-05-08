# Spectra Workflow

Use Spectra when the work changes behavior, introduces a feature, adjusts architecture, or needs spec traceability.

## When to Use

- Discussion needs structure before coding: `$spectra-discuss`.
- User asks to plan, propose, or design a change: `$spectra-propose`.
- A change is ready to implement: `$spectra-apply`.
- Requirements shift during an active change: `$spectra-ingest`.
- User asks how a behavior works or where it is specified: `$spectra-ask`.
- Implementation is complete and should be archived: `$spectra-archive`.
- Commit only files for one Spectra change: `$spectra-commit`.

## Loading Rules

- Active specs live in `openspec/specs/`.
- Active changes live in `openspec/changes/`.
- Parked changes are hidden from normal change lists. Use `spectra list --parked` if an expected change is missing.
- Do not read every spec. Select by domain and task.

## Current Known Active Change

- `upload-first-autofill`: listing and data-collection domain.

Confirm active state from the filesystem or `npx spectra` before making assumptions.
