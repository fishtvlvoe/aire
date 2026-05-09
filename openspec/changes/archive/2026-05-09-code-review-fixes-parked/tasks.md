## Wave 1: Auth 統一 + 權限基礎建設（P0）

- [ ] 1.1 實作「Resolve current user from NextAuth JWT」（D1: 統一 auth helper）：建立 `src/lib/auth/resolve-user.ts`，export `resolveCurrentUser(req)` 函式，內部用 `getToken({ req, secret })` 取 JWT payload，再查 DB 用戶。處理 null token → return null [Tool: Copilot]
- [ ] 1.2 實作「Owner-scoped listing access」（D2: listing 存取控制 helper）：建立 `src/lib/auth/require-listing-access.ts`，export `requireListingAccess(user, listingId)`，邏輯：null user → 401、admin → 通過、agent → 檢查 listing.owner_id === user.id，不符 → 403 [Tool: Copilot]
- [ ] [P] 1.3 實作「All API routes use unified auth」：替換 `src/app/api/listings/route.ts` 的 auth，移除 SESSION_COOKIE/getSessionUser，改用 resolveCurrentUser。GET 加 owner_id 過濾（agent 只看自己的），POST 自動帶 owner_id [Tool: Copilot]
- [ ] [P] 1.4 實作「DELETE endpoint performs soft-delete (was: hard delete)」（D3: soft-delete 取代硬刪除）：替換 `src/app/api/listings/[id]/route.ts` 的 auth，GET/PATCH 加 requireListingAccess，DELETE 改為 soft-delete（設 archived_at），寫 audit log [Tool: Copilot]
- [ ] [P] 1.5 實作「Admin-created users have username populated」（D7: admin 用戶 username backfill）：替換 `src/app/api/admin/users/route.ts` 的 auth，改用 resolveCurrentUser，建立用戶時自動設 username = email [Tool: Copilot]
- [ ] 1.6 寫 auth + owner 隔離測試：agent A 不能存取 agent B listing、admin 可存取所有、未登入 → 401 [Tool: Sonnet]

## Wave 2: Listing 子路由權限 + 內部 fetch 修復（P0）

- [ ] [P] 2.1 實作「Internal fetch carries auth」：替換 attachments route 的 auth + 加 requireListingAccess + 修復 void fetch() 帶 auth header [Tool: Copilot]
- [ ] [P] 2.2 替換 extract route 的 auth + 加 requireListingAccess（Owner-scoped listing access） [Tool: Copilot]
- [ ] [P] 2.3 替換 field-visit route 的 auth + 加 requireListingAccess（Owner-scoped listing access） [Tool: Copilot]
- [ ] [P] 2.4 替換 supplementary route 的 auth + 加 requireListingAccess（Owner-scoped listing access） [Tool: Copilot]
- [ ] [P] 2.5 替換 generate route 的 auth + 加 requireListingAccess（Owner-scoped listing access） [Tool: Copilot]
- [ ] [P] 2.6 替換 regenerate route 的 auth + 加 requireListingAccess（Owner-scoped listing access） [Tool: Copilot]
- [ ] [P] 2.7 替換 documents route 的 auth + 加 requireListingAccess（Owner-scoped listing access） [Tool: Copilot]
- [ ] [P] 2.8 替換 pdf route 的 auth + 加 requireListingAccess（Owner-scoped listing access） [Tool: Copilot]
- [ ] 2.9 寫跨 agent 拒絕測試：涵蓋 attachments/extract/field-visit/supplementary/generate/regenerate/documents/pdf 八個子路由 [Tool: Sonnet]

## Wave 3: Schema 驗證 + Audit Log（P1）

- [ ] 3.1 實作「Zod validation on all mutating routes」+「Consistent error format」（D4: Zod schema 驗證策略）：安裝 zod（如尚未安裝），建立 `src/lib/validation/schemas.ts`，listing create/update、field-visit、supplementary、generate/regenerate、admin users、transfer-cases 的 Zod schema，驗證失敗統一回 400 + `{ error: "Validation failed", code: "VALIDATION_ERROR", details }` [Tool: Copilot]
- [ ] [P] 3.2 在 listings POST/PATCH route 加 Zod 驗證 [Tool: Copilot]
- [ ] [P] 3.3 在 field-visit、supplementary、generate、regenerate route 加 Zod 驗證 [Tool: Copilot]
- [ ] [P] 3.4 在 admin users、transfer-cases route 加 Zod 驗證 [Tool: Copilot]
- [ ] 3.5 實作「DB write helpers auto-log audit entries」（D3 延伸）：修改 `src/lib/db/index.ts`，在 createListing、updateListing、deleteListing（改名 archiveListing）、updateSupplementaryData 內自動呼叫 writeAuditLog [Tool: Copilot]
- [ ] 3.6 寫 Zod 驗證測試 + audit log 寫入測試 [Tool: Sonnet]

## Wave 4: 注入防護（P1）

- [ ] [P] 4.1 實作「CLI adapters use spawn with argv instead of shell exec」（D5: CLI adapter 改 spawn + stdin）：修改 `src/lib/codex-client/adapters/codex.ts`，exec(command) 改為 spawn("codex", ["exec", "-q", ...]) + stdin pipe，參考 gemini.ts 的模式 [Tool: Copilot]
- [ ] [P] 4.2 修改 `src/lib/codex-client/adapters/claude-code.ts`：同上模式，spawn("claude", ["-p", "-"]) + stdin pipe（CLI adapters use spawn） [Tool: Copilot]
- [ ] [P] 4.3 實作「Sanitize Markdown HTML output before PDF rendering」+「HTML allowlist」（D6: PDF HTML sanitizer）：安裝 sanitize-html，建立 `src/lib/pdf-generator/sanitize.ts`，allowlist 只保留 p/h1-h6/ul/ol/li/table/thead/tbody/tr/td/th/strong/em/br/a/img/blockquote/pre/code/span/div/hr [Tool: Copilot]
- [ ] [P] 4.4 修改 dossier.ts 和 survey-sales.ts：marked 輸出後呼叫 sanitize 函式再插入模板 [Tool: Copilot]
- [ ] 4.5 寫 shell injection 測試（backtick、$()、分號、管道、換行）+ HTML injection 測試（script、onerror、外部 img） [Tool: Sonnet]

## Wave 5: 用戶管理 + Token 加密 + CI 修復（P1-P2）

- [ ] [P] 5.1 實作「Backfill existing users」（D7）：修改 admin users 建立邏輯確保 username 填入，寫 migration script backfill 既有 null-username 用戶 [Tool: Copilot]
- [ ] [P] 5.2 實作「Encrypted token storage」（D8: Electron token 加密）：修改 electron/main.ts 的 token 存儲，用 key-store.ts 的加密模組取代明文 JSON 讀寫 [Tool: Copilot]
- [ ] [P] 5.3 修改 vitest.config.ts：exclude 加入 license-server/node_modules、dist-electron、electron/build、.next [Tool: Copilot]
- [ ] [P] 5.4 修改 eslint.config.mjs：ignores 加入 dist-electron、.next/standalone、electron/build [Tool: Copilot]
- [ ] 5.5 修復真正的測試失敗：middleware.test.ts DB setup、refresh cookie env、external URL format、generate-license response shape、Chromium mock、missing @testing-library/dom [Tool: Sonnet]
- [ ] 5.6 跑 `npm run build` + `npm run test` + `npm run lint` 確認全過 [Tool: 主對話]
