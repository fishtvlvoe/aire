# Agent Navigation

This directory is the progressive-loading layer for agents. `AGENTS.md` stays small and routes agents here only when the current task needs more detail.

## Read Order

1. Start with `AGENTS.md`.
2. Pick the relevant domain file from `domains/`.
3. Pick relevant workflow files from `workflows/`.
4. Open the exact `openspec/specs/<name>/spec.md` or `openspec/changes/<change>/` files only after the domain guide points to them.

## Files

- `spectra.md`: Spectra/OpenSpec workflow.
- `domains/listing.md`: Listing records, listing UI flow, field visit, dossiers.
- `domains/documents.md`: Document generation, disclosure documents, templates, marketing text.
- `domains/data-collection.md`: Upload-first flow, OCR, autofill, supplementary fields.
- `domains/property.md`: Property types, dynamic fields, validation, commission lookup.
- `domains/llm-infra.md`: LLM adapters, prompts, timeouts, deployment-sensitive backend behavior.
- `workflows/testing.md`: Test expectations and command selection.
- `workflows/commits.md`: Commit and PR conventions.
- `workflows/deployment.md`: Docker and production deployment checks.

## Validation

Run this after editing agent docs:

```bash
node scripts/validate-agent-docs.mjs
```
