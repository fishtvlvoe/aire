## ADDED Requirements

### Requirement: Codex CLI 內包

Electron 安裝檔 SHALL 內包 Codex CLI binary，客戶無須額外安裝 Node.js 或 npm。

#### Scenario: Codex 隨 app 安裝

- **WHEN** 客戶安裝「不動產 AI 系統」
- **THEN** Codex CLI binary 自動安裝至 app 的 resources/codex/ 目錄，可直接呼叫

##### Example: macOS Apple Silicon 安裝

- **GIVEN** 客戶使用 macOS Apple Silicon（M1/M2/M3）
- **WHEN** 從 .dmg 安裝 app
- **THEN** app bundle 內含 resources/codex/codex-darwin-arm64，Electron 主程序設定 PATH 包含該路徑

### Requirement: ChatGPT 授權流程

系統 SHALL 在首次啟動且 Codex 未授權時，引導客戶完成 ChatGPT 授權。

#### Scenario: OAuth 授權成功

- **WHEN** 客戶在 /setup/codex 頁面點擊「使用 ChatGPT 帳號授權」
- **THEN** 開啟系統瀏覽器到 ChatGPT OAuth 頁面 → 客戶授權 → callback 回 app → 驗證 token → 儲存至 OS Keychain

##### Example: OAuth 完整流程

- **GIVEN** 客戶有 ChatGPT Plus 帳號，首次啟動 app
- **WHEN** 點擊「使用 ChatGPT 帳號授權」
- **THEN** 系統瀏覽器開啟 https://auth.openai.com/authorize → 客戶登入並授權 → redirect 回 app 的 localhost callback → app 收到 token → 呼叫 GET /v1/models 驗證 → 成功 → 儲存 token 到 macOS Keychain → 重導至主畫面

#### Scenario: 手動貼 API Key

- **WHEN** 客戶選擇「手動輸入 API Key」並貼入有效 key
- **THEN** 呼叫 OpenAI API 驗證 key 有效性 → 儲存至 OS Keychain → 重導至主畫面

##### Example: 手動輸入有效 Key

- **GIVEN** 客戶從 platform.openai.com/api-keys 複製了有效的 API Key `sk-proj-abc123...`
- **WHEN** 在 /setup/codex 頁面的輸入框貼入該 key 並點擊「驗證」
- **THEN** 系統呼叫 GET /v1/models 帶 Authorization: Bearer sk-proj-abc123... → 回 200 → 儲存 key 到 macOS Keychain → 重導至主畫面

#### Scenario: 無效 API Key

- **WHEN** 客戶輸入無效或過期的 API Key
- **THEN** 顯示錯誤「API Key 無效，請確認後重新輸入」，不允許進入主畫面

##### Example: 過期 Key 被拒

- **GIVEN** 客戶貼入已撤銷的 API Key `sk-proj-expired...`
- **WHEN** 系統呼叫 GET /v1/models 帶該 key
- **THEN** OpenAI 回 HTTP 401 → 頁面顯示「API Key 無效，請確認後重新輸入」→ 輸入框清空，焦點回到輸入框

### Requirement: 訂閱驗證

系統 SHALL 驗證客戶的 ChatGPT 帳號具有 Plus 訂閱（$20/月）才允許使用 AI 功能。

#### Scenario: 有 Plus 訂閱

- **WHEN** 授權完成且帳號有 ChatGPT Plus
- **THEN** AI 功能正常可用

##### Example: Plus 帳號正常使用

- **GIVEN** 客戶用 ChatGPT Plus 帳號完成 OAuth 授權
- **WHEN** 系統呼叫 OpenAI API 檢查帳號方案
- **THEN** 偵測到 Plus 方案 → AI 功能按鈕全部啟用（文件生成、OCR 解析、行銷文案等）→ 正常進入主畫面

#### Scenario: 無 Plus 訂閱

- **WHEN** 授權完成但帳號無 ChatGPT Plus
- **THEN** 顯示「需要 ChatGPT Plus 訂閱才能使用 AI 功能，請升級後重試」

##### Example: 免費帳號嘗試使用

- **GIVEN** 客戶用免費 ChatGPT 帳號完成 OAuth 授權
- **WHEN** 系統檢查訂閱狀態
- **THEN** 偵測到非 Plus 方案 → 顯示提示訊息 → AI 相關按鈕灰色停用 → 其他非 AI 功能正常可用

### Requirement: 生產模式鎖定

當 NEXT_PUBLIC_APP_MODE=production 時，系統 SHALL 只使用 Codex 後端，隱藏開發者設定 UI。

#### Scenario: 生產模式隱藏設定

- **WHEN** app 以 production mode 啟動
- **THEN** /setup 頁面不顯示「開發者設定」區塊，LLM 後端切換 UI 隱藏

##### Example: 生產模式 UI

- **GIVEN** 環境變數 NEXT_PUBLIC_APP_MODE=production
- **WHEN** 客戶瀏覽 /setup 頁面
- **THEN** 只顯示「ChatGPT 授權狀態」區塊（已授權 ✓ / 未授權），不顯示 Gemini/Claude/Ollama 選項
