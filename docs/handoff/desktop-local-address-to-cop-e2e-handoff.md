# AIRE Desktop Local Address-to-COP E2E Handoff

## 目標

把 AIRE 修到 Fish 可以先驗收本機 Web，再壓 Desktop App：

```text
地址輸入
  -> 地址 discovery 取得地段/地號/建號候選或明確失敗
  -> 保存 discovery run / candidate / error
  -> 使用者確認地政鍵
  -> COP formal pull
  -> 保存 JSON / 費用 / cache / sourceRunId / error log
  -> 物調與 PDF 使用保存資料，不重新打付費查詢
```

完成前不要做 App packaging acceptance、Windows acceptance 或 auto-update。

## 目前實測結論

Branch: `feat/desktop-fullflow-r02-cop-parity-clean-v2`

最近相關 commit:

- `d03ea6b1 fix(settings): route land registry test through local bridge`

已通：

- `cargo test --manifest-path src-tauri/Cargo.toml --test cop_api_live -- --ignored --nocapture`
- 結果：已知地政鍵可打 COP formal pull。
- 證據：`/tmp/criterion2-cop-live.json`
- 摘要：5/5 formal services succeeded，總費用 50 元。

已失敗或未打通：

- 本機 Web `localhost:1420` 非 Tauri，`addressLookup()` 目前直接拒絕，不會做真實地址 discovery。
- COP `/BuildingNo/1.0/QueryByAddress` 對裕農路 live probe 回 `address_to_parcel count=0`。
- NLSC/便民 `AddressQueryLand` 對勝利街與裕農路從此環境回 `PERMISSION DENIED`。
- 地址 discovery 與 formal COP pull 沒有串成單一可驗收產品流程。

## 問題清單

1. `/cases/new` 查不到地段、地號、建號。
2. App/Tauri 查詢也可能因 COP 地址查詢回 0、NLSC permission denied 而查不到。
3. 已知地政鍵 formal COP 可用，但使用者不會一開始就知道地政鍵。
4. discovery failure 沒有完整產品化保存為 query record。
5. 本機 Web 若完全不查，Fish 無法先本機驗收。
6. 若直接壓 App，會把同樣斷點帶到 App。
7. 多次 live COP 測試會產生費用，必須加 cache 和費用 guard。
8. 物調/PDF 必須讀保存 JSON，不可在文件產出時重新打 COP。

## 禁止事項

- 不准把 mock `0001/0001/0001` 當成功。
- 不准 raw address 直接打 formal COP。
- 不准未確認地段/地號/建號就付費查詢。
- 不准 PDF 產出時重新打 paid COP。
- 不准完成此 SR 前開始 auto-update。
- 不准用 build green 代替 E2E 驗收。

## 新 SR

Change id: `desktop-local-address-to-cop-e2e`

建議先讀：

- `openspec/changes/desktop-local-address-to-cop-e2e/proposal.md`
- `openspec/changes/desktop-local-address-to-cop-e2e/design.md`
- `openspec/changes/desktop-local-address-to-cop-e2e/tasks.md`

## 實作順序

1. 定義 discovery result/status 型別。
2. 讓 local Web 可以保存 safe discovery attempt，不假成功。
3. 讓 Tauri discovery 保存 COP/NLSC 診斷。
4. 保存 confirmed registry match。
5. formal COP 僅吃 confirmed key。
6. 實作 billing/cache/error/sourceRunId。
7. PDF/物調只讀 saved JSON。
8. 跑 local Web E2E。
9. 跑 Desktop App E2E。
10. 再回 Desktop fullflow release acceptance。

## 驗收指令與證據

最低驗收：

```bash
pnpm type-check
pnpm test
pnpm playwright test e2e/<local-address-to-cop-smoke>.spec.ts
cargo test --manifest-path src-tauri/Cargo.toml land_registry
cargo test --manifest-path src-tauri/Cargo.toml --test cop_api_live -- --ignored --nocapture
spectra analyze desktop-local-address-to-cop-e2e --json
spectra validate desktop-local-address-to-cop-e2e
```

必要證據：

- Local Web smoke 截圖或 Playwright artifact。
- COP live JSON。
- discovery failure JSON。
- formal query JSON。
- billing rows。
- cache hit run with `sourceRunId`。
- error log。
- PDF artifact。

## 給下一個 Agent 的重點

這不是 UI 問題，是資料流沒有打通。請不要先改視覺，也不要先打包 App。先把外部 discovery 失敗、人工確認、formal pull 成功、費用與保存 JSON 全部做成可觀測、可重跑、可驗收的流程。
