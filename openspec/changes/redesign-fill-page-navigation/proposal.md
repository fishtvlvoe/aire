## Why

目前 fill 頁（/listings/[id]/fill）的「儲存並前往補件」按鈕身兼雙職（必填全綠→送出、未填完→跳補件頁），使用者不知道會發生什麼；加上英中混雜文案（「Generate Documents 產出文件」）與側邊欄被舊空草稿淹沒，讓日常現勘填寫動線破碎。這些問題累積降低了顧問端接手的信任感，必須在本週內收斂。

## What Changes

- 修改 `src/app/listings/[id]/fill/page.tsx`：移除舊的單一「儲存並前往補件」按鈕，改為「下一章節」主按鈕（章節內導航）+ 「暫存草稿」次要按鈕（任何狀態皆可）
- 新增條件：當 FieldVisitForm 的 `isComplete === true`（所有必填全綠），才顯示「儲存並產出」主按鈕（點擊跳 `/listings/[id]/generating`），否則隱藏
- 新增 `src/components/forms/FieldVisitForm.tsx` 對外暴露 `currentChapterId`、`goToNextChapter`、`hasNextChapter` 導航 helper（純函數 + setState），供 fill 頁控制「下一章節」按鈕 disabled 狀態與提示文字
- 修改 fill 頁導航提示文字：未達下一章節條件時顯示「本章節還有必填未完成」；章節已是最後一章且未達全填時顯示「還有必填欄位未完成，無法產出」
- 移除「Generate Documents 產出文件」按鈕的英文前綴 — 掃 `src/components/`, `src/app/` 下所有 `tsx` 檔，將中英夾雜按鈕/標題/tooltip 文字統一為純繁中
- 新增 `scripts/cleanup-empty-drafts.ts`（一次性）：`DELETE FROM listings WHERE status='draft' AND (field_visit_data IS NULL OR field_visit_data = '{}' OR field_visit_data = '')`；執行後 commit 記錄結果
- 修改 `src/lib/db/index.ts`：新增 `listRecentListings(limit)` 函式或於既有列表查詢加條件，過濾掉「status='draft' 且 field_visit_data 為空」的 listings（避免側邊欄污染）
- 修改 `src/components/Sidebar.tsx`（或實際渲染「最近物件」的元件）：使用新 helper 或過濾條件後的 listings 列表

## Non-Goals

- 不改 `/generating`、`/documents` 頁的行為（僅觸發流程改在 fill 頁）
- 不改 schema 欄位結構（上一個 change 已處理）
- 不加軟刪除機制（直接 SQL 硬刪空 draft）
- 不重寫 FieldVisitForm 的 chapter tabs 核心邏輯（已可用，只加導航 helper）
- 不做 auth / 權限（整站尚無登入機制，未來另案處理）
- 不處理多人同時編輯同一 listing 的 race condition

## Capabilities

### New Capabilities

（none）

### Modified Capabilities

- `listing-ui-flow`: 新增 fill 頁「下一章節」「暫存草稿」「儲存並產出」三按鈕導航規則；新增「所有必填完成才顯示產出按鈕」的條件顯示要求
- `field-visit-form`: 新增對外暴露導航 helper（goToNextChapter / hasNextChapter / currentChapterId）的要求，以便外層 fill 頁控制按鈕狀態
- `listing-workflow`: 新增「側邊欄只顯示非空 listings」的查詢過濾要求 + 「空 draft 一次性清除」腳本要求

## Impact

- Affected specs: `listing-ui-flow`, `field-visit-form`, `listing-workflow`
- Affected code:
  - `src/app/listings/[id]/fill/page.tsx`（按鈕重構、導航邏輯）
  - `src/components/forms/FieldVisitForm.tsx`（暴露章節導航 helper）
  - `src/components/Sidebar.tsx`（套用過濾後的 listings）
  - `src/lib/db/index.ts`（新增或修改 listings 列表查詢）
  - `scripts/cleanup-empty-drafts.ts`（新增一次性清理腳本）
  - `src/components/outputs/*`, `src/app/listings/[id]/documents/page.tsx` 等含「Generate Documents」等英文文字的檔（全站掃）
  - 測試：`src/app/listings/[id]/fill/__tests__/navigation.test.ts`（章節導航純函數）、`src/lib/db/__tests__/list-recent.test.ts`（過濾邏輯）
- Dependencies 新增：無
- 環境變數新增：無