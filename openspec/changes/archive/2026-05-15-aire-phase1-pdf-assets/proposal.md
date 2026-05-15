## Why

Phase 1 已 archived，但 `disclosure-pdf-render` capability 在 runtime 無法產出可用 PDF：`src/lib/pdf-renderer.ts` 預期載入的 19 頁底板 PDF（成屋 / 土地各一）與 NotoSansTC 子集字型皆缺檔，渲染器只要被呼叫就會丟 `TemplateNotFoundError` 或 `FontNotFoundError`。Fish 即將實作 Phase 3 地政 API，但若沒先補齊這些資產，後續所有 PDF 相關驗收（含 SDD #1b 的座標校對與 e2e）都會被卡住。

## What Changes

- 新增 `src/resources/templates/residential.pdf`：成屋說明書 19 頁底板，從 `docs/0417-old/` 既有範本挑出最完整版本複製
- 新增 `src/resources/templates/land.pdf`：土地說明書 19 頁底板，同樣從既有範本挑出
- 新增 `src/resources/fonts/NotoSansTC-Subset.ttf`：跑既有 `scripts/subset-font.py`（102 行、字元表 `scripts/real-estate-chars.txt` 已備）產出，目標 file size < 2 MB
- 驗證既有 `src/lib/pdf-renderer.test.ts` 在資產到位後通過，不需修改測試本身

## Non-Goals

- **不做** PDF 座標校對：`src/lib/pdf-layout.ts` 的 35 + 20 個欄位座標保持 stub 狀態，校對留 SDD #1b 用真實地政 API 資料當基準（避免用 mock 資料校完後重做白工）
- **不做** 視覺對齊 / E2E SOP 實際跑：`docs/visual-parity-checklist.md` 與 `docs/e2e-acceptance-script.md` 已存在，實際勾選驗收留 SDD #1b 完成座標校對後一併跑
- **不改** PDF 渲染器邏輯：`src/lib/pdf-renderer.ts`、`src/lib/export-pdf.ts`、`src-tauri/src/commands/pdf.rs` 都不動
- **不重做** Phase 1 既有 unit tests：測試本身不改，只驗證資產補齊後既有測試能通過
- **不改** 字型子集腳本：`scripts/subset-font.py` 與 `scripts/real-estate-chars.txt` 視為既有資產直接使用

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `disclosure-pdf-render`：補齊 runtime 必要資產（templates + font），讓既有渲染器能成功載入底板與嵌入字型；spec 行為描述新增「資產存在與大小門檻」需求

## Impact

- Affected specs：
  - Modified：`openspec/specs/disclosure-pdf-render/spec.md` 加「資產存在性需求」與「字型大小上限」需求
- Affected code：
  - New：
    - `src/resources/templates/residential.pdf`
    - `src/resources/templates/land.pdf`
    - `src/resources/fonts/NotoSansTC-Subset.ttf`
  - Modified：(none)
  - Removed：(none)
- Dependencies 新增：(none，使用既有 `pdf-lib` / `@pdf-lib/fontkit` / `@fontsource/noto-sans-tc`)
- 環境變數新增：(none)
