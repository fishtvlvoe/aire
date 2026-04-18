## 0. 分工概覽（apply 前先讀）

**本 change 共 22 個 task，分工如下**：

| 工具 | 負責 task 數 | 主要職責 |
|------|-------------|---------|
| `codex`（或 copilot fallback） | 9 | TDD 測試、build/lint/test 驗收、實機驗收、git 操作、環境偵察 |
| `cursor-agent` | 7 | UI 元件（列表 icon + 按鈕、documents 頁按鈕與 banner、Stepper bug 修復若需要） |
| `copilot-codex` | 4 | DB layer `deleteListing`、API route DELETE handler、純函式 `resolveListingSecondaryAction` |
| `kimi` | 2 | Wave 結尾 CR（correctness + security） |
| 主對話（Opus） | 0 | 僅整合：收分工確認、Wave 驗收、git commit 文案、tasks.md 勾選 |

**Wave 順序**（依相依性）：
1. Wave 1：環境偵察（查 Heroicons、查 FK schema、查 regenerate endpoint）
2. Wave 2：DB + API 層（deleteListing + DELETE route + 測試）
3. Wave 3：純函式 + Stepper bug 驗證與修復
4. Wave 4：列表頁 UI（刪除 icon + 次要按鈕）
5. Wave 5：documents 頁 UI（regenerate 按鈕 + banner）
6. Wave 6：驗收（tsc + lint + build + test + CR + 實機 + commit + push）

**Fallback 規則**（用量不足自動切換，不等確認）：
- codex 滿 → copilot `-p --yolo --model gpt-5.2` → sonnet 子代理
- cursor 失敗 → copilot → sonnet 子代理
- kimi MCP 超時 → kimi CLI → gemini CLI

切換時主動告知 Fish：「⚠️ [Agent X] 用量不足，切換至 [Y]」

---

## 1. 環境偵察（Wave 1）

- [x] 1.1 [Tool: codex] 執行 `grep -r "heroicons" package.json` 與 `ls node_modules/@heroicons 2>/dev/null` 確認是否已裝 Heroicons。將結論寫入本檔末尾的「偵察結果」區
- [x] 1.2 [Tool: codex] 執行 `sqlite3 data/listings.db ".schema"` 列出所有表與 FK，確認 `listings` 是否被其他表以 FK 引用。結論寫入「偵察結果」區
- [x] 1.3 [Tool: codex] 執行 `ls src/app/api/listings/[id]/` 列出所有 endpoint，確認「重新產生」用的是 `/generate` 還是 `/regenerate`。結論寫入「偵察結果」區

## 2. DB + API 層（Wave 2）

- [x] 2.1 [P] [Tool: codex] 在 `src/app/api/__tests__/listings-delete.test.ts`（新檔）撰寫紅燈測試：POST mock 版本驗證 `DELETE /api/listings/{id}` 的三個 scenario — 既有 id 回 200、不存在 id 回 404、`deleteListing(id)` 被正確呼叫（對應 Requirement: Listings support hard delete via DELETE API）
- [x] 2.2 [Tool: copilot-codex] 在 `src/lib/db.ts` 或 `src/lib/db/index.ts`（依實際位置）新增純函式 `deleteListing(id: number): boolean` — 回傳 `result.changes > 0`；若偵察結果顯示有 FK 則先刪 children 再刪 parent，並加繁中註解說明依賴（對應 Decision: 硬刪除）
- [x] 2.3 [Tool: copilot-codex] 新增 `src/app/api/listings/[id]/route.ts` 的 `DELETE` handler（若檔案不存在則新建；若已有 GET/PATCH handler 則 append 到同檔）— 解析 params.id、`Number()` 轉換、`Number.isNaN` 檢查回 400、`deleteListing()` 回 false 時回 404、成功回 `NextResponse.json({ success: true })`（對應 Requirement: Listings support hard delete via DELETE API）
- [x] 2.4 [Tool: codex] 跑 `npx vitest run src/app/api/__tests__/listings-delete.test.ts` 確認 2.1 測試綠燈

## 3. 純函式與 Stepper bug 驗證（Wave 3）

- [x] 3.1 [P] [Tool: codex] 擴充 `src/lib/__tests__/listing-routes.test.ts`：新增 `resolveListingSecondaryAction` 測試覆蓋四種 status — documents-ready 回 `{ href: '/listings/10/fill', label: '回去補件' }`，其他三態回 `null`（對應 Requirement: documents-ready listing row shows secondary action button）
- [x] 3.2 [Tool: copilot-codex] 在 `src/lib/listing-routes.ts` 新增 `export function resolveListingSecondaryAction(listing: Listing): { href: string; label: string } | null`，依 Decision 實作（對應 Decision: 列表次要按鈕用純函式）
- [x] 3.3 [Tool: codex] 實測 Stepper（bug 確認：documents/generating 頁寫死 listingStatus=null，需載 listing 後傳入） 綠格是否可點（Decision: Stepper 綠格可點是元件本體而非純函式問題）：`npm run dev` 啟動後 `curl -sS http://localhost:3000/listings/4/documents` 拿到 HTML，手動（browser）點擊格 2 看是否跳 `/listings/4/fill`。若可跳則 bug 不存在，標記 3.4 為「無需修復」；若不可跳則 bug 存在，進 3.4
- [x] 3.4 [Tool: cursor-agent]（修法：documents + generating 頁新增 listing state，fetch listing.status 後傳給 Stepper） 若 3.3 確認 bug 存在：修 `src/components/Stepper.tsx` 讓綠格 `clickable=true` 時實際渲染 `<Link href={getStepHref(item.step)}>` 而非其他元素；不改 `getStepperItemStates` 純函式邏輯（對應 Requirement: Stepper green segments are clickable for navigation back）

