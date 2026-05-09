<!-- SPECTRA:START v1.0.2 -->

# Spectra Instructions

This project uses Spectra for Spec-Driven Development(SDD). Specs live in `openspec/specs/`, change proposals in `openspec/changes/`.

## Use `$spectra-*` skills when:

- A discussion needs structure before coding -> `$spectra-discuss`
- User wants to plan, propose, or design a change -> `$spectra-propose`
- Tasks are ready to implement -> `$spectra-apply`
- There's an in-progress change to continue -> `$spectra-ingest`
- User asks about specs or how something works -> `$spectra-ask`
- Implementation is done -> `$spectra-archive`
- Commit only files related to a specific change -> `$spectra-commit`

## Workflow

discuss? -> propose -> apply <-> ingest -> archive

- `discuss` is optional: skip if requirements are clear
- Requirements change mid-work? `ingest` -> resume `apply`

## Parked Changes

Changes can be parked, temporarily moved out of `openspec/changes/`. Parked changes will not appear in `spectra list` but can be found with `spectra list --parked`. To restore: `spectra unpark <name>`. The `$spectra-apply` and `$spectra-ingest` skills handle parked changes automatically.

<!-- SPECTRA:END -->

# AGENTS.md - AIRE Agent Entry

This is the always-read entrypoint for GenAI agents working in `AIRE`. Keep it short. Load detailed guidance only when the current task needs it.

## Project Purpose

`AIRE` is an intelligent real-estate listing and document platform. It helps agents upload official PDF documents, extract/OCR property data, validate fields, and generate compliant disclosure and transaction documents.

Core product capabilities:

- Upload-first autofill from land/building PDFs.
- Seven property-type workflows.
- Five formal document outputs.
- Swappable LLM backends through adapters.
- Lightweight local or Docker deployment.

## Non-Negotiable Rules

1. Never hard-delete a listing without an audit trail.
2. Never modify document templates without version control.
3. Never run LLM inference on untrusted PDF input.
4. Never expose API keys or secrets in logs.
5. Validate request bodies with schemas before mutating data.
6. Use parameterized SQLite queries through project data helpers.
7. Every data INSERT, UPDATE, or DELETE must consider audit logging.
8. Before deployment, run the Docker build path documented for this repo.

## Progressive Loading Policy

Before coding:

1. Read this file.
2. Identify the affected domain from the task routing table.
3. Read only the matching file under `docs/agents/domains/`.
4. Read workflow files under `docs/agents/workflows/` only when the task touches that workflow.
5. Read `docs/agents/spectra.md` when planning, applying, ingesting, archiving, or asking about Spectra changes/specs.
6. Do not bulk-load all specs. Open only the specific `openspec/specs/<name>/spec.md` or active change files needed for the task.

## Task Routing

| If task mentions | Read next |
|---|---|
| listing, object, draft, workflow, field visit, dossier, 物件, 草稿, 現勘, 檔案 | `docs/agents/domains/listing.md` |
| PDF, document, disclosure, template, marketing copy, 文件, 說明書, 契約, 範本 | `docs/agents/domains/documents.md` |
| OCR, autofill, upload, supplementary form, 謄本, 權狀, 自動帶入, 補充資料 | `docs/agents/domains/data-collection.md` |
| property type, validation fields, commission, 房型, 欄位, 驗證, 佣金 | `docs/agents/domains/property.md` |
| LLM, Codex, Claude, Gemini, Ollama, prompt, adapter | `docs/agents/domains/llm-infra.md` |
| tests, coverage, Playwright, Vitest, 測試 | `docs/agents/workflows/testing.md` |
| commit, PR, review, release note | `docs/agents/workflows/commits.md` |
| deploy, docker, production, container, 部署 | `docs/agents/workflows/deployment.md` |
| Spectra, openspec, spec, proposal, change | `docs/agents/spectra.md` |

## Tech Baseline

- Next.js 16.2.4, React 19.2.4, TypeScript 5.x.
- Tailwind CSS 4.x.
- SQLite through `better-sqlite3`.
- Puppeteer, `pdf-parse`, and `marked` for document generation.
- Playwright and Vitest for verification.
- npm for package management.

Confirm exact versions from `package.json` before version-sensitive work.

## Common Commands

```bash
npm run dev
npm run build
npm run lint
npm run test
npm run cleanup:drafts
docker build -t jianan-ai:latest .
docker compose up -d
```

## Documentation Map

- Agent navigation: `docs/agents/README.md`
- Spectra workflow: `docs/agents/spectra.md`
- Current specs: `openspec/specs/`
- Change proposals: `openspec/changes/`
- Legacy/parallel specs: `docs/specs/`
- Architecture decisions: `docs/adr/`
- Project governance: `docs/README.md`

## Maintenance

When adding a new major domain, update this file's task routing table and add a focused file under `docs/agents/domains/`. When adding a repeatable workflow, add it under `docs/agents/workflows/`.
