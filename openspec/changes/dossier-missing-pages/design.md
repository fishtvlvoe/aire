## Context

說明書目前由 `src/lib/pdf-engine/document.tsx` 組合，缺少第 6-8 頁與地圖附件。稅費計算散落在 UI 元件中或完全缺失。地圖功能尚未實作。`disclosure-form-residential.tsx` 和 `disclosure-form-land.tsx` 收集表單資料，`DisclosureHtmlPreview.tsx` 即時渲染右側預覽。

## Goals / Non-Goals

**Goals:**
- 新增說明書第 6 頁（固定法條 6 項，無需使用者輸入）
- 新增說明書第 7 頁（費用一覽表，3 個使用者輸入觸發全自動計算）
- 新增說明書第 8 頁（增值稅概算表附注 7 項，固定文字）
- 新增周遭設施地圖附件（地址解析 + Overpass 查詢 + Leaflet 渲染）
- 稅費計算邏輯集中到 `src/lib/tax-calculator.ts`，純函式便於測試

**Non-Goals:**
- 不實作 PDF 匯出（現有 `export_pdf` Tauri 命令不修改）
- 不實作地政 WMS（地籍套疊）—— 地圖只用 OSM + Overpass
- 不支援多筆土地分筆增值稅計算（只處理單筆）
- 不加入政府稅率 API（稅率為硬編碼常數，業務可手動覆蓋）

## Decisions

### 1. 稅費計算：純函式 + TypeScript

建立 `src/lib/tax-calculator.ts`，匯出以下純函式：
```
stampTax(contractPrice: number, officialValue: number, shareRatio: number): number
// 公式：(核定契價 + 公告現值 × 持分面積) × 0.1%

deedTax(contractPrice: number): number
// 公式：核定契價 × 6%

buildingTax(buildingCurrentValue: number, usage: "residential" | "commercial"): number
// 住家：buildingCurrentValue × 1.2%；營業：× 3%

landPriceTax(landCurrentValue: number, daysDiff: number): number
// 概估：地價 × (daysDiff / 365) × 稅率（住家 2‰、一般 10‰）
```
土地增值稅（LVT）不計算，只顯示說明文字（需地政 API 公告地價歷史，超出本 change 範圍）。

### 2. 第 6、8 頁：靜態 React 元件

- `DossierPage6Notices.tsx`：6 項法條硬編碼為 JSX 列表，無 props
- `DossierPage8TaxNotes.tsx`：7 項附注硬編碼，無 props
- 在 `DisclosureHtmlPreview.tsx` 和 `pdf-engine/document.tsx` 兩處插入

### 3. 第 7 頁：接收 `TaxInputs` prop

```typescript
interface TaxInputs {
  contractPrice: number;      // 交易價金（元）
  officialLandValue: number;  // 公告現值（元，從地政 API 或手填）
  shareRatio: number;         // 持分比例（0-1，預設 1.0）
  buildingCurrentValue: number;
  transactionDate: string;    // ISO 格式，用於計算地價稅天數
  usage: "residential" | "commercial";
}
```
`DossierPage7FeeTable.tsx` 接收 `TaxInputs`，呼叫 `tax-calculator.ts` 各函式，渲染費用表格。

### 4. 地圖：Leaflet + Overpass，瀏覽器端渲染

`src/lib/map-api.ts` 封裝：
1. `geocodeAddress(address: string): Promise<{lat,lng}>` — 呼叫 Nominatim
2. `fetchAmenities(lat, lng, radiusM): Promise<Amenity[]>` — 呼叫 Overpass

`DossierSurroundingMap.tsx`：
- mount 時呼叫上述兩函式
- 用 `leaflet` npm 套件渲染地圖容器
- 顯示學校、醫院、捷運、公車站、市場等 icon
- 提供 `onMapReady(imageUrl: string)` callback 供 PDF 截圖（Phase 2 才需要，本 change 先渲染 HTML）

### 5. 整合入 DisclosureHtmlPreview

`DisclosureHtmlPreview.tsx` 接收新 prop `taxInputs?: TaxInputs`，於頁面序列末尾插入 Page6, Page7, Page8, Map。表單 onChange 時自動串接 `taxInputs` 資料更新。

## Implementation Contract

### C1：`src/lib/tax-calculator.ts`

| 函式 | 輸入 | 輸出 | 邊界 |
|------|------|------|------|
| `stampTax` | contractPrice=1000000, officialValue=800000, shareRatio=1.0 | 1800 | 四捨五入至整數 |
| `deedTax` | contractPrice=1000000 | 60000 | 四捨五入至整數 |
| `buildingTax` | buildingCurrentValue=200000, "residential" | 2400 | 四捨五入至整數 |
| `buildingTax` | buildingCurrentValue=200000, "commercial" | 6000 | 四捨五入至整數 |

輸入為 0 或負數 → 回傳 0（不拋出例外）。

### C2：`DossierPage6Notices.tsx`

- 無 props，render 回傳含 6 項法條的 `<section>` 元素
- 每項法條有 `data-notice-index="1"` 到 `"6"` 屬性便於測試

### C3：`DossierPage7FeeTable.tsx`

- 接收 `TaxInputs` props，渲染費用表格
- `data-testid="fee-stamp-tax"` 顯示印花稅計算結果
- `data-testid="fee-deed-tax"` 顯示契稅結果
- `data-testid="fee-building-tax"` 顯示房屋稅結果
- 輸入改變時立即重算（無 debounce）

### C4：`DossierPage8TaxNotes.tsx`

- 無 props，render 回傳含 7 項附注的 `<section>` 元素
- 第 5 項必須包含「非都市土地持分面積>700m²」文字

### C5：`DossierSurroundingMap.tsx`

- Props：`address: string`
- mount 後 2s 內呼叫 geocodeAddress；失敗時顯示「地圖載入失敗，請確認地址」
- `data-testid="surrounding-map-container"` 用於測試驗收

### C6：`src/lib/map-api.ts`

- `geocodeAddress` 失敗（網路錯誤或回傳空）→ throw `MapGeocodingError`
- `fetchAmenities` 失敗 → throw `MapAmenitiesError`
- 兩者皆有 `message` 欄位描述失敗原因
