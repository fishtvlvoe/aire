## Why

目前補件資料嵌入在「建立不動產說明書」流程中，表單內有「補件資料」tab 和「前去補件」按鈕。這造成兩個問題：(1) 建立流程過長、步驟混雜，(2) 補件是「事後補充」的動作，不應跟「初次建立」綁在一起。需要將補件獨立為獨立入口，讓兩個流程解耦。

## What Changes

- 移除建立物件表單中的「補件資料」tab 和「前去補件」按鈕
- 在物件列表新增「補件狀態」icon 欄位（⚠️ 有缺件 / ✅ 補齊 / ── 尚未開始）
- 新增獨立補件入口：點擊列表 icon 直接進入該物件的補件頁面
- 補件頁面內容不變，只是入口從「表單內 tab」改為「列表 icon + 獨立路由」

## Non-Goals

- 不修改補件表單本身的欄位或邏輯（只改入口）
- 不做補件進度百分比（只做三態 icon）
- 不做補件提醒通知（未來可擴充）

## Capabilities

### New Capabilities

- `supplementary-entry`: 補件獨立入口，包含列表 icon 顯示、點擊導航至補件頁面、獨立路由定義

### Modified Capabilities

- `listing-ui-flow`: 建立表單移除補件 tab 和「前去補件」按鈕，列表新增補件狀態欄位
- `supplementary-form`: 補件表單路由獨立化，不再依附於建立流程
- `supplementary-field-completeness`: 補件完成度計算邏輯新增三態判斷（缺件/補齊/未開始），供列表 icon 使用

## Impact

- Affected specs: listing-ui-flow, supplementary-form, supplementary-field-completeness（修改）；supplementary-entry（新建）
- Affected code:
  - New: `src/app/listings/[id]/supplement/page.tsx`（獨立補件頁面路由）, `src/components/listings/SupplementStatusIcon.tsx`（狀態 icon 元件）
  - Modified: `src/app/listings/[id]/page.tsx`（移除補件 tab）, `src/app/listings/page.tsx`（列表加 icon 欄位）, `src/lib/listings/supplementary-status.ts`（三態計算邏輯）
  - Removed: 建立表單中的補件 tab 相關元件
- Dependencies 新增: 無
- 環境變數新增: 無
