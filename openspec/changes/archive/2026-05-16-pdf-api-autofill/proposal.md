## Why

目前 AIRE 的 PDF（土地版 7 頁、建物版顯示「建置中」placeholder）所有資料欄位均為空白，雖然後端已串接地政 API（土地/建物謄本、使用分區、公告現值、他項權利、建物所有權）、實價登錄 API 及法規條文 IPC，但資料完全未流入 PDF。使用者現在仍需手動抄寫所有欄位，失去 AIRE 的核心價值。

## What Changes

- 擴充 `CaseDossierData` 介面，新增地政 API 對應的 optional 欄位（土地/建物面積、使用分區、公告現值、他項權利、建物所有權、成交均價、法規條文清單）
- 新增 `assemble-dossier-data.ts`：根據 `propertyType`，呼叫對應 Tauri IPC（土地版：`land_registry`、`zoning`、`land_value`、`mortgages`；建物版：`building_registry`、`building_ownership`、`mortgages`），加上 `query_real_price` 和 `get_legal_clause_ipc`，組裝完整 `CaseDossierData`
- 更新 `document.tsx`：土地版各頁填入真實資料；建物版從 placeholder 改為完整 7 頁結構（封面、法規告知、建物標示、所有權/他項權利、現況調查、管理組織、成交行情）
- 法規告知頁（頁 2）改為從 IPC 動態取得條文，移除寫死的 `LEGAL_CLAUSES` 陣列
- 頁 5「土地使用管制/水土保持」欄位根據 zoning_type 做靜態 lookup table 自動帶入（法規明文，不需額外 API）
- PDF 預覽頁（`cases/[id]/preview/page.tsx`）改呼叫 `assemble-dossier-data.ts` 取得完整資料

## Non-Goals

- 不涉及手動填表欄位（承辦人/店長/經紀人、交易價金、付款方式、勾選式現況調查）
- 不修改任何 Tauri 後端 Rust 指令（全部使用現有 IPC）
- 不做資料快取（PDF 每次預覽都即時呼叫，快取為後續優化）
- 建物版的管委會/公寓管理組織欄位顯示空格（無對應 API，不強制填入）

## Capabilities

### New Capabilities

- `pdf-api-autofill`: 從現有 Tauri IPC 組裝完整 `CaseDossierData`，自動填入土地版及建物版 PDF 所有可從 API 取得的欄位

### Modified Capabilities

- `dossier-land-document`: 擴充 `CaseDossierData` 介面；建物版從 placeholder 升級為完整 7 頁結構；土地版各頁改用動態資料

## Impact

- Affected specs: pdf-api-autofill（新），dossier-land-document（修改介面及建物版結構）
- Affected code:
  - New: src/lib/pdf-engine/assemble-dossier-data.ts
  - Modified: src/lib/pdf-engine/document.tsx
  - Modified: src/app/(dashboard)/cases/[id]/preview/page.tsx
