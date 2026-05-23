## Why

前期洽談物調不能要求每一筆建號、地號都先人工確認，否則 Fish 在還沒取得委託前就無法準備可討論資料。AIRE 需要把候選土地與建物可能性一次列出，先產「候選資料版」物調表，等屋主或權狀確認後再升級成正式資料。

## What Changes

- 新增候選土地/建物清單：地址 lookup 或外部公開來源找到多筆候選地號、建號時，工作台 SHALL 一次列出全部候選，包含地段、地號/建號、來源、查詢狀態與可用欄位摘要。
- 修改前期物調資料策略：沒有正式地址反查權限或正式建號未確認時，系統 SHALL 允許使用候選建號/地號拉可取得的資料，並標示為「候選資料，待屋主/權狀確認」。
- 新增候選比較與確認流程：使用者 SHALL 能比較候選建物的登記坪數、主建坪、用途、完成日、樓層、屋齡、他項權利摘要，並可把其中一筆標記為「本案暫用候選」或「已確認」。
- 新增同棟戶別規律推測：當目標戶別例如 `8樓之1` 找不到唯一建號時，系統 SHALL 使用同棟同尾碼戶別（例如 `3樓之1`、`5樓之1`、`7樓之1`）與相鄰樓層候選資料推估可參考坪數、用途、屋齡與信心等級。
- 修改 PDF 產出：候選資料版 PDF SHALL 顯示候選來源與待確認警示，不得把 candidate 偽裝成正式謄本；正式確認後才移除候選警示。
- 新增圖資 fallback：若候選資料或外部參考已有座標，PDF 圖資 SHALL 使用該座標產位置圖與航拍圖，不因完整地址 geocode 失敗而整頁空白。
- 修改驗收：PDF 驗收 SHALL 檢查欄位是否有實際值，不能只檢查標題存在；候選資料版與正式資料版要分開驗收。

## Non-Goals

- 本次不承諾未授權 MOI API 會回傳正式地址反查結果；若 API 回 COP317/COP312/COP305，系統只會揭露原因並走候選資料流程。
- 本次不把候選資料當成正式交付資料；正式交付仍需屋主授權、權狀/謄本或使用者確認建號/地號。
- 本次不把同棟戶別規律推測當成登記資料；推測資料只能用於前期洽談版，PDF 必須標示「推測資料，非登記資料」。
- 本次不重做整體 UI/UX 導航，只在現有案件工作台、資料來源、補件/PDF 檢查與 PDF assembly 補上候選清單與候選版輸出。
- 本次不處理價格試算完整性；沒有成交/委託價格時費用頁仍可保持空白或提示待補價格。

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `land-registry-address-lookup`: 地址查詢需要回傳並保存多筆候選土地/建物可能性，且標示候選來源與正式性。
- `dossier-data-assembly`: PDF/data assembly 需要支援候選資料版物調表，並在正式確認前保留候選警示與來源。
- `property-data-sheet`: 物件資料表需要顯示候選資料值與待確認狀態，而不是只留下空欄位。
- `location-map-api`: 圖資取得需要使用候選座標或外部參考座標 fallback，避免地址 geocode 失敗時位置圖與航拍圖全空。

## Impact

- Affected specs: land-registry-address-lookup, dossier-data-assembly, property-data-sheet, location-map-api
- Affected code:
  - Modified: src/app/(dashboard)/cases/[id]/page.tsx
  - Modified: src/components/workbench/DemoAlignedWorkbench.tsx
  - Modified: src/lib/pdf-engine/assemble-dossier-data.ts
  - Modified: src/lib/registry-provenance.ts
  - Modified: src/lib/pdf-blocks/property-data-sheet.tsx
  - Modified: src/lib/pdf-engine/document.tsx
  - Modified: src/lib/mock-backend.ts
  - Modified: src-tauri/src/land_registry/
  - Modified: e2e/complete-presurvey-property-sheet-flow.spec.ts
  - New: e2e/candidate-parcel-options-presurvey.spec.ts
- Dependencies 新增: none
- 環境變數新增: none
