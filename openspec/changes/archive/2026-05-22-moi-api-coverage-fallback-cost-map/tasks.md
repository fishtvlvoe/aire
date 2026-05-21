## 1. Catalog And Coverage

- [ ] 1.1 `Decision: Treat catalog and integration as separate layers` 與 `MOI service catalog is available from scraped COP data`：先新增測試或快照驗證，確認 catalog 能讀取 63 筆服務、`MOI_API_001` 到 `MOI_API_046`、WFS/WMS 與價格描述。
- [ ] 1.2 `Decision: Treat catalog and integration as separate layers` 與 `MOI service catalog is available from scraped COP data`：實作或整理 service catalog source，不以 endpoint wrapper 硬編碼價格為唯一依據。
- [ ] 1.3 `Decision: Coverage matrix drives implementation priority` 與 `AIRE maintains a MOI API coverage matrix`：建立 coverage matrix，欄位至少包含 serviceCode、serviceName、officialPrice、eligibility、currentAireApiId、workflowNeed、priority、fallbackRole、status。
- [ ] 1.4 `Decision: Coverage matrix drives implementation priority` 與 `AIRE maintains a MOI API coverage matrix`：將現有 AIRE endpoints 對照到官方服務碼，標出已串、缺漏、免費可補、限制不可用與待決策項目。
- [ ] 1.5 `Document-side evidence` 與 `Disclosure Field Reverse Map` 與 `Disclosure fields have source coverage classifications` 與 `AIRE classifies disclosure fields by source and auto-fill feasibility`：從 `docs/dossier-implementation-spec.md`、`docs/0417-new/建安不動產欄位總表.md`、`docs/0417-old` 類型清單建立說明書欄位來源矩陣，標出地政可查、圖資可查、公開資料可查、現場必問、秘書/合約後補、必須留白。
- [ ] 1.6 `Property type implications` 與 `AIRE maps property-type-specific disclosure fields to registry, public-data, field-visit, and manual sources`：優先完成農地、農舍、透天別墅三類反推，確認哪些欄位可由 `MOI_API_001`~`MOI_API_046` 或 WMS/WFS 補齊。

## 2. Success Classifier And Cost Policy

- [ ] 2.1 `Decision: Success classifier must be domain-level` 與 `MOI API outcome classifier distinguishes transport, domain, empty, and restricted failures`：先新增測試覆蓋 HTTP 2xx + `STATUS=1`、HTTP 2xx + `STATUS=0/COP309`、`RETURNROWS=0`、payload null、parse failure。
- [ ] 2.2 `Decision: Success classifier must be domain-level` 與 `MOI API outcome classifier distinguishes transport, domain, empty, and restricted failures`：實作共用 outcome classifier，避免每個 endpoint 各自猜成功/失敗。
- [ ] 2.3 `Decision: Cost policy must be explicit per service and outcome` 與 `MOI cost policy calculates billable amounts from catalog rules`：先新增 cost policy tests，覆蓋 `MOI_API_005` 單筆 1 元、`MOI_API_007` 依地段 10 元、免費 API、`COP309` 失敗預設不計費。
- [ ] 2.4 `Decision: Cost policy must be explicit per service and outcome` 與 `MOI cost policy calculates billable amounts from catalog rules`：實作 catalog-driven cost policy，取代 `DEFAULT_UNIT_COST = 10` 與 endpoint wrapper 固定 `unit_cost: 10.0` 的決策來源。

## 3. Fallback And Integration Decisions

- [ ] 3.1 `Decision: Coverage matrix drives implementation priority` 與 `AIRE required disclosure workflows map to required and fallback MOI services`：盤點揭露書/案件流程欄位，將每個欄位映射到 primary API、fallback API 或人工補件。
- [ ] 3.2 `Decision: Coverage matrix drives implementation priority` 與 `AIRE required disclosure workflows map to required and fallback MOI services`：標出第一批必接服務，至少包含目前已用於土地/建物標示、所有權、他項權利、門牌查建號、帳務查詢與免費補充資料的候選 API。
- [ ] 3.3 `Decision: Success classifier must be domain-level` 與 `AIRE fallback policy handles unavailable or no-data MOI responses`：定義 `COP309`、不可查縣市、無資料、憑證不足、政府限定服務的 UI/後端 fallback 行為。
- [ ] 3.4 `Current gap statement` 與 `Fields that should stop being blank when MOI data exists` 與 `Auto-fillable blank is reported as a gap`：新增空白欄位稽核，當說明書欄位缺值但 registry payload 或 catalog-mapped API 可提供來源時，UI/後台報告必須標示「可自動補」而不是單純留白。
- [ ] 3.5 `Auto-fill audit separates already fetched data from not-yet-wired services`：空白欄位稽核必須分成 `mapping_gap`（已有 registry payload 但未映射）與 `integration_gap`（爬蟲有服務但 AIRE 尚未串接），避免把已抓到的資料誤判成需要新 API。

## 4. Verification And Handoff

- [ ] 4.1 `Current Evidence Snapshot`：以 `docs/cop-scrape` 產出一份人工可讀的 API coverage report，供 Fish 決定哪些 API 是必接、可延後或不支援。
- [ ] 4.2 `Relationship To Existing SR`：確認 `moi-api-usage-ledger-and-cost-audit` 的 ledger 欄位可接收本 SR 的 serviceCode、outcome、billable rule 與 charged amount。
- [ ] 4.3 `Spectra / SR consistency gate`：執行 `spectra analyze moi-api-coverage-fallback-cost-map --json` 與 `spectra validate moi-api-coverage-fallback-cost-map`，Critical/Warning 必須為 0。
