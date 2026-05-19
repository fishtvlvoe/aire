## Why

`assembleDossierData` 呼叫 `safeInvoke("fetch_location_map", ...)` 取得地圖圖片，但這是 Tauri-only IPC。在 Next.js web 預覽（CaseWizardStep5）中 IPC 失敗 → `locationMapImage = null` → 說明書顯示「待取得地圖資料後自動填入」佔位文字。

## What Changes

新增 Next.js API route `/api/location-map`，接收 `lat/lng` 參數，在 server 端呼叫既有的 `fetchStaticMap()`（OSM tiles + sharp）並回傳 PNG。`assembleDossierData` 在 Tauri IPC 失敗時 fallback 到此 route，若也無 lat/lng 則先用 Nominatim geocoding 從地址取得座標。

## Non-Goals

- 建物外觀（street view）與航拍圖不在此 change 範圍（需付費 API）
- 不修改 Tauri Desktop 路徑（IPC 優先保持不變）

## Capabilities

### New Capabilities

- `location-map-api-route`: Next.js API route `/api/location-map?lat=X&lng=Y` 回傳 OSM 靜態地圖 PNG
- `web-geocode-fallback`: 瀏覽器環境下 `assembleDossierData` 自動 geocode 地址並 fetch 地圖

### Modified Capabilities

- `assemble-dossier-data`: 新增 web fallback 路徑

## Impact

- Affected specs: location-map-api-route, web-geocode-fallback
- Affected code:
  - New: src/app/api/location-map/route.ts
  - Modified: src/lib/pdf-engine/assemble-dossier-data.ts
