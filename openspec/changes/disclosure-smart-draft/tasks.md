<!--
Each task description MUST state:
- the behavior or contract being delivered (what is observably true when the
  task is complete), and
- the verification target that proves completion (test, CLI invocation,
  analyzer check, manual assertion, or content review).

File paths are supporting context for locating the work, never the task
itself. "Edit file X" is not a valid task — it is missing both behavior and
verification.
-->

## 1. Wave 1 — 封面 + 物件資料表 + 建物標示

- [x] 1.1 擴充 CaseDossierData 介面：新增 `cover: CoverData`、`propertySheet: PropertySheetData`、`buildingAreaBreakdown` nested objects（Assemble dossier data from all sources）。依 D5：CaseDossierData 擴充策略，用 optional nested objects 確保向後相容。完成後 `npm run build` 型別檢查通過，無 TS error。[Tool: copilot]

- [x] 1.2 [P] 修改 assemble-dossier-data.ts：從已有謄本 API 映射封面欄位（Cover page displays all official format fields）、物件資料表欄位、建物面積分欄。呼叫 `assembleDossierData()` 回傳的物件包含 cover/propertySheet/buildingAreaBreakdown。驗證：寫 unit test `assemble-dossier-data.test.ts` 確認映射正確。[Tool: copilot]

- [x] 1.3 [P] 修改 Cover.tsx：渲染完整封面（Disclosure cover page — Cover page with full company info scenario）。PDF 封面顯示物件名稱/編號/承辦人/經紀人/公司全欄位。驗證：`npm run build` 通過 + 產 PDF 目視封面完整。[Tool: copilot]

- [x] 1.4 新增 PropertyDataSheetPage.tsx：土地版照母版格式渲染（Render property data sheet for land type）。驗證：產 PDF 含物件資料表頁，欄位有資料。[Tool: copilot]

- [x] 1.5 [P] 新增 PropertyDataSheetPage.tsx 成屋版分支：照建物物調表母版渲染（Render property data sheet for building type），面積顯示主建/附屬/公設/車位分欄（Building property data sheet distinguishes area types）。驗證：成屋案件產 PDF 含正確分欄。[Tool: copilot]

- [x] 1.6 修改 document.tsx：整合新頁面至 LandPages/BuildingPages（PDF page ordering for land type + PDF page ordering for building type），依 D4：PDF 頁面組織方式，每章節獨立 pdf-block。驗證：`npm run build` 通過，PDF 頁面順序正確。[Tool: copilot]

- [x] 1.7 Wave 1 Review：diff > 10 行用 Kimi MCP 做 CR + build 驗證。[Tool: kimi]

## 2. Wave 2 — 成交行情 + 周邊設施

- [x] 2.1 新增 Rust 模組 `src-tauri/src/geo_services/`：依 D1：地圖與周邊設施整合架構，用 Overpass API（免費無 key）。實作 `query_nearby_amenities` IPC command（Query nearby amenities via Tauri IPC + Amenity categories mapping to OSM tags），符合 IPC 合約。呼叫後回傳 `Vec<Amenity>` JSON。驗證：cargo build 通過 + 手動 invoke IPC 回傳正確 JSON（或網路失敗回傳空陣列不 crash）。[Tool: copilot]

- [x] 2.2 修改 assemble-dossier-data.ts：地址 → geocode → 呼叫 `query_nearby_amenities` → 填入 nearbyAmenities（Assemble dossier data — Graceful degradation scenario）。驗證：unit test 模擬 IPC 回傳確認資料映射。[Tool: copilot]

- [x] 2.3 [P] 新增 TransactionHistoryPage.tsx：照「透明房價一覽表」格式渲染（Render transaction history table + pagination scenario）。驗證：5+ 筆時表格正確，0 筆顯示「查無成交紀錄」，15+ 筆自動分頁。[Tool: copilot]

- [x] 2.4 [P] 修改 LifeAmenities.tsx：從 placeholder 改為渲染實際資料（Render life amenities page），按類別分組（學校/醫院/公園/捷運/市場）顯示名稱+距離+地址。驗證：產 PDF 生活機能表有自動設施資料。[Tool: copilot]

- [x] 2.5 Wave 2 Review：Kimi MCP CR + build + 產 PDF 驗證成交表 + 機能表有資料。[Tool: kimi]

## 3. Wave 3 — 稅費試算 + 簽章欄

- [x] 3.1 新增 `src/lib/tax-calculator.ts`：依 D2：稅費計算引擎位置（純前端 TS），實作 calculateTaxFees 函式，符合稅費計算合約（Calculate land value increment tax + Calculate deed tax + Calculate stamp tax + Calculate registration fee + Calculate scrivener fee + Aggregate seller and buyer costs + Handle invalid inputs）。驗證：unit test 覆蓋一般稅率、優惠稅率、零增值、無效輸入四種場���。[Tool: copilot]

