## 1. 紅燈測試：資料鏈先鎖住

- [x] 1.0 對應決策 1：`desktop-local-address-to-cop-e2e` 作為唯一主線，Mac 優先驗收；先補齊本 change 所需 spec / tasks 對齊，避免 artifact 漂移。驗證：`spectra analyze desktop-local-address-to-cop-e2e --json` clean、`spectra validate desktop-local-address-to-cop-e2e` 通過。

- [x] 1.1 [P] 建立案件後 `confirmed_registry_match` 必須保存 `section_name / land_no / building_no / land_area_sqm / announced_land_current_value / announced_land_value`，且 formal pull 請求使用同一 confirmed key。驗證：`pnpm exec vitest run 'src/app/(dashboard)/cases/new/__tests__/new-case-page.test.tsx' 'src/lib/server/__tests__/local-formal-pull-proxy.test.ts' 'src/lib/__tests__/land-registry-api.test.ts' --reporter=dot` 通過。
- [x] 1.2 [P] dossier assembly 能讀到公告現值、公告地價、土地面積與 real-price records；real-price 為空時仍成功。驗證：`pnpm exec vitest run src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts src/lib/__tests__/real-price-query.test.ts --reporter=dot` 通過。
- [x] 1.3 [P] 補紅燈測試：formal COP 缺少 confirmed key 時必須拒絕，不得直接輸出 trusted PDF。驗證：`src/lib/__tests__/land-registry-api.test.ts` 已驗證 `registry_match_required`。
- [x] 1.4 [P] 補紅燈測試：免費前查（地址候選、實價登錄、免費欄位補齊）不得觸發付費 API；只有使用者確認後的正式查詢才可進入付費流程。驗證：`src/app/(dashboard)/cases/new/__tests__/new-case-page.test.tsx`、`src/components/__tests__/PullParcelDataButton.test.tsx` 已覆蓋免費前查與付費正式查分流。
- [x] 1.5 [P] 補紅燈測試：付費正式查前必須顯示費用 / 計費說明 / 是否可能失敗仍計費。驗證：`src/components/__tests__/PullParcelDataButton.test.tsx` 已驗證預估費用與扣款確認。
- [x] 1.5A [P] 對應 Requirement `Nationwide free pre-survey SHALL remain available before any paid formal query`：補紅燈測試覆蓋全台免費前查先於任何付費正式查詢，且未確認付費前不得產生成本。
- [x] 1.6 [P] 對應 Requirement `Confirmed registry fields SHALL persist into formal COP workflow`：補紅燈測試覆蓋 confirmed 欄位保存與後續 formal COP key 使用。驗證：`src/app/(dashboard)/cases/new/__tests__/new-case-page.test.tsx`、`src/lib/server/__tests__/local-formal-pull-proxy.test.ts`、`src/components/__tests__/DemoAlignedWorkbench.test.tsx` 通過。
- [x] 1.7 [P] 對應 Requirement `Free pre-survey SHALL remain usable when the user skips formal COP`：補紅燈測試覆蓋未打 COP 仍可保存案件與預覽 reference PDF。

## 2. 案件保存與 provenance 轉綠

- [x] 2.0 對應決策 2：COP 是讀取來源，系統寫入的是本機 trusted data 與 provenance。驗證：案件保存 shape 與 provenance 欄位不把外部 COP 當可回寫目標，`src/lib/__tests__/registry-provenance.test.ts`、`src/components/__tests__/PullParcelDataButton.test.tsx` 通過。

