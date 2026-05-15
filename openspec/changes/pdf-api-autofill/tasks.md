## 1. 擴充 CaseDossierData 介面

- [x] 1.1 在 `src/lib/pdf-engine/document.tsx` 的 `CaseDossierData` 介面新增所有 API optional 欄位（landArea、landPurpose、zoningType、usageCategory、soilConservation、buildingLineNote、announcedLandValue、assessedLandValue、mortgages、buildingArea、buildingPurpose、constructionDate、buildingCertificateNo、buildingOwnershipDate、recentSalePricePerSqm、recentSaleCount、legalClauses）。驗證：`npm run type-check` 通過，現有 tests 繼續綠燈（因所有新欄位皆為 optional，不破壞現有物件建構）。

## 2. 建立資料組裝模組

- [x] 2.1 建立 `src/lib/pdf-engine/assemble-dossier-data.ts`，實作 `assembleDossierData(caseRow: CaseRow): Promise<CaseDossierData>`。土地版呼叫 `invoke("land_registry_pull_data", { parcelId, apiIds: ["land_registry","zoning","land_value","mortgages"] })`、`invoke("query_real_price", { district, keyword, limit: 5 })`、`invoke("get_legal_clause")`；建物版呼叫 api_ids `["building_registry","building_ownership","mortgages"]`。每個 invoke 獨立 try/catch，失敗時對應欄位設 undefined，函式保證不拋出。驗證：`npm test src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts` 通過。

- [x] 2.2 在 `src/lib/pdf-engine/assemble-dossier-data.ts` 新增 `ZONING_RESTRICTIONS` lookup table，包含至少 5 個常見使用分區（住宅區、商業區、工業區、農業區、保護區）對應的 `soilConservation` 和 `buildingLineNote` 文字；未知分區回傳 `"依主管機關規定辦理"`。驗證：`ZONING_RESTRICTIONS["農業區"].soilConservation` 為非空字串，`ZONING_RESTRICTIONS["未知X"]` 為 undefined 且 fallback 邏輯回傳 `"依主管機關規定辦理"`。

- [x] 2.3 在 `src/lib/pdf-engine/assemble-dossier-data.ts` 實作 `computeRecentSaleStats(records: unknown[]): { avg: number | undefined; count: number }`，從每筆記錄取 `unit_price` 欄位計算平均（四捨五入）；空陣列時 avg = undefined、count = 0。驗證：5 筆 unit_price `[100000, 120000, 110000, 130000, 90000]` → avg = 110000，count = 5。

## 3. 撰寫 assemble-dossier-data 單元測試

- [x] 3.1 建立 `src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts`，mock `@tauri-apps/api/core` 的 `invoke`，驗證：(a) 土地版成功路徑 — 所有 land 欄位有值；(b) invoke 拋出錯誤時欄位為 undefined 且函式不拋出；(c) 空 query_real_price 結果 → recentSalePricePerSqm undefined，recentSaleCount 0；(d) 已知 zoningType 映射正確，未知 zoningType 回傳 "依主管機關規定辦理"。驗證：`npm test src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts` 全綠。

## 4. 更新 document.tsx — 土地版真實資料

- [x] 4.1 在 `src/lib/pdf-engine/document.tsx` 更新土地版頁 2 的法規告知：移除寫死的 `LEGAL_CLAUSES` 陣列，改為渲染 `data.legalClauses ?? []`；陣列為空時頁面顯示空白（無錯誤）。驗證：`npm test src/lib/pdf-engine/__tests__/document.test.tsx` 綠燈，且 `PdfDocument` 用 legalClauses=["條文A"] 渲染不拋出。

- [x] 4.2 在 `src/lib/pdf-engine/document.tsx` 更新土地版頁 3（土地標示）：`地積（㎡）` 欄顯示 `data.landArea?.toFixed(2) ?? ""`；`地目` 欄顯示 `data.landPurpose ?? ""`；`使用分區` 欄顯示 `data.zoningType ?? ""`；`使用地類別` 欄顯示 `data.usageCategory ?? ""`；`水土保持` 欄顯示 `data.soilConservation ?? ""`；`建築線指定` 欄顯示 `data.buildingLineNote ?? ""`。驗證：`npm test src/lib/pdf-engine/__tests__/document.test.tsx` 綠燈。

- [x] 4.3 在 `src/lib/pdf-engine/document.tsx` 更新土地版頁 4（所有權/他項權利）：`所有權人` 欄顯示 `data.ownerName`（現有）；`他項權利種類` 顯示第一筆 mortgage 的 creditor；`擔保金額` 顯示第一筆 amount（格式化為 NT$ 整數）；無 mortgage 時兩欄顯示空字串。驗證：有 mortgages 資料的 CaseDossierData 渲染不拋出。

- [x] 4.4 在 `src/lib/pdf-engine/document.tsx` 更新土地版頁 6（稅費/規費）：`地價稅（元/年）` 欄顯示 `data.assessedLandValue` 計算值說明（顯示公告現值 `data.announcedLandValue ?? ""` 與評估地價 `data.assessedLandValue ?? ""`）。驗證：有 announcedLandValue 的 CaseDossierData 渲染不拋出。

- [x] 4.5 在 `src/lib/pdf-engine/document.tsx` 更新土地版頁 7（成交行情）：`近期成交均價（元/㎡）` 欄顯示 `data.recentSalePricePerSqm?.toLocaleString("zh-TW") ?? ""`；`近期成交案件數（件）` 欄顯示 `data.recentSaleCount?.toString() ?? ""`。驗證：`npm test` 綠燈。

## 5. 更新 document.tsx — 建物版完整 7 頁

- [x] 5.1 在 `src/lib/pdf-engine/document.tsx` 將建物版 `propertyType === "building"` 分支從單頁 placeholder 改為 7 頁結構。頁 1 封面同土地版；頁 2 法規告知同步使用 `data.legalClauses`；頁 3 建物標示顯示 buildingArea、buildingPurpose、constructionDate；頁 4 所有權/他項權利顯示 ownerName、buildingCertificateNo、buildingOwnershipDate、mortgages；頁 5 建物現況調查顯示空格行；頁 6 管理組織顯示空格行加 "請洽管理委員會確認" 備注；頁 7 成交行情同土地版。驗證：`npm test src/lib/pdf-engine/__tests__/document.test.tsx` 中建物版測試改為驗證 7 頁（blob.size > 1000），全綠。

## 6. 更新 preview/page.tsx 串接 assembleDossierData

- [x] 6.1 在 `src/app/(dashboard)/cases/[id]/preview/page.tsx` 中，將現有 `CaseDossierData` 手動組裝邏輯改為呼叫 `assembleDossierData(caseRow)` from `src/lib/pdf-engine/assemble-dossier-data.ts`，並將結果傳給 `PdfPreviewer`。Server Component 中加 `"use client"` 或改為以 `use server` 傳入客戶端組件（視現有架構決定），確保 `invoke` 在 Tauri 環境執行。驗證：`npm run build` 通過，無 TypeScript 錯誤。
