## Context

不動產說明書 PDF 目前以 Puppeteer 將 Markdown 轉 HTML 後輸出靜態 PDF。所有欄位值由 LLM 從 `field_visit_data`、`extracted_data`、`supplementary_data` 組合生成 Markdown 文字，欄位不足時輸出 `{{待補}}` 字串。業務員無法在 PDF 上直接編輯，也無法在網站上補填所有必要欄位。稅費欄位全空白，無計算邏輯。

## Goals / Non-Goals

**Goals:**
- 補件表單覆蓋全部說明書必要欄位（15 個新增欄位）
- 成交價 + 房屋現值輸入後，系統自動計算 4 項稅費
- PDF 輸出包含 AcroForm text field，對應所有仍為空白的欄位
- PDF 封面 header 表格正確帶入物件名稱、案件編號、地址、公司名稱
- LLM 輸出移除個人化稱呼「老魚，您好」

**Non-Goals:**
- 土地增值稅完整試算（需要原始取得地價，非本 change 範圍）
- 實價登錄 API 查詢成交行情（需要政府 API key）
- Google Maps API 查周遭機能距離（需要 API key）
- PDF 頁面重新排版（保留現有 Puppeteer HTML 模板）

## Decisions

### D1：AcroForm 覆蓋方式

**決策**：Puppeteer 先產生帶底線空白的 PDF，再用 `pdf-lib` post-process 在底線位置加 AcroForm text field。

**理由**：
1. 保留現有 Puppeteer HTML 模板的視覺品質
2. `pdf-lib` 直接操作 PDF bytes，不需重繪版面
3. 欄位位置由 HTML 模板中 `data-field-id` attribute 標記，Puppeteer 在產生 PDF 前先呼叫 `page.evaluate()` 取得每個 `data-field-id` 元素的 `getBoundingClientRect()` 座標，寫入欄位座標 map，再交給 `acroform-overlay.ts` 疊加

**替代方案放棄**：
- 完全改用 `pdf-lib` 重建 PDF：工作量過大，需重建所有表格、字型、中文字體嵌入
- HTML 表單 → 印出：印表機不會保留表單欄位

### D2：補件表單新增欄位分組

新欄位分為 4 組加入 `supplementary_data` JSON：

| 群組 | 欄位 |
|------|------|
| **身份資訊** | `company_name`, `property_name`, `case_number`, `agent_name`, `agent_phone` |
| **交易資訊** | `sale_price`, `transaction_type`, `deed_fee_split`, `other_terms` |
| **建物補充** | `ancillary_building_area`, `common_area_ping`, `land_use_zone`, `announced_land_value` |
| **周遭機能** | `school_distance`, `park_distance`, `transport_description`, `shopping_description` |

所有欄位為 optional string，不影響現有 schema 驗證。

### D3：稅費自動計算

新建 `src/lib/document-generator/tax-calculator.ts`，Export `calculateTaxFees(input: TaxInput): TaxResult`。

計算項目（輸入：`sale_price` 成交價、`house_assessed_value` 房屋現值）：

| 稅費項目 | 計算公式 | 負擔方 |
|----------|----------|--------|
| 契稅 | `house_assessed_value × 6%` | 買方 |
| 印花稅（買方） | `sale_price × 0.05‰` | 買方 |
| 印花稅（賣方） | `sale_price × 0.05‰` | 賣方 |
| 登記規費 | `sale_price × 0.1%` | 買方 |
| 履保費 | `sale_price × 0.06%` | 雙方各半 |
| 地價稅 | `manual`（需點交日分算） | 待填 |
| 房屋稅 | `manual`（需點交日分算） | 待填 |
| 代書費 | `manual`（市場行情 NT$20,000–30,000） | 待填 |

`sale_price` 或 `house_assessed_value` 任一為空 → 對應項目輸出 `null`（PDF 顯示空白 AcroForm 欄位）。

### D4：移除 LLM 個人化稱呼

修改 `dossier-building.ts` prompt：
- 移除 `老魚，您好，已為您整理好` 這段 system prompt 指令
- 改為：`請直接產出 16 章節的說明書內容，不要有任何稱呼或問候語，直接從章節 1 開始。`

## Risks / Trade-offs

| 風險 | 緩解 |
|------|------|
| `getBoundingClientRect()` 在 Puppeteer headless 模式座標精度 | 在開發環境驗證座標 map，必要時加偏移校正常數 |
| AcroForm 欄位在不同 PDF 閱讀器顯示差異 | 以 Acrobat Reader / macOS Preview 為目標，其他閱讀器為 best-effort |
| 補件表單 15 個新欄位 UX 複雜度增加 | 分組顯示（摺疊面板），非必填欄位預設摺疊 |
