## ADDED Requirements

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

---

### Requirement: Stable public API

The public functions `runCodex(prompt, timeoutMs?)` and `checkCodexStatus()` SHALL maintain their existing TypeScript signatures and return types (`Promise<CodexResult>` and `Promise<CodexStatus>`) regardless of which adapter is active.

#### Scenario: Callers require no changes

- **WHEN** `LLM_BACKEND` is changed from `codex` to any other value
- **THEN** all callers of `runCodex` and `checkCodexStatus` SHALL continue to compile and run without modification

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

---

### Requirement: Claude Code adapter

The `claude-code` adapter SHALL call `claude -p "<prompt>"` and treat a zero-exit-code response as success. The adapter SHALL detect unauthenticated state when stderr contains `not logged in` or `auth`.

#### Scenario: Successful generation

- **WHEN** `LLM_BACKEND=claude-code` and `claude -p "<prompt>"` exits 0 with stdout content
- **THEN** `runCodex(prompt)` SHALL return `{ success: true, output: <stdout>, status: "ready" }`

#### Scenario: Not authenticated

- **WHEN** `claude -p` stderr contains `not logged in`
- **THEN** `checkCodexStatus()` SHALL return `"not-logged-in"`

---

### Requirement: Gemini adapter

The `gemini` adapter SHALL call `gemini -p "<prompt>"` with the same interface contract as the Claude Code adapter.

#### Scenario: Successful generation

- **WHEN** `LLM_BACKEND=gemini` and `gemini -p "<prompt>"` exits 0
- **THEN** `runCodex(prompt)` SHALL return `{ success: true, output: <stdout>, status: "ready" }`

#### Scenario: Quota exceeded

- **WHEN** stderr contains `quota` or `429`
- **THEN** `runCodex(prompt)` SHALL return `{ success: false, status: "quota-exceeded" }`

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
