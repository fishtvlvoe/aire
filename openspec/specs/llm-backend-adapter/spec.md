# llm-backend-adapter Specification

## Purpose

TBD - created by archiving change 'pluggable-llm-backend'. Update Purpose after archive.

## Requirements

### Requirement: Backend selection via environment variable

The system SHALL select the active LLM adapter based on the `LLM_BACKEND` environment variable at process startup. Valid values are `codex`, `claude-code`, `gemini`, and `ollama`. When `LLM_BACKEND` is unset or contains an unrecognized value, the system SHALL default to the `codex` adapter.

#### Scenario: Known backend selected

- **WHEN** `LLM_BACKEND=claude-code` is set in the environment
- **THEN** `runCodex(prompt)` SHALL delegate to the Claude Code CLI adapter

#### Scenario: Unknown backend value

- **WHEN** `LLM_BACKEND=unknown-value` is set
- **THEN** the system SHALL use the `codex` adapter without throwing an error

#### Scenario: Backend unset

- **WHEN** `LLM_BACKEND` is not set
- **THEN** the system SHALL use the `codex` adapter (backward compatible)


<!-- @trace
source: pluggable-llm-backend
updated: 2026-04-18
code:
  - docker/安裝說明.md
  - src/lib/codex-client/adapters/ollama.ts
  - docker/compose.yaml
  - src/lib/codex-client/adapters/codex.ts
  - src/lib/codex-client/index.ts
  - src/lib/codex-client/adapters/claude-code.ts
  - src/lib/codex-client/types.ts
  - src/lib/codex-client/adapters/gemini.ts
tests:
  - src/lib/codex-client/__tests__/adapters/ollama.test.ts
  - src/lib/codex-client/__tests__/codex-client.test.ts
  - src/lib/codex-client/__tests__/adapters/claude-code.test.ts
  - src/lib/codex-client/__tests__/adapters/gemini.test.ts
-->

---
### Requirement: Stable public API

The public functions `runCodex(prompt, timeoutMs?)` and `checkCodexStatus()` SHALL maintain their existing TypeScript signatures and return types (`Promise<CodexResult>` and `Promise<CodexStatus>`) regardless of which adapter is active.

#### Scenario: Callers require no changes

- **WHEN** `LLM_BACKEND` is changed from `codex` to any other value
- **THEN** all callers of `runCodex` and `checkCodexStatus` SHALL continue to compile and run without modification


<!-- @trace
source: pluggable-llm-backend
updated: 2026-04-18
code:
  - docker/安裝說明.md
  - src/lib/codex-client/adapters/ollama.ts
  - docker/compose.yaml
  - src/lib/codex-client/adapters/codex.ts
  - src/lib/codex-client/index.ts
  - src/lib/codex-client/adapters/claude-code.ts
  - src/lib/codex-client/types.ts
  - src/lib/codex-client/adapters/gemini.ts
tests:
  - src/lib/codex-client/__tests__/adapters/ollama.test.ts
  - src/lib/codex-client/__tests__/codex-client.test.ts
  - src/lib/codex-client/__tests__/adapters/claude-code.test.ts
  - src/lib/codex-client/__tests__/adapters/gemini.test.ts
-->

---
### Requirement: Codex adapter preserves existing behavior

The `codex` adapter SHALL reproduce the exact behavior of the current `codex-client/index.ts` implementation, including error classification via stderr pattern matching and the two-step `checkCodexStatus` (version check then health exec).

#### Scenario: Codex CLI installed and authenticated

- **WHEN** `LLM_BACKEND=codex` (or unset) and `codex exec` succeeds
- **THEN** `checkCodexStatus()` SHALL return `"ready"`

#### Scenario: Codex CLI not installed

- **WHEN** `codex --version` fails
- **THEN** `checkCodexStatus()` SHALL return `"error"`

#### Scenario: Codex CLI not logged in

- **WHEN** `codex --version` succeeds but `codex exec` stderr contains `"not logged in"`
- **THEN** `checkCodexStatus()` SHALL return `"not-logged-in"`


