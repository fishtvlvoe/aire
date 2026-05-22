## 1. SR setup and acceptance target

- [x] 1.1 Create SR `full-product-flow-ia-ux-acceptance` and record the user-reported duplicate workflow, fake-control, and address misclassification issues.
- [x] 1.2 Run `spectra analyze full-product-flow-ia-ux-acceptance --json` and `spectra validate full-product-flow-ia-ux-acceptance`; fix Critical and Warning findings.

## 2. Navigation and page-scope cleanup

- [x] 2.1 Cover Requirement: Customer workflow sidebar navigation and Requirement: Customer navigation SHALL expose each workflow once. Update product navigation so `新增案件` is the only create-object entry, `地政查詢` is removed from customer sidebar, and each secondary item has a unique workflow scope. This implements the design topic 左側選單.
- [x] 2.2 Cover Requirement: Settings section scope and Requirement: Customer pages SHALL render only their own scope. Remove page-internal settings category duplication; settings section content SHALL rely on the left sidebar as the navigation source. This implements the design topic 頁內內容.
- [x] 2.3 Cover Requirement: Settings section scope. Ensure `功能開關` renders exactly one feature toggle list and does not include 授權管理、MCP Hub, or Super Admin.
- [x] 2.4 Cover Requirement: Workbench SHALL not show fake executable controls. Remove or demote backend-incomplete workbench buttons so `重新查詢` and `產生補件清單` do not appear as active customer controls until wired.

## 3. Address and registry classification

- [x] 3.1 Cover Requirement: Address-to-property classification fallback. Add tests for normal building addresses, including `台南市永康區勝利街58巷4號1樓`, to ensure fallback displays `建物`, not `農地` or `農舍`.
- [x] 3.2 Cover Requirement: Create case flow and Requirement: Create-case flow SHALL be address-first and guarded. Verify create-case flow blocks creation before `判斷地政資料` and routes successful creation to the case workbench.

## 4. Full-flow automated acceptance

- [x] 4.1 Cover Requirement: Full product flow SHALL have automated acceptance coverage. Add E2E that clicks through 新增案件、案件總覽、說明書工作台、補件清單、資料來源、費用紀錄、PDF 預覽、列印與匯出、地政授權、功能開關、授權與升級.
- [x] 4.2 Cover Requirement: Customer pages SHALL render only their own scope. In E2E, assert each page has unique heading/content and does not show duplicate same-scope controls.
- [x] 4.3 Run targeted unit tests, `pnpm type-check`, `pnpm build`, and full-flow E2E.

## 5. Handoff

- [x] 5.1 Commit and push only files related to this SR; leave unrelated existing dirty files untouched.
- [x] 5.2 Report exact remaining backend gaps separately from UI/IA fixes so Fish can do manual acceptance without false claims.
