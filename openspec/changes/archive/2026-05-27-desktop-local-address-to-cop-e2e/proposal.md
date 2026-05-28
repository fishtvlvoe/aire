## Why

AIRE 目前的地址查詢到正式地政資料流程尚未成為可驗收的本機產品流程。Fish 在本機 Web 測試時看到的核心問題是：輸入多數地址時無法穩定取得地段、地號、建號；就算曾經查過某地址，系統也沒有把 R02 discovery、正式 COP 查詢、費用、cache、錯誤與 JSON 結果完整保存到本機 DB，導致後續案件、物調、預覽與 PDF 無法可靠重用資料。

本 SR 重新定義 `desktop-local-address-to-cop-e2e`：先把本機 Web 版做成完整 source of truth，再封裝成 Mac / Windows App。App 版除登入授權入口改為從 SaaS 取得 AIRE 授權碼外，其餘功能、資料流、查詢邏輯、畫面內容、cache 與驗收案例都必須與本機 Web 版一致。

## What Changes

- 本機 Web 版成為第一階段實作與驗收目標；Mac / Windows App 僅在 Web E2E 通過後封裝。
- 地址 discovery 主流程改為地址輸入後先查 EasyMap R02，取得候選地段、地號、建號，再由使用者確認後才允許正式 COP 查詢。
- 本機 Web 不直接從 browser 呼叫外部服務；必須走 same-origin local proxy。Desktop App 走 Tauri/Rust，但要共用同一份 discovery / formal pull contract。
- 地址輸入必須先自動判別為 `門牌號碼`、`地段地號` 或 `資料不足`；門牌走 R02 門牌 discovery，地段地號走 R02 地段/地號 discovery，不得把地段字串硬套門牌 parser。
- 多筆土地候選或建號候選不得自動全部查詢；UI 必須要求使用者選定一筆候選或人工補正，選定前正式 COP 按鈕不可用，且付費 API 呼叫數必須為 0。
- 零成本 discovery 找不到建號時，若使用者明確願意付費，系統可提供「地址轉地號/建號」付費 resolver；resolver 只產生候選與費用紀錄，不等於正式 COP 查詢，也不得直接產 trusted PDF。
- 門牌查不到但疑似路名錯字或別名時，系統只提供修正建議與 readable diagnostics，例如 `苓雅路二段` 可能應檢查 `苓雅二路`；不得把建議自動當成已確認 registry key。
- 地號可用於土地正式資料查詢與零成本反查建號候選；但只有地號不能保證鎖定單一建物，建物正式資料仍需要 confirmed building number。
- R02 raw JSON、parsed JSON、候選資料、確認結果、COP raw JSON、COP parsed JSON、費用、cache hit、sourceRunId 與錯誤紀錄都保存於客戶本機 AIRE DB。
- 客戶 UI 隱藏 API、JSON、COP、R02、sourceRunId 等技術詞，只呈現客戶能理解的案件資料、確認動作、費用預估、已使用既有資料與失敗提示。
- 系統要偵測同地址、同地政鍵、同 API set 的重複輸入，提示已有同樣資訊並自動帶入；同 registry key + same API set 重查必須 cache hit 且費用為 0。
- 地址 discovery 找不到地段、地號、建號時，允許建立 `registry_pending` 案件並導向補件/人工確認；只阻擋正式 COP 與可信 PDF，不阻擋業務繼續收資料。
- 案件分類要由系統自動帶入並可人工修正：R02 先判斷建物或土地，COP 正式資料回來後再細分完整 property type 類別，至少包含大樓、公寓、透天、成屋、農舍、土地、農地、店面、工廠、其他。
- 成屋與土地的物調表欄位必須分流：建物流程收樓層、格局、屋況、建物用途與格局圖；土地流程收使用分區、臨路、面寬深度、農地/商業用地/其他分類與地籍/空拍/地標圖資。
- 正式 COP 查詢只允許 confirmed registry key；raw address、未確認候選、mock、dev fixture、空資料不得觸發付費查詢。
- 物調補件、HTML 預覽與 PDF 只讀已保存資料，不得在文件產生時重新打付費查詢；地籍圖、空拍圖、格局圖、地標圖必須在補件流程綁定單一案件/物件，不得作為全域 PDF 圖資。
- 正式資料匯入（付費）完成後，UI 必須顯示本次取得哪些資料、各欄位值、未取得原因、費用與會同步到哪個 PDF 區塊；不得只顯示「已完成」。
- PDF 必須帶入已保存的正式資料與補件資料，至少包含建物登記坪數、主建坪數、附屬建物、公共設施、車位坪數、建物現況、法定用途、所有權人比對結果、Logo、生活機能、實價登錄行情與土地增值稅估算；缺資料時必須顯示原因或待補狀態。
- 土地增值稅第一版先做估算，不宣稱正式稅額；缺公告現值、前次移轉現值、成交價或持分時，UI 與 PDF 檢查必須列出估算依據與缺漏。
- 自動街景或建物外觀只作參考；若定位到地下室、車庫或錯誤入口，補件流程必須提供現場外觀照片覆蓋欄位，PDF 優先使用案件/物件已保存的現場照片。
- 費用紀錄改成可追溯查詢明細：以戶建、土地與服務列出查詢目標、狀態、交易序號與費用，並可點進去看對應 saved run。
- 系統設定資訊架構精簡為品牌設定、操作日誌與方案設定；品牌 Logo 上傳後要顯示檔名/預覽/保存狀態，方案設定要顯示帳號身分、角色、授權狀態、試用到期日或終身授權。

