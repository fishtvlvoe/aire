## 1. SR and validation

- [x] 1.1 Create SR `fix-case-list-destinations-and-workbench-actions` for case-row routing, workbench fake controls, and land-registry billing line items.
- [x] 1.2 Run `spectra analyze fix-case-list-destinations-and-workbench-actions --json` and `spectra validate fix-case-list-destinations-and-workbench-actions`; fix Critical and Warning findings.

## 2. Case list routing

- [x] 2.1 Cover Requirement: Case row destinations SHALL preserve selected workflow scope / Design: 案件列目的地. Update `/cases` row destination logic so supplements, PDF preview, and export views preserve their selected workflow.
- [x] 2.2 Cover Requirement: Case row destinations SHALL preserve selected workflow scope. Add/update unit and E2E coverage for row destinations.

## 3. Workbench controls

- [x] 3.1 Cover Requirement: Case workbench controls SHALL be executable or clearly read-only / Design: 工作台 tabs. Make workbench tabs actually switch scoped content.
- [x] 3.2 Cover Requirement: Case workbench controls SHALL be executable or clearly read-only / Design: 假按鈕處理. Convert backend-pending actions to read-only status and make local supplement actions show feedback.
- [x] 3.3 Cover Requirement: Case workbench controls SHALL be executable or clearly read-only. Add/update component tests for tab switching and action feedback.

## 4. Land-registry billing

- [x] 4.1 Cover Requirement: Billing log SHALL expose customer-visible line items / Design: 費用紀錄. Expose billing log line items from Rust IPC and browser mock backend.
- [x] 4.2 Cover Requirement: Billing log SHALL expose customer-visible line items / Design: 費用紀錄. Update fee page to show line-item table, success/failure amounts, total, and AIRE-plan separation.
- [x] 4.3 Cover Requirement: Billing log SHALL expose customer-visible line items. Add/update tests for billing line items.

## 5. PDF asset supplement entry

- [x] 5.1 Cover Requirement: Data source page SHALL provide PDF asset supplement slots / Design: PDF 圖資補件入口. Add PDF asset upload slots for 地籍圖、空拍圖、格局圖、地標圖 on 資料來源.
- [x] 5.2 Cover Requirement: Data source page SHALL provide PDF asset supplement slots. Add/update tests for PDF asset upload slots.

## 6. Verification and handoff

- [x] 6.1 Run targeted tests, type-check, build, E2E, Spectra analyze, and Spectra validate.
- [x] 6.2 Commit and push only this SR's files and related implementation changes.
