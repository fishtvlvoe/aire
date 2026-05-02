## 1. 型別更新（Requirement: usedBackend field in CodexResult）

- [ ] 1.1 修改 `src/lib/codex-client/types.ts`：在 `CodexResult` 介面新增 `usedBackend?: string | null` 欄位，實作 Requirement "usedBackend field in CodexResult" [Tool: copilot]

## 2. Fallback 鏈核心邏輯（Requirement: Fallback chain on backend unavailability）

- [ ] 2.1 修改 `src/lib/codex-client/index.ts`：新增 `buildFallbackChain(preferred: LlmBackend): LlmBackend[]`，回傳 `[preferred, "gemini", "codex", "claude-code", "ollama"]` 去重陣列，實作 Requirement "Fallback chain on backend unavailability" [Tool: copilot]
- [ ] 2.2 修改 `src/lib/codex-client/index.ts`：移除 module-level `const activeAdapter`，重寫 `runCodex()` 為依序 `check()` → `run()` 的 fallback 迴圈；`check() !== "ready"` 或 `status === "quota-exceeded"` 時跳下一個；成功時在結果附加 `usedBackend: backend`；全部失敗時回傳 `{ success: false, error: "All LLM backends failed", status: "error", usedBackend: null }` [Tool: copilot]
- [ ] 2.3 確認 `checkCodexStatus()` 和 `runVision()` 保持原邏輯（仍用 preferred backend，不走 fallback 鏈）[Tool: copilot]

## 3. 單元測試

- [ ] 3.1 新增 `src/lib/codex-client/__tests__/fallback-chain.test.ts`，測試三個情境：(a) 首選 backend check=ready、run 成功 → `usedBackend` 等於首選名稱；(b) 首選 check=quota-exceeded、第二個 check=ready、run 成功 → `usedBackend` 等於第二個名稱；(c) 所有 backend check=error → 回傳 `success: false, usedBackend: null`。每個情境用 vi.fn() mock `adapters` 物件的 check 和 run 方法 [Tool: copilot]

## 4. API Response 更新

- [ ] 4.1 修改 `src/app/api/listings/[id]/generate/route.ts`：`generateSingle()` 呼叫後，若 result 含 `usedBackend` 欄位，將其加入 JSON response（格式：`{ ok: true, documentType, document, usedBackend }`）[Tool: copilot]

## 5. 驗證

- [ ] 5.1 執行 `npm run test` 確認全部 424+ 個測試通過，包含新增的 fallback-chain 測試 [Tool: bash]
- [ ] 5.2 執行 `npm run build` 確認 TypeScript 編譯 0 錯誤 [Tool: bash]