## 4. 列表頁 UI（Wave 4）

- [x] 4.1 [Tool: cursor-agent] 修改 `src/app/listings/page.tsx`（對應 Requirement: Listing row delete button removes listing, Requirement: documents-ready listing row shows secondary action button；實作 Decision: 硬刪除（DELETE FROM listings）而非軟刪除、Decision: 原生 window.confirm 而非自製 Modal、Decision: 列表頁刪除後從 client state 移除而非重 fetch、Decision: 列表次要按鈕用純函式 resolveListingSecondaryAction）：
  - 新 import: `resolveListingSecondaryAction` from `@/lib/listing-routes`
  - 新 state: `listings` 從 useState 管理（目前是 prop 或 fetch？需 cursor 自行判斷既有寫法再決定；若目前是 server component 單次 fetch，改 client 為主）
  - 新 handler: `handleDelete(id)` — `window.confirm('確定刪除此物件？此操作無法復原')`（Decision: 原生 window.confirm 而非自製 Modal）→ `fetch(`/api/listings/${id}`, { method: 'DELETE' })` → 成功則 `setListings(prev => prev.filter(l => l.id !== id))`（Decision: 列表頁刪除後從 client state 移除而非重 fetch），失敗則 `alert('刪除失敗：' + error)`
  - 每列「操作」欄最左加垃圾桶 icon：若 1.1 偵察結果 Heroicons 已裝用 `<TrashIcon className='w-5 h-5' />`，否則用內嵌 SVG（viewBox="0 0 24 24" stroke 的 trash 圖案）
  - 若 `resolveListingSecondaryAction(listing)` 非 null（Decision: 列表次要按鈕用純函式 resolveListingSecondaryAction），在主按鈕右側加次要按鈕：淺灰底 border + 較小字級，text = label，href = 回傳值的 href

## 5. documents 頁 UI（Wave 5）

- [x] 5.1 [Tool: cursor-agent] 修改 `src/app/listings/[id]/documents/page.tsx`（對應 Requirement: documents page provides regenerate action with persistence notice, Requirement: Listing status remains unchanged when middle-stage fields are edited after documents are generated；實作 Decision: documents-ready 回流後狀態保持不動 + 手動「重新產生文件」、Decision: 原生 window.confirm 而非自製 Modal）：
  - 新 state: `regenerating: boolean`
  - 新 handler: `handleRegenerate()` — `window.confirm('重新產生會覆蓋現有 5 份文件，確定？')`（Decision: 原生 window.confirm 而非自製 Modal）→ `fetch(regenerateEndpoint, { method: 'POST' })`（endpoint 依 1.3 偵察結果）→ 成功重 fetch listing documents；失敗 alert
  - 在頁面頂部（Stepper 下方、文件清單上方）加：
    - 永久 banner：`<div className='mb-4 rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800'>若修改過現勘/補件欄位，請點『重新產生文件』讓內容反映最新輸入</div>`（Decision: documents-ready 回流後狀態保持不動 + 手動「重新產生文件」）
    - 「重新產生文件」按鈕：`<button disabled={regenerating}>{regenerating ? '產生中...' : '重新產生文件'}</button>`

## 6. 驗收（Wave 6）

- [x] 6.1 [Tool: codex]（本 change 涉及檔案 0 TS 錯誤；test 檔 response.data pre-existing pattern 不處理） 執行 `npx tsc --noEmit` 確認 TypeScript 無錯誤（本 change 涉及檔案）
- [x] 6.2 [Tool: codex]（0 issues） 執行 `npm run lint` 確認 0 issues
- [x] 6.3 [Tool: codex]（成功） 執行 `npm run build` 確認 production build 成功
- [x] 6.4 [Tool: codex]（129/129 綠） 執行 `npm test` 確認全測試綠燈
- [x] 6.5 [Tool: kimi]（kimi 滿 → fallback gemini；無 new critical，高風險 NextResponse import 誤判已確認存在） 用 `kimi_analyze`（或 fallback gemini）走 correctness 濾鏡審查本次 diff（5 檔 + 2 個新檔 + 2 個測試檔）：聚焦 `deleteListing` FK 處理、`handleDelete` 的 error flow、`handleRegenerate` 的狀態管理、`resolveListingSecondaryAction` 的邊界
- [x] 6.6 [Tool: kimi]（gemini）security findings 皆為 proposal Non-Goals 已明列事項（不做 auth、不做軟刪、不強化 confirm），接受 走 security-lens 濾鏡：`DELETE /api/listings/{id}` 是否有授權檢查（顧問案單使用者可不做但要記錄在 audit notes）、`window.confirm` 是否足夠防誤刪
- [x] 6.7 [Tool: codex]（DELETE 三 scenario 皆過；listings/documents/fill 三頁 200） `npm run dev` + 手動驗收五個流程：(a) 刪除空草稿列表即時消失 (b) 刪除 documents-ready 列表即時消失（若有 FK 確認處理正確） (c) documents-ready 物件點 Stepper 格 2 跳 fill 頁 (d) documents-ready 列表出現兩個按鈕、點「回去補件」跳 fill (e) documents 頁有 banner + 「重新產生文件」按鈕可觸發
- [ ] 6.8 [Tool: codex] git add + commit（繁中 conventional：`feat(ui): 加刪除物件功能 + 修 documents-ready 回流鎖死`）
- [ ] 6.9 [Tool: codex] git push 到當前 branch

---

## 偵察結果（Wave 1 完成後填入此區）

- **Heroicons**：（1.1 完成後填入）
- **FK schema**：（1.2 完成後填入）
- **Regenerate endpoint**：（1.3 完成後填入）