- [x] 2.1 在 `src/app/(dashboard)/cases/new/page.tsx` 與 `src/lib/land-registry-api.ts` 對齊案件保存 shape，保證 7 個欄位進入 `land_registry_data.confirmed_registry_match` 與 query provenance。驗證：Task 1.6 focused tests 轉綠，並補 `office_code / section_code / registry_key` 供 formal COP payload 使用。
- [x] 2.2 在 `src/lib/registry-provenance.ts` 擴充 reference / trusted provenance，記錄公告現值、公告地價、土地面積、sourceRunId、cost、cache hit、isPaid、pricingNote 與 real-price source。驗證：`src/lib/__tests__/registry-provenance.test.ts` 通過；`isPaid` / `pricingNote` 已落地，sourceRunId / cache hit 仍由 formal flow 續補 audit。
- [x] 2.3 對應 Requirement `Extended address-discovery fields SHALL carry provenance before PDF use`：確認土地面積、公告現值、公告地價、實價登錄摘要在保存前已有 provenance。驗證：`src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts` 與 workbench PDF snapshot 測試通過。

## 3. Formal COP 與 trusted data 轉綠

- [x] 3.0 對應決策 3：PDF 組裝優先序採 trusted COP > manual confirmed > candidate/reference。驗證：formal 成功後 trusted 資料不被候選覆蓋，`src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts` 通過。

- [x] 3.1 在 `src/components/PullParcelDataButton.tsx` 與相關 formal pull 流程中，強制使用 confirmed registry key 作為正式查詢輸入，並在送出前顯示費用 / 風險說明。驗證：`src/lib/__tests__/land-registry-api.test.ts`、`src/components/__tests__/DemoAlignedWorkbench.test.tsx`、`src/components/__tests__/PullParcelDataButton.test.tsx` 通過。
- [x] 3.2 formal COP 成功後，將 trusted data 與 confirmed/reference data 正確分層保存，禁止未 trusted 的候選覆蓋正式資料。驗證：focused vitest 通過。
- [x] 3.3 對應 Requirement `Formal registry pull SHALL use the confirmed registry key from address-first flow`：正式查詢與客戶 PDF 僅使用 confirmed key 進入 trusted 流程。

## 4. Dossier / PDF 組裝轉綠

- [x] 4.0 對應決策 4：實價登錄同時是 UI 資料與 dossier input。驗證：同一批 recent sale records 同時進 UI 與 dossier，`src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts` 通過。

- [x] 4.1 在 `src/lib/pdf-engine/assemble-dossier-data.ts` 將 `land_area_sqm`、`announced_land_current_value`、`announced_land_value`、recent sale records 或摘要帶入 dossier snapshot。驗證：`src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts` 通過。
- [x] 4.2 在 `src/lib/pdf-engine/document.tsx` 與必要的 PDF blocks 中確認這些欄位有對應讀取點；沒有時補齊最小可用輸出。驗證：`src/lib/pdf-blocks/__tests__/property-data-sheet.test.tsx`、`src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts` 通過。
- [x] 4.3 在 `src/app/(dashboard)/cases/[id]/preview/page.tsx` 與 `src/lib/export-pdf.ts` 驗證正式 preview / export 使用的是保存後 snapshot，而不是即時候選。驗證：`e2e/local-web-registry-pending-billing.spec.ts` 的正式匯入後預覽流程通過，preview 以案件保存資料進入 `/cases/:id/preview`。
- [x] 4.4 對應 Requirement `Dossier assembly SHALL include confirmed address-first land values and real price`：確認 confirmed land values 與實價登錄摘要可進 PDF 快照。驗證：`src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts` 通過。
- [x] 4.5 說明書完整性回歸：免費前查已可取得的土地面積（坪數）、建築面積、建築物屋齡、附近實價登錄，以及位置圖 / Logo / 空拍圖 / 建築物外觀必須出現在 dossier / PDF；正式地政產權與所有權欄位則在 API 成功時覆蓋，失敗時需明確標註來源與缺漏原因。驗證：`src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts`、`src/lib/pdf-blocks/__tests__/property-data-sheet.test.tsx` 與 `e2e/desktop-local-address-to-cop-e2e.spec.ts` 通過。
- [x] 4.6 PDF 前置審核頁：正式 COP 或免費前查完成後，先在工作台提供可編輯、可保存的 PDF 內容表格；保存後 `assembleDossierData` 讀取 `dossier_editable_snapshot`，避免只在最終 PDF 才看到缺漏。驗證：`src/components/__tests__/DemoAlignedWorkbench.test.tsx`、`src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts` 通過。
- [x] 4.7 對應決策 6c：工作台與 PDF 欄位必須使用可讀語意，不直接顯示地政原始代碼；對應 Requirement `Registry codes and total-floor values are not treated as user-facing facts`：工作台與 PDF 不再把 `003` 當成本戶樓層，無法轉換的 `A` / `04` 類代碼改標示為待代碼表轉換，建物面積顯示平方公尺與坪數。驗證：`pnpm exec vitest run src/lib/__tests__/product-ui-demo-alignment.test.ts src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts` 通過。

