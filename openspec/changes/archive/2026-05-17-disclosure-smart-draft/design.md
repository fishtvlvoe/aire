## Context

AIRE 目前已有謄本 API 串接（7 種資料源）、實價登錄 API（Twinkle Hub MCP）、法規條文 API，以及 React PDF 引擎（5 主題）。PDF 可產出但欄位不完整 — 缺封面細節、物件資料表、完整成交行情、生活機能、稅費試算、現況調查表、位置圖/外觀圖。

本次目標：補齊所有缺失模組，使「輸入地址 + 總價」即可產出業務可帶去現場的智能草稿 PDF。

限制：
- 客戶端桌面 App，資料不離機
- Google Maps API key 由客戶自付，存 Tauri stronghold
- PDF 用 @react-pdf/renderer（已採用，不換）
- 6 Wave 漸進交付，每 Wave 可獨立驗證

## Goals / Non-Goals

**Goals:**

- 封面、物件資料表、建物標示面積分欄完整照官方格式
- 成交行情以完整表格呈現（每筆一列）
- 周邊設施自動查詢（只查正面：學校/醫院/公園/捷運/市場）
- 稅費從總價 + 公告現值自動試算
- 土地版 35 題 + 成屋版 ~58 題現況調查表（草稿 = 空白問卷）
- 位置圖 + 外觀圖自動帶入 PDF
- 簽章欄四方完整

**Non-Goals:**

- 電子簽章、線上簽約
- 非房屋類建物（店面/廠房/農舍）
- 嫌惡設施自動查詢
- 表單 UI 大改
- PDF 主題/浮水印變更

## Decisions

### D1：地圖與周邊設施整合架構（免費無 key 方案）

在 Rust 端新建 `src-tauri/src/geo_services/` 模組，提供 2 個 Tauri IPC command：
- `query_nearby_amenities` — Overpass API（OpenStreetMap 免費查詢，無需 API key）
- `fetch_location_map` — OSM Tile 拼接（下載 tile 圖片 → 合成帶紅色標記的 PNG）

外觀圖不自動抓取 — 改由業務現場拍攝後上傳（草稿版顯示佔位提示）。

**Alternatives Considered:**
1. Google Maps Platform（Places + Static Maps + Street View）→ 否決：需申請 API key + 綁信用卡，增加客戶導入門檻
2. Mapbox → 否決：同樣需要 key，free tier 有限

**Rationale:** Overpass API 免費、無 key、台灣 POI 覆蓋率足夠（學校/醫院/公園/捷運站/市場皆有）。OSM tiles 免費使用（需標註 attribution）。外觀圖由業務現場拍實際照片比 Google 街景舊照更有價值。零外部依賴 = 客戶安裝即用。

### D2：稅費計算引擎位置

純前端 TypeScript 模組 `src/lib/tax-calculator.ts`。輸入：總價、公告現值、土地面積、持分比例、持有年數。輸出：各稅費金額物件。

**Alternatives Considered:**
1. Rust 端計算 → 否決：稅費公式純數學無 I/O，放前端即時預覽更方便，且公式會隨法規常改
2. 外部 API → 否決：無可靠第三方提供此服務

**Rationale:** 前端計算可即時更新 UI，且修改公式只改 TS 不需重編 Rust。

### D3：現況調查表資料結構

新增 `LandSurveyData`（35 欄位）和 `BuildingSurveyData`（~58 欄位），每題對應一個 `boolean | null` 欄位（null = 未填）。存 SQLite `disclosure_drafts.survey_data` JSON 欄位。

**Alternatives Considered:**
1. 每題獨立 DB 欄位 → 否決：58+ 欄位 schema 太寬，且題目可能微調
2. 用 array of {questionId, answer} → 否決：型別安全差、取值需 find

**Rationale:** JSON 欄位彈性高，TypeScript interface 提供編譯期型別安全，兩者兼得。

### D4：PDF 頁面組織方式

每個新章節獨立 pdf-block 檔案（如 `TaxFeePage.tsx`、`LandConditionSurveyPages.tsx`），在 `document.tsx` 的 `LandPages()` / `BuildingPages()` 函式中按順序 import 並渲染。

**Alternatives Considered:**
1. 全寫在 document.tsx → 否決：檔案已 500 行，再加會不可維護
2. 動態載入 → 否決：@react-pdf/renderer 不支援 lazy component

**Rationale:** 延續現有 pdf-blocks 模式（已有 11 個），一致性優先。

### D5：CaseDossierData 擴充策略

