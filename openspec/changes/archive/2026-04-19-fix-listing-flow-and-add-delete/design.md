## Context

本 change 合併四個相互依賴的議題到同一個 sprint：

- A（刪除）與 C（列表次要按鈕）都改 `/listings/page.tsx` 同個 `<tr>` 結構，分開做會 merge conflict
- B（Stepper 可點）與 D（回流配套）在同一個 UX 敘事下：documents-ready 回去改東西的完整路徑
- A 與 B 是阻塞級，C/D 是 B 的配套（沒 B 的 bug 修好，C/D 意義不大）

**既有狀態**：
- Next.js 16.2.4（Turbopack / App Router / React 19）
- better-sqlite3 @ `data/listings.db`，既有 `getListing(id)` / `getAllListings()` / `updateListing(id, data)` 但**尚無** `deleteListing`
- `src/lib/listing-routes.ts` 純函式已提供 `resolveListingHref` / `resolveListingActionLabel`（前一個 change 建立）
- `src/components/Stepper.tsx` 的 `getStepperItemStates` 純函式已回傳 `clickable`，元件本體已根據 `listingId` 算 href — 但實測 documents-ready 物件的綠格視覺上不可互動（待查：是 Stepper bug 還是容器頁沒掛）
- Heroicons 是否已裝？要查

**核心約束**：
- 顧問案不允許新 npm 套件
- 主對話 0 寫碼（`~/.claude/lessons.md` L027）
- 每個 task 標 `[Tool: ...]` 且整體 ≤ 20K tokens 成本

## Goals / Non-Goals

**Goals**

- 修復 `documents-ready` 物件無法回中間頁改內容的流程鎖死
- 提供 UI 刪除入口避免未來再發生 22 筆空草稿堆積
- 保持 listing.status 狀態機不動（四態不變）
- 零新依賴

**Non-Goals**

見 proposal.md 的 Non-Goals 段落。

## Decisions

### Decision: 硬刪除（DELETE FROM listings）而非軟刪除

**選擇**：`DELETE FROM listings WHERE id = ?`，無 `deleted_at` 欄位，被刪除的 listing 完全消失。

**理由**：
- 顧問案單使用者、SQLite 本機檔、無 audit 需求
- 軟刪除要 migration + 改所有 `getAllListings()` 為 `WHERE deleted_at IS NULL` + 考慮外鍵級聯（若有）— 改動範圍不成比例
- 測試產生的空草稿是主要被刪對象，本來就沒保留價值
- 未來若客戶要 audit 再開新 change 做 migration

**Alternatives Considered**:
1. **軟刪除加 deleted_at 欄位**：保留可復原與歷史查詢能力。否決（成本 >> 效益；顧問案 MVP 優先）。
2. **歸檔到 `archived_listings` 表**：保留資料但需 schema 兩份 + 移動邏輯。否決（比軟刪還重）。

### Decision: 原生 window.confirm 而非自製 Modal

**選擇**：刪除與「重新產生文件」都用 `window.confirm(訊息)` 彈原生 OS dialog。

**理由**：
- 零依賴、零 UI 元件成本
- 顧問案不追求視覺精緻，追求「快速交付可用」
- 原生 confirm 在 macOS/Windows/Chrome/Firefox 一致、瀏覽器處理 focus / keyboard / a11y
- 未來若需要客製（例如多段文案、checkbox「不要再問」），再開獨立 change 做 Modal

**Alternatives Considered**:
1. **自建 Modal 元件**：可客製，但需寫 focus trap / esc close / backdrop click / a11y 屬性。否決（過度工程）。
2. **Radix UI 或 Headless UI 的 AlertDialog**：現成 a11y 完備，但要新增 npm 套件違反約束。否決。

### Decision: 列表頁刪除後從 client state 移除而非重 fetch

**選擇**：DELETE API 回 200 後，前端做 `setListings(prev => prev.filter(l => l.id !== deletedId))`，不重打 `/api/listings`。

**理由**：
- 順暢的 UI 回饋（立即消失，無重 loading）
- 減少一次網路往返
- 顧問案單使用者無需擔心多 tab 同步

**Alternatives Considered**:
1. **重打 `/api/listings` 重畫列表**：最保守，但有明顯 loading 閃動。否決（UX 差）。
2. **樂觀更新（先從 UI 移除再打 API）**：更快但 API 若失敗要 rollback。否決（複雜度增加但本場景 API 幾乎不會失敗）。

### Decision: documents-ready 回流後狀態保持不動 + 手動「重新產生文件」

**選擇**：使用者改中間頁欄位時，`listing.status` 保持原 `documents-ready`；`/documents` 頁加「重新產生文件」按鈕，按下才跑 AI 重生。

