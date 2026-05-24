## Why

目前 AIRE 會在地址、地號、建號尚未對標完成時進入地政查詢與文件產出，容易打錯 COP API、重複扣費，也缺少可在後台查詢的 JSON、費用與錯誤紀錄。這個 change 將地址優先對標、正式查詢關卡、物件分類、補件題庫與查詢紀錄 UI 整成可驗收的產品流程。

## What Changes

- 新增地址優先對標流程：輸入地址時先透過 EasyMap R02 / 便民系統尋找地段、地號、建號與候選資料，正式 COP 查詢前必須完成地址、地段、地號、建號對標確認。
- 新增 AIRE 桌面 App / Helper 反查流程：當 SaaS 無法直接存取 EasyMap R02 時，由 Mac/Windows 本機 App 以使用者本機瀏覽器或 WebView 開啟 R02、擷取候選地段地號建號，再同步回 AIRE SaaS 案件。
- 新增查詢 run 紀錄：每一次地址反查、候選比對、COP 呼叫、快取命中、人工確認與 PDF 輸出都留下可追溯資料。
- 新增後台查詢紀錄 UI：設定頁可搜尋、檢視、展開 JSON、查看費用、查看 COP 錯誤、匯出 JSON/CSV，不需要靠本機檔案或 AI 翻資料。
- 修改地政快取策略：同一 registry key 已有有效 COP JSON 時自動帶入舊資料，本次費用為 0，只有使用者確認重新查詢後才再打 COP。
- 修改費用與錯誤紀錄：每支 COP API 都記錄 service id、endpoint、成功/失敗、費用、COP code/message、payload 摘要與下一步建議。
- 修改物件分類：依客戶規則自動建議大樓、華廈、公寓、透天、別墅、農地、建地、農建地、工業地等分類，缺少電梯/車庫/水塔等證據時要求人工確認。
- 修改物調與補件工作台：從 `0520/不動產說明書/0417-old` 題庫載入現場必問與秘書後補，左側補件欄位、右側 HTML 預覽與 PDF 下載。
- 修改不動產說明書產出：候選資料只能產生物調參考；正式說明書必須使用已確認地段、地號、建號與 COP 正式資料。

## Non-Goals (optional)

- 不記錄 AI prompt、AI 推理、chain-of-thought 或任何模型內部過程。
- 不把 EasyMap R02 / 便民系統資料當成正式謄本資料；它只用於 key discovery、候選與對標。
- 不假裝純 SaaS 可以穩定直接抓取 EasyMap R02；若 R02 擋掉雲端請求，正式產品路徑必須走本機 App / Helper 或人工輸入確認資料。
- 不繞過 COP 權限限制；權限不足、COP 錯誤與查無資料都必須如實記錄並顯示。
- 不重做 AIRE 既有 UI 骨架；本次只補地址對標、分類、查詢紀錄、補件與預覽流程。
- 不把未確認候選資料直接輸出為正式不動產說明書。

## Capabilities

### New Capabilities

- `address-first-registry-match`: 地址或土地輸入先對標到地址、地段、地號、建號，再進入正式 COP 查詢。
- `desktop-r02-helper-saas-sync`: AIRE 本機 App / Helper 從本機 R02 頁面擷取候選資料，將 JSON、費用、錯誤與確認結果同步到 SaaS。
- `registry-query-records`: 每次查詢、快取、費用、錯誤、JSON 與人工確認都形成可在後台查詢的產品紀錄。

### Modified Capabilities

- `land-registry-cache`: 以對標後 registry key 重用已查過的 COP JSON，避免同一物件重複扣費。
- `land-registry-billing-log`: 記錄每支 COP API 的費用、錯誤碼、結果與查詢 run 關聯。
- `settings-land-api-section`: 在設定頁提供地政 API 查詢紀錄、費用、錯誤與 JSON 檢視。
- `property-type-registry`: 依客戶定義自動建議建物與土地細分類，並在缺證據時要求人工確認。
- `case-supplement`: 依物件分類載入現場必問與秘書後補題庫，支援左補件右預覽工作台。
- `disclosure-document-generation`: 正式不動產說明書必須通過地址、地段、地號、建號對標與 COP 正式資料關卡。

## Impact

- Affected specs: address-first-registry-match, desktop-r02-helper-saas-sync, registry-query-records, land-registry-cache, land-registry-billing-log, settings-land-api-section, property-type-registry, case-supplement, disclosure-document-generation
- Affected code:
  - New: src-tauri/src/land_registry/easymap_r02.rs, src-tauri/src/land_registry/r02_webview.rs, src-tauri/src/land_registry/saas_sync.rs, src-tauri/migrations/013_registry_query_runs.sql, src/app/(dashboard)/settings/land-registry-records/page.tsx, src/lib/property-classifier.ts, src/lib/question-bank/import-0417-old.ts
  - Modified: src-tauri/src/land_registry/pull.rs, src-tauri/src/land_registry/cache/mod.rs, src-tauri/src/land_registry/billing_log/mod.rs, src/lib/land-registry-api.ts, src/lib/cases-api.ts, src/components/PullParcelDataButton.tsx, src/components/case-wizard/CaseWizardStep2.tsx, src/components/HouseMvpWorkbench.tsx, src/lib/pdf-engine/assemble-dossier-data.ts
  - Removed: none
- Dependencies 新增: none
- 環境變數新增: none
