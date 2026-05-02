## Why

`codex-client` 在 module import 時鎖死單一 LLM adapter，`runCodex()` 沒有探針（check）也沒有 fallback 鏈。當設定的 backend（如 Gemini）回 429 或 CLI 不存在時，整個文件生成直接失敗，沒有自動切換到其他可用 backend，導致說明書全顯示「待補」。

## What Changes

- 新增 `buildFallbackChain(preferred)` 函式：將使用者偏好的 backend 放第一，其餘 backend 依固定順序附加、去重
- 修改 `runCodex()`：改為依序探針（`check()`）→ 執行（`run()`），成功即回傳，quota-exceeded / 不可用則跳往下一個
- `runCodex()` 回傳值新增 `usedBackend` 欄位，記錄實際使用的 backend
- 修改 `generate` API route：將 `usedBackend` 帶入 API response，便於前端除錯
- 更新 `llm-backend-adapter` spec：新增 fallback chain 行為需求

## Non-Goals

- 不實作跨請求的 backend 快取健康狀態（每次 `runCodex()` 都重新 check，簡單優先）
- 不實作 retry 次數設定（每個 backend 只嘗試一次）
- 不變更 `.env.local` 的 `LLM_BACKEND` 語意（仍代表偏好，非強制）
- 不為 `runVision()` 實作 fallback（scope 限縮在文字生成）

## Capabilities

### New Capabilities

（無，此為現有能力的行為修正）

### Modified Capabilities

- `llm-backend-adapter`：新增 fallback chain 行為需求 — 當主 backend 不可用或 quota exceeded 時，系統 SHALL 自動依序嘗試其他 backend

## Impact

- Affected specs: `llm-backend-adapter`（修改需求）
- Affected code:
  - Modified: `src/lib/codex-client/index.ts`
  - Modified: `src/lib/codex-client/types.ts`（`CodexResult` 新增 `usedBackend` 欄位）
  - Modified: `src/app/api/listings/[id]/generate/route.ts`（response 帶 `usedBackend`）
  - New: `src/lib/codex-client/__tests__/fallback-chain.test.ts`
