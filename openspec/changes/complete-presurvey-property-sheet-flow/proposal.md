## Why

AIRE 目前已經把主要 UI/UX 骨架調整到可驗收的方向，但完整流程仍有落差：地政可取得的資料沒有穩定帶入物調表、補件與現場必問還沒有形成可操作閉環、PDF 輸出與資料來源狀態仍需要逐頁驗收，OPCOS 授權也尚未完成正式串接。

房仲的實際使用情境不是等正式委託後才開始準備資料，而是在談委託前先帶著基本資料去跟屋主對焦。系統必須允許「地政有的先放上去」，並清楚標示哪些資料已帶入、待確認、需補件，回來後再修正成正式版本。

## What Changes

- 固定現有已調整的 AIRE UI/UX 骨架，不再大改資訊架構與畫面風格。
- 將流程定義為「物調表階段」：地址定位、地政資料帶入、可查資料展示、補件與現場必問、PDF 草稿輸出。
- 地政 API 有取得的資料先帶入物調表；無法取得或不可信的欄位以待確認、需補件、現場必問呈現。
- PDF 輸出必須包含目前可用資料、空白圖資框、資料來源與費用摘要，不得混入假資料。
- 補件流程支援圖資上傳、現場必問填寫、手動覆蓋，並回寫到預覽與 PDF。
- OPCOS 授權與方案升級只保留必要端口與狀態，不阻塞測試版完整使用。
- 建立完整驗收：真實瀏覽器 E2E、裕農路真實地址測試、物調表 PDF 輸出檢查、SR validation。

## Non-Goals

- 不重做已驗收方向的 UI/UX，不新增大型版型或新導航架構。
- 不把物調表輸出改成正式法律文件審核流程。
- 不在本 SR 完成線上付款；只保留 OPCOS 授權與方案升級後端端口。
- 不承諾用地政 API 查出私人屋主姓名、身分證、私人地址等不可線上查詢資料。

## Capabilities

### New Capabilities

- `presurvey-property-sheet-flow`: 物調表前置作業流程，允許先帶入可取得地政與公開資料，再於補件後修正。
- `presurvey-e2e-acceptance`: 針對真實地址、真實瀏覽器與 PDF 輸出的完整驗收流程。

### Modified Capabilities

- `disclosure-document-generation`: PDF 與預覽改以物調表階段資料狀態輸出，不因待確認欄位而阻擋產出。
- `land-registry-address-lookup`: 地政查詢結果需提供可帶入、待確認、失敗與費用狀態。
- `case-management`: 案件新增、案件總覽、物調表、補件清單與 PDF 預覽不得重複功能或導向錯誤。
- `settings-page`: 個人設定、地政授權、方案升級與開發中功能需分區清楚，避免放入資料來源頁。

## Impact

- Affected specs:
  - New: `presurvey-property-sheet-flow`
  - New: `presurvey-e2e-acceptance`
  - Modified: `disclosure-document-generation`
  - Modified: `land-registry-address-lookup`
  - Modified: `case-management`
  - Modified: `settings-page`
- Affected code:
  - Modified: `src/app/`
  - Modified: `src/components/`
  - Modified: `src/lib/`
  - Modified: `src-tauri/src/land_registry/`
  - Modified: `src-tauri/tests/`
  - Modified: `e2e/`
  - New: `docs/`
  - New: `openspec/changes/complete-presurvey-property-sheet-flow/`