擴充現有 interface，新增 optional 欄位群組（用 nested object）：
- `cover: CoverData` — 封面完整欄位
- `propertySheet: PropertySheetData` — 物件資料表
- `transactionHistory: TransactionRecord[]` — 成交行情
- `nearbyAmenities: AmenityRecord[]` — 周邊設施
- `taxCalculation: TaxResult` — 稅費試算結果
- `surveyData: LandSurveyData | BuildingSurveyData | null` — 現況調查
- `exteriorPhoto: Uint8Array | null` — 外觀照片（業務上傳，草稿版為 null）
- `locationMapImage: Uint8Array | null` — 位置圖 bytes（OSM 拼接）

**Alternatives Considered:**
1. 建立新 interface 完全替代 → 否決：破壞現有 5 主題的渲染邏輯
2. 多個小 interface 分開傳 → 否決：PDF renderer 需要單一 data prop

**Rationale:** Optional nested objects 確保向後相容，舊資料仍可渲染（缺的頁面自動跳過）。

## Implementation Contract

### 行為描述

使用者在案件頁面點「產出說明書」，系統：
1. 呼叫 `assemble-dossier-data.ts` 聚合所有資料源（含 Overpass API + OSM tiles）
2. 傳入 PDF renderer，依物件類型選擇 LandPages 或 BuildingPages
3. 產出 PDF 包含所有完整頁面；缺資料的欄位顯示空白（不報錯）
4. 草稿模式：現況調查表所有 checkbox 顯示 ☐；外觀圖顯示「請於現場拍攝」佔位
5. 完整模式：依填答顯示 ☑/☐；外觀圖顯示業務上傳的照片

### IPC 合約

| Command | 參數 | 回傳 | 失敗行為 |
|---------|------|------|---------|
| `query_nearby_amenities` | `{ lat: f64, lng: f64, radius_m: u32 }` | `Vec<Amenity>` where Amenity = `{name, category, distance_m, address}` | 回傳空陣列 + log warning |
| `fetch_location_map` | `{ lat: f64, lng: f64, zoom: u8, size: "600x400" }` | `Vec<u8>` (PNG bytes, OSM tiles 拼接) | 回傳空 Vec + log warning |

### 稅費計算合約

`calculateTaxFees(input: TaxInput): TaxResult`

TaxInput: `{ totalPrice, announcedLandValue, landArea, shareRatio, holdingYears, isFirstSale, propertyType }`

TaxResult: `{ landValueIncrementTax, landValueIncrementTaxPreferential, deedTax, stampTax, registrationFee, scrivenerFee, totalSellerCost, totalBuyerCost }`

錯誤處理：輸入不合理值（負數/零）→ 回傳各項為 0 + `warnings: string[]`

### 驗收標準

- Wave 1：PDF 封面所有欄位有值、物件資料表渲染正確、建物面積分列
- Wave 2：成交行情表 5+ 筆資料、生活機能表有自動設施 + 距離
- Wave 3：輸入總價 1000 萬 → 稅費各項有合理數字、簽章欄四方完整
- Wave 4：土地版 35 題全空白 checkbox 渲染、填答後顯示 ☑
- Wave 5：成屋版 ~58 題完整、格式與 Wave 4 一致
- Wave 6：PDF 有位置地圖（非 placeholder 文字）；外觀圖草稿版顯示佔位提示

### 範圍邊界

- IN：所有 PDF 頁面渲染 + 資料組裝 + 2 個新 IPC（amenities + map）+ 稅費計算 + 外觀照片上傳
- OUT：表單 UI 大改、PDF 主題新增、權限系統、加密邏輯、Google Maps（已改用免費方案）

## Risks / Trade-offs

[Overpass API 回應速度] → 可能 2-5 秒 → 合理，只在產 PDF 時呼叫一次；加 timeout 30s + 失敗回空陣列

[OSM 台灣 POI 覆蓋率] → 學校/醫院/公園/捷運覆蓋率高，傳統市場可能較少 → 可接受，缺的留空

[稅費公式過時] → 稅率/級距寫成常數物件，修改只改常數不改邏輯；未來可做設定檔外部化

[PDF 頁數過多] → 完整版可能 20+ 頁 → @react-pdf/renderer 效能未驗證超過 30 頁 → Wave 1 完成後壓測

[調查表題目異動] → 題目寫成 const array（非 hardcode JSX），改題只改 array 不改 component

## Open Questions

- Overpass API 台灣 subway_station tag 是否用 `station=subway` 或 `network=臺北捷運` → 實作時實測
- 土地增值稅「自用住宅優惠稅率」判定條件是否需要額外輸入欄位（目前規劃由使用者勾選）
