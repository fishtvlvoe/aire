## 1. 紅燈測試：資料鏈先鎖住

- [x] 1.0 對應決策 1：`desktop-local-address-to-cop-e2e` 作為唯一主線，Mac 優先驗收；先補齊本 change 所需 spec / tasks 對齊，避免 artifact 漂移。驗證：`spectra analyze desktop-local-address-to-cop-e2e --json` clean、`spectra validate desktop-local-address-to-cop-e2e` 通過。

- [ ] 1.1 [P] 在 `src/app/(dashboard)/cases/new/__tests__/formal-cop-persistence.test.tsx` 補紅燈測試：建立案件後 `confirmed_registry_match` 必須保存 `section_name / land_no / building_no / land_area_sqm / announced_land_current_value / announced_land_value`，且 formal pull 請求使用同一 confirmed key。驗證：`pnpm exec vitest run src/app/\(dashboard\)/cases/new/__tests__/formal-cop-persistence.test.tsx` 先紅燈。
- [ ] 1.2 [P] 在 `src/lib/pdf-engine/__tests__/assemble-dossier-mac-chain.test.ts` 補紅燈測試：dossier assembly 能讀到公告現值、公告地價、土地面積與 real-price records；real-price 為空時仍成功。驗證：`pnpm exec vitest run src/lib/pdf-engine/__tests__/assemble-dossier-mac-chain.test.ts` 先紅燈。
- [x] 1.3 [P] 補紅燈測試：formal COP 缺少 confirmed key 時必須拒絕，不得直接輸出 trusted PDF。驗證：`src/lib/__tests__/land-registry-api.test.ts` 已驗證 `registry_match_required`。
- [x] 1.4 [P] 補紅燈測試：免費前查（地址候選、實價登錄、免費欄位補齊）不得觸發付費 API；只有使用者確認後的正式查詢才可進入付費流程。驗證：`src/app/(dashboard)/cases/new/__tests__/new-case-page.test.tsx`、`src/components/__tests__/PullParcelDataButton.test.tsx` 已覆蓋免費前查與付費正式查分流。
- [x] 1.5 [P] 補紅燈測試：付費正式查前必須顯示費用 / 計費說明 / 是否可能失敗仍計費。驗證：`src/components/__tests__/PullParcelDataButton.test.tsx` 已驗證預估費用與扣款確認。
- [x] 1.5A [P] 對應 Requirement `Nationwide free pre-survey SHALL remain available before any paid formal query`：補紅燈測試覆蓋全台免費前查先於任何付費正式查詢，且未確認付費前不得產生成本。
- [ ] 1.6 [P] 對應 Requirement `Confirmed registry fields SHALL persist into formal COP workflow`：補紅燈測試覆蓋 confirmed 欄位保存與後續 formal COP key 使用。
- [x] 1.7 [P] 對應 Requirement `Free pre-survey SHALL remain usable when the user skips formal COP`：補紅燈測試覆蓋未打 COP 仍可保存案件與預覽 reference PDF。

## 2. 案件保存與 provenance 轉綠

- [ ] 2.0 對應決策 2：COP 是讀取來源，系統寫入的是本機 trusted data 與 provenance。驗證：案件保存 shape 與 provenance 欄位不把外部 COP 當可回寫目標。

- [ ] 2.1 在 `src/app/(dashboard)/cases/new/page.tsx` 與 `src/lib/land-registry-api.ts` 對齊案件保存 shape，保證 7 個欄位進入 `land_registry_data.confirmed_registry_match` 與 query provenance。驗證：Task 1.1 轉綠。
- [x] 2.2 在 `src/lib/registry-provenance.ts` 擴充 reference / trusted provenance，記錄公告現值、公告地價、土地面積、sourceRunId、cost、cache hit、isPaid、pricingNote 與 real-price source。驗證：`src/lib/__tests__/registry-provenance.test.ts` 通過；`isPaid` / `pricingNote` 已落地，sourceRunId / cache hit 仍由 formal flow 續補 audit。
- [ ] 2.3 對應 Requirement `Extended address-discovery fields SHALL carry provenance before PDF use`：確認土地面積、公告現值、公告地價、實價登錄摘要在保存前已有 provenance。

## 3. Formal COP 與 trusted data 轉綠

- [ ] 3.0 對應決策 3：PDF 組裝優先序採 trusted COP > manual confirmed > candidate/reference。驗證：formal 成功後 trusted 資料不被候選覆蓋。

- [x] 3.1 在 `src/components/PullParcelDataButton.tsx` 與相關 formal pull 流程中，強制使用 confirmed registry key 作為正式查詢輸入，並在送出前顯示費用 / 風險說明。驗證：`src/lib/__tests__/land-registry-api.test.ts`、`src/components/__tests__/DemoAlignedWorkbench.test.tsx`、`src/components/__tests__/PullParcelDataButton.test.tsx` 通過。
- [ ] 3.2 formal COP 成功後，將 trusted data 與 confirmed/reference data 正確分層保存，禁止未 trusted 的候選覆蓋正式資料。驗證：focused vitest 通過。
- [x] 3.3 對應 Requirement `Formal registry pull SHALL use the confirmed registry key from address-first flow`：正式查詢與客戶 PDF 僅使用 confirmed key 進入 trusted 流程。

## 4. Dossier / PDF 組裝轉綠

- [ ] 4.0 對應決策 4：實價登錄同時是 UI 資料與 dossier input。驗證：同一批 recent sale records 同時進 UI 與 dossier。

