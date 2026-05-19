## Context

`assembleDossierData` 從 Tauri IPC `fetch_location_map` 取得 PNG bytes 賦值給 `locationMapImage`。在 web 環境（dev server / CaseWizardStep5 預覽），IPC 丟例外 → `locationMapImage = null` → HTML 說明書顯示佔位文字。`osm-static-map.ts` 已有完整 OSM tile 邏輯，只需一個 server-side API route 對外暴露。

## Goals / Non-Goals

**Goals:**
- 在 web 環境 `locationMapImage` 有真實 OSM 地圖 PNG
- 不改變 Tauri 路徑（IPC 成功時直接用，不走 API route）

**Non-Goals:**
- 建物外觀（街景/航拍）— 需付費 API，不在此 change
- 地圖樣式客製化

## Decisions

1. **API Route 放 `/api/location-map`**：接收 `lat`, `lng`（必填）、`zoom`（可選，預設 16）的 query params，呼叫 `fetchStaticMap()` 回傳 `image/png`。無效參數回 400。
2. **Fallback 順序**：Tauri IPC 成功 → 用 IPC 結果；IPC 丟例外 → 若有 `geoLat`/`geoLng` 呼叫 API route；若也無座標 → 用 `geocodeAddress(caseRow.address)` 取得座標再呼叫 API route；全部失敗 → `locationMapImage = null`（維持現有行為）。
3. **`isTauriEnv()` 判斷**：`assembleDossierData` 已有 `safeInvoke` try/catch；不需要額外的環境判斷，catch 即觸發 web fallback。
4. **回傳型別相容**：API route 回傳 `application/octet-stream` bytes，`assembleDossierData` 用 `arrayBuffer()` 取出轉 `Uint8Array`，與現有 IPC 路徑相同型別。

## Implementation Contract

### `/api/location-map/route.ts`

- `GET /api/location-map?lat={number}&lng={number}&zoom={number?}`
- 成功：HTTP 200，Content-Type: `image/png`，body 為 PNG bytes
- 無效 lat/lng（非數字或超出範圍）：HTTP 400 JSON `{ error: "invalid coordinates" }`
- `fetchStaticMap` 回傳空 Uint8Array（網路失敗）：HTTP 502 JSON `{ error: "map fetch failed" }`
- 正常範圍：lat ∈ [-90,90], lng ∈ [-180,180]

### `assemble-dossier-data.ts` 修改

- 僅修改 `fetch_location_map` catch 區塊（約 lines 258–269）
- 新增 `fetchLocationMapWeb(lat, lng)` helper（同檔案內，非 export）：
  - 呼叫 `/api/location-map?lat=X&lng=Y`
  - 成功：回傳 `Uint8Array`；失敗：回傳 `null`
- 若 `geoLat === undefined || geoLng === undefined`，在 catch 區塊外補充：嘗試 `geocodeAddress(caseRow.address)` 取座標再 `fetchLocationMapWeb`
- 所有新邏輯在 try/catch 包裹，失敗維持 `locationMapImage = null`

### 驗收標準

- `GET /api/location-map?lat=25.04&lng=121.51` 回傳 `image/png`，bytes > 1000
- `GET /api/location-map?lat=999&lng=0` 回傳 HTTP 400
- `assembleDossierData` with `{ address: "台北市信義區信義路五段7號" }` in web env → `locationMapImage !== null`
