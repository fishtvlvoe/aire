## Summary

修復 documents-ready 物件無法回去中間頁修改內容的流程鎖死 bug，並新增列表頁刪除功能與 documents-ready 物件的次要「回去補件」入口。

## Motivation

實測兩個阻塞級問題：

1. **流程鎖死**：物件進入 `documents-ready` 後，點擊列表「查看文件」只能進 `/documents` 頁；沒有任何入口可回去 `/fill` 或 `/supplementary` 改欄位。Stepper 雖然顯示 5 格但綠格都不可點（current change 實作時只讓藍格與 currentStep 同的格子可點），使用者改內容的唯一途徑是重新建一筆物件，對真實工作流不可行。

2. **測試資料堆積**：開發過程產出一堆空草稿（實測一度累積 22 筆空 `draft`），列表與 Sidebar「最近物件」都被雜訊淹沒，使用者沒有任何手段清理。已手動 SQL 刪除一次，但缺 UI 入口會一直發生。

## Proposed Solution

A. **刪除功能**
- 新增 `DELETE /api/listings/[id]` route：硬刪除 `DELETE FROM listings WHERE id=?`
- `/listings` 列表頁每列「操作」欄尾加垃圾桶 icon（Heroicons `TrashIcon` — 專案已有 Heroicons？若無，用內嵌 SVG）
- 點擊彈原生 `window.confirm('確定刪除此物件？此操作無法復原')`
- 確認後打 DELETE API，成功則從 client state 移除該筆（不重 fetch 全部）
- 所有狀態皆可刪（含 `documents-ready`），無額外二次 ID 確認

B. **Stepper 綠格可點**（修 documents-ready 鎖死 bug）
- `getStepperItemStates` 純函式的 `clickable` 規則不動（綠=true、藍=true、格 1 在 listing 已存在時強制 false）
- Stepper 元件本體的 `getStepHref` 已存在對應 listingId 的路徑映射 — 確認其在 documents-ready 物件上能實際跳轉
- 驗收：`documents-ready` 物件的 stepper 格 2-4 （現勘/補件/產生中）全為綠色且實際可點跳到對應頁

C. **列表頁按鈕分狀態顯示**
- 新增 `resolveListingSecondaryAction(listing)` 純函式回傳 `{ href, label } | null`：`documents-ready` 回「回去補件」跳 `/fill`，其他狀態回 `null`
- `/listings` 列表「操作」欄：保留 `resolveListingHref/resolveListingActionLabel` 的主按鈕；若 secondary 非 null 額外渲染次要按鈕（灰底、較小）

D. **重新產生文件按鈕**（回流配套）
- `/listings/[id]/documents` 頁面新增「重新產生文件」按鈕，打既有 `POST /api/listings/[id]/generate` 或 `POST /api/listings/[id]/regenerate` endpoint（以實作時現有的為準）
- 按下前彈 `window.confirm('重新產生會覆蓋現有 5 份文件，確定？')`
- 回流後狀態處理：修改中間頁欄位時 `status` 保持 `documents-ready` 不退步；UI 在 `/documents` 頁顯示提示「若修改過現勘/補件欄位，請點『重新產生文件』讓內容反映最新輸入」

## Non-Goals

- **不改 listing.status 狀態機**：不新增中間態，不做「field-touched-after-generation」這類旗標
- **不引入新 npm 套件**：刪除 confirm 用原生 `window.confirm`，icon 用專案既有方式或內嵌 SVG
- **不做軟刪除**：硬刪，無 `deleted_at` 欄位；被刪的 listing 完全消失不可復原
- **不做批量刪除**：一次只能刪一筆，多筆清理靠連續點擊
- **不做刪除權限控管**：顧問案單使用者場景，不檢查 auth
- **不做 undo toast**：刪除後立即消失，不提供「還原」
- **不做自動重新產生文件**：改欄位 → 不自動重生，需使用者主動點「重新產生」
- **不改 field_visit_data / supplementary_data 的驗證規則**：回 `/fill` 頁改欄位後，若原本必填已填完，按「儲存並前往補件」正常流程；若被改成缺欄，顯示既有橫幅提示（existing Change 已實作）

## Alternatives Considered

1. **軟刪除（加 deleted_at 欄位）**：保留可復原能力，但需 migration + 所有既有 `getAllListings` query 加 `WHERE deleted_at IS NULL` — 改動範圍大，顧問案重點是「現在能用」，未來客戶要 audit 再獨立開 change。**否決**。

2. **documents-ready 物件的回流只用 Stepper，不加列表次要按鈕**：Stepper 要掛載在每頁頂部；使用者需先點「查看文件」進 `/documents` 才能用 Stepper 回中間頁，多一跳。列表加按鈕是直達路徑。**採主+副按鈕組合**。

3. **改完中間頁自動回退 status 到 `ready-for-generation` 或 `draft`**：簡化「狀態與文件一致性」判斷，但會讓使用者驚訝（我只是改個地址欄，文件就失效了？）。Gmail 專案處理過類似情境的結論：保留舊狀態 + 手動重生更符合使用者預期。**否決**。

4. **刪除走後台管理頁而非列表行內**：顧問案無後台、單使用者，列表 inline 是最低摩擦設計。**採 inline**。

## Impact

- **Affected specs**:
  - `openspec/specs/listing-ui-flow/spec.md`（modified — 新增刪除需求、Stepper 綠格可點需求、列表次要按鈕需求、重新產生文件按鈕需求、documents-ready 回流提示需求）
  - `openspec/specs/listing-workflow/spec.md`（modified — 新增 listing 硬刪除 API 需求）
- **Affected code**:
  - `src/app/api/listings/[id]/route.ts`（新增 DELETE handler；檢查既有是否有 GET/PATCH handler 決定 append 或新檔）
  - `src/lib/db.ts` 或 `src/lib/db/index.ts`（新增 `deleteListing(id)` 函式）
  - `src/app/listings/page.tsx`（加垃圾桶 icon 欄位、加次要按鈕、client state 移除邏輯）
  - `src/lib/listing-routes.ts`（新增 `resolveListingSecondaryAction` 純函式）
  - `src/components/Stepper.tsx`（驗證綠格實際可點；若 bug 在此則修）
  - `src/app/listings/[id]/documents/page.tsx`（加「重新產生文件」按鈕 + 回流提示 banner）
  - 對應測試：`src/app/api/__tests__/listings-delete.test.ts`（新）、`src/lib/__tests__/listing-routes.test.ts`（擴充）
- **Dependencies 新增**：無
- **環境變數新增**：無