## 4A. 實價登錄 source parity 與最新資料修補

- [x] 4A.0 對應決策 5：實價登錄 source 以「地址感知 dataset mapping」統一，不允許 web fallback 到 mock fixture。

- [x] 4A.1 在 `src/lib/tauri-bridge.ts`、`src/lib/real-price-query.ts`、`src/app/api/local/real-price/route.ts` 移除 web/dev 對 `mock-backend` 的 fixed fixture 依賴，改為統一走 Twinkle helper。驗證：台南 `東和路` 不再顯示 `裕農路`，台北 `漢中街` 不再顯示 `和平東路`。
- [x] 4A.2 在 `src/lib/server/twinkle-real-price.ts` 建立全台可擴充的 city dataset mapping、交易日期倒序與欄位對映；不可只停在單一城市 hotfix。驗證：`src/lib/server/__tests__/twinkle-real-price.test.ts` + `src/lib/__tests__/real-price-query.test.ts` + `src/app/api/local/real-price/__tests__/route.test.ts` 通過。
- [x] 4A.3 補 live smoke：至少覆蓋北、中、南、東與都會區地址，確認全台地址查詢都會回地址相關真資料，而非 mock fixture。結果記錄到 `artifacts/smoke/macos/2026-05-29-real-price-source-parity.md`。
- [x] 4A.4 對應 Requirement `Real price query SHALL provide dossier-eligible nearby sale data from free sources` 與 `Desktop real price source parity SHALL hold across web, local runtime, and desktop app`。驗證：`src/lib/__tests__/real-price-query.test.ts`、`src/lib/server/__tests__/twinkle-real-price.test.ts`、`src/app/api/local/real-price/__tests__/route.test.ts` 通過。

## 4B. 免費前查 / 付費正式查邊界轉綠

- [x] 4B.0 對應決策 6：付費查詢只能在 confirmed key 後觸發，且必須先顯示費用。