**理由**：
- 避免「改一個字就失效所有文件」的使用者驚訝
- 避免自動重生 = 每改一下燒一次 token
- 手動觸發給使用者明確控制權 — 符合顧問案「成本透明」精神
- 配套 UI 提示確保使用者知道「欄位與文件可能不一致」

**Alternatives Considered**:
1. **自動回退 status 到 `ready-for-generation`**：概念簡潔但使用者驚訝度高。否決。
2. **加 `field_touched_after_generation` 旗標 + UI 標紅**：精準但要動 schema。否決（超出本 change 範圍）。
3. **每次改完自動重生**：最一致但最貴。否決。

### Decision: Stepper 綠格可點是元件本體而非純函式問題

**預設**：`getStepperItemStates` 的 `clickable` 邏輯已正確（綠=true、藍=true、格1 listing 存在時 false）；若實測綠格不可點，bug 在 Stepper 元件本體的 `getStepHref` 或 `Link` 渲染邏輯。

**驗證流程**：
1. 先在 `/listings/4/documents` 頁面實測點擊 Stepper 格 2（綠）是否跳 `/listings/4/fill`
2. 若跳 → 無 bug，只需補 C/D 與刪除功能
3. 若不跳 → 修 Stepper 元件；最可能原因：`Link` 元件在 `clickable=false` 時才用 `<div>`，但其他渲染條件出錯

**Alternatives Considered**:
1. **改寫 `getStepperItemStates` 邏輯讓 clickable 更嚴格**：不需要，問題不在這裡。否決。

### Decision: 列表次要按鈕用純函式 resolveListingSecondaryAction

**選擇**：擴充 `src/lib/listing-routes.ts`，新增：

```ts
export function resolveListingSecondaryAction(listing: Listing): { href: string; label: string } | null {
  if (listing.status === 'documents-ready') {
    return { href: `/listings/${listing.id}/fill`, label: '回去補件' };
  }
  return null;
}
```

**理由**：
- 與 `resolveListingHref` / `resolveListingActionLabel` 設計一致，可單元測試
- 未來擴充（例如 field-visit-complete 加「回去改基本資料」）只需改此函式

## Risks / Trade-offs

- **[Risk] 刪除 documents-ready 物件會連同已產生的 5 份文件一起消失** → Mitigation：原生 confirm 訊息明寫「此操作無法復原」；使用者看到是 `documents-ready` 狀態會警覺

- **[Risk] 硬刪除若 listings 有外鍵關聯（例如 codex_sessions）會報 FK constraint error** → Mitigation：先查 schema 確認；若有 FK 則在 `deleteListing` 內先刪 children 再刪 listing，或在 API handler 回 409 Conflict 告知有關聯資料

- **[Risk] 列表頁 client state 刪除失敗時 UI 會不一致**（例如網路斷）→ Mitigation：`try/catch` API call，失敗時彈 `window.alert('刪除失敗：' + msg)` 並不改動 state

- **[Risk] 「重新產生文件」覆蓋現有文件前無備份** → Mitigation：confirm 訊息明寫「會覆蓋現有 5 份文件」

- **[Trade-off] 不加 `field_touched_after_generation` 旗標 → 使用者改欄位後無視覺標記提醒文件過時** → Mitigation：`/documents` 頁永久顯示提示 banner「若修改過現勘/補件欄位，請點『重新產生文件』」；接受此提示在從未改過的情境下也會顯示（稍嫌冗餘但無害）

## Migration Plan

**部署步驟**：
1. 本機 `npm run dev` 實測：
   - 刪除空 listing 200 + 列表更新
   - 刪除 documents-ready listing 200 + 列表更新
   - documents-ready 物件的 Stepper 格 2/3/4 可點跳對應頁
   - `/listings/[id]/documents` 頁「重新產生文件」按鈕可觸發重生
   - `/listings` 列表 documents-ready 列出現兩個按鈕
2. `npm run build` + `npm test` 全綠
3. commit + push
4. 顧問案無 staging，直接交付客戶

**回滾策略**：
- 單 commit，`git revert <sha>` 即可
- DELETE API 若被誤用刪了重要資料：靠 SQLite 檔案備份（本機 `data/listings.db` 定期 cp 備份 — 若客戶尚未建立備份習慣，單獨發操作手冊提醒）

## Open Questions

- **是否有 FK 關聯表**：`listings` 是否被 `codex_sessions` / `generated_documents` 等表以 FK 引用？若有，硬刪除會拋 constraint error。**Apply 第一步要查 schema**，若有則在 `deleteListing` 實作時一併處理。
- **Heroicons 是否已裝**：`package.json` 查不到的話用內嵌 SVG（約 10 行）。Apply 第一步查。
- **`/api/listings/[id]/generate` vs `/regenerate` endpoint 哪個現存**：既有 `route.ts` 與 `regenerate.test.ts` 都看過，實作時確認哪個是對的 endpoint。
