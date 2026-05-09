## Context

AIRE 是房地產 AI 系統（Next.js 16 + SQLite），業務在 `src/app/listings/[id]/fill/page.tsx` 編輯物件資料。目前該頁面有「委託前資料」「現勘」「補充」三個 tab，但缺少周邊行情查詢輔助。

業務目前的 workflow：
1. 編輯物件 → 切換到瀏覽器 → 開 591 → 手動輸入縣市/區/價格 → 看結果 → 截圖 → 切回系統 → 上傳 → 填寫摘要

每個物件約 5–10 分鐘的切換成本。本 change 把「開 591 + 預填查詢條件」自動化（純 URL 組裝，零後端訪問），保留「業務判斷 + 截圖 + 摘要」為人工。

技術限制：
- 三家平臺的搜尋 URL 格式偶爾改版（年度頻率）→ 寫成可設定的 template，未來只改一個檔
- 附件儲存目前在 `listing.attachments` JSON 欄位 → 不另起新表，沿用既有結構

## Goals / Non-Goals

**Goals:**
- 業務點 1 個按鈕即可在新分頁打開預填查詢的 591 / 信義 / 樂屋
- 業務上傳的截圖與填寫的摘要 SHALL 進入不動產說明書「周邊環境」章節
- 系統與第三方平臺零自動互動（無 fetch、無 headless）

**Non-Goals:**
- 不做地圖視覺化
- 不做附件內容自動分析
- 不取代業務的判斷工作

## Decisions

### URL Builder 策略

**決策**：在 `src/lib/external-links/url-builder.ts` 集中管理三家平臺的 URL template。

```ts
// 結構示意（不是最終代碼）
export const externalPlatforms = {
  '591-price': {
    label: '591 實價登錄',
    template: 'https://price.591.com.tw/list?regionid={regionId}&section={sectionId}',
    paramMapper: (listing) => ({ regionId: cityToRegionId(listing.city), sectionId: districtToSectionId(listing.district) }),
  },
  '591-buy': { ... },
  'sinyi': { ... },
  'rakuya': { ... },
} as const;
```

**理由**：
- 集中管理 → URL 改版只改一處
- 純函式 → 易測試、不需 mock
- 對應表（city → regionId、district → sectionId）寫成 const → 可在測試中固定快照

**替代方案**：每個按鈕元件自己組 URL → 散落各處難維護 → 不採用

### Region / District ID 對應表

**決策**：建立 `src/lib/external-links/region-mapping.ts`，內含三家平臺的「縣市/行政區 → 對方 ID」對應表。

- 591：使用 `regionid` (1=台北、2=新北...)、`section` (11=中正、12=大同...)
- 信義房屋：URL slug 用中文（`/buy/list/台北市-中正區-zip/`）→ 直接 URL encode
- 樂屋網：使用 `city` + `zipcode`（郵遞區號）

**理由**：避免 hard-code 在 URL builder 內，未來新增縣市只改對應表。

**Risk**：對應表需建立全台 22 縣市 + 約 368 個鄉鎮市區。
**Mitigation**：第一版只建 6 都（涵蓋 90% 物件），其他縣市 fallback 到「縣市層」搜尋（不指定行政區），標註「未覆蓋區域」於 UI。

### 附件儲存策略

**決策**：沿用現有 `listing.attachments` JSON 欄位，新增 `type: 'market_research'` 標記區分用途。

```json
{
  "attachments": [
    { "id": "att_1", "filename": "591_周邊成交.png", "type": "market_research", "uploaded_at": "..." },
    { "id": "att_2", "filename": "現勘照片.jpg", "type": "field_visit", "uploaded_at": "..." }
  ]
}
```

**理由**：
- 不另起新表，遷移成本低
- 用 `type` 欄位即可在「周邊環境」章節篩選 `market_research` 附件
- 與既有現勘附件 (`field_visit`) 同一儲存層

### Schema 變更

**決策**：新增 `listings.market_summary TEXT NULL` 欄位。

**理由**：避免 overload `field_visit_data` 或 `supplementary_data` JSON（語意不同：周邊行情是「外部資料人工摘要」，不屬於現勘或補充）。

**Migration**：新增 `migrations/00X_add_market_summary.sql`：
```sql
ALTER TABLE listings ADD COLUMN market_summary TEXT;
```

向後相容：欄位 nullable，舊資料不受影響。

### UI 元件位置

**決策**：在 `src/app/listings/[id]/fill/page.tsx` 的「補充資料」tab 新增 `<MarketLookupPanel />` 區塊，置於現勘照片區下方。

**理由**：周邊行情屬於「補充判斷依據」，不屬於委託前的官方資料、也不屬於現勘的物件本身觀察。

### 不動產說明書整合

**決策**：`src/lib/document-generators/dossier/sections/neighborhood.ts`（若不存在則新建）讀取：
- `listing.market_summary` → 渲染為「周邊行情摘要」段落
- `listing.attachments.filter(a => a.type === 'market_research')` → 嵌入為附件圖片或 PDF 連結

如果 `market_summary` 為空且無 `market_research` 附件 → 章節顯示「待補」（與其他章節一致行為）。

## Implementation Distribution Strategy

**代理分配表（禁用 Codex / Cursor）：**

| 任務類別 | 代理 | 原因 |
|---------|------|------|
| URL builder + 對應表 | Copilot CLI | 純函式 + 常數，CLI 最快 |
| MarketLookupPanel UI 元件 | Copilot CLI | React + Tailwind，標準前端 |
| Migration | Copilot CLI | 1 行 ALTER TABLE |
| Attachment API（如需新增） | Copilot CLI | 標準 RESTful upload |
| Dossier neighborhood section 整合 | Copilot CLI | 修現有檔案 |
| 單元測試（URL builder） | Copilot CLI | 純函式測試 |
| E2E 測試（按鈕點擊 + 上傳 + PDF 驗證） | Sonnet 子代理 | 跨多模組整合測試 |
| 跨檔 CR | Kimi MCP | diff > 10 行 |

**並行策略**：
- Wave 1：URL builder + 對應表 + Migration（並行，無互相依賴）
- Wave 2：UI 元件 + Attachment API + Dossier 整合（並行，依賴 Wave 1）
- Wave 3：單元測試 + E2E 測試（並行，依賴 Wave 2）

**Token 成本估算**：約 8K tokens（小功能，Copilot 免費額度為主）

## Risks / Trade-offs

- **[Risk] 三家平臺 URL 改版** → 系統按鈕跳到無效頁面。**Mitigation**：每月手動驗證一次（加入 v31-polish 的 CI 後可半自動）；URL template 集中管理便於修復。
- **[Risk] 對應表覆蓋不全** → 偏鄉物件無法精準導向。**Mitigation**：第一版 6 都優先；fallback 到縣市層搜尋；UI 顯示「未覆蓋此區域，已導向縣市層」提示。
- **[Risk] 業務忘記人工查看就送出說明書** → 周邊環境章節為空。**Mitigation**：說明書生成時若 `market_summary` 為空，顯示「待補」並在預覽頁警示。
- **[Risk] 附件 5MB 上限不夠用** → 4K 截圖可能超過。**Mitigation**：UI 顯示「建議 1080p 截圖」提示；超過時 client-side 自動壓縮（Wave 2 任務）。
- **[Trade-off] 不做地圖** → 業務仍需切換到 591 看地圖。**接受**：本 change 範圍小、可快速上線；地圖功能未來另開 change（需 Google Maps API 授權）。
