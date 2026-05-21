## 1. SR 與契約驗證

- [x] 1.1 驗證 `AIRE subsite public positioning`、`AIRE subsite OPCOS account and license routing`、`AIRE subsite official assets`、`AIRE subsite production smoke coverage`、`OPCOS and AIRE cloud entry boundary` 的 SR 契約一致性；完成時 `spectra analyze aire-opcos-subsite-integration --json` 無 Critical/Warning，`spectra validate aire-opcos-subsite-integration` 通過。

## 2. OPCOS marketing 測試先行

- [x] 2.1 針對 `Decision 2: AIRE 子網站內容必須強調桌面 App 與本機資料邊界` 與 `AIRE subsite public positioning` 補上 copy regression 測試；完成時測試會阻擋泛用 SaaS dashboard 指標、模板 placeholder、錯誤 AI 文案，並要求 AIRE、不動產說明書、桌面 App、本機資料邊界等繁中內容存在。
- [x] 2.2 針對 `Decision 1: AIRE 子網站作為產品入口，OPCOS 作為帳號與授權中台` 與 `AIRE subsite OPCOS account and license routing` 補上 URL/redirect 單元測試；完成時測試證明 CTA 使用 HTTPS `opcos.me` 白名單、保留 AIRE product context，並移除換行、空白與 stale OAuth error query。
- [x] 2.3 針對 `AIRE subsite official assets` 補上 asset routing 測試；完成時測試證明 `aire-icon-dark.png` 與 `aire-icon-light.png` 不會被 locale catch-all 處理，且 production smoke 能直接檢查 HTTP 200。
- [x] 2.4 針對 `Decision 3: 正式站驗收以 production smoke 為完成條件` 與 `AIRE subsite production smoke coverage` 補上 production smoke；完成時 smoke 覆蓋 `https://aire.opcos.me`、`https://opcos.me/products/aire`、官方 icon、CTA URL 與 allowed login redirect。

## 3. OPCOS marketing 實作

- [x] 3.1 實作 `AIRE subsite public positioning`；完成時 `https://aire.opcos.me/` 第一屏顯示 AIRE 官方圖示、AIRE 名稱、繁中不動產說明書桌面 App 定位，且 copy regression 測試通過。
- [x] 3.2 實作 `OPCOS and AIRE cloud entry boundary`；完成時 AIRE 子網站明確說明 OPCOS 管帳號/授權/下載/更新，AIRE 桌面 App 保留案件資料與屋主個資於本機，且 copy regression 測試通過。
- [x] 3.3 實作 `AIRE subsite OPCOS account and license routing`；完成時 AIRE 子網站與 OPCOS AIRE 產品頁的登入、開始使用、授權管理、返回產品網站 CTA 都導向正確 HTTPS URL，且 URL/redirect 測試通過。
- [x] 3.4 實作 `AIRE subsite official assets`；完成時正式站 light/dark AIRE icon 依主題顯示，public asset URL 回 HTTP 200，且 asset routing 測試通過。

## 4. 本機驗證與正式部署

- [x] 4.1 執行 OPCOS marketing 本機驗證；完成時 marketing app 的 unit test、type-check、build 全部通過，且失敗項目若屬無關工作樹污染必須明確列為 out-of-scope 證據。
- [x] 4.2 執行 `Decision 3: 正式站驗收以 production smoke 為完成條件` 的部署；完成時 OPCOS marketing production deployment Ready，`https://aire.opcos.me` alias 指向最新 Ready deployment。
- [x] 4.3 執行 `AIRE subsite production smoke coverage` 的正式站驗收；完成時 production smoke 通過，並以 `curl` 或 Playwright 證明 `https://aire.opcos.me`、icon assets、`https://opcos.me/products/aire` 與登入 redirect 正常。

## 5. 收尾

- [x] 5.1 更新任務勾選並重跑 SR consistency gate；完成時 `spectra analyze aire-opcos-subsite-integration --json` 與 `spectra validate aire-opcos-subsite-integration` 均通過，tasks.md 只勾選已驗證完成的項目。
- [x] 5.2 提交並推送本 SR 與 OPCOS marketing 實作；完成時 AIRE repo 與 OPCOS marketing repo 的相關 commit 均已 push 到正確 branch，且 `git status` 僅剩本輪以外的既有變更。