<!-- @trace
source: pluggable-llm-backend
updated: 2026-04-18
code:
  - docker/安裝說明.md
  - src/lib/codex-client/adapters/ollama.ts
  - docker/compose.yaml
  - src/lib/codex-client/adapters/codex.ts
  - src/lib/codex-client/index.ts
  - src/lib/codex-client/adapters/claude-code.ts
  - src/lib/codex-client/types.ts
  - src/lib/codex-client/adapters/gemini.ts
tests:
  - src/lib/codex-client/__tests__/adapters/ollama.test.ts
  - src/lib/codex-client/__tests__/codex-client.test.ts
  - src/lib/codex-client/__tests__/adapters/claude-code.test.ts
  - src/lib/codex-client/__tests__/adapters/gemini.test.ts
-->

---
### Requirement: Claude Code adapter

The `claude-code` adapter SHALL call `claude -p "<prompt>"` and treat a zero-exit-code response as success. The adapter SHALL detect unauthenticated state when stderr contains `not logged in` or `auth`.

#### Scenario: Successful generation

- **WHEN** `LLM_BACKEND=claude-code` and `claude -p "<prompt>"` exits 0 with stdout content
- **THEN** `runCodex(prompt)` SHALL return `{ success: true, output: <stdout>, status: "ready" }`

#### Scenario: Not authenticated

- **WHEN** `claude -p` stderr contains `not logged in`
- **THEN** `checkCodexStatus()` SHALL return `"not-logged-in"`


<!-- @trace
source: pluggable-llm-backend
updated: 2026-04-18
code:
  - docker/安裝說明.md
  - src/lib/codex-client/adapters/ollama.ts
  - docker/compose.yaml
  - src/lib/codex-client/adapters/codex.ts
  - src/lib/codex-client/index.ts
  - src/lib/codex-client/adapters/claude-code.ts
  - src/lib/codex-client/types.ts
  - src/lib/codex-client/adapters/gemini.ts
tests:
  - src/lib/codex-client/__tests__/adapters/ollama.test.ts
  - src/lib/codex-client/__tests__/codex-client.test.ts
  - src/lib/codex-client/__tests__/adapters/claude-code.test.ts
  - src/lib/codex-client/__tests__/adapters/gemini.test.ts
-->

---
### Requirement: Gemini adapter

The `gemini` adapter SHALL call `gemini -p "<prompt>"` with the same interface contract as the Claude Code adapter.

#### Scenario: Successful generation

- **WHEN** `LLM_BACKEND=gemini` and `gemini -p "<prompt>"` exits 0
- **THEN** `runCodex(prompt)` SHALL return `{ success: true, output: <stdout>, status: "ready" }`

#### Scenario: Quota exceeded

- **WHEN** stderr contains `quota` or `429`
- **THEN** `runCodex(prompt)` SHALL return `{ success: false, status: "quota-exceeded" }`


<!-- @trace
source: pluggable-llm-backend
updated: 2026-04-18
code:
  - docker/安裝說明.md
  - src/lib/codex-client/adapters/ollama.ts
  - docker/compose.yaml
  - src/lib/codex-client/adapters/codex.ts
  - src/lib/codex-client/index.ts
  - src/lib/codex-client/adapters/claude-code.ts
  - src/lib/codex-client/types.ts
  - src/lib/codex-client/adapters/gemini.ts
tests:
  - src/lib/codex-client/__tests__/adapters/ollama.test.ts
  - src/lib/codex-client/__tests__/codex-client.test.ts
  - src/lib/codex-client/__tests__/adapters/claude-code.test.ts
  - src/lib/codex-client/__tests__/adapters/gemini.test.ts
-->

---
### Requirement: Ollama adapter

The `ollama` adapter SHALL call the Ollama HTTP API at `OLLAMA_BASE_URL` (default `http://localhost:11434`) using `POST /api/generate` with `stream: false` and `model` set to `OLLAMA_MODEL` (default `llama3`). The adapter SHALL NOT require the `ollama` CLI binary.

#### Scenario: Successful generation

- **WHEN** `LLM_BACKEND=ollama` and `POST /api/generate` returns HTTP 200 with `{ response: "..." }`
- **THEN** `runCodex(prompt)` SHALL return `{ success: true, output: <response>, status: "ready" }`

#### Scenario: Service unavailable

- **WHEN** fetch to Ollama throws a connection error
- **THEN** `runCodex(prompt)` SHALL return `{ success: false, error: <message>, status: "error" }`

