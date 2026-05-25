<!--
Each task description MUST state:
- the behavior or contract being delivered, and
- the verification target that proves completion.
-->

## 1. SR 與交接

- [x] 1.1 建立 SR `desktop-local-address-to-cop-e2e`，明確列出本機 Web、Desktop App、地址 discovery、COP formal pull、費用/cache/error/JSON 與 PDF 的缺口；以 proposal/design/spec/tasks review 驗證。
- [x] 1.2 建立 `docs/handoff/desktop-local-address-to-cop-e2e-handoff.md`，記錄 live probe 結果、斷點、禁止事項與接手順序；以文件審查驗證。
- [x] 1.3 更新 `openspec/SR-ACTIVE-INDEX.md`，將此 SR 排在 `desktop-fullflow-r02-cop-parity` 前，並標示完成前不得打包 App；以 index review 驗證。

## 2. Discovery 狀態與保存

- [ ] 2.1 實作 Requirement: Address discovery records source status 與 decision: split discovery from formal COP pull，定義本機 Web 與 Tauri 共用的 discovery result/status 型別；以 unit test 驗證 COP 回 0、NLSC permission denied、dev fixture、manual-required 都可表達。
- [ ] 2.2 實作 Requirement: Local Web uses safe discovery path 與 decision: local Web gets a safe dev path, not fake success，讓 `localhost:1420` 可保存 discovery attempt，但不得把 mock placeholder 當成功；以 `/cases/new` component test 與 Playwright smoke 驗證。
- [ ] 2.3 實作 decision: every failed external source is product-visible in records，讓 Tauri `land_registry_address_lookup` 保存 COP/NLSC 來源、錯誤與候選；以 Rust integration test 與 query record detail 驗證。

## 3. Confirmed key 與 COP formal pull

- [ ] 3.1 實作 Requirement: Create-case flow SHALL persist registry confirmation state，讓手動或候選確認後的地段/地號/建號保存於 case 與 registry run；以 mock-backend 與 Tauri case tests 驗證。
- [ ] 3.2 實作 Requirement: Formal COP requires confirmed key，禁止 raw address、未確認候選、dev fixture 直接打付費查詢；以 unit/integration test 驗證 `registry_match_required` 且費用 0。
- [ ] 3.3 實作 Requirement: Known registry key can pull COP data，使用已知地政鍵跑 formal pull，保存正式 JSON、api calls 與費用；以 `cop_api_live` 或等效 live smoke 證據驗證。

## 4. 費用、cache、error log 與 PDF

- [ ] 4.1 實作 Requirement: Formal COP runs preserve cost, cache, source, and errors 與 decision: fee guard is part of acceptance，第一次查詢寫費用與 JSON，第二次同 key 查詢 cache hit 且 `totalCostCents=0`；以 integration test 驗證 `sourceRunId`。
- [ ] 4.2 實作 Requirement: Product-visible errors are retained，地址 discovery 與 formal pull 失敗都能在查詢紀錄看到客戶文案與管理明細；以 UI/component test 驗證。
- [ ] 4.3 實作 Requirement: Disclosure generation uses saved formal JSON only，物調與 PDF 使用已保存 formal JSON 或已標示 candidate/manual reference，不在 PDF 產出時重新打付費 COP；以 PDF assembly test 驗證 paid call count 不增加。

## 5. E2E 與收斂

- [ ] 5.1 實作 Requirement: Local address-to-COP E2E gates app packaging 與 decision: app packaging waits，跑 Local Web E2E：`localhost:1420/cases/new` 輸入勝利街地址，不出現 `0001/0001/0001` 假成功；人工確認後可建立案件並保存 confirmed key；以 Playwright artifact 驗證。
- [ ] 5.2 跑 Desktop App E2E：設定 COP 憑證、地址 discovery 失敗可保存診斷、人工確認後 formal COP 成功、cache hit 成功、PDF 使用保存資料；以 macOS app smoke report 驗證。
- [ ] 5.3 跑 Spectra consistency gate：`spectra analyze desktop-local-address-to-cop-e2e --json` 與 `spectra validate desktop-local-address-to-cop-e2e` 通過。
- [ ] 5.4 完成後更新 release acceptance checklist/report，明確列出本 SR 證據；以文件審查與乾淨 git status 驗證。