- [x] 4.1 在 `src/lib/pdf-engine/assemble-dossier-data.ts` 將 `land_area_sqm`、`announced_land_current_value`、`announced_land_value`、recent sale records 或摘要帶入 dossier snapshot。驗證：`src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts` 通過。
- [x] 4.2 在 `src/lib/pdf-engine/document.tsx` 與必要的 PDF blocks 中確認這些欄位有對應讀取點；沒有時補齊最小可用輸出。驗證：`src/lib/pdf-blocks/__tests__/property-data-sheet.test.tsx`、`src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts` 通過。
- [x] 4.3 在 `src/app/(dashboard)/cases/[id]/preview/page.tsx` 與 `src/lib/export-pdf.ts` 驗證正式 preview / export 使用的是保存後 snapshot，而不是即時候選。驗證：`e2e/local-web-registry-pending-billing.spec.ts` 的正式匯入後預覽流程通過，preview 以案件保存資料進入 `/cases/:id/preview`。
- [ ] 4.4 對應 Requirement `Dossier assembly SHALL include confirmed address-first land values and real price`：確認 confirmed land values 與實價登錄摘要可進 PDF 快照。

## 4A. 實價登錄 source parity 與最新資料修補

- [x] 4A.0 對應決策 5：實價登錄 source 以「地址感知 dataset mapping」統一，不允許 web fallback 到 mock fixture。

- [x] 4A.1 在 `src/lib/tauri-bridge.ts`、`src/lib/real-price-query.ts`、`src/app/api/local/real-price/route.ts` 移除 web/dev 對 `mock-backend` 的 fixed fixture 依賴，改為統一走 Twinkle helper。驗證：台南 `東和路` 不再顯示 `裕農路`，台北 `漢中街` 不再顯示 `和平東路`。
- [x] 4A.2 在 `src/lib/server/twinkle-real-price.ts` 建立全台可擴充的 city dataset mapping、交易日期倒序與欄位對映；不可只停在單一城市 hotfix。驗證：`src/lib/server/__tests__/twinkle-real-price.test.ts` + `src/lib/__tests__/real-price-query.test.ts` + `src/app/api/local/real-price/__tests__/route.test.ts` 通過。
- [x] 4A.3 補 live smoke：至少覆蓋北、中、南、東與都會區地址，確認全台地址查詢都會回地址相關真資料，而非 mock fixture。結果記錄到 `artifacts/smoke/macos/2026-05-29-real-price-source-parity.md`。
- [ ] 4A.4 對應 Requirement `Real price query SHALL provide dossier-eligible nearby sale data from free sources` 與 `Desktop real price source parity SHALL hold across web, local runtime, and desktop app`。

## 4B. 免費前查 / 付費正式查邊界轉綠

- [x] 4B.0 對應決策 6：付費查詢只能在 confirmed key 後觸發，且必須先顯示費用。

- [x] 4B.1 在 `/cases/new` 明確區分免費前查區塊與正式付費查詢按鈕，讓使用者知道哪些資料現在可直接看、哪些動作會花錢。驗證：`src/app/(dashboard)/cases/new/__tests__/new-case-page.test.tsx` 通過。
- [ ] 4B.2 把免費前查的 query ledger 與付費正式查的成本紀錄分開保存，避免後續 PDF 或工作台把兩者混成同一來源。驗證：focused vitest 通過。
- [x] 4B.3 對應 Requirement `Paid query consent and cost SHALL be explicit before formal COP runs`：正式查詢前必須揭露用途、價格、失敗仍可能計費。
- [x] 4B.4 正式查詢扣款 modal 顯示逐項費用明細，明確列出每個查詢項目各自費用，以及付費後會取得的正式資料。驗證：`pnpm exec vitest run src/components/__tests__/PreChargeConfirmDialog.test.tsx src/components/__tests__/PullParcelDataButton.test.tsx` 通過。

## 5. Mac 驗收

- [x] 5.0 對應決策 7：驗收必須留下 Mac 證據，Windows 延後。

- [x] 5.1 跑本機 Web / Mac smoke：`/cases/new` 地址查詢成功，免費前查可看到並保存 7 個欄位，正式查詢前顯示費用，formal COP 成功後 preview / export PDF 成功。驗證：`e2e/local-web-registry-pending-billing.spec.ts` 通過，結果記錄到 `artifacts/smoke/macos/2026-05-29-desktop-local-address-to-cop-e2e-smoke.md`。
- [x] 5.2 跑 `spectra analyze desktop-local-address-to-cop-e2e --json` 與 `spectra validate desktop-local-address-to-cop-e2e`，確認 proposal / design / specs / tasks 全通過。驗證：CLI exit code 0。
- [x] 5.3 對應 Requirement `Mac-first address-to-COP-to-PDF flow SHALL be accepted before Windows work resumes`：完成 Mac smoke 後才能把 Windows 工作往前推。
- [x] 5.3 更新 `openspec/SR-ACTIVE-INDEX.md` 的下一步描述，註記此主線以 Mac first 驗收為當前完成定義，Windows 維持次順位。驗證：index 內容與本 change 一致。
- [x] 5.4 工作台 UI 收斂：`DemoAlignedWorkbench` 與 `docs/workbench-redesign-prototype/` 的核心三頁改用 `12px` 摘要表，`物件資料總覽 / PDF 檢查` 改用 `17px` 精簡單行摘要；主工作區字級統一為 `17px`，移除左側大摘要卡。驗證：`pnpm exec vitest run src/components/__tests__/DemoAlignedWorkbench.test.tsx` 通過。