#### Scenario: Health check

- **WHEN** `checkCodexStatus()` is called with `LLM_BACKEND=ollama`
- **THEN** the adapter SHALL call `GET /api/tags` and return `"ready"` on HTTP 200, `"error"` otherwise

<!-- @trace
source: pluggable-llm-backend
updated: 2026-04-18
code:
  - docker/安裝說明.md
  - src/lib/codex-client/adapters/ollama.ts
  - docker/compose.yaml
  - src/lib/codex-client/adapters/codex.ts
  - src/lib/codex-client/index.ts
  - src/lib/codex-client/adapters/claude-code.ts
  - src/lib/codex-client/types.ts
  - src/lib/codex-client/adapters/gemini.ts
tests:
  - src/lib/codex-client/__tests__/adapters/ollama.test.ts
  - src/lib/codex-client/__tests__/codex-client.test.ts
  - src/lib/codex-client/__tests__/adapters/claude-code.test.ts
  - src/lib/codex-client/__tests__/adapters/gemini.test.ts
-->

---
### Requirement: Fallback chain on backend unavailability

When the preferred backend is unavailable (CLI not found, quota exceeded, or any non-success check), the system SHALL automatically attempt subsequent backends in a deterministic fallback order rather than returning an error immediately.

**Fallback order** (fixed, regardless of `LLM_BACKEND`):

1. Preferred backend (from `LLM_BACKEND` env var, default: `codex`)
2. `gemini`
3. `codex`
4. `claude-code`
5. `ollama`

Duplicates are removed (preferred backend appears only once at position 1).

#### Scenario: Preferred backend quota exceeded

- **GIVEN** `LLM_BACKEND=gemini` is set
- **WHEN** `runCodex(prompt)` is called
- **AND** the Gemini adapter's `check()` returns `"quota-exceeded"`
- **THEN** the system SHALL skip Gemini and attempt the next backend in the fallback order
- **AND** SHALL continue until a backend returns `check() === "ready"` and `run()` succeeds
- **AND** the returned `CodexResult` SHALL include a `usedBackend` field naming the backend that succeeded

#### Scenario: All backends unavailable

- **WHEN** all backends return `check() !== "ready"` or `run().success === false`
- **THEN** `runCodex()` SHALL return `{ success: false, status: "error", error: "All LLM backends failed", usedBackend: null }`

#### Scenario: Preferred backend succeeds immediately

- **GIVEN** the preferred backend's `check()` returns `"ready"`
- **AND** `run()` returns `{ success: true }`
- **THEN** the system SHALL return immediately without probing other backends
- **AND** `usedBackend` SHALL equal the preferred backend name


<!-- @trace
source: llm-backend-auto-fallback
updated: 2026-05-03
code:
  - listings.db
  - kimi-statusline-issue-body.md
  - docs/kimi-prompts-wave1-fix-disclosure.md
  - src/app/api/listings/[id]/generate/route.ts
  - src/lib/codex-client/index.ts
  - src/lib/codex-client/types.ts
  - kimi-statusline-feature-request.md
tests:
  - src/lib/codex-client/__tests__/fallback-chain.test.ts
-->

---
### Requirement: usedBackend field in CodexResult

The `CodexResult` type SHALL include an optional `usedBackend` field of type `string | null`, indicating which adapter successfully processed the request. This field SHALL be `null` when all backends fail.

#### Scenario: Successful run populates usedBackend

- **WHEN** `runCodex(prompt)` completes successfully using the `codex` adapter
- **THEN** the returned `CodexResult.usedBackend` SHALL equal `"codex"`

#### Scenario: All backends fail yields null usedBackend

- **WHEN** all adapters in the fallback chain fail or are unavailable
- **THEN** the returned `CodexResult.usedBackend` SHALL be `null`

<!-- @trace
source: llm-backend-auto-fallback
updated: 2026-05-03
code:
  - listings.db
  - kimi-statusline-issue-body.md
  - docs/kimi-prompts-wave1-fix-disclosure.md
  - src/app/api/listings/[id]/generate/route.ts
  - src/lib/codex-client/index.ts
  - src/lib/codex-client/types.ts
  - kimi-statusline-feature-request.md
tests:
  - src/lib/codex-client/__tests__/fallback-chain.test.ts
-->