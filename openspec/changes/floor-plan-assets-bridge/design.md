## Context

AIRE 目前已有兩條格局圖路徑：Step 3 上傳 raster 圖後存進 `land_registry_data.floor_plan_photo`，以及現場手稿轉 SVG 後由 `floor_plan_conversions` 的 approved 狀態進 PDF。完整 `floor-plan-assets-and-ai-schematic` change 尚未實作，若直接全量導入會造成儲存模型、審核規則與 PDF 頁面同時變動。

## Goals / Non-Goals

**Goals:**

- 建立本機 `case_assets` table，先承接 Step 3 raster 格局圖/土地規劃圖。
- 讓新上傳走 `case_assets`，PDF 組裝優先讀本機 asset bytes。
- 保留舊 `land_registry_data.floor_plan_photo` fallback，避免舊案件格局圖消失。
- 修正預覽頁桌面匯出路徑，使其符合 Rust `export_pdf` 的 PDF bytes 合約。

**Non-Goals:**

- 不建立多圖審核 UI 與 primary selector。
- 不把現場手稿 SVG conversion 搬入 `case_assets`。
- 不實作 AI schematic generation 或 vendor API。
- 不引入雲端 storage。

## Decisions

### Decision: Bridge assets are local-first and additive

新增 `case_assets` table 與本機 app data 目錄，檔案放在 `AIRE/case-assets/{case_id}/{asset_id}.{ext}`，SQLite 保存 metadata 與 `storage_path`。這保持 AIRE 桌面版零雲端資料邊界，也讓 future SR-B 可在同一模型上加審核狀態。

Alternatives Considered:

1. 繼續把 base64 存在 `land_registry_data`：否決，JSON 欄位會膨脹，無法承載多來源、metadata 與刪除。
2. 直接使用 supastarter S3 storage：否決，本輪是本機桌面交付，屋主資料與圖資不應上雲。
3. 直接整併 SVG conversion：否決，SVG 已有 approved 流程，本輪先降低 raster bridge 風險。

SQL DDL:

```sql
CREATE TABLE IF NOT EXISTS case_assets (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('floor_plan')),
  source TEXT NOT NULL CHECK (source IN ('manual_upload', 'legacy_floor_plan_photo')),
  trust_tier TEXT NOT NULL CHECK (trust_tier IN ('assistant_uploaded', 'legacy_import')),
  review_status TEXT NOT NULL DEFAULT 'approved' CHECK (review_status IN ('approved')),
  is_primary INTEGER NOT NULL DEFAULT 1 CHECK (is_primary IN (0, 1)),
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/png', 'image/jpeg', 'image/webp')),
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
  storage_path TEXT NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_case_assets_case_kind_primary
  ON case_assets(case_id, kind, is_primary, updated_at);
```

### Decision: Step 3 import creates an approved primary raster asset

Bridge 階段沒有新審核 UI，所以 Step 3 上傳的 raster 圖維持既有產品語意：上傳後可進 PDF。資料上以 `review_status='approved'` 與 `is_primary=1` 表示，目前同一 case/kind 的新上傳會取代舊 primary。

Alternatives Considered:

1. 先全部存 `pending`：否決，會讓既有 Step 3 使用者上傳後 PDF 反而看不到圖。
2. 同時寫入 `land_registry_data` 和 `case_assets`：否決，會造成雙寫不一致。
3. 做完整審核 UI：否決，這是 SR-B 範圍。

### Decision: PDF assembly uses strict fallback order

`assembleDossierData` 讀取順序固定為 `list_case_assets` 最新 primary approved raster asset -> `read_case_asset_bytes` -> legacy JSON base64 -> null。IPC 不存在、asset file 不存在或讀取失敗時，不中斷整份說明書，只 fallback 或顯示 placeholder。

Alternatives Considered:

1. 讀到 case asset 錯誤就讓 PDF fail：否決，缺圖不應阻擋說明書產出。
2. 同時輸出 legacy 與 asset 兩頁：否決，會讓業務無法判斷哪張是正式格局圖。
3. 移除 legacy fallback：否決，舊案件會退化。

