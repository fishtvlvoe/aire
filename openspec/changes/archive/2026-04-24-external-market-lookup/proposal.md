## Why

業務在編輯物件時需要查看周邊行情（591 / 信義 / 樂屋的成交與待售案）以判斷定價、撰寫銷售說明，但目前系統沒有任何輔助查詢入口。手動切換瀏覽器、複製地址貼到搜尋框，每個物件多花 5–10 分鐘。

我們不能（也不應該）由系統自動爬取這些平臺的內容（違反 ToS、有著作權與個資風險），但**可以提供 deep-link 按鈕**：點擊後在新分頁打開對方平臺、預先帶入查詢參數（縣市、行政區、價格區間），讓業務自己看完後**人工填寫摘要 + 上傳截圖附件**。整個過程：

- 系統不發任何 request 給 591 / 信義 / 樂屋
- 業務的瀏覽器自己訪問對方網站（與一般用戶無異）
- 業務自行截圖、上傳、填寫摘要
- 截圖與摘要存入 listing，於不動產說明書「周邊環境」章節引用

## What Changes

### 新功能（純前端 + 一個附件 API）

- **三個外連按鈕**：物件編輯頁新增「查看 591 實價登錄」「查看信義房屋」「查看樂屋網」按鈕，URL 由系統根據物件的縣市 + 行政區 + 總價區間動態組出，`target="_blank"` 開新分頁、`rel="noopener noreferrer"`
- **周邊行情摘要欄位**：物件編輯頁新增「周邊行情摘要」textarea（max 500 字），業務查看後自行填寫
- **附件上傳區**：接受 jpg / png / pdf（max 5MB / 單檔，最多 10 個附件），存到 `listing.attachments` 並標記為 `market_research` 類型
- **不動產說明書整合**：「周邊環境」章節 SHALL 引用周邊行情摘要與 `market_research` 類型的附件

### 法務防線

- 系統 SHALL NOT 自行 fetch / scrape / headless browser 訪問 591 / 信義 / 樂屋
- URL builder SHALL 僅組裝 query string，不模擬點擊、不嵌入 iframe
- 三個按鈕 SHALL 顯示明確標籤「在新分頁打開外部網站」

## Non-Goals

- **不做**自動截圖（任何形式的 headless browser、Puppeteer、Playwright 自動訪問三家平臺）
- **不做**iframe 內嵌對方網頁（規避 ToS 與 X-Frame-Options）
- **不做**自建周邊行情地圖（未來如要做，另開 change，預計使用內政部公開資料 + Google Maps API）
- **不做**附件 OCR 或 AI 自動摘要（業務人工填寫即可，避免幻覺）
- **不修改**現有 listing schema 的核心欄位（只擴充 attachments 與新增 `market_summary` 欄位）

## Capabilities

### New Capabilities

- `external-market-lookup`: 業務點擊外連按鈕查看第三方平臺、人工填寫周邊行情摘要與上傳截圖附件

### Modified Capabilities

- `disclosure-document-generation`: 「周邊環境」章節 SHALL 渲染 `market_summary` 欄位內容，並嵌入 `market_research` 類型附件

## Impact

- 影響的 specs：external-market-lookup（新增）、disclosure-document-generation（修改）
- 影響的程式碼：
  - New: `src/lib/external-links/url-builder.ts`、`src/components/MarketLookupPanel.tsx`、`src/app/api/listings/[id]/attachments/route.ts`（若不存在）
  - Modified: `src/app/listings/[id]/fill/page.tsx`（嵌入 MarketLookupPanel）、`src/lib/document-generators/dossier/sections/neighborhood.ts`（讀取 market_summary 與附件）
  - Migration: 新增 `listings.market_summary TEXT NULL` 欄位
  - Removed: 無
- 法律影響：本 change 主動降低法律風險（明確禁止系統自動訪問第三方平臺，僅提供使用者導引）
