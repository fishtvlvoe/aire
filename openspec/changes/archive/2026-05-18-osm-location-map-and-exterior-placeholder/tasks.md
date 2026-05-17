## 1. OSM 靜態地圖產生器

- [x] 1.1 新增 src/lib/osm-static-map.ts（涵蓋 Fetch static location map via Tauri IPC 與 OSM attribution）：實作 fetchStaticMap 函式，接收 {lat, lng, zoom?, width?, height?}，從 tile.openstreetmap.org 下載所需 tiles（zoom 預設 16），用 Node.js canvas（@napi-rs/canvas 或 sharp）拼貼成一張圖，在中心畫紅色圓圈標記，右下角加 OpenStreetMap contributors 文字，回傳 PNG Uint8Array。座標無效回空 Uint8Array 並 console.warn。網路失敗回空 Uint8Array 並 console.warn。30 秒 timeout。[Tool: kimi]

## 2. html-renderer 無條件包含位置圖與外觀圖

- [x] 2.1 修改 src/lib/pdf-engine/html-renderer.tsx（涵蓋 Render exterior photo in PDF）：移除位置圖頁面的 if (data.locationMapImage) guard，改為無條件渲染（元件內部已有佔位邏輯）。同樣移除外觀圖頁面的 if (data.exteriorPhoto) guard，無條件渲染。[Tool: copilot]

## 3. assemble-dossier-data 整合位置圖

- [x] 3.1 修改 src/lib/pdf-engine/assemble-dossier-data.ts（涵蓋 Fetch static location map via Tauri IPC）：在有經緯度時 import 並呼叫 fetchStaticMap（來自 src/lib/osm-static-map.ts），將回傳的 Uint8Array 賦給 base.locationMapImage。無經緯度或失敗時維持 null（元件會顯示佔位）。[Tool: copilot]

## 4. 修正測試資料

- [x] 4.1 修正 scripts/test-html-pdf.ts：土地版移除 locationMapImage 和 exteriorPhoto 的假 PNG bytes（改為 null 或省略），讓測試驗證佔位模式。建物版不變（已無這兩個欄位）。[Tool: copilot]

## 5. PDF 輸出驗證

- [x] 5.1 執行 npx tsx scripts/test-html-pdf.ts，確認土地版和建物版 PDF 均包含「位置圖」頁面（顯示佔位或實際地圖）和「建物外觀」頁面（顯示佔位文字）。頁數應增加。[Tool: sonnet]