- [x] 4B.1 在 `/cases/new` 明確區分免費前查區塊與正式付費查詢按鈕，讓使用者知道哪些資料現在可直接看、哪些動作會花錢。驗證：`src/app/(dashboard)/cases/new/__tests__/new-case-page.test.tsx` 通過。
- [x] 4B.2 把免費前查的 query ledger 與付費正式查的成本紀錄分開保存，避免後續 PDF 或工作台把兩者混成同一來源。驗證：`src/lib/__tests__/registry-provenance.test.ts`、`src/components/__tests__/DemoAlignedWorkbench.test.tsx`、`e2e/desktop-local-address-to-cop-e2e.spec.ts` 通過。
- [x] 4B.3 對應 Requirement `Paid query consent and cost SHALL be explicit before formal COP runs`：正式查詢前必須揭露用途、價格、失敗仍可能計費。
- [x] 4B.4 正式查詢扣款 modal 顯示逐項費用明細，明確列出每個查詢項目各自費用，以及付費後會取得的正式資料。驗證：`pnpm exec vitest run src/components/__tests__/PreChargeConfirmDialog.test.tsx src/components/__tests__/PullParcelDataButton.test.tsx` 通過。
- [x] 4B.5 正式資料匯入頁不得把 `manual-*` 人工確認紀錄當成可付費查詢 key；只有 `office_code / section_code / land_no / building_no` 完整且格式正確的候選可顯示付費匯入。驗證：`pnpm exec vitest run src/components/__tests__/DemoAlignedWorkbench.test.tsx`、`pnpm exec vitest run src/lib/server/__tests__/local-formal-pull-proxy.test.ts src/lib/__tests__/land-registry-api.test.ts` 通過。
- [x] 4B.6 對應決策 6b：地址候選不得用同土地第一個建號猜測目標建物；對應 Requirement `Same land returns multiple building candidates`：Z10Web 門牌前查遇到同地號多建號時，保留所有建號候選，不再取第一個建號；新建案件也不再從其他候選偷拿第一個建號當 confirmed key。驗證：`pnpm exec vitest run src/lib/server/__tests__/local-address-discovery-proxy.test.ts` 通過。
- [x] 4B.7 正式資料匯入頁提供「重新查詢候選」入口，讓既有案件可回到便民系統候選確認，不需重新建立案件；重新查詢不扣款，且需再次確認候選後才可付費匯入。驗證：`pnpm exec vitest run src/components/__tests__/DemoAlignedWorkbench.test.tsx` 通過。
- [x] 4B.8 對應 Requirement `Formal pull returns a different doorplate than the case address`：formal COP 回傳門牌與案件地址不一致時，彈窗顯示原因與扣款資訊，且不寫入 trusted PDF data。驗證：`pnpm exec vitest run src/components/__tests__/PullParcelDataButton.test.tsx` 通過。
- [x] 4B.9 正式匯入建物資料前先用官方門牌查建號解析案件地址；解析成功才用官方建號送後續付費建物標示 / 所有權查詢，解析失敗時不送出付費查詢。驗證：`pnpm exec vitest run src/lib/server/__tests__/local-formal-pull-proxy.test.ts src/lib/__tests__/land-registry-api.test.ts` 通過。
- [x] 4B.10 R02 舊版便民系統恢復可用時，作為 Z10Web 的交叉驗證來源；兩者地號 / 建號衝突時顯示候選衝突與診斷，不自動確認。驗證：`pnpm exec vitest run src/lib/server/__tests__/local-address-discovery-proxy.test.ts --reporter=dot` 通過，並以免費 live discovery 確認 `台南市永康區勝利街58巷4號` 回 `DK / 9125 / 04140000 / 00084000`。
- [x] 4B.11 對應 Requirement `Floor-unit address narrows Z10Web building candidates`：Z10Web 先定位土地 / 建號候選，含 `樓之號` 的地址再用 R02 戶別解析縮小候選；`之一` 必須正規化為 `之1`，不得用候選排序推測目標建號。驗證：`pnpm exec vitest run src/lib/server/__tests__/local-address-discovery-proxy.test.ts` 通過，並以 live discovery 確認 `台南市東區裕農路288巷17號5樓之1` 與 `8樓之1` 回不同建號。
- [x] 4B.12 對應 Requirement `Address whitespace does not change discovery result`：地址查詢應忽略中間空白；真實 fixture 採無空白地址 `台南市東區中華東路三段24巷8號5樓`，E2E 驗證免費前查可回候選且 cost = 0。
- [x] 4B.13 對應 Requirement `Chinese and Arabic address numbers resolve to the same candidate`：地址 parser 將全形 / 半形、中文 / 阿拉伯數字正規化，並為 Z10Web / R02 產生 `三段` / `3段` 等查詢變體。驗證：`pnpm exec vitest run src/lib/server/__tests__/local-address-discovery-proxy.test.ts src/app/(dashboard)/cases/new/__tests__/new-case-page.test.tsx` 通過，真實 E2E 覆蓋 `台南市東區中華東路三段24巷8號5樓` 與 `台南市東區中華東路3段24巷8號5樓` 對到同一候選。

