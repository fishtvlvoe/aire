## 1. SDD 與測試紅燈

- [x] 1.1 [Tool: codex] Floor plan raster assets are stored locally / Decision: Bridge assets are local-first and additive：新增分析文件與 `floor-plan-assets-bridge` artifacts，完成後 `spectra validate floor-plan-assets-bridge` 可解析 proposal/design/spec/tasks。
- [x] 1.2 [Tool: codex] [P] Floor plan raster assets are stored locally：先新增 Rust DB/command 測試，覆蓋 accepted raster import、unsupported MIME、oversized import、list/read/delete。
- [x] 1.3 [Tool: codex] [P] Step 3 writes floor plan uploads through case assets / Disclosure PDF uses case asset before legacy photo：先新增 TypeScript 測試，覆蓋 Step 3 呼叫 `import_case_asset`、legacy preview restore、`assembleDossierData` case asset 優先與 legacy fallback。

## 2. 本機資產模型與 IPC

- [x] 2.1 [Tool: codex] Floor plan raster assets are stored locally / Decision: Bridge assets are local-first and additive：新增 `010_case_assets.sql` 並掛進 migration list，完成後 Rust migration smoke test 可建立 table 與 index。
- [x] 2.2 [Tool: codex] Floor plan raster assets are stored locally / Decision: Step 3 import creates an approved primary raster asset：實作 `src-tauri/src/db/case_assets.rs`，支援 insert/list/read metadata/delete 與同 case/kind primary 替換。
- [x] 2.3 [Tool: codex] Floor plan raster assets are stored locally：實作 `src-tauri/src/commands/case_assets.rs` 並註冊 Tauri commands，支援 `import_case_asset`、`list_case_assets`、`read_case_asset_bytes`、`delete_case_asset`。

## 3. 前端橋接與 PDF 組裝

- [x] 3.1 [Tool: codex] Step 3 writes floor plan uploads through case assets / Decision: Step 3 import creates an approved primary raster asset：新增 `src/lib/floor-plan-assets.ts` wrapper 與 mock backend 支援，Step 3 新上傳改呼叫 `import_case_asset`。
- [x] 3.2 [Tool: codex] Disclosure PDF uses case asset before legacy photo / Decision: PDF assembly uses strict fallback order：修改 `assembleDossierData`，依 `case_assets` -> legacy JSON -> null 順序設定 `floorPlanPhoto`。
- [x] 3.3 [Tool: codex] PDF preview export writes generated PDF bytes / Decision: Desktop export writes generated PDF bytes：修改 preview page 匯出流程，Tauri 桌面版送 `pdfBytes + outputPath` 給 `export_pdf`，瀏覽器 dev 維持下載 blob。

## 4. 驗證與收尾

- [x] 4.1 [Tool: codex] Floor plan raster assets are stored locally / Step 3 writes floor plan uploads through case assets：跑 Rust 與 TypeScript 目標測試，確認新增測試通過。
- [x] 4.2 [Tool: codex] Disclosure PDF uses case asset before legacy photo / PDF preview export writes generated PDF bytes：跑 `spectra validate floor-plan-assets-bridge` 與相關 PDF assembly/export 測試，記錄通過結果或剩餘非本 change 失敗。
