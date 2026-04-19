## Context

現有 `/listings/[id]/fill` 頁的導航是單按鈕雙任務：同一顆「儲存並前往補件」按鈕在不同狀態下表達不同意圖（送出 vs 跳轉），使用者反映「按了沒反應」「不知道按下去會去哪」。同時存在兩個雜項問題污染日常動線：

1. `/listings/[id]/documents` 頁的按鈕文案是「Generate Documents 產出文件」中英混雜。
2. 側邊欄 `最近物件` 顯示了 10+ 筆純空 draft listings（多為過去測試殘留，#30-#33 等），讓真實作業物件被淹沒。

這些問題都指向同一類根因：**UI 沒有反映系統狀態的語意差異**。本次設計以「按鈕文字即行為承諾」為核心原則重整 fill 頁按鈕、清理 UI 雜訊。

## Goals / Non-Goals

**Goals:**

- fill 頁的主按鈕**在每個時刻只承諾一件事**（下一章節 / 儲存並產出），且文字與實際行為一致
- 所有必填完成前，「儲存並產出」按鈕不可被誤觸（disabled + 明確 inline 提示）
- 任何時候使用者都可以安全離開並保留進度（「暫存草稿」永遠在場）
- 全站移除中英混雜按鈕/標題文字，以繁中為唯一 UI 語言
- 側邊欄僅顯示有意義的 listings（非 draft 或 draft 但有填寫內容）
- 一次性清除 DB 裡的純空草稿

**Non-Goals:**

- 不重寫 FieldVisitForm 的 chapter tabs 核心渲染邏輯（既有可用）
- 不改 `/generating`、`/documents` 頁本身的流程
- 不加軟刪除機制（draft 直接 SQL 硬刪；使用者刪除物件仍走既有 hard delete）
- 不做多人同編的 race 處理
- 不引入新的 UI 框架或 state management（繼續 React useState + props drilling / ref forwarding）
- 不改 DB schema（只加查詢函數）

## Decisions

### Decision: 用 callback prop + forwardRef 組合對外暴露章節導航 helper

FieldVisitForm 目前的 chapter state 是純 internal useState。要讓 fill 頁外層按鈕能讀到 `currentChapterId`、`hasNextChapter`、`isCurrentChapterComplete`、`isComplete` 並呼叫 `goToNextChapter()`，採以下模式：

- 新增 prop `onNavigationStateChange(state: NavigationState)` — FieldVisitForm 每次 chapter 或欄位變更時呼叫，state 形如 `{ currentChapterId, hasNextChapter, isCurrentChapterComplete, isComplete }`
- 新增 `forwardRef` 暴露 `{ goToNextChapter: () => void }`；fill 頁用 `useRef<FieldVisitFormHandle>()` 取得 handle
- fill 頁用 `useState<NavigationState>()` 接收，用 handle 觸發切換

**Alternatives Considered**：
- (A) 把 chapter state 抽到外層（hoist state up）：侵入性太大，FieldVisitForm 所有測試要改。否決。
- (B) 全局 Zustand / Context：為了一頁用額外依賴，過度設計。否決。

### Decision: `hasNextChapter` 跳過空章節（chapter.fields.length === 0）

上一個 change 已把空章節 tab 過濾不顯示，導航的 `hasNextChapter` / `goToNextChapter` 也要一致：從 chapters 過濾 `fields.length > 0` 再計算 index。

**Alternatives Considered**：
- (A) 跳過但 tab 仍保留：tab 已經被 filter 不顯示，保留無意義，否決。
- (B) 不跳過：會出現「下一章節」跳到空頁面，使用者困惑，否決。

### Decision: 「暫存草稿」按鈕永遠在場，不隱藏

在任何填寫階段都顯示此次要按鈕，功能為「當下送 PATCH 到 `/api/listings/:id` 存 field_visit_data、status 保持 draft、跳回 /listings」。即使全填完也保留此按鈕（因為使用者可能想儲存先不產生）。

**Alternatives Considered**：
- (A) 只在部分填寫時顯示：邏輯複雜且違反使用者預期（全填完就強迫產出），否決。
- (B) 用 auto-save 取代：技術複雜度增加（debounce、衝突處理），不符合 MVP 精簡原則，否決。

