## Why

html-pdf-engine change 已完成核心渲染引擎替換（4 頁基礎結構），但 disclosure-smart-draft 之前做好的 9 個頁面區塊仍在 react-pdf 版（會中文亂碼）。需要把所有頁面遷移到 HTML renderer，讓完整 21 頁不動產說明書正常輸出。

## What Changes

- 新增 9 個 HTML 版頁面元件到 `src/lib/pdf-engine/html-blocks/`：
  - `property-data-sheet.tsx` — 物件資料表
  - `transaction-history.tsx` — 成交行情表
  - `life-amenities.tsx` — 生活機能表
  - `tax-fee.tsx` — 費用一覽表 + 增值稅概算表
  - `signature-block.tsx` — 簽章欄（完整四方版）
  - `land-condition-survey.tsx` — 土地版現況調查表（35 題）
  - `building-condition-survey.tsx` — 成屋版現況調查表
  - `location-map.tsx` — 位置圖
  - `exterior-photo.tsx` — 外觀圖
- 修改 `src/lib/pdf-engine/html-renderer.tsx` — 整合所有 HTML 頁面區塊，完整排列 21 頁
- 修改 `src/lib/pdf-engine/html-components.tsx` — 如需新增共用 HTML 元件

## Non-Goals

- 不刪除舊 react-pdf 版（保留供比對/rollback）
- 不改資料組裝層（assemble-dossier-data.ts）
- 不加新功能，只做 1:1 格式遷移

## Capabilities

### New Capabilities

- `html-pdf-blocks`: HTML 版 PDF 頁面區塊元件群，取代 react-pdf 版的 src/lib/pdf-blocks/*.tsx

### Modified Capabilities

- `html-pdf-renderer`: 擴充 renderDisclosureHtml ��� 4 頁到完整 21 頁

## Impact

- Affected specs: `html-pdf-blocks`（新）、`html-pdf-renderer`（修改）
- Affected code:
  - New: `src/lib/pdf-engine/html-blocks/property-data-sheet.tsx`、`src/lib/pdf-engine/html-blocks/transaction-history.tsx`、`src/lib/pdf-engine/html-blocks/life-amenities.tsx`、`src/lib/pdf-engine/html-blocks/tax-fee.tsx`、`src/lib/pdf-engine/html-blocks/signature-block.tsx`、`src/lib/pdf-engine/html-blocks/land-condition-survey.tsx`、`src/lib/pdf-engine/html-blocks/building-condition-survey.tsx`、`src/lib/pdf-engine/html-blocks/location-map.tsx`、`src/lib/pdf-engine/html-blocks/exterior-photo.tsx`、`src/lib/pdf-engine/html-blocks/index.ts`
  - Modified: `src/lib/pdf-engine/html-renderer.tsx`
