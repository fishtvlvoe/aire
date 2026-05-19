## Why

說明書目前缺少第 6-8 頁及周遭設施地圖附件。業務在現場遞交說明書時，缺頁會導致法律糾紛或退件。稅費欄位（印花稅、契稅、增值稅）目前需業務手動計算，容易出錯且費時。

## What Changes

- 新增第 6 頁：產權相關注意事項（6 項固定法條）
- 新增第 7 頁：買賣雙方費用一覽表（印花稅/契稅/增值稅/地價稅/房屋稅自動計算）
- 新增第 8 頁：土地增值稅概算表附注（7 項說明）
- 新增周遭設施地圖附件（地政 WMS + Overpass API，地址自動轉座標）
- 業務僅需填「交易價金、交屋日、使用性質」3 項，其餘系統自動計算

## Capabilities

### New Capabilities

- `dossier-page-six-notices`: 說明書第 6 頁產權相關注意事項，包含平均地權條例第47條、房地合一稅說明等 6 項固定法條
- `dossier-pages-seven-eight-tax`: 說明書第 7 頁費用一覽表及第 8 頁增值稅概算表，含稅費自動計算（買方：印花稅＋契稅；賣方：增值稅＋地價稅＋房屋稅）
- `dossier-surrounding-map`: 周遭設施地圖附件，以地址透過 OSM Nominatim 取得座標，再用 Overpass API 查詢 1km 半徑內設施，Leaflet.js 渲染地圖

### Modified Capabilities

- `tax-fee-pages`: MODIFIED — 渲染邏輯從佔位符升級至完整第 7-8 頁 HTML/React 元件
- `tax-calculation-engine`: MODIFIED — 加入印花稅、契稅、地價稅、房屋稅計算函式（原算式僅有佔位符）
- `location-map-api`: MODIFIED — 整合 Nominatim 地址解析 + Overpass 設施查詢 + Leaflet 渲染

## Impact

- Affected specs: dossier-page-six-notices（新建）、dossier-pages-seven-eight-tax（新建）、dossier-surrounding-map（新建）、tax-fee-pages（修改）、tax-calculation-engine（修改）、location-map-api（修改）
- Affected code:
  - New: src/components/DossierPage6Notices.tsx
  - New: src/components/DossierPage7FeeTable.tsx
  - New: src/components/DossierPage8TaxNotes.tsx
  - New: src/components/DossierSurroundingMap.tsx
  - New: src/lib/tax-calculator.ts
  - New: src/lib/map-api.ts
  - Modified: src/lib/pdf-engine/document.tsx
  - Modified: src/components/DisclosureHtmlPreview.tsx
  - Modified: src/components/disclosure-form-residential.tsx
  - Modified: src/components/disclosure-form-land.tsx
