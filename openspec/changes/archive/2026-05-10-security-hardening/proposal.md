## Why

Code review 發現三個高風險安全問題：Shell Injection 漏洞、Audit Log 稽核機制缺失，以及 API 請求缺乏嚴格驗證。這些問題若不處理，將導致系統面臨命令執行攻擊、營運軌跡丟失及非法數據注入的風險。

## What Changes

- 修改 src/lib/codex-client/adapters/codex.ts 與 claude-code.ts，廢棄 exec() 拼接命令的方式，改用 spawn 並透過 stdin 傳遞 prompt，徹底杜絕 Shell Injection。
- 修改 src/lib/db/index.ts，在 createListing、updateListing、archiveListing 等資料異動函式中內建 writeAuditLog 呼叫。
- **BREAKING**: 廢棄 deleteListing 的硬刪除行為，API 層級統一導向軟刪除（Archive）。
- 新增 src/lib/schemas/listing.ts Zod schema，並在 src/app/api/listings/ 路由中實作請求體驗證。

## Non-Goals

- 不調整 Auth 認證邏輯（由 code-quality-and-auth-cleanup 處理）。
- 不重寫 DB Helper 結構，僅增加稽核邏輯。
- 不涉及前端表單驗證。

## Capabilities

### New Capabilities

- listing-validation: 提供基於 Zod 的 API 請求體驗證機制。

### Modified Capabilities

- codex-integration: LLM 適配器必須採用安全的 process spawning 機制，禁止直接拼接 shell 命令。
- audit-log: 資料庫異動輔助函式應內建自動稽核日誌記錄功能。
- listing-archive: 廢棄硬刪除，所有刪除操作必須透過軟刪除並保留稽核軌跡。

## Impact

- Affected specs: codex-integration, audit-log, listing-archive, listing-validation
- Affected code:
  - Modified: src/lib/codex-client/adapters/codex.ts
  - Modified: src/lib/codex-client/adapters/claude-code.ts
  - Modified: src/lib/db/index.ts
  - Modified: src/app/api/listings/route.ts
  - Modified: src/app/api/listings/[id]/field-visit/route.ts
  - New: src/lib/schemas/listing.ts
