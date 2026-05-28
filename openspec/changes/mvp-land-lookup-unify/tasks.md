## 1. 盤點與契約定型

- [x] 1.1 盤點 registry-discovery-contract.ts 封存版本（commit de45aebe）完成度，定義統一的 DiscoveryResult／ParcelInfo 契約型別作為單一事實來源（對應決策 1：以 registry-discovery-contract 作為統一查詢契約）。完成標準：契約型別可被 Web 與 Rust 兩端引用、型別檢查通過。驗證：`pnpm tsc --noEmit` 通過，缺口盤點筆記寫入 change 目錄。

## 2. TDD 紅燈測試（先寫，預期全紅）

- [ ] 2.1 [P] 撰寫契約一致性紅燈測試，覆蓋 requirement「Web and Desktop SHALL share a unified discovery contract」：同一組合成地址經 Web proxy 與 App IPC `land_registry_address_lookup` 回傳一致 ParcelInfo（parcel_id／lot_number／building_number 相符）。完成標準：測試存在且現為紅燈。驗證：`pnpm vitest run` 顯示該測試 fail。
- [ ] 2.2 [P] 撰寫 manual_required 紅燈測試（對應決策 2：維持探查（EasyMap）與拉謄本（COP）雙路徑拆分）：查無覆蓋時回傳 status=manual_required 與空 candidates，不拋錯。完成標準：測試存在且紅燈。驗證：`pnpm vitest run` 該測試 fail。
- [ ] 2.3 [P] 撰寫 proxy 約束紅燈測試（對應決策 3：本機 Web 經 same-origin localhost proxy 查詢）：瀏覽器層不得直連 EasyMap／COP 外部端點。完成標準：測試存在且紅燈。驗證：`pnpm vitest run` 或 e2e 該測試 fail。
- [ ] 2.4 [P] 撰寫跨 runtime 一致性紅燈測試，覆蓋 requirement「Address-to-parcel results SHALL be consistent across runtimes」：同一地址 Web 與 App 回傳的 ParcelInfo 清單筆數與欄位值相同。完成標準：測試存在且紅燈。驗證：`pnpm vitest run` 該測試 fail。

## 3. 合一實作（轉綠）

- [ ] 3.1 [P] 將本機 Web route POST `/api/local/address-discovery` 改為經 registry-discovery-contract 解析並回傳統一 DiscoveryResult，移除分叉查詢邏輯。完成標準：2.1／2.4 契約一致性測試轉綠。驗證：`pnpm vitest run` 對應測試 pass。
- [ ] 3.2 [P] 將桌面 App IPC `land_registry_address_lookup`（src-tauri/src/land_registry/）對齊同一 DiscoveryResult 契約形狀回傳。完成標準：2.1 跨 runtime 一致性測試對 App 端轉綠。驗證：`cargo test` 相關測試 + 契約測試 pass。

## 4. 修復查不到（根因定位）

- [x] 4.1 以契約一致性測試定位本機 Web 查不到地段建號地號的斷點並修復銜接（對應決策 4：以契約一致性測試定位查不到根因，禁止盲目還原 route.ts）；明確區分 EasyMap 無覆蓋（manual_required）與銜接斷裂（error）。完成標準：本機 Web 對已知可查地址回傳非空 ParcelInfo。驗證：dev server 操作截圖佐證，且 2.2 manual_required 測試 pass。
- [x] 4.2 查證並對齊 EasyMap／COP endpoint 設定，確認產品 context 的 cop.land.moi.gov.tw 與程式碼現值（cop.moi.gov.tw／easymap.moi.gov.tw）何者正確並統一。完成標準：查詢打到正確 endpoint 並回傳有效資料。驗證：對已知可查地址查詢回傳非空結果。

## 5. 驗收

- [ ] 5.1 全部契約／manual_required／proxy 約束測試轉綠，且本機 Web 對已知可查地址手動驗證查得到地段建號地號。完成標準：測試全綠且截圖佐證。驗證：`pnpm vitest run` 全綠，dev server 截圖存入 artifacts/。
