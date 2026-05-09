## Problem

Code review 發現三個高風險安全問題：

### 1. Shell Injection（P0 — 立即修復）

src/lib/codex-client/adapters/codex.ts 和 claude-code.ts 使用 exec() 拼接 shell command 執行 LLM CLI，prompt 只做了雙引號 escape，未處理反勾號、$()、反斜線等特殊字元。攻擊者若能控制 prompt 內容（例如透過 OCR 結果帶入惡意字串），可執行任意 shell 命令。

同專案的 gemini.ts adapter 已正確使用 spawn() + stdin pipe，證明此模式可行。

### 2. Audit Log 缺失（P1）

src/lib/db/index.ts 的 helper 函式（createListing、updateStatus、deleteListing 等）沒有內建 audit log。deleteListing() 是硬刪除且無任何審計軌跡，最危險。目前依賴 API route caller 手動記錄，容易遺漏。

### 3. API 請求驗證缺失（P1）

src/app/api/listings/ 的 POST/PATCH route 沒有用 Zod schema 驗證 request body。propertyType 等輸入未嚴格檢查，直接傳給 db helper。

## Root Cause

1. Shell injection：早期開發時直接用 exec() 跑 CLI，未考慮 prompt 內容可能包含 shell metacharacter
2. Audit log：db helper 設計時未預設 audit，依賴外層呼叫者記錄
3. API 驗證：專案初期未引入 Zod，手動 try-catch 做基本檢查

## Proposed Solution

### P0：Shell Injection 修復

將 codex.ts 和 claude-code.ts 的 exec(command string) 改為 spawn/execFile + argv array。prompt 透過 stdin pipe 傳入，不經過 shell 解析。參考同專案 gemini.ts 的實作模式。保留現有的 timeout 和 error classification 邏輯。

### P1：防禦性 Audit

在 src/lib/db/index.ts 的 INSERT/UPDATE/DELETE helper 中內建 writeAuditLog 呼叫。函式簽名加入 userId 參數（可選，預設 system）。特別是 deleteListing() 必須在刪除前記錄完整資料快照。

### P2：Zod Schema 驗證

在 src/lib/schemas/ 建立 listing 相關的 Zod schema。在 API route 層用 schema.parse() 驗證 request body，取代手動 try-catch。

## Non-Goals

- Auth 認證邏輯統一（範圍太大，另開 change）
- 重寫 db helper API（只加 audit，不改結構）
- 前端表單驗證（此 change 只處理後端）

## Success Criteria

1. codex.ts 和 claude-code.ts 不再使用 exec()，改用 spawn/execFile
2. prompt 含 shell metacharacter（反勾號、$()、分號）時不會觸發命令執行
3. 所有 db INSERT/UPDATE/DELETE helper 執行後都有 audit log 記錄
4. deleteListing() 在刪除前記錄完整資料快照到 audit_logs
5. listings API 的 POST/PATCH route 使用 Zod schema 驗證，無效輸入回傳 400

## Impact

- Affected code:
  - Modified: src/lib/codex-client/adapters/codex.ts
  - Modified: src/lib/codex-client/adapters/claude-code.ts
  - Modified: src/lib/db/index.ts
  - Modified: src/app/api/listings/route.ts
  - Modified: src/app/api/listings/[id]/field-visit/route.ts
  - New: src/lib/schemas/listing.ts
