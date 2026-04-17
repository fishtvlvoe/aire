## 1. 介面定義與 dispatcher

- [x] 1.1 [Tool: copilot-codex] 在 `src/lib/codex-client/` 建立 `types.ts`：定義 `LlmAdapter` 介面（`run(prompt, timeoutMs): Promise<CodexResult>`、`check(): Promise<CodexStatus>`）— Design: Adapter 介面設計：共用 `LlmAdapter` 介面；Requirement: Stable public API
- [x] 1.2 [Tool: copilot-codex] 重構 `src/lib/codex-client/index.ts`：移除直接 exec 邏輯，改為根據 `LLM_BACKEND` 環境變數選擇 adapter，未知值 fallback `codex`（環境變數 LLM_BACKEND 的 fallback 行為）；公開 API 簽名不變 — Requirement: Backend selection via environment variable

## 2. Adapter 實作

- [x] 2.1 [Tool: copilot-codex] 建立 `src/lib/codex-client/adapters/codex.ts`：將現有 `exec + promisify` 邏輯搬入此 adapter，保留完整的 stderr 錯誤分類與兩步 checkCodexStatus — 對應 Requirement: Codex adapter preserves existing behavior
- [x] 2.2 [Tool: copilot-codex] 建立 `src/lib/codex-client/adapters/claude-code.ts`：呼叫 `claude -p "<prompt>"`，健康檢查用 `claude --version`，偵測 `not logged in`/`auth` stderr 回 `not-logged-in` — Design: Claude Code adapter：呼叫 `claude -p "<prompt>"` CLI；Requirement: Claude Code adapter
- [x] 2.3 [Tool: copilot-codex] 建立 `src/lib/codex-client/adapters/gemini.ts`：呼叫 `gemini -p "<prompt>"`，健康檢查 `gemini --version`，偵測 `quota`/`429` stderr 回 `quota-exceeded` — Design: Gemini adapter：呼叫 `gemini -p "<prompt>"` CLI；Requirement: Gemini adapter
- [x] 2.4 [Tool: copilot-codex] 建立 `src/lib/codex-client/adapters/ollama.ts`：`fetch POST /api/generate`（`stream: false`，`model: OLLAMA_MODEL`），健康檢查 `GET /api/tags`，不依賴 ollama CLI binary — Design: Ollama adapter：直接 fetch HTTP API，不走 CLI；Requirement: Ollama adapter

## 3. 測試

- [x] 3.1 [Tool: codex] 更新 `src/lib/codex-client/__tests__/codex-client.test.ts`：補 dispatcher 路由測試（LLM_BACKEND=codex/claude-code/gemini/ollama 各指向正確 adapter，未知值 fallback codex）— 對應 Requirement: Backend selection via environment variable
- [x] 3.2 [Tool: codex] 新增 `src/lib/codex-client/__tests__/adapters/claude-code.test.ts`：mock exec，測試 run 成功/失敗/not-logged-in、check ready/not-logged-in — 對應 Requirement: Claude Code adapter
- [x] 3.3 [Tool: codex] 新增 `src/lib/codex-client/__tests__/adapters/gemini.test.ts`：mock exec，測試 run 成功/quota-exceeded、check ready — 對應 Requirement: Gemini adapter
- [x] 3.4 [Tool: codex] 新增 `src/lib/codex-client/__tests__/adapters/ollama.test.ts`：mock fetch，測試 run 成功/連線失敗、check ready/error — 對應 Requirement: Ollama adapter

## 4. 設定與文件

- [x] 4.1 [Tool: cursor] 更新 `docker/compose.yaml`：在 `environment` 區塊加入 `LLM_BACKEND=codex`（附註解說明可選值：codex/claude-code/gemini/ollama）
- [x] 4.2 [Tool: cursor] 更新 `docker/安裝說明.md`：新增「選擇 AI 後端」章節，說明各後端需求（Codex 需 OpenAI 訂閱、Claude Code 需 Anthropic 帳號、Gemini 需 Google 帳號、Ollama 本地免費）和對應環境變數設定方式
