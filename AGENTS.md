<!-- SPECTRA:START v1.0.2 -->

# Spectra Instructions

This project uses Spectra for Spec-Driven Development(SDD). Specs live in `openspec/specs/`, change proposals in `openspec/changes/`.

## Use `$spectra-*` skills when:

- A discussion needs structure before coding → `$spectra-discuss`
- User wants to plan, propose, or design a change → `$spectra-propose`
- Tasks are ready to implement → `$spectra-apply`
- There's an in-progress change to continue → `$spectra-ingest`
- User asks about specs or how something works → `$spectra-ask`
- Implementation is done → `$spectra-archive`
- Commit only files related to a specific change → `$spectra-commit`

## Workflow

discuss? → propose → apply ⇄ ingest → archive

- `discuss` is optional — skip if requirements are clear
- Requirements change mid-work? `ingest` → resume `apply`

## Parked Changes

Changes can be parked（暫存）— temporarily moved out of `openspec/changes/`. Parked changes won't appear in `spectra list` but can be found with `spectra list --parked`. To restore: `spectra unpark <name>`. The `$spectra-apply` and `$spectra-ingest` skills handle parked changes automatically.

<!-- SPECTRA:END -->

<!-- graphify:auto:start -->
## graphify

This project keeps a local knowledge graph in `graphify-out/`.

Rules:
- For broad codebase questions, read `graphify-out/GRAPH_REPORT.md` before opening source files.
- For relationship questions, prefer `graphify query`, `graphify path`, or `graphify explain` against this project's local `graphify-out/graph.json`.
- Do not inspect unrelated sibling projects unless the user explicitly asks for cross-project context.
- The workspace-level project index is `/Users/fishtv/Development/graphify-projects.json`.
- Maintained by `/Users/fishtv/Development/batch-graphify.sh` for `products/AIRE`.
<!-- graphify:auto:end -->
