# LLM Infrastructure Domain

Use this guide for Codex, Claude Code, Gemini, Ollama, prompt management, adapter selection, and LLM-related deployment behavior.

## Primary Code

- `src/lib/codex-client/`
- `src/lib/codex-client/adapters/`
- `src/lib/codex-client/prompts/`
- Docker and environment configuration.

## Specs and ADRs to Open as Needed

- `openspec/specs/llm-backend-adapter/spec.md`
- `openspec/specs/codex-cli-detection/spec.md`
- `openspec/specs/codex-setup-flow/spec.md`
- `openspec/specs/developer-settings/spec.md`
- `docs/adr/ADR-002_llm-backend-pluggability.md`

## Rules

- Keep backend selection environment-driven or configuration-driven, following the adapter pattern.
- Version prompts under `src/lib/codex-client/prompts/`.
- Set LLM call timeout behavior around 60 seconds unless a spec/change says otherwise.
- Never log API keys, full environment dumps, or secrets.
- Keep OCR/listing context within model limits; chunk before calling adapters if needed.

## Verification

- Test adapter selection and failure handling with mocked backends.
- Verify timeout and error response behavior for API routes that call LLMs.
- For Docker-sensitive adapter changes, read `workflows/deployment.md`.
