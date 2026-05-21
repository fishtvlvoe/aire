## 1. Catalog And Coverage

- [ ] 1.1 `Decision: Treat catalog and integration as separate layers` 與 `MOI service catalog is available from scraped COP data`：先新增測試或快照驗證，確認 catalog 能讀取 63 筆服務、`MOI_API_001` 到 `MOI_API_046`、WFS/WMS 與價格描述。
- [ ] 1.2 `Decision: Treat catalog and integration as separate layers` 與 `MOI service catalog is available from scraped COP data`：實作或整理 service catalog source，不以 endpoint wrapper 硬編碼價格為唯一依據。
- [ ] 1.3 `Decision: Coverage matrix drives implementation priority` 與 `AIRE maintains a MOI API coverage matrix`：建立 coverage matrix，欄位至少包含 serviceCode、serviceName、officialPrice、eligibility、currentAireApiId、workflowNeed、priority、fallbackRole、status。
- [ ] 1.4 `Decision: Coverage matrix drives implementation priority` 與 `AIRE maintains a MOI API coverage matrix`：將現有 AIRE endpoints 對照到官方服務碼，標出已串、缺漏、免費可補、限制不可用與待決策項目。

## 2. Success Classifier And Cost Policy

- [ ] 2.1 `Decision: Success classifier must be domain-level` 與 `MOI API outcome classifier distinguishes transport, domain, empty, and restricted failures`：先新增測試覆蓋 HTTP 2xx + `STATUS=1`、HTTP 2xx + `STATUS=0/COP309`、`RETURNROWS=0`、payload null、parse failure。
- [ ] 2.2 `Decision: Success classifier must be domain-level` 與 `MOI API outcome classifier distinguishes transport, domain, empty, and restricted failures`：實作共用 outcome classifier，避免每個 endpoint 各自猜成功/失敗。
- [ ] 2.3 `Decision: Cost policy must be explicit per service and outcome` 與 `MOI cost policy calculates billable amounts from catalog rules`：先新增 cost policy tests，覆蓋 `MOI_API_005` 單筆 1 元、`MOI_API_007` 依地段 10 元、免費 API、`COP309` 失敗預設不計費。
- [ ] 2.4 `Decision: Cost policy must be explicit per service and outcome` 與 `MOI cost policy calculates billable amounts from catalog rules`：實作 catalog-driven cost policy，取代 `DEFAULT_UNIT_COST = 10` 與 endpoint wrapper 固定 `unit_cost: 10.0` 的決策來源。

## 3. Fallback And Integration Decisions

- [ ] 3.1 `Decision: Coverage matrix drives implementation priority` 與 `AIRE required disclosure workflows map to required and fallback MOI services`：盤點揭露書/案件流程欄位，將每個欄位映射到 primary API、fallback API 或人工補件。
- [ ] 3.2 `Decision: Coverage matrix drives implementation priority` 與 `AIRE required disclosure workflows map to required and fallback MOI services`：標出第一批必接服務，至少包含目前已用於土地/建物標示、所有權、他項權利、門牌查建號、帳務查詢與免費補充資料的候選 API。
- [ ] 3.3 `Decision: Success classifier must be domain-level` 與 `AIRE fallback policy handles unavailable or no-data MOI responses`：定義 `COP309`、不可查縣市、無資料、憑證不足、政府限定服務的 UI/後端 fallback 行為。

## 4. Verification And Handoff

- [ ] 4.1 `Current Evidence Snapshot`：以 `docs/cop-scrape` 產出一份人工可讀的 API coverage report，供 Fish 決定哪些 API 是必接、可延後或不支援。
- [ ] 4.2 `Relationship To Existing SR`：確認 `moi-api-usage-ledger-and-cost-audit` 的 ledger 欄位可接收本 SR 的 serviceCode、outcome、billable rule 與 charged amount。
- [ ] 4.3 `Spectra / SR consistency gate`：執行 `spectra analyze moi-api-coverage-fallback-cost-map --json` 與 `spectra validate moi-api-coverage-fallback-cost-map`，Critical/Warning 必須為 0。
