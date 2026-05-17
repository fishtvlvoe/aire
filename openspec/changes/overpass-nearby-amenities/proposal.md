## Why

不動產說明書的「生活機能」頁面目前固定顯示空陣列，PDF 只會顯示「尚未查詢周邊設施」。需要整合免費的 Overpass API（OpenStreetMap）自動查詢物件周邊的學校、醫院、公園、捷運站、市場，讓 PDF 有實際的周邊設施資料。

## What Changes

- 新增 Overpass API 查詢模組（純 TypeScript fetch，不依賴 Tauri IPC），接收經緯度和半徑，回傳 NearbyAmenity 陣列
- 修改 assemble-dossier-data.ts，在組裝階段呼叫 Overpass 查詢並填入 nearbyAmenities
- 修正 test-html-pdf.ts 測試資料的 nearbyAmenities 格式，從 distance 字串改為 distanceM 數字

## Non-Goals

- 不實作 Tauri IPC 包裝（桌面打包時再包一層，本次用純 TS fetch）
- 不實作 geocoding（經緯度由地籍 API 或手動輸入取得，本次測試用硬編碼座標）
- 不快取查詢結果（未來可加 SQLite 快取，本次不做）
- 不處理 Overpass API 限流重試（回傳空陣列即可）

## Capabilities

### New Capabilities

（無新 spec — 既有 nearby-amenities-api spec 已定義完整需求）

### Modified Capabilities

- `nearby-amenities-api`：從 Tauri IPC 調整為純 TypeScript fetch 實作，保留相同的回傳格式和錯誤處理行為

## Impact

- Affected specs: `nearby-amenities-api`
- Affected code:
  - New: src/lib/overpass-client.ts
  - Modified: src/lib/pdf-engine/assemble-dossier-data.ts, scripts/test-html-pdf.ts
  - Removed: 無
- Dependencies 新增: 無（使用原生 fetch）
- 環境變數新增: 無
