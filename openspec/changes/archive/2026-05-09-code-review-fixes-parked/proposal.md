## Why

全面 code review 發現 7 類安全與品質問題：auth/session 分裂導致 API 授權失效（P0）、listing 硬刪除違反專案規則（P0）、listing 子路由缺乏 owner 權限檢查（P0）、request body 缺 schema 驗證（P1）、admin 建立的用戶無法登入（P1）、PDF/LLM 執行存在注入風險（P1）、CI 測試與 lint 信號不可靠（P2）。這些問題讓系統在多用戶場景下無法安全運作，必須在交付客戶前修復。

## What Changes

- 修改 auth 機制：建立統一的 `resolveCurrentUser(req)` helper，取代所有 API route 中的 `SESSION_COOKIE` / `getSessionUser` 呼叫，統一走 NextAuth JWT
- 修改 listing DELETE API：移除硬刪除行為，改為 soft-delete（設 `archived_at`），保留 audit log
- 新增 listing 存取控制 helper：建立 `requireListingAccess(req, listingId, permission)` 函式，套用到所有 listing 子路由（attachments、extract、field-visit、supplementary、generate、regenerate、documents、pdf）
- 新增 Zod schema 驗證：為所有 mutating API route 加入 request body 驗證，回傳一致的 `{ error, code, details }` 格式
- 修改 admin 用戶建立流程：確保 `username` 欄位被填入（預設等於 email），並 backfill 既有用戶
- 修改 LLM CLI adapter：codex.ts 和 claude-code.ts 從 `exec(command string)` 改為 `spawn` + argv + stdin pipe
- 修改 PDF 生成：marked 輸出的 HTML 加入 sanitizer（DOMPurify 或 allowlist），防止 script injection
- 修改 Electron token 存儲：從明文 JSON 改為加密存儲或 OS keychain
- 修改 CI 設定：vitest.config.ts 和 eslint.config.mjs 排除 generated/vendor 目錄，修復真正的測試失敗

## Non-Goals

- 不重構 NextAuth provider 架構（只統一讀取方式）
- 不新增 RBAC 角色系統（維持現有 admin/agent 兩級）
- 不遷移 SQLite 到其他資料庫
- 不重寫 PDF 模板（只加 sanitizer）
- 不新增 E2E 測試框架（只修復現有 unit test）

## Capabilities

### New Capabilities

- `unified-auth-resolver`: 統一的 NextAuth JWT 用戶解析 helper，取代分裂的 session_id / NextAuth 雙軌制
- `listing-access-control`: listing 子路由的 owner/admin 存取控制 helper
- `api-schema-validation`: 所有 mutating API route 的 Zod request body 驗證
- `pdf-html-sanitization`: PDF 生成流程中 Markdown→HTML 的安全過濾

### Modified Capabilities

- `listing-archive`: 原 listing DELETE 改為 soft-delete/archive 語意
- `audit-log`: db helper 內建 audit log 寫入
- `llm-backend-adapter`: CLI adapter 從 shell exec 改為 spawn + stdin
- `user-account-management`: admin 建立用戶時自動填入 username
- `codex-integration`: token 存儲從明文改為加密

## Impact

- Affected specs: unified-auth-resolver（新）、listing-access-control（新）、api-schema-validation（新）、pdf-html-sanitization（新）、listing-archive（改）、audit-log（改）、llm-backend-adapter（改）、user-account-management（改）、codex-integration（改）
- Affected code:
  - New: src/lib/auth/resolve-user.ts, src/lib/auth/require-listing-access.ts, src/lib/validation/schemas.ts, src/lib/pdf-generator/sanitize.ts
  - Modified: src/app/api/listings/route.ts, src/app/api/listings/[id]/route.ts, src/app/api/listings/[id]/attachments/route.ts, src/app/api/listings/[id]/extract/route.ts, src/app/api/listings/[id]/field-visit/route.ts, src/app/api/listings/[id]/supplementary/route.ts, src/app/api/listings/[id]/generate/route.ts, src/app/api/listings/[id]/regenerate/route.ts, src/app/api/listings/[id]/documents/route.ts, src/app/api/listings/[id]/pdf/route.ts, src/app/api/admin/users/route.ts, src/app/api/admin/transfer-cases/route.ts, src/lib/db/index.ts, src/lib/codex-client/adapters/codex.ts, src/lib/codex-client/adapters/claude-code.ts, src/lib/pdf-generator/dossier.ts, src/lib/pdf-generator/survey-sales.ts, electron/main.ts, src/lib/codex-client/key-store.ts, vitest.config.ts, eslint.config.mjs
  - Removed: 無
- Dependencies 新增: zod（如尚未安裝）、dompurify（或 sanitize-html）
- 環境變數新增: 無
