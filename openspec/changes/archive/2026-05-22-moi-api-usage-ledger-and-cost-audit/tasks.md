## 1. Ledger And Pricing

- [ ] 1.1 `Decision: Store an append-only local usage ledger before dashboard aggregation` 與 `MOI API attempts are recorded in a usage ledger`：先新增失敗的 Rust/TypeScript 測試，覆蓋成功 row 與 `COP309` 失敗 row；以 targeted test 驗證紅燈。
- [ ] 1.2 `Decision: Store an append-only local usage ledger before dashboard aggregation` 與 `MOI API attempts are recorded in a usage ledger`：實作 append-only usage ledger，不保存屋主、完整地址、PDF 或 raw dossier；以 ledger tests 驗證。
- [ ] 1.3 `Decision: Use a service pricing table separate from call records` 與 `MOI API pricing table exists for audited services`：新增 `MOI_API_005`、`MOI_API_037` 費用表與 cost calculator 測試；以 pricing tests 驗證。
- [ ] 1.4 `Decision: Use a service pricing table separate from call records` 與 `Land registry billing log totals align with MOI usage ledger`：實作費用計算，成功 billable row 累計未付款、`COP309` non-billable failure 不計費但列入失敗次數；以 billing tests 驗證。

## 2. Dashboard And Audit

- [ ] 2.1 `Cost audit dashboard behavior` 與 `Users can audit MOI API usage and cost totals`：先新增 dashboard 測試，覆蓋日期、服務、成功/失敗、歷程編號 filters 與摘要卡；以 UI tests 驗證紅燈。
- [ ] 2.2 `Cost audit dashboard behavior` 與 `Users can audit MOI API usage and cost totals`：實作 dashboard summary cards 與 ledger table，顯示回傳筆數、成功次數、失敗次數、成功/失敗比例、累計未付款；以 UI tests 與手動截圖驗證。
- [ ] 2.3 `Admin can review customer MOI API ledger rows` 與 `Usage ledger behavior`：實作 admin/support ledger view 並確認不顯示屋主、完整地址、PDF、raw dossier payload；以 privacy assertion tests 驗證。

## 3. Verification

- [ ] 3.1 `Verification targets`：用 Fish 2026/05/21 提供的 MOI screenshots 做 manual QA checklist，核對 `MOI_API_005`、`MOI_API_037`、`COP309`、成功/失敗次數、回傳筆數與未付款金額；以 `spectra analyze moi-api-usage-ledger-and-cost-audit --json` 和 `spectra validate moi-api-usage-ledger-and-cost-audit` 驗證 0 Critical/Warning。