### Decision: Desktop export writes generated PDF bytes

預覽頁在 Tauri 環境中先用目前的 `PdfDocument` 產生 blob/bytes，再開啟儲存對話框並呼叫 Rust `export_pdf` 寫檔。`export_pdf` 不接受 HTML body，因此 preview page 不再直接送 `{ caseId, html }`。

Alternatives Considered:

1. 修改 Rust `export_pdf` 接 HTML：否決，Rust 端目前沒有 HTML to PDF engine，且會擴大平台差異。
2. 只支援瀏覽器下載：否決，AIRE 是桌面 App，必須更新 case status 與 operation log。
3. 新增第二個 export command：否決，既有 `exportDisclosurePdf` 已封裝錯誤分類與儲存對話框。

## Implementation Contract

Behavior:

- Step 3 成屋顯示「格局圖上傳」，土地顯示「規劃圖上傳」，支援 PNG/JPEG/WebP，10MB 以內。
- 新上傳成功後建立 `case_assets` record，並更新預覽圖。
- PDF 產出只使用一個 raster floor plan page；有 `case_assets` 時優先使用它，否則讀舊 JSON。
- 沒有任何圖時 PDF 仍完整產出，頁面顯示既有 placeholder。
- Tauri 匯出 PDF 成功時以 `pdfBytes + outputPath` 呼叫 Rust `export_pdf`，更新 case 狀態與 operation log。

Interfaces:

- `import_case_asset(payload) -> CaseAsset`
- `list_case_assets(case_id, kind?) -> CaseAsset[]`
- `read_case_asset_bytes(asset_id) -> { bytes: number[]; mime: string }`
- `delete_case_asset(asset_id) -> { ok: true }`
- `CaseAsset.kind` bridge 階段只允許 `floor_plan`
- `CaseAsset.source` bridge 階段只允許 `manual_upload` 與 `legacy_floor_plan_photo`

Failure modes:

- Unsupported MIME returns `unsupported_mime` and creates no DB row.
- Empty bytes or over 10MB returns validation error and creates no DB row.
- Missing asset file returns `asset_file_missing`; PDF assembly catches it and falls back.
- Legacy malformed base64 is ignored and becomes null.

Acceptance criteria:

- `spectra validate floor-plan-assets-bridge` passes.
- Rust tests cover migration schema, import/list/read/delete, MIME validation, and missing file read error.
- TypeScript tests cover Step 3 import wrapper use and `assembleDossierData` priority/fallback.
- Manual or automated PDF export confirms desktop path sends PDF bytes, not HTML.

## Risks / Trade-offs

[Risk] case asset file deleted outside DB → Mitigation: `read_case_asset_bytes` returns explicit error and assembly falls back without failing PDF.

[Risk] bridge marks Step 3 upload approved before future review UI exists → Mitigation: this preserves current product behavior; SR-B will add pending/approved workflow.

[Risk] old JSON and new asset diverge → Mitigation: new uploads stop writing legacy JSON; legacy remains read-only fallback.

[Risk] migration numbering conflicts → Mitigation: use `010_case_assets.sql`, after existing `009_floor_plan_sketches.sql`.

## Migration Plan

1. Add `010_case_assets.sql` and include it after `009_floor_plan_sketches.sql`.
2. Add Rust repository and IPC commands.
3. Add frontend wrapper and mock backend support.
4. Update Step 3 upload and PDF assembly priority.
5. Update preview export to use generated PDF bytes.

Rollback strategy:

- Remove the Step 3 `import_case_asset` call and return to legacy JSON write path.
- Leave `case_assets` rows/files unused; they are additive and do not change `cases` schema.
- Remove PDF assembly priority read if needed; legacy fallback keeps old behavior available.

## Open Questions

- None for bridge scope. SR-B will decide review UI placement and AI schematic endpoint ownership.
