## Why

裕農路真實地址驗收顯示，AIRE 目前會把「地政 API 成功回傳資料」、「公開候選地建號」與「探索用 raw endpoint 結果」放在同一條資料流附近。產品第一階段實際上是房仲業既有的物件調查表流程：先產出可帶去談委託的物調資料，再於補件階段修正與確認。因此需要在儲存、預覽與 PDF 組裝層建立來源邊界，讓候選資料能用於物調表，但不會在補件完成前被誤當已確認欄位。

## What Changes

- 新增 registry data provenance contract，規範地政資料必須標記來源、狀態與可信等級。
- 修改 PDF 組裝流程，只接受可信來源的地政資料或使用者明確人工填寫資料。
- 修改謄本資料儲存流程，將 API 成功資料包成 provenance envelope，失敗、未授權、候選與探索資料不得當成正式 `land_registry_data`。
- 修改裕農路 live API 驗收輸出，明確分離正式 API 成功資料、未授權或失敗資料、公開候選輸入與探索端點結果。
- 新增測試覆蓋：沒有 provenance 的舊資料、mock 資料、候選資料、raw endpoint 資料都不得輸出到正式 PDF 欄位。

## Non-Goals

- 不修正 COP 帳號授權本身；`MOI_API_037` 若回 `COP317`，本 SR 僅正確標示為未授權。
- 不把 twzipcode 或其他公開頁面候選值升級為正式地政資料。
- 不用屋主姓名反查個資；已知姓名只能做比對服務測試，不能作為發現屋主姓名的來源。
- 不重做全部地政 API client；本 SR 只建立來源可信防線與目前資料流修補。

## Capabilities

### New Capabilities

- `registry-data-provenance`: 規範地政資料來源、可信狀態、候選資料與 PDF 可用性的邊界。

### Modified Capabilities

- `disclosure-document-generation`: PDF 組裝必須排除未可信或未標記來源的地政資料。
- `land-registry-parcel-apis`: live API 驗收輸出必須區分正式成功、未授權/失敗、候選輸入與探索端點。

## Impact

- Affected specs: registry-data-provenance, disclosure-document-generation, land-registry-parcel-apis
- Affected code:
  - Modified: src/components/PullParcelDataButton.tsx
  - Modified: src/lib/pdf-engine/assemble-dossier-data.ts
  - Modified: src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts
  - Modified: src/lib/registry-preview.ts
  - Modified: src-tauri/tests/cop_api_yunong_live.rs
  - New: src/lib/registry-provenance.ts
  - New: src/lib/__tests__/registry-provenance.test.ts
- Dependencies 新增: 無
- 環境變數新增: 無