### Decision: 中英混雜掃描採手動 regex + 人工覆核

mixed-language 判定邏輯：同字串同時含 3+ 字母連續 Latin word + Chinese characters。以 `rg -n '[A-Za-z]{3,}.*[\u4e00-\u9fff]|[\u4e00-\u9fff].*[A-Za-z]{3,}'` 掃 `src/`。例外白名單：`PDF`, `AI`, `URL`, `API`, `Claude`, `Next.js`（專有名詞/品牌名）。掃到的位置人工審視後修正，不做自動改。

**Alternatives Considered**：
- (A) i18n 庫（next-intl）：為了一個掃描工作引入整套 i18n 基礎設施，過重，否決。
- (B) ESLint custom rule：維護成本高，顧問專案非常態性需求，否決。

### Decision: 側邊欄過濾用 SQL WHERE，不在記憶體過濾

`listRecentListings(limit)` 實作：

```sql
SELECT * FROM listings
WHERE NOT (
  status = 'draft'
  AND (
    field_visit_data IS NULL
    OR field_visit_data = ''
    OR field_visit_data = '{}'
  )
)
ORDER BY updated_at DESC
LIMIT ?;
```

index 不新加（既有 `updated_at` 排序在小顧問資料量下 < 10ms，無需）。

**Alternatives Considered**：
- (A) JS 層 filter：所有 row 撈回再過濾，在資料量成長後會爛，否決。
- (B) 加一個 `is_empty` 計算欄位：migration 成本不划算，否決。

### Decision: 清理腳本用 tsx 執行而非 SQL migration

`scripts/cleanup-empty-drafts.ts` 用 `npx tsx scripts/cleanup-empty-drafts.ts` 執行（package.json 加 script alias）。腳本讀同一個 db 連線，印出變更前後 count，手動執行。

**Alternatives Considered**：
- (A) better-sqlite3 migration file：現有專案無 migration 基礎設施，單次清理不值得建立，否決。
- (B) 直接 bash + sqlite3 CLI：失去 TypeScript 安全性與重用 db 模組，否決。

## Risks / Trade-offs

- [Risk] FieldVisitForm 改動可能破壞既有單元測試（normalizeInitialData、getChapterBadgeClassName、shouldShowRequiredDot） → Mitigation: 只新增 onNavigationStateChange + forwardRef，不改既有 exports；跑全測試回歸
- [Risk] 清理腳本誤刪有價值資料 → Mitigation: 腳本先 SELECT COUNT 預覽 + 人工確認後才執行 DELETE；只刪 `status='draft'` AND `field_visit_data` 空的嚴格條件
- [Risk] 中英混雜掃描遺漏動態字串（透過變數拼接） → Mitigation: 手動覆核掃描結果 + 第二輪走 Kimi CR 確認；優先抓 hardcoded string literals
- [Risk] callback prop 在每次 chapter 切換都觸發外層 setState 造成 re-render 循環 → Mitigation: FieldVisitForm 內用 useEffect([currentChapterId, formState]) 統一觸發；外層用 useCallback 包住接收器
- [Risk] 使用者已打開 fill 頁填到一半時，dev server HMR reload 後狀態丟失 → Mitigation: 不在本 change 解決（屬於既有 HMR 問題）；暫存草稿按鈕是 workaround

## Migration Plan

**部署步驟**：

1. 本機跑完測試 + build 綠燈
2. 清理腳本先在 dev db 試跑（`npx tsx scripts/cleanup-empty-drafts.ts`），確認 count 正確
3. commit + push（origin/main，顧問案直接 main）
4. 顧問環境部署時手動執行清理腳本一次

**回滾策略**：

- UI 改動：`git revert <commit>` 後 rebuild
- 清理腳本執行後的資料已刪除 — 若客戶要求 undo，只能從 db 備份還原（本地 sqlite 無即時備份機制，需事前 cp listings.db listings.db.bak）
- 清理前**強制**先 `cp listings.db listings.db.bak.YYYYMMDD` 備份，寫入 tasks.md

## Open Questions

（無 — 使用者已確認 3 個決策點：暫存保留、產出直接跳 generating、舊草稿兩者都做）