- [x] 3.2 修改 assemble-dossier-data.ts：有 totalPrice 時呼叫 calculateTaxFees 填入 taxCalculation（Assemble dossier data — Draft mode without total price scenario）。驗證：unit test 確認有/無 totalPrice 兩種情境。[Tool: copilot]

- [x] 3.3 [P] 新增 TaxFeePage.tsx：增值稅概算表頁（Render land value increment tax estimate page）+ 費用一覽表頁（Render fee summary page）。草稿模式空白、完整模式有值。驗證：產 PDF 含兩個稅費頁面，數字合理。[Tool: copilot]

- [x] 3.4 [P] 新增 SignatureBlock.tsx：四方簽章欄（Render signature block — layout scenario）。驗證：PDF 最後頁含賣方/買方/經紀人/公司四區塊 + 日期欄。[Tool: copilot]

- [x] 3.5 Wave 3 Review：Kimi MCP CR + 輸入總價 1000 萬驗證稅費數字合理。[Tool: kimi]

## 4. Wave 4 — 土地版現況調查表

- [x] 4.1 定義 `LandSurveyData` 型別：依 D3：現況調查表資料結構，用 JSON 欄位 + TS interface。35 個 `boolean | null` 欄位對應 35 題（Land survey data persistence）。驗證：`npm run build` 通過。[Tool: copilot]

- [x] 4.2 新增 LandConditionSurveyPages.tsx：渲染 35 題（Render land condition survey pages），草稿模式全 ☐（Draft mode — all checkboxes blank），完整模式依填答 ☑/☐（Completed mode），題 14 多欄 grid（Question 14 special layout）。驗證：產 PDF 35 題全空白 + 填答後顯示正確勾選。[Tool: copilot]

- [x] 4.3 整合 survey 存取：disclosure_drafts.survey_data JSON 欄位讀寫（Save partial survey progress + Load existing survey data）。驗證：存後讀回值一致。[Tool: copilot]

- [x] 4.4 Wave 4 Review：Kimi MCP CR + PDF 逐題驗證。[Tool: kimi]

## 5. Wave 5 — 成屋版現況調查表

- [x] 5.1 定義 `BuildingSurveyData` 型別：~58 個欄位（Building survey data persistence + Distinguish from land survey by property type）。驗證：`npm run build` 通過。[Tool: copilot]

- [x] 5.2 新增 BuildingConditionSurveyPages.tsx：渲染 ~58 題（Render building condition survey pages），含建物瑕疵 7 題（Building defect section）、設備 6 題（Equipment section）、管理、停車位。僅房屋類（公寓/大樓/套房）渲染（Scope limited to residential buildings）。驗證：成屋 PDF 有完整題目，格式與 Wave 4 一致。[Tool: copilot]

- [x] 5.3 Wave 5 Review：Kimi MCP CR + PDF 與官方格式比對。[Tool: kimi]

## 6. Wave 6 — 外觀圖 + 位置圖

- [x] 6.1 新增 Rust `fetch_location_map` IPC（Fetch static location map via Tauri IPC + OSM attribution）：下載 OSM tiles → 拼接 PNG → 加紅色標記 + attribution。驗證：cargo build + 手動測試台北座標產出有標記的 PNG。[Tool: copilot]

- [x] 6.2 [P] 新增 ExteriorPhotoPage.tsx：外觀圖頁面（Render exterior photo in PDF）。草稿模式顯示灰色佔位「請於現場拍攝建物外觀」，完整模式渲染上傳照片。驗證：草稿 PDF 有佔位提示、上傳照片後 PDF 有圖。[Tool: copilot]

- [x] 6.3 實作外觀照片上傳（Exterior photo upload and persistence）：使用者選 JPEG/PNG（max 5MB）→ 存入 disclosure_drafts。驗證：上傳 → 讀回 → bytes 一致。[Tool: copilot]

- [x] 6.4 修改 assemble-dossier-data.ts：geocode → 呼叫 fetch_location_map → 填入 locationMapImage bytes（Assemble dossier data — Graceful degradation）。驗證：unit test 模擬有圖/無圖兩情境。[Tool: copilot]

- [x] 6.5 修改 LocationMapPage.tsx：從 placeholder 文字改為渲染實際 OSM 地圖。條件渲染：locationMapImage 為 null 時不顯示（PDF page ordering — Conditional page rendering scenario）。驗證：有座標案件 PDF 含地圖、無座標案件不含該頁。[Tool: copilot]

- [x] 6.6 Wave 6 Review：Kimi MCP CR + 最終完整 PDF 所有頁面驗收。[Tool: kimi]

## 7. 最終驗收

- [x] 7.1 E2E 驗收：建立測試案件（輸入地址 + 總價 1000 萬），產出完整 PDF，逐頁確認所有頁面存在且格式正確。對照驗收標準與範圍邊界：封面/物件表/土地標示/建物標示/費用/稅費/調查表/成交行情/機能/地圖/外觀佔位/簽章。行為描述中所述流程全部可走通。[Tool: sonnet]
