## Why

不動產說明書的「位置圖」和「建物外觀」頁面目前在 PDF 中不會出現 — assemble-dossier-data 設定 locationMapImage=null 和 exteriorPhoto=null，而 html-renderer 用 truthy 檢查跳過這兩頁。需要：(1) 新增 OSM tile 拼貼功能產生靜態位置圖；(2) 讓外觀圖在無照片時仍顯示佔位頁面提醒業務員拍照。

## What Changes

- 新增 OSM 靜態地圖產生模組（純 TypeScript fetch + canvas 拼貼），從 tile.openstreetmap.org 下載 tile 並合成帶紅色標記的 PNG
- 修改 assemble-dossier-data.ts：在有經緯度時呼叫地圖產生器填入 locationMapImage
- 修改 html-renderer.tsx：位置圖和外觀圖頁面改為無條件包含（有圖顯示圖、無圖顯示佔位），移除 truthy guard
- 修正 test-html-pdf.ts：移除假 PNG bytes，改用 null 測試佔位模式，建物版保持 null 測試佔位

## Non-Goals

- 不實作 Tauri IPC 包裝（桌面打包時再加）
- 不實作照片上傳 UI（本次只確保佔位頁面出現在 PDF）
- 不加紅色標記文字標註（只在圖片中心畫紅圈）
- 不快取 tile（每次重新下載）

## Capabilities

### New Capabilities

（無新 spec）

### Modified Capabilities

- `location-map-api`：從 Tauri IPC 調整為純 TypeScript fetch + canvas 拼貼
- `exterior-photo-upload`：確保佔位頁面在 exteriorPhoto 為 null 時仍出現在 PDF

## Impact

- Affected specs: `location-map-api`、`exterior-photo-upload`
- Affected code:
  - New: src/lib/osm-static-map.ts
  - Modified: src/lib/pdf-engine/assemble-dossier-data.ts, src/lib/pdf-engine/html-renderer.tsx, scripts/test-html-pdf.ts
  - Removed: 無
- Dependencies 新增: 無（使用原生 fetch + Node.js canvas 或 sharp）
- 環境變數新增: 無
