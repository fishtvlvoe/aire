## Why

目前 `codex-client` 硬綁 Codex CLI，客戶必須有 OpenAI 訂閱才能使用所有 AI 功能。將後端抽象為可插拔介面，讓不同環境（無 OpenAI 訂閱、企業禁用雲端 AI、離線環境）都能選擇合適的 LLM。

## What Changes

- `src/lib/codex-client/` 重構為 adapter 架構，定義 `LlmBackend` 介面
- 新增四個 adapter：`codex`（現有行為）、`claude-code`（Claude Code CLI）、`gemini`（Gemini CLI）、`ollama`（本地 Ollama HTTP API）
- 透過環境變數 `LLM_BACKEND`（預設 `codex`）切換 adapter
- 公開 API `runCodex(prompt)` 和 `checkCodexStatus()` 介面不變，呼叫端零修改
- 各 adapter 有獨立 `check()` 邏輯，`checkCodexStatus()` 委派給當前 adapter
- `LLM_BACKEND=ollama` 時額外需要 `OLLAMA_BASE_URL`（預設 `http://localhost:11434`）和 `OLLAMA_MODEL`（預設 `llama3`）

## Non-Goals

- 不支援同時呼叫多個後端（非並行、非 fallback chain）
- 不實作 prompt 格式轉換（各 adapter 直接傳遞原始 prompt）
- 不提供 UI 設定介面，只用環境變數切換
- 不支援付費 API 直接呼叫（Anthropic API、OpenAI API）——只用本機 CLI

## Capabilities

### New Capabilities

- `llm-backend-adapter`: 可插拔 LLM 後端介面與四個 adapter 實作

### Modified Capabilities

- （無 spec-level 行為變更，既有規格文件不需 delta）

## Impact

- 修改：`src/lib/codex-client/index.ts`（重構為 adapter dispatcher）
- 新增：`src/lib/codex-client/adapters/codex.ts`
- 新增：`src/lib/codex-client/adapters/claude-code.ts`
- 新增：`src/lib/codex-client/adapters/gemini.ts`
- 新增：`src/lib/codex-client/adapters/ollama.ts`
- 修改：`src/lib/codex-client/__tests__/codex-client.test.ts`（補 adapter 測試）
- 修改：`docker/compose.yaml`（新增 LLM_BACKEND 環境變數說明）
- 修改：`docker/安裝說明.md`（新增後端切換說明）
