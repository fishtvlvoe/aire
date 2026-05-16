# Tasks — pdf-template-land-complete

> Design refs: D1 章節對應關係、D2 頁面數量、D3 PdfSignatureBlock、D4 CaseDossierData 擴充策略、D5 mock-backend 測試資料、D6 不動 LegalPage

## 1. 擴充 CaseDossierData 介面（實現 spec: System SHALL define a CaseDossierData interface for dossier rendering）

- [x] [P] 1.1 在 `src/lib/pdf-engine/document.tsx` 的 `CaseDossierData` interface 新增第三段欄位：`restrictionRegistration?: string`、`trustRegistration?: string`、`cautionRegistration?: string`、`otherRightsDetail?: string` [Tool: copilot]
- [x] [P] 1.2 在 `CaseDossierData` 新增第四段欄位：`currentRentalStatus?: string`、`currentOccupation?: string`、`sharedManagement?: string`、`existingRoad?: string`、`otherUsageStatus?: string` [Tool: copilot]
- [x] [P] 1.3 在 `CaseDossierData` 新增第五段欄位：`urbanPlanZone?: string`、`nonUrbanLandCategory?: string`、`floorAreaRatio?: string`、`buildingCoverageRatio?: string`、`specialDesignatedArea?: string` [Tool: copilot]
- [x] [P] 1.4 在 `CaseDossierData` 新增第六段欄位：`transactionTotalPrice?: string`、`paymentMethod?: string`、`taxBurdenAgreement?: string`、`penaltyClause?: string` [Tool: copilot]
- [x] [P] 1.5 在 `CaseDossierData` 新增第七段欄位：`environmentalImpact?: string`、`majorIncident?: string`、`nearbyPublicFacilities?: string`、`surroundingTransactionPrice?: string` [Tool: copilot]

## 2. 新增 PdfSignatureBlock 共用元件（實現 spec: LandPages SHALL render a signature block page after Section Seven）

- [x] 2.1 在 `src/lib/pdf-engine/react-pdf-components.tsx` 新增 `PdfSignatureBlock` 元件：接收 `tokens: PdfTokens` 參數，渲染四欄橫排簽章區塊。每欄包含：職稱標題（不動產經紀業 / 經紀人 / 買方 / 賣方）、簽名線（最少 60pt 寬）、日期線「日期：＿＿年＿＿月＿＿日」。用 react-pdf 的 View/Text 元件排版，flex row 四等分。export 此元件。 [Tool: copilot]

## 3. 改寫 LandPages 章節結構（實現 spec: LandPages SHALL render a 10-page document aligned with the government 105-year format）

- [x] 3.1 修改 `src/lib/pdf-engine/document.tsx` 的 `LandPages`：`totalPages` 從 7 改為 10 [Tool: copilot]
- [x] 3.2 改寫頁 3（原「二、產權調查表—土地標示」→「一、標示及權利範圍」）：保留原有欄位（地號/地目/地積/使用分區/使用地類別/水土保持/建築線指定），新增「權利範圍」和「持分比例」兩個空欄位 [Tool: copilot]
- [x] 3.3 改寫頁 4（原「三、產權調查表—所有權及他項權利」→「二、所有權人及其基本資料」）：只保留所有權人相關欄位（所有權人/持分比例），移除他項權利欄位（移到第三段） [Tool: copilot]
- [x] 3.4 新增頁 5：LandPages SHALL render Section Three with all government-mandated fields（三、權利種類及登記狀態），用 PdfSection + PdfFieldTable 渲染限制登記、他項權利明細（從 `mortgages` 組合 creditor + amount）、信託登記、預告登記、其他權利登記事項五列 [Tool: copilot]
- [x] 3.5 新增頁 6：LandPages SHALL render Section Four with all government-mandated fields（四、目前管理與使用情況），用 PdfSection + PdfFieldTable 渲染出租情形、占用情形、共有物分管情形、既成道路、其他使用情況五列 [Tool: copilot]
- [x] 3.6 新增頁 7：LandPages SHALL render Section Five with all government-mandated fields（五、使用管制內容），用 PdfSection + PdfFieldTable 渲染都市計畫使用分區（fallback `zoningType`）、非都市土地使用分區及編定（fallback `usageCategory`）、容積率、建蔽率、特定目的事業用地五列 [Tool: copilot]
- [x] 3.7 改寫頁 8（原「五、稅費╱規費」→「六、重要交易條件」）：新欄位為交易總價、付款方式、稅費負擔約定、違約處理、公告現值、評估地價六列 [Tool: copilot]
- [x] 3.8 改寫頁 9（原「六、成交行情╱周遭設施」→「七、其他重要事項」）：新欄位為環境影響、重大事故、鄰近公共設施、周遭成交行情、近期成交均價、近期成交案件數六列 [Tool: copilot]
- [x] 3.9 新增頁 10「簽章欄」：用 PdfSection 標題 + PdfSignatureBlock 元件渲染 [Tool: copilot]

## 4. 更新 mock 測試資料

- [x] 4.1 在 `src/lib/mock-backend.ts` 的 mockCaseDossierData（或 assembleDossierData 的 mock 回傳值）補充第三～七段各 1-2 個範例值，讓開發預覽有部分欄位顯示真實資料而非全部「待補」 [Tool: copilot]

## 5. 驗證（含 BuildingPages SHALL remain unchanged at 7 pages）

- [x] 5.1 執行 `npm run build`，確認 TypeScript 編譯零錯誤 [Tool: main]
- [x] 5.2 在瀏覽器 dev 模式開啟 Step 4 預覽，確認土地版 PDF 顯示 10 頁、章節標題正確、未填欄位顯示「待補」、簽章欄四欄橫排 [Tool: main]
- [x] 5.3 確認 BuildingPages SHALL remain unchanged at 7 pages — 建物版 PDF 仍為 7 頁、內容不受影響 [Tool: main]