## 4C. 兩段式補件流程與正確費用模型

- [x] 4C.1 對應決策 6 與「決策 6D：補件流程改成兩段式，正式資料匯入只屬於簽約後」：把工作台流程切成「簽約前免費前查」與「簽約後正式補件」兩段。前段只顯示免費資料、候選確認、生活機能、地圖、Logo、reference PDF；後段才顯示電子謄本 / formal COP 的所有權與他項權利調閱入口。驗證：`src/components/__tests__/DemoAlignedWorkbench.test.tsx` 覆蓋兩段式 tabs / CTA 與未確認候選時不出現付費正式調閱入口。
- [x] 4C.2 對應 Requirement `Pre-signing output SHALL be free and marked as reference data`：測試保證簽約前保存案件、預覽與匯出 PDF 時 COP cost 為 0，且不呼叫 `/api/local/formal-pull-data`、Tauri formal pull 或電子謄本調閱。驗證：`src/app/(dashboard)/cases/new/__tests__/new-case-page.test.tsx`、`src/components/__tests__/DemoAlignedWorkbench.test.tsx`、`e2e/desktop-local-address-to-cop-e2e.spec.ts` 通過。
- [x] 4C.3 對應免費資料鏈：以 Z10Web / R02 已確認的地號與建號補齊免費建物標示參考資料，將建物面積、建築完成日、屋齡、樓層別 / 總層數與主要用途帶入工作台與 reference PDF，來源標示為免費前查 / reference，不得標示 trusted formal。驗證：`src/lib/server/__tests__/local-address-discovery-proxy.test.ts`、`src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts` 覆蓋 `台南市永康區勝利街58巷4號` 類案例。
- [x] 4C.4 對應 Requirement `Post-signing formal supplement SHALL use catalog-driven pricing`：移除 `billableSuccessCount * 10`、E2E fixture `requestedApiIds.length * 10` 與 Tauri `DEFAULT_UNIT_COST = 10` 對正式費用的固定估算，改由 `src/lib/moi-service-catalog.ts` / COP 服務目錄計算 API code、單價、查詢單位、預估費用與實際費用。驗證：`src/lib/server/__tests__/local-formal-pull-proxy.test.ts`、`src/components/__tests__/PreChargeConfirmDialog.test.tsx`、`cargo test --lib land_registry::pull` 通過。
- [x] 4C.5 對應正式補件邊界：簽約後正式補件預設只查所有權、他項權利 / 抵押與電子謄本相關資料；土地 / 建物標示若免費前查已有 reference data，不得在未選擇正式標示部時自動重查並計費。驗證：`src/components/__tests__/DemoAlignedWorkbench.test.tsx`、`src/components/__tests__/PullParcelDataButton.test.tsx` 通過。
- [x] 4C.6 對應 Requirement `Formal ownership and other-right data SHALL be post-signing supplement data`：PDF 在簽約前把所有權與他項權利顯示為「簽約後正式補件調閱」，簽約後 formal 成功才改用 trusted data。驗證：`src/lib/pdf-blocks/__tests__/property-data-sheet.test.tsx`、`src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts` 通過。
- [x] 4C.7 補 Mac E2E：跑一次簽約前免費流程到 reference PDF，確認沒有扣費；再跑簽約後正式補件確認畫面，確認費用逐項來自服務目錄且不再出現「每成功項目 NT$10」。驗證：`pnpm exec playwright test e2e/desktop-local-address-to-cop-e2e.spec.ts --reporter=line` 通過，並更新 `artifacts/smoke/macos/2026-05-31-desktop-local-address-to-cop-e2e.md`。
- [x] 4C.8 補真實前查 PDF 下載 E2E：同一支 Playwright 測試用 `台南市東區裕農路288巷17號8樓之1` 與 `台南市南化區南化段850-1地號` 建立草稿、維持本次地政費用 0 元、不得出現 COP 錯誤碼，並下載兩份 PDF；土地版 PDF 必須輸出原始標的描述，避免地號案件在說明書遺失輸入資料。驗證：`E2E_BASE_URL=http://localhost:1420 pnpm exec playwright test e2e/real-presurvey-pdf-download.spec.ts --reporter=line` 通過。
- [x] 4C.9 買家版 PDF 清理與補齊：簽約前 reference PDF 不得顯示內部狀態、候選比較、`candidate_data_available`、`unconfirmed`、`來源：PDF 前置審核` 或假值 `委託總價 0`；系統 UI 仍保留這些審核資訊。大樓 PDF 必須輸出便民系統已取得的建物面積、用途、建材、建築完成日、屋齡、樓層與所有權人等可讀事實；土地 PDF 必須輸出土地面積（坪數為主）。缺建物外觀時顯示「待補」，不得使用綠色 placeholder；Logo 必須正常出現在 PDF；土地現況說明書 34 題收成單頁。驗證：`pnpm exec vitest run src/lib/pdf-blocks/__tests__/property-data-sheet.test.tsx src/lib/pdf-blocks/__tests__/registry-image-pages.test.tsx src/lib/pdf-blocks/__tests__/land-condition-survey.test.tsx`、`E2E_BASE_URL=http://localhost:1420 pnpm exec playwright test e2e/real-presurvey-pdf-download.spec.ts --reporter=line`、`spectra validate desktop-local-address-to-cop-e2e` 通過。
- [x] 4C.10 買家版周邊與大樓土地面積語意修正：生活機能「學校」只收正式國小、國中、高中、高職、專科、大學 / 學院，排除音樂教室、樂團、補習班、幼兒園等非正式學校；大樓物件的土地面積欄位改標「基地土地總面積（坪）」，避免被誤解為單戶專有土地。驗證：`pnpm exec vitest run src/lib/__tests__/overpass-client.test.ts src/lib/pdf-blocks/__tests__/property-data-sheet.test.tsx` 通過。
- [x] 4C.11 實價登錄 freshness 修正：台南 city-specific dataset `128852` 實測最新只到 2022-12，不能壓過全國 `lvr-trades` 內較新的 2025 / 2026 成交資料；city-specific 查詢後需合併 national fallback、依成交日倒序去重，讓 PDF 優先使用較新行情。驗證：live Twinkle 查詢確認 `台南市東區裕農路` 在 `lvr-trades` 有 2026-01 / 2025-12 資料，`pnpm exec vitest run src/lib/server/__tests__/twinkle-real-price.test.ts src/lib/__tests__/overpass-client.test.ts src/lib/pdf-blocks/__tests__/property-data-sheet.test.tsx` 通過。
- [x] 4C.12 成交行情與生活機能買家版密度修正：附近地段實價登錄 PDF 固定只印前 10 筆、維持單頁；生活機能半徑擴到 5km，正式學校可列多筆，醫療優先大型醫院與一般 / 小兒科 / 家醫 / 內科 / 耳鼻喉診所，排除牙醫、醫美、動物醫院；Google 與 Overpass 結果合併，不再用任一來源完全覆蓋另一來源。驗證：`pnpm exec vitest run src/lib/__tests__/overpass-client.test.ts src/lib/pdf-blocks/__tests__/life-amenities.test.tsx src/lib/pdf-blocks/__tests__/transaction-history-page.test.ts` 通過。
- [x] 4C.13 土地版 PDF 可讀性與基本資料修正：土地資料表應從正式資料、候選資料或地段地號標的描述補出地段 / 地號 / 土地面積，不得因未付費正式查詢而漏掉已知免費資料；土地現況說明書維持 34 題單頁但放大字級，只留「是 / 否」，並將原第 14 題「嫌惡設施」移到第 34 題。驗證：`pnpm exec vitest run src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts src/lib/pdf-blocks/__tests__/land-condition-survey.test.tsx` 通過。
- [x] 4C.14 土地分號地號欄位修正：土地描述輸入如 `850-1` / `850之1` 必須正規化為 `08500001`，查 EasyMap detail 時還原成 `850-1`，避免誤送 `8501` 導致面積、使用分區、公告現值與公告地價漏抓；候選資料需保留 `zoning` 供土地 PDF 使用。驗證：`pnpm exec vitest run src/lib/server/__tests__/local-address-discovery-proxy.test.ts` 通過，live probe 確認 `台南市南化區南化段850-1地號` 回 `土地面積 3404.0 平方公尺 / 使用分區 山坡地保育區 / 公告現值 270 / 公告地價 58`。
- [x] 4C.15 土地類免費前查欄位邊界確認：土地地段地號輸入在 Z10Web 前查後，系統可用免費候選資料辨識土地位置與基本類型，並帶入買家版草稿欄位。可穩定使用欄位包含正式地段名稱、段代碼、地政事務所代碼、正規化地號、土地面積、使用分區、公告現值、公告地價；`使用分區` 可作為土地類型判斷依據（例：`山坡地保育區`、`特定農業區`），但所有權人、取得日期、權利範圍、他項權利仍歸簽約後正式補件。驗證：live probe 確認 `台南市南化區南化段850-1地號`、`台南市新市區港子前段1090地號`、`台南市新市區港子前段1090-26地號` 均回 `candidate_found`、cost = 0，且分別回土地面積 / 使用分區 / 公告現值 / 公告地價。
- [x] 4C.16 對應決策 8：第一階段驗收邊界是「便民系統免費前查」，第二階段才進 COP；將第一階段「便民系統免費前查 → UI 確認 → reference PDF」的驗收邊界、建物/土地 fixture 範圍、已踩坑、前端需避雷點，以及第二階段 COP 的 confirmed key / 付費確認 / trusted data 回填原則寫入 `design.md`，供下一個代理讀取後規劃。驗證：`spectra validate desktop-local-address-to-cop-e2e` 通過。

