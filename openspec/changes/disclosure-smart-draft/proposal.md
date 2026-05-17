## Why

業務助理每份不動產說明書耗費 2-3 小時手工查冊、謄抄、比對資料。AIRE 已有謄本 API 串接，但 PDF 產出尚缺封面完整欄位、物件資料表、成交行情表、生活機能表、稅費試算、現況調查表（土地 35 題 / 成屋 ~58 題）及位置圖/外觀圖。補齊這些模組後，助理只需輸入地址 + 總價，即可產出「智能草稿版」PDF 帶去現場。

## What Changes

- 新增封面完整欄位（照官方格式）及物件資料表頁面（土地版/成屋版各自格式）
- 新增建物標示面積分欄（主建物/附屬/公設/車位）
- 新增成交行情完整表格頁面（每筆列出，照客戶「透明房價一覽表」格式）
- 新增 Tauri IPC `query_nearby_amenities`（Overpass API / OpenStreetMap，免費無 key）自動查周邊設施
- 新增生活機能表頁面（兩版皆有，自動帶入）
- 新增稅費計算引擎（土地增值稅一般/優惠、契稅、印花稅、登記規費、代書費）
- 新增增值稅概算表 + 費用一覽表頁面（照客戶格式）
- 新增簽章欄（賣方/買方/經紀人/公司/日期）
- 新增土地版現況調查表（客戶版 35 題連續編號，草稿 = 空白問卷）
- 新增成屋版現況調查表（客戶 38 題 + 官方建物專屬 ~20 題）
- 新增 Tauri IPC `fetch_location_map`（OSM Tile 拼接，免費無 key）
- 新增外觀圖功能：草稿版顯示「請於現場拍攝」佔位，完整版渲染業務上傳的照片
- 修改 `assemble-dossier-data.ts` 擴充 CaseDossierData 映射新欄位
- 修改 PDF document.tsx 整合所有新頁面

## Non-Goals

- 電子簽章 / 線上簽約流程（實體紙本簽章）
- 表單 UI 大改（現有表單 UI 足夠）
- 非房屋類建物（店面/廠房/農舍/車位等）— 後續版本
- 嫌惡設施自動查詢（留現場人工確認）
- 社群登入 / 帳號系統改動
- PDF 底板 / 浮水印改動

## Capabilities

### New Capabilities

- `property-data-sheet`: 物件資料表頁面（土地版照 docx 母版、成屋版照 pdf 母版格式）
- `transaction-history-table`: 成交行情完整表格（每筆列出，含地址/面積/總價/單價/日期）
- `nearby-amenities-api`: Overpass API（OSM）串接，查詢周邊學校/醫院/公園/捷運/市場（免費無 key）
- `life-amenities-page`: 生活機能表頁面（兩版皆有，距離+名稱自動帶入）
- `tax-calculation-engine`: 稅費計算引擎（總價+公告現值 → 各稅費金額）
- `tax-fee-pages`: 增值稅概算表 + 費用一覽表 PDF 頁面
- `land-condition-survey`: 土地版現況調查表 35 題（草稿空白/完整填答兩模式）
- `building-condition-survey`: 成屋版現況調查表 ~58 題（客戶38+官方補充20）
- `exterior-photo-upload`: 外觀圖功能（草稿佔位提示 + 完整版渲染業務上傳照片）
- `location-map-api`: OSM Tile 拼接產生位置圖（免費無 key）
- `signature-block`: 簽章欄完整格式（四方+日期）

### Modified Capabilities

- `dossier-data-assembly`: 擴充 CaseDossierData 介面，新增封面欄位、建物標示面積分欄、物件資料表欄位、周邊設施、稅費、地圖/外觀照片
- `pdf-document-structure`: 修改 PDF 主模板，整合所有新頁面至正確位置
- `disclosure-cover-page`: 封面補齊所有官方格式欄位（物件名稱/編號/承辦人/經紀人/公司資訊）

## Impact

- Affected specs: dossier-data-assembly, pdf-document-structure, disclosure-cover-page（修改）+ 11 個新 spec
- Affected code:
  - New: `src/lib/pdf-blocks/PropertyDataSheetPage.tsx`, `src/lib/pdf-blocks/TransactionHistoryPage.tsx`, `src/lib/pdf-blocks/TaxFeePage.tsx`, `src/lib/pdf-blocks/LandConditionSurveyPages.tsx`, `src/lib/pdf-blocks/BuildingConditionSurveyPages.tsx`, `src/lib/pdf-blocks/SignatureBlock.tsx`, `src/lib/pdf-blocks/ExteriorPhotoPage.tsx`, `src/lib/tax-calculator.ts`, `src-tauri/src/geo_services/mod.rs`, `src-tauri/src/geo_services/overpass.rs`, `src-tauri/src/geo_services/osm_map.rs`
  - Modified: `src/lib/pdf-engine/assemble-dossier-data.ts`, `src/lib/pdf-engine/document.tsx`, `src/lib/pdf-blocks/Cover.tsx`, `src/lib/pdf-blocks/LifeAmenities.tsx`, `src/lib/pdf-blocks/LocationMap.tsx`, `src-tauri/src/lib.rs`（IPC 註冊）, `src/lib/disclosure-schema-land.ts`, `src/lib/disclosure-schema-residential.ts`
- Dependencies 新增: 無（Overpass API + OSM tiles 皆免費無需 key）
- 環境變數新增: 無
