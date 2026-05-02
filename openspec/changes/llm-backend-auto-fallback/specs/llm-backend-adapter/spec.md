## ADDED Requirements

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

### Requirement: usedBackend field in CodexResult

The `CodexResult` type SHALL include an optional `usedBackend` field of type `string | null`, indicating which adapter successfully processed the request. This field SHALL be `null` when all backends fail.

#### Scenario: Successful run populates usedBackend

- **WHEN** `runCodex(prompt)` completes successfully using the `codex` adapter
- **THEN** the returned `CodexResult.usedBackend` SHALL equal `"codex"`

#### Scenario: All backends fail yields null usedBackend

- **WHEN** all adapters in the fallback chain fail or are unavailable
- **THEN** the returned `CodexResult.usedBackend` SHALL be `null`
