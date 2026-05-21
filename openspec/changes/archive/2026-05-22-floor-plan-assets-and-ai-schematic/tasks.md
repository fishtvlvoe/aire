## 0. AIRE 端口保留

- [ ] 0.1 Decision: AIRE owns the AI floor plan extension port / AIRE AI floor plan extension port is reserved：在 AIRE 產品規格、feature/entitlement 命名或對應文件中保留 `floor-plan.manual-upload`、`floor-plan.external-import`、`floor-plan.ai-schematic`，並明確標記這是 AIRE 產品功能、不是 ST 平台功能；完成後以 `spectra analyze floor-plan-assets-and-ai-schematic --json` 無 Coverage/Consistency Warning 及內容審查確認。

## 1. 資料模型與本機儲存

- [ ] 1.1 Decision: Local case asset store / Case floor plan assets are stored locally：新增 `case_assets` migration 與 indexes，完成後 `spectra validate floor-plan-assets-and-ai-schematic` 與 SQLite migration smoke test 可確認 table schema 正確。
- [ ] 1.2 Decision: Local case asset store / Case floor plan assets are stored locally：實作 Rust DB helper，讓 import/list/delete/review 可讀寫 metadata 與 local storage path，完成後以 cargo unit tests 驗證新增、查詢、刪除與 cascade 行為。
- [ ] 1.3 Decision: Source trust tiers drive PDF wording / Source trust and review status are explicit：集中定義 source、trust_tier、review_status enum 與 label mapping，完成後以 TypeScript/Rust enum serialization tests 驗證 AI schematic 與 measured external 來源不會混淆。

## 2. 案件附件命令與驗證

- [ ] 2.1 Case floor plan assets are stored locally：新增 `import_case_asset` Tauri command，支援 PNG/JPEG/WebP 匯入並拒絕 unsupported MIME，完成後以 command-level tests 驗證成功匯入與錯誤不落 DB。
- [ ] 2.2 Source trust and review status are explicit：新增 `review_case_asset` Tauri command，讓 approved/rejected 狀態會記錄 reviewer 與 Asia/Taipei reviewed_at，完成後以 unit tests 驗證狀態轉換與 timestamp 格式。
- [ ] 2.3 Case floor plan assets are stored locally：新增 `list_case_assets`、`delete_case_asset`、`read_case_asset_bytes` commands，完成後以 integration test 驗證列表、刪除 metadata+file、讀取 bytes 的行為。

## 3. UI 匯入與審核流程

- [ ] 3.1 External floor plan integrations are import-first / Decision: Reuse ST attachment pattern and defer supastarter storage：新增 FloorPlanAssetPanel，讓助理可選 Magicplan、Homestyler、CubiCasa、RoomSketcher、Apple RoomPlan、owner_provided 或 manual_upload 來源並匯入圖檔，完成後以 component test 或手動 UI assertion 驗證來源 metadata 顯示正確。
- [ ] 3.2 Source trust and review status are explicit / Decision: Source trust tiers drive PDF wording：在 UI 顯示 pending/approved/rejected 與 trust tier 文案，完成後以 component test 驗證 OpenAI 圖顯示「格局示意圖」而外部工具圖顯示來源名稱。
- [ ] 3.3 AI schematic floor plan generation uses structured briefs / Decision: OpenAI image as schematic draft：新增 FloorPlanBrief 表單/資料 contract validation，完成後以 validation tests 驗證缺少 room list 或 adjacency 時不能建立 AI schematic request。

## 4. PDF 資料組裝與輸出

- [ ] 4.1 Uploaded or imported floor plan appears in disclosure PDF：擴充 CaseDossierData 與 assemble-dossier-data，使 approved primary floor plan 會被載入為 imageBytes，完成後以 TypeScript test 驗證 pending/rejected 不進 dossier data。
- [ ] 4.2 Uploaded or imported floor plan appears in disclosure PDF / Decision: Source trust tiers drive PDF wording：新增 floor plan PDF page，完成後以 PDF snapshot 或 manual render 檢查圖片、來源、review timestamp 與 disclaimer 都存在。
- [ ] 4.3 Uploaded or imported floor plan appears in disclosure PDF：沒有 approved primary floor plan 時 PDF 仍完整產生且省略格局圖頁，完成後以 PDF generation test 驗證 no-asset fallback 不拋錯。

## 5. AI 與外部工具操作文件

- [ ] 5.1 AI schematic floor plan generation uses structured briefs / Decision: OpenAI image as schematic draft：補上 OpenAI/ChatGPT Image Tool 操作說明，明確列出問卷欄位、prompt 結構、審核與 disclaimer，完成後以文件審查確認沒有把 AI 圖稱為精準測量圖。
- [ ] 5.2 External floor plan integrations are import-first：補上 Magicplan/Homestyler/CubiCasa/RoomSketcher/Apple RoomPlan 的匯入操作備註與 metadata 欄位，完成後以文件審查確認每個來源都有手動 export/import 路徑。

## 6. 驗證與收尾

- [ ] 6.1 Case floor plan assets are stored locally / Uploaded or imported floor plan appears in disclosure PDF：跑完整驗證 `spectra validate floor-plan-assets-and-ai-schematic`、cargo tests、frontend tests，完成後紀錄通過結果或剩餘失敗原因。
- [ ] 6.2 Source trust and review status are explicit / AI schematic floor plan generation uses structured briefs：用一個合成案件手動驗證外部工具匯入圖與 OpenAI schematic draft 的 PDF 文案差異，完成後保存測試輸出或截圖路徑供 review。
