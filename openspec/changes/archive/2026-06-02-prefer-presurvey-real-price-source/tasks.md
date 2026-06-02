## 1. SR / Spec

- [x] 1.1 建立新 SR `prefer-presurvey-real-price-source`，說明 PDF 實價登錄資料來源邊界。驗證：proposal / design / spec / tasks 存在。
- [x] 1.2 新增 spec：對應 Requirement `PDF real price data SHALL come from saved pre-survey records` 與 `Creation-time pre-survey SHALL save obtained real-price records`，PDF SHALL use saved pre-survey real-price records and SHALL NOT query live real-price providers during preview/export。驗證：`spectra validate prefer-presurvey-real-price-source` 通過。

## 2. Tests

- [x] 2.1 對應 Requirement `PDF real price data SHALL come from saved pre-survey records`：補紅燈測試，已保存 `real_price_query` 時，`assembleDossierData` 產生 transaction history，且不呼叫 `queryRealPrice`。
- [x] 2.2 對應 Requirement `PDF real price data SHALL come from saved pre-survey records`：補紅燈測試，沒有保存 `real_price_query` 時，`assembleDossierData` 仍完成，且不呼叫 `queryRealPrice`。

## 3. Implementation

- [x] 3.1 移除 PDF 組裝階段的 live `queryRealPrice` fallback，只使用 persisted pre-survey records。
- [x] 3.2 對應 Requirement `Creation-time pre-survey SHALL save obtained real-price records`：確認 `/cases/new` 保存 provenance 的 `real_price_query` 結構仍可被 PDF 讀取。

## 4. Verification

- [x] 4.1 跑 focused tests：`pnpm exec vitest run src/lib/pdf-engine/__tests__/assemble-dossier-data.test.ts src/lib/__tests__/real-price-query.test.ts --reporter=dot`。
- [x] 4.2 跑 Spectra：`spectra analyze prefer-presurvey-real-price-source --json` 與 `spectra validate prefer-presurvey-real-price-source`。