## Non-Goals

- 不重做既有 UI 骨架與導航。
- 不做 SaaS parity；OPCOS / SaaS 只處理帳號、方案、授權與 AIRE 授權碼，不保存客戶地政查詢 JSON。
- 不做 desktop auto-update。
- 不把 browser partial success、mock、dev fixture 或 `0001/0001/0001` 當成正式成功。
- 不讓客戶下載 raw JSON；raw / parsed JSON 留在本機 DB，僅在 App / local Web 內檢視。
- 不讓 App 版重新實作另一套地址查詢或 COP 流程。

## Capabilities

### New Capabilities

- `desktop-local-address-to-cop-e2e`: 本機 Web 到 Desktop App 共用的 R02 discovery、人工確認、正式 COP 查詢、本機保存、cache、防重複、費用與 PDF E2E 驗收。

### Modified Capabilities

- `land-registry-address-lookup`: 地址 lookup 改為 R02-first discovery，保存來源、候選、錯誤與確認狀態。
- `local-address-discovery-proxy`: 本機 Web 透過 localhost proxy 查 R02，不由 browser 直接打外部服務。
- `case-management`: 新增案件時自動帶入既有資料、提示重複物件、保存 confirmed registry key 與案件分類。
- `land-registry-billing-log`: 正式 COP 查詢與使用者明確同意的付費 resolver 都要保存費用、cache hit、sourceRunId、API call rows 與錯誤，並能區分 resolver candidate run 與 formal COP run。
- `disclosure-document-generation`: 物調、HTML 預覽、PDF 僅使用已保存 JSON 與案件/物件補件圖資，不重新付費查詢。
- `app-settings-and-license`: 精簡設定資訊架構、品牌 Logo 上傳狀態、方案/授權狀態與帳號角色呈現。

## Impact

- Affected specs: desktop-local-address-to-cop-e2e, land-registry-address-lookup, local-address-discovery-proxy, case-management, land-registry-billing-log, disclosure-document-generation, app-settings-and-license
- Affected code:
  - Modified: src/lib/land-registry-api.ts, src/app/(dashboard)/cases/new/page.tsx, src/lib/mock-backend.ts, src-tauri/src/land_registry/pull.rs, src-tauri/src/commands/cases.rs, src-tauri/src/db/registry_query_runs.rs, src/lib/pdf-engine/assemble-dossier-data.ts, src/lib/product-navigation-ia.ts, src/components/SettingsTabs.tsx, src/components/workbench/DemoAlignedWorkbench.tsx
  - New: src/app/api/local/address-discovery/route.ts, src/lib/server/local-address-discovery-proxy.ts, src-tauri/migrations/014_registry_query_cache_keys.sql if existing schema cannot store stable api set cache keys
  - Test coverage includes component, server, Tauri live discovery, billing/cache and E2E verification for the changed flow.
  - Release documentation must update the desktop full-flow checklist and acceptance report.
