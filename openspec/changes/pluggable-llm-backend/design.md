## Context

`src/lib/codex-client/index.ts` 目前直接呼叫 `codex exec "<prompt>"` shell 命令，`checkCodexStatus()` 也硬綁 `codex --version` + `codex exec` 健康檢查。所有文件生成函數（survey、listing591、dm、social、dossier）都透過 `runCodex(prompt)` 這個單一入口點呼叫，沒有直接依賴 Codex CLI。重構只需要動 codex-client 層，上層完全不用改。

## Goals / Non-Goals

**Goals:**

- `runCodex(prompt)` 和 `checkCodexStatus()` 的簽名和回傳型別保持不變
- 現有測試（`codex-client.test.ts`）繼續通過，不需要修改 mock
- 透過 `LLM_BACKEND` 環境變數在四個 adapter 之間切換
- 各 adapter 封裝自己的 CLI 呼叫邏輯和錯誤分類

**Non-Goals:**

- 不做 fallback chain（後端失敗不自動切換到下一個）
- 不支援 API key 直接呼叫（只用本機 CLI 或本機 HTTP）
- 不做 prompt 格式轉換

## Decisions

### Adapter 介面設計：共用 `LlmAdapter` 介面

每個 adapter 實作：
```typescript
interface LlmAdapter {
  run(prompt: string, timeoutMs: number): Promise<CodexResult>;
  check(): Promise<CodexStatus>;
}
```

`index.ts` 根據 `LLM_BACKEND` 環境變數選擇 adapter，再委派呼叫。

**替代方案**：strategy pattern 用 class 繼承 → 不選，函數介面更輕量，測試更容易。

### Ollama adapter：直接 fetch HTTP API，不走 CLI

Ollama 提供 `POST /api/generate` REST endpoint，直接用 `fetch` 呼叫，不需要 ollama CLI。
- `OLLAMA_BASE_URL`（預設 `http://localhost:11434`）
- `OLLAMA_MODEL`（預設 `llama3`）
- `check()` 用 `GET /api/tags` 確認服務存活

**替代方案**：用 ollama CLI → 不選，HTTP API 在容器環境更穩定（不需要 ollama binary）。

### Claude Code adapter：呼叫 `claude -p "<prompt>"` CLI

Claude Code CLI（`claude`）支援 `--print` 模式直接輸出，不開互動式 session。
- 健康檢查：`claude --version`
- 執行：`claude -p "<prompt>"`（非互動，直接輸出）
- 未登入偵測：stderr 含 `not logged in` 或 `auth`

### Gemini adapter：呼叫 `gemini -p "<prompt>"` CLI

與 Claude Code adapter 結構相同，換成 `gemini` binary。
- 健康檢查：`gemini --version`
- 執行：`gemini -p "<prompt>"`

### 環境變數 LLM_BACKEND 的 fallback 行為

未設定 `LLM_BACKEND` 或值不認識 → 預設使用 `codex` adapter（向下相容現有部署）。

## Risks / Trade-offs

- **[Claude Code -p 模式行為]** → Claude Code CLI 的 `--print`/`-p` flag 在不同版本行為可能有差異，需在 Dockerfile 固定版本
- **[Ollama 回應格式]** → Ollama streaming 預設開啟，需設 `stream: false` 才能拿到完整 JSON；若版本不同 API 格式可能變
- **[Gemini CLI quota]** → Gemini CLI 有 per-minute rate limit，與 Codex 錯誤分類邏輯不同，需獨立處理 `429` / `quota` 訊號

## Migration Plan

1. 新增 `src/lib/codex-client/adapters/` 目錄，建立四個 adapter
2. 修改 `index.ts`：export 不變，內部委派給選中的 adapter
3. 補測試：各 adapter 的 run/check 邏輯各一個 describe block
4. 更新 `compose.yaml`：新增 `LLM_BACKEND` 環境變數（預設值 `codex`，註解說明可選值）
5. 更新安裝說明文件

Rollback：刪除 adapters 目錄，還原 `index.ts` 原始版本，不影響任何上層程式碼。