## 5. Mac 驗收

- [x] 5.0 對應決策 7：驗收必須留下 Mac 證據，Windows 延後。

- [x] 5.1 跑本機 Web / Mac smoke：`/cases/new` 地址查詢成功，免費前查可看到並保存 7 個欄位，正式查詢前顯示費用，formal COP 成功後 preview / export PDF 成功。驗證：`e2e/local-web-registry-pending-billing.spec.ts` 通過，結果記錄到 `artifacts/smoke/macos/2026-05-29-desktop-local-address-to-cop-e2e-smoke.md`。
- [x] 5.2 跑 `spectra analyze desktop-local-address-to-cop-e2e --json` 與 `spectra validate desktop-local-address-to-cop-e2e`，確認 proposal / design / specs / tasks 全通過。驗證：CLI exit code 0。
- [x] 5.3 對應 Requirement `Mac-first address-to-COP-to-PDF flow SHALL be accepted before Windows work resumes`：完成 Mac smoke 後才能把 Windows 工作往前推。
- [x] 5.3 更新 `openspec/SR-ACTIVE-INDEX.md` 的下一步描述，註記此主線以 Mac first 驗收為當前完成定義，Windows 維持次順位。驗證：index 內容與本 change 一致。
- [x] 5.4 決策 6a：工作台摘要與字級分成核心三頁模式與非核心頁模式。`DemoAlignedWorkbench` 與 `docs/workbench-redesign-prototype/` 的核心三頁改用 `12px` 摘要表，`物件資料總覽 / PDF 檢查` 改用 `17px` 精簡單行摘要；主工作區字級統一為 `17px`，移除左側大摘要卡。驗證：`pnpm exec vitest run src/components/__tests__/DemoAlignedWorkbench.test.tsx` 通過。
