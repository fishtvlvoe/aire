## Context

three-ai 是房地產 AI 文件平台，支援多用戶（admin + agent）。目前 auth 分裂為 NextAuth JWT 和 legacy session_id 兩套，導致 API 授權失效。listing 子路由缺乏 owner 檢查，硬刪除違反審計規則。LLM CLI adapter 用 shell exec 傳 prompt 有注入風險。CI 信號被 generated/vendor 噪音淹沒。

現有架構：
- 登入：NextAuth credentials provider → JWT
- API 授權：多數路由讀 `SESSION_COOKIE` → `getSessionUser(session_id)` → 找不到用戶 → null
- 資料庫：better-sqlite3，db helper 在 src/lib/db/index.ts
- LLM 呼叫：adapters 在 src/lib/codex-client/adapters/，gemini.ts 已正確用 spawn + stdin

## Goals / Non-Goals

**Goals:**

1. 統一 auth：所有 API route 用 NextAuth JWT 解析用戶
2. 強制 owner 隔離：agent 只能存取自己的 listing
3. 消除硬刪除：改為 soft-delete + audit log
4. 輸入驗證：所有 mutating route 用 Zod 驗證 request body
5. 消除注入面：CLI adapter 改 spawn、PDF HTML 加 sanitizer
6. 修復 CI：測試和 lint 只掃應用程式碼

**Non-Goals:**

- 不重構 NextAuth provider 或改用其他 auth 框架
- 不新增 RBAC 細粒度權限（維持 admin/agent 兩級）
- 不遷移資料庫引擎
- 不重寫 PDF 模板結構
- 不新增 E2E 測試（只修現有 unit test）

## Decisions

### D1: 統一 auth helper

建立 `src/lib/auth/resolve-user.ts`，export `resolveCurrentUser(req: NextRequest): Promise<DbUser | null>`。內部呼叫 `getToken({ req, secret })` 取 JWT payload，再用 username 或 email 查 DB。所有 API route 改用此函式取代 `getSessionUser`。

理由：最小改動，只加一層 adapter，不需動 NextAuth 設定。

### D2: listing 存取控制 helper

建立 `src/lib/auth/require-listing-access.ts`，export `requireListingAccess(user, listingId, permission)`。邏輯：admin → 全通；agent → listing.owner_id === user.id；未登入 → 403。

套用到所有 listing 子路由（attachments, extract, field-visit, supplementary, generate, regenerate, documents, pdf）。

### D3: soft-delete 取代硬刪除

listing DELETE API 改為設 `archived_at = now()`，不實際刪除 row。需在 listings table 加 `archived_at` 欄位（如果尚未存在，listing-archive spec 可能已有）。getAllListings 等查詢自動排除 archived。

### D4: Zod schema 驗證策略

在 `src/lib/validation/` 下建立各 route 的 schema，每個 mutating handler 開頭呼叫 `schema.safeParse(body)`，失敗回 400 + `{ error: "Validation failed", code: "VALIDATION_ERROR", details: issues }`。

不用 middleware 攔截（Next.js App Router 沒有 route-level middleware），直接在 handler 內驗證。

### D5: CLI adapter 改 spawn + stdin

參考 gemini.ts 的模式：`spawn("codex", ["exec", "-q", ...], { stdio: ["pipe", "pipe", "pipe"] })`，prompt 寫入 stdin。claude-code.ts 同理。

### D6: PDF HTML sanitizer

在 marked 輸出後、插入模板前，用 sanitize-html（比 DOMPurify 更適合 server-side）過濾。allowlist 只保留安全標籤（p, h1-h6, ul, ol, li, table, tr, td, th, strong, em, br, a）。

### D7: admin 用戶 username backfill

admin 建立用戶時，如果 username 為空，自動設為 email。加 migration script backfill 既有 null-username 用戶。

### D8: Electron token 加密

利用現有的 key-store.ts 加密模組，替換 electron/main.ts 的明文 JSON 讀寫。

## Risks / Trade-offs

| 風險 | 影響 | 對策 |
|------|------|------|
| 移除 session_id 可能影響未遷移的前端頁面 | 部分頁面可能斷開 | 全面搜尋 SESSION_COOKIE 使用處，確保全部替換 |
| soft-delete 後 listing 查詢需多加 WHERE 條件 | 查詢遺漏可能暴露 archived listing | 修改 getAllListings 等 helper 統一加 filter |
| Zod 加太多欄位可能讓 API 變嚴格 | 現有前端可能傳多餘欄位被擋 | 用 `.passthrough()` 或 `.strip()` 處理多餘欄位 |
| sanitize-html 可能過濾掉 LLM 生成的合法 HTML 結構 | PDF 排版跑掉 | 測試常見 LLM 輸出格式，調整 allowlist |
