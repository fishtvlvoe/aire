## ADDED Requirements

### Requirement: Developer settings panel

The system SHALL provide a settings panel visible only in development mode for configuring LLM backend and debug options.

#### Scenario: Panel visibility in development mode

- **WHEN** application runs with NEXT_PUBLIC_APP_MODE=development
- **THEN** a "設定" menu item SHALL be visible in the navigation

#### Scenario: Panel hidden in production mode

- **WHEN** application runs with NEXT_PUBLIC_APP_MODE=production
- **THEN** no "設定" menu item SHALL be visible

### Requirement: LLM backend switching

The system SHALL allow developers to switch between Claude, Gemini, and Codex backends in development mode.

#### Scenario: Switch LLM backend

- **WHEN** developer selects a different LLM backend in the settings panel
- **THEN** subsequent AI operations SHALL use the selected backend

##### Example: Switch to Gemini

- **GIVEN** current backend is "Codex" and developer is on /settings
- **WHEN** developer selects "Gemini" from the LLM dropdown and clicks "儲存"
- **THEN** next AI call (e.g., generate disclosure document) SHALL route through the Gemini adapter

### Requirement: Debug mode toggle

The system SHALL provide a debug mode toggle that shows additional diagnostic information.

#### Scenario: Enable debug mode

- **WHEN** developer enables debug mode in settings
- **THEN** LLM request/response logs, token counts, and timing information SHALL be displayed in a debug panel

##### Example: Debug panel output

- **GIVEN** debug mode is enabled and developer triggers "生成不動產說明書"
- **WHEN** LLM call completes
- **THEN** debug panel SHALL show: "Backend: Codex | Tokens: 1,234 in / 567 out | Time: 3.2s | Status: 200"
