## MODIFIED Requirements

### Requirement: First-time OpenAI authorization setup

The system SHALL provide a guided setup flow for OpenAI authentication on first launch. The flow SHALL use manual API Key entry with server-side verification (calling OpenAI `GET /v1/models`), NOT OAuth browser redirect.

#### Scenario: Manual API key entry

- **WHEN** user reaches Step 2 of the setup wizard on `/setup/codex`
- **THEN** system SHALL display an API Key input field and "驗證" button
- **WHEN** user enters a valid API Key and clicks "驗證"
- **THEN** system SHALL call `POST /api/setup/verify-openai` to validate the key
- **THEN** on success, the key SHALL be encrypted (AES-256-GCM) and stored in SQLite `settings` table
- **THEN** system SHALL redirect to homepage `/`

#### Scenario: Invalid API key

- **WHEN** user enters an invalid API key and clicks "驗證"
- **THEN** system SHALL display "API Key 無效，請確認後重試" and NOT proceed

##### Example: Valid manual key

- **GIVEN** user is on `/setup/codex` page
- **WHEN** user enters "sk-proj-abc123..." and clicks "驗證"
- **THEN** system calls `POST /api/setup/verify-openai` with `{ "apiKey": "sk-proj-abc123..." }` → receives `{ "valid": true }` → stores encrypted key → redirects to `/`

### Requirement: 生產模式鎖定

當 `NEXT_PUBLIC_APP_MODE=production` 時，系統 SHALL 只使用 Codex 後端，隱藏開發者設定 UI。codex-client 初始化時 SHALL 強制使用 Codex adapter，忽略其他 adapter 設定。

#### Scenario: 生產模式隱藏設定

- **WHEN** app 以 production mode 啟動（`NEXT_PUBLIC_APP_MODE=production`）
- **THEN** 設定頁面 SHALL NOT 顯示 Gemini/Claude/Ollama 選項
- **THEN** LLM 後端切換 UI SHALL 隱藏

#### Scenario: 生產模式強制 Codex adapter

- **WHEN** `NEXT_PUBLIC_APP_MODE=production` 且 codex-client 初始化
- **THEN** system SHALL 使用 Codex adapter，即使 .env 設定其他 adapter

##### Example: 生產模式 UI

- **GIVEN** 環境變數 `NEXT_PUBLIC_APP_MODE=production`
- **WHEN** 客戶瀏覽 `/setup/codex` 頁面
- **THEN** 只顯示 API Key 輸入區塊和授權狀態（已授權 / 未授權），不顯示其他 LLM provider 選項
