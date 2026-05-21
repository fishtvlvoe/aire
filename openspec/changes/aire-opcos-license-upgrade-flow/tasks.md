## 1. OPCOS 資料模型與升級申請 TDD

- [x] 1.1 `Decision: Use OPCOS database as upgrade request source of truth` 與 `User upgrade request behavior`：先新增 OPCOS 測試，證明 `Authenticated users can request AIRE upgrade` 會建立 `PENDING` request、重複申請會回同一筆、已有 active license 會回 `FULFILLED`；以 `pnpm --filter api test` 或對應 vitest 指令驗證紅燈。
- [x] 1.2 `Decision: Use OPCOS database as upgrade request source of truth` 與 `User upgrade request behavior`：實作 Prisma enum/model/migration 與升級申請 API/procedure，讓 `Authenticated users can request AIRE upgrade` 全部測試轉綠；以 `pnpm --filter database generate` 與升級申請測試驗證。
- [x] 1.3 `AIRE product page displays upgrade request state` 與 `User upgrade request behavior`：先新增 OPCOS AIRE product page 測試，覆蓋尚未申請、審核中、已開通、已拒絕四種 UI 狀態與下載連結 gate；以相關 page/component test 驗證紅燈。
- [x] 1.4 `AIRE product page displays upgrade request state` 與 `User upgrade request behavior`：實作 `/products/aire` 後端讀取與送出申請的 UI flow，未授權不顯示 installer direct link，已授權才顯示 masked key 與下載；以 product page 測試與手動登入頁面檢查驗證。

## 2. OPCOS Admin Fulfillment TDD

- [x] 2.1 `Admin can list pending AIRE upgrade requests` 與 `Admin fulfillment behavior`：先新增 admin request list 測試，證明 admin 可看到 pending rows、非 admin 被拒絕；以 admin API/component 測試驗證紅燈。
- [x] 2.2 `Admin can list pending AIRE upgrade requests` 與 `Admin fulfillment behavior`：實作 admin list API/procedure 與 license 後台 pending request 區塊，顯示 email、organization、plan、requestedAt 與 actions；以 admin list 測試與 UI 手動檢查驗證。
- [x] 2.3 `Admin approval fulfills AIRE upgrade request`、`Decision: Fulfillment creates a real License, not a temporary flag` 與 `Admin fulfillment behavior`：先新增 approve/reject transaction 測試，覆蓋核發 license、拒絕不建立 license、重複核發回 409；以 fulfillment 測試驗證紅燈。
- [x] 2.4 `Admin approval fulfills AIRE upgrade request`、`Decision: Fulfillment creates a real License, not a temporary flag` 與 `Admin fulfillment behavior`：實作 approve/reject API/procedure 與 admin actions，核發後 request 連到 real `License`；以 fulfillment 測試與 license list 回讀驗證。

## 3. License API 與 AIRE Desktop Contract

- [x] 3.1 `Decision: License API accepts production desktop payload and returns desktop-compatible status`、`License api contract` 與 `OPCOS production license API compatibility`：先新增 OPCOS license API 測試，覆蓋 snake_case alias、IP derivation、invalid_key、quota_exhausted、device_mismatch、ip_blocked；以 route/API tests 驗證紅燈。
- [x] 3.2 `Decision: License API accepts production desktop payload and returns desktop-compatible status`、`License api contract` 與 `OPCOS production license API compatibility`：實作 activate/verify API canonical camelCase + desktop alias + lowercase error contract，成功回應含 AIRE desktop 可持久化欄位；以 license API 測試驗證。
- [x] 3.3 `Decision: Production license base URL is `https://opcos.me`` 與 `OPCOS API base URL points to production server in release build`：先新增 AIRE Rust 測試，證明 release/default base URL 是 `https://opcos.me` 且 dev override 生效；以 `cargo test opcos` 驗證紅燈。
- [x] 3.4 `Decision: Production license base URL is `https://opcos.me``、`License activation flow`、`AIRE desktop behavior` 與 `OPCOS production license API compatibility`：更新 `src-tauri/src/opcos.rs` 與 license IPC mapping，AIRE desktop 送出 production-compatible payload、解析 token/status/error 且不傳案件資料；以 Rust tests 與 TypeScript/Rust payload 檢查驗證。

## 4. AIRE 升級入口與整合驗證

- [x] 4.1 `Decision: AIRE settings upgrade CTA opens OPCOS product management` 與 `Premium unlock section display`：先新增/更新 AIRE frontend 測試，證明未訂閱非 admin 顯示 `前往升級` 並開啟 `https://opcos.me/products/aire?intent=request-access`；以 vitest 驗證紅燈。
- [x] 4.2 `Decision: AIRE settings upgrade CTA opens OPCOS product management` 與 `Premium unlock section display`：實作 AIRE settings CTA 與 mock backend 回傳升級入口 URL，admin unlocked 與 subscribed 狀態保持原行為；以 AIRE frontend 測試驗證。
- [x] 4.3 `Verification targets`：執行整合驗證，跑 OPCOS 測試/type-check、AIRE license client/frontend 測試、`spectra analyze aire-opcos-license-upgrade-flow --json`、`spectra validate aire-opcos-license-upgrade-flow`，確認 Critical/Warning 為 0。

## 5. Review 與部署

- [x] 5.1 Review：針對 OPCOS schema/API/admin UI、AIRE desktop client/settings CTA 做多檔 review，確認沒有上傳案件資料、沒有跳過授權 gate、沒有付款假流程；以 review notes 或修正 commit 驗證。
- [ ] 5.2 Deployment：分別提交並 push AIRE SR/desktop 變更與 OPCOS backend/admin 變更，部署 OPCOS production，使用 curl/Playwright smoke 驗證登入 gate、invalid license error、admin grant 後 activate/verify 成功。
