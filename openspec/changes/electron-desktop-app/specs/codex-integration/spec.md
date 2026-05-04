## ADDED Requirements

### Requirement: Codex CLI bundled in application

The system SHALL include Codex CLI (@openai/codex) within the Electron application package so clients do not need separate installation.

#### Scenario: Codex available without separate install

- **WHEN** application is installed on a clean machine
- **THEN** Codex CLI functionality SHALL be available without requiring additional npm install or terminal commands

##### Example: Clean machine test

- **GIVEN** a Windows PC with no Node.js or npm installed
- **WHEN** user installs via AI-不動產說明書系統-Setup-1.0.0.exe and completes setup wizard
- **THEN** clicking "生成不動產說明書" SHALL successfully invoke Codex without any "command not found" error

### Requirement: First-time OpenAI authorization setup

The system SHALL provide a guided setup flow for OpenAI authentication on first launch.

#### Scenario: OAuth authorization flow

- **WHEN** user reaches Step 2 of the setup wizard and clicks "登入 OpenAI"
- **THEN** system SHALL open the default browser to OpenAI's OAuth authorization page
- **THEN** after user authorizes, the token SHALL be stored securely in the application

#### Scenario: Manual API key entry

- **WHEN** user chooses to enter API key manually
- **THEN** system SHALL accept and store the API key after validating it with a test API call

##### Example: Valid manual key

- **GIVEN** user is on setup wizard Step 2 and clicks "手動輸入 API Key"
- **WHEN** user enters "sk-proj-abc123..." and clicks "驗證"
- **THEN** system SHALL call OpenAI API with a test prompt → receive 200 → display "驗證成功" → proceed to Step 3

#### Scenario: Invalid API key

- **WHEN** user enters an invalid API key
- **THEN** system SHALL display "API Key 無效，請確認後重試" and not proceed

### Requirement: Client version locked to Codex

The system SHALL restrict the LLM backend to Codex only in production mode.

#### Scenario: Production mode LLM selection

- **WHEN** application runs with NEXT_PUBLIC_APP_MODE=production
- **THEN** only Codex adapter SHALL be available and no LLM switching UI SHALL be shown

##### Example: Production client UI

- **GIVEN** client machine has NEXT_PUBLIC_APP_MODE=production
- **WHEN** client navigates to any page
- **THEN** no "設定" menu item SHALL exist and all AI calls SHALL route exclusively through Codex

### Requirement: Client must have ChatGPT Plus subscription

The system SHALL validate that the OpenAI token has sufficient access for Codex CLI operations.

#### Scenario: Insufficient subscription

- **WHEN** user's OpenAI account does not have Plus or higher subscription
- **THEN** system SHALL display guidance: "需要 ChatGPT Plus 方案（$20/月）才能使用 AI 功能"
