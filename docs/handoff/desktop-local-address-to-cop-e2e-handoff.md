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

- 本機 Web `localhost:1420` 目前只命中 dev fixture/mock-backend，沒有真正的 localhost discovery proxy；因此只有裕農路 fixture 會出現候選，勝利街、新竹地址會進人工補填。
- COP `/BuildingNo/1.0/QueryByAddress` 對裕農路 live probe 回 `address_to_parcel count=0`。
- NLSC/便民 `AddressQueryLand` 對勝利街與裕農路從此環境回 `PERMISSION DENIED`。
- 地址 discovery 與 formal COP pull 沒有串成單一可驗收產品流程。

## 問題清單

1. `/cases/new` 查不到地段、地號、建號。
2. App/Tauri 查詢也可能因 COP 地址查詢回 0、NLSC permission denied 而查不到。
3. 已知地政鍵 formal COP 可用，但使用者不會一開始就知道地政鍵。
4. discovery failure 沒有完整產品化保存為 query record。
5. 本機 Web 若完全不查，Fish 無法先本機驗收。
6. 本機 Web 不能讓 browser 直接打便民/NLSC/COP；必須補 same-origin localhost proxy，由本機後端做代理、保存診斷、避免憑證外洩。
7. 若直接壓 App，會把同樣斷點帶到 App。
8. 多次 live COP 測試會產生費用，必須加 cache 和費用 guard。
9. 物調/PDF 必須讀保存 JSON，不可在文件產出時重新打 COP。

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
2. 新增 local Web same-origin discovery proxy：browser 只打 localhost API，不直接打便民/NLSC/COP。
3. 讓 local Web 可以保存 safe discovery attempt，不假成功。
4. 讓 Tauri discovery 保存 COP/NLSC 診斷。
5. 保存 confirmed registry match。
6. formal COP 僅吃 confirmed key。
7. 實作 billing/cache/error/sourceRunId。
8. PDF/物調只讀 saved JSON。
9. 跑 local Web E2E。
10. 跑 Desktop App E2E。
11. 再回 Desktop fullflow release acceptance。

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

Fish 追問「本機 Web 不能用便民服務嗎？」的結論：可以，但不能由 browser 直接打便民服務。必須補一層 localhost discovery proxy：

```text
localhost:1420 /cases/new
  -> /api/local/address-discovery
  -> server-side local proxy
  -> COP address adapter / public cadastral adapter / dev fixture
  -> DiscoveryResult
  -> query run diagnostics
```

若沒有 proxy，local Web 只能吃 fixture，所以目前「只有裕農路查得到」是設計未完成，不是 Fish 操作錯。

## 2026-05-25 WIP 補充：未提交程式改動

注意：以下是 Codex 在被 Fish 糾正分工前誤開始的 WIP，尚未 commit，不能視為已完成實作，也不要直接當成產品行為。若另一個 Agent 要規劃，請只把它當成可能的技術方向與風險清單。

目前未提交程式檔：

- `src/lib/land-registry-api.ts`
- `src/lib/mock-backend.ts`
- `src/app/(dashboard)/cases/new/page.tsx`
- `src/app/(dashboard)/cases/new/__tests__/new-case-page.test.tsx`
- `src/lib/__tests__/land-registry-api.test.ts`
- `src/lib/__tests__/mock-backend.test.ts`

WIP 嘗試方向：

1. `addressLookup()` 在 development browser mode 不再直接丟 `NotInTauriError`，而是走 local mock backend 的 `land_registry_address_lookup`。
2. production browser mode 仍拒絕，不回到泛用 mock 假成功。
3. `mock-backend` 把裕農路候選標成 `dev_fixture` 且 `trusted_for_pdf=false`。
4. `mock-backend` 對勝利街回 `manual_required`，保存 `address_discovery_unavailable`，不塞 `0001/0001/0001`。
5. `confirm_case_registry_match` WIP 嘗試把 confirmed key 回寫到 case `land_registry_data`。
6. `land_registry_formal_pull_data` WIP 嘗試把 formal pull JSON、run id、confirmed key 回寫到 case `land_registry_data`。

已跑過的窄測試：

```bash
pnpm vitest run src/lib/__tests__/land-registry-api.test.ts src/app/'(dashboard)'/cases/new/__tests__/new-case-page.test.tsx src/lib/__tests__/mock-backend.test.ts
pnpm type-check
```

當時結果：上述 targeted vitest 與 type-check 通過。但這不是 E2E 完成證據，因為：

- 未完成 local Web Playwright smoke。
- 未完成 Desktop App/Tauri E2E。
- 未完成真實 COP formal pull 回寫到 SQLite 的驗證。
- 未完成 PDF 不重打 paid COP 的端到端證據。
- 未完成 Windows/macOS App 驗收。

WIP 主要風險：

- `dev_fixture` 是否應被前端視為 trusted candidate 需要重新設計；目前 WIP 讓它能自動帶欄位，但 `trusted_for_pdf=false`，兩者語意可能衝突。
- 勝利街測試用 `勝利段 / 1043-0002 / 00000000` 只是人工確認流程測試值，不可視為真實建號。
- browser development 直接走 mock backend 有助本機驗收，但必須與 production browser refusal 清楚分離。
- Tauri/Rust 端尚未同步同一 discovery result shape，不能只修 TypeScript mock。

建議下一個 Agent 先做：

1. 決定 discovery result 的正式 TypeScript/Rust schema。
2. 決定 `dev_fixture` 與 `trusted_for_pdf` 的語意，不要讓「可供本機 E2E」被誤解成「正式謄本可信」。
3. 把 WIP 拆成 TDD 小步，不要一次接受所有改動。
4. 如果要清掉 WIP，先保存 patch：`git diff > /tmp/aire-local-address-to-cop-wip.patch`。

## WIP 逐檔處置裁定（2026-05-25 規劃）

patch 已備份 `/tmp/aire-local-address-to-cop-wip.patch`（699 行）。決策依據見 design.md Decisions 段。

| 檔案 | 裁定 | 動作 |
| --- | --- | --- |
| `src/lib/mock-backend.ts` | 保留全部 | 裕農路 dev_fixture、勝利街 manual_required、formal pull write-back、persistState 對齊 design |
| `src/lib/__tests__/mock-backend.test.ts` | 保留全部 | 三測試直接驗 contract |
| `src/lib/__tests__/land-registry-api.test.ts` | 保留全部 | dev/production env 分支；Wave 2.2 順帶把 guard 改 `=== "development"` 並更新此測試 |
| `src/lib/land-registry-api.ts` | 部分保留 | 保留 `dev_fixture` union + dev bypass；補 DiscoveryResult 型別、guard 收緊 |
| `src/app/(dashboard)/cases/new/page.tsx` | 還原並改正 | 移除「dev_fixture 加進 trusted」那行；改讀 `trusted_for_pdf === true`（task 0.1） |
| `src/app/(dashboard)/cases/new/__tests__/new-case-page.test.tsx` | 部分保留 | 還原 A 段（驗 dev_fixture 不可信）；保留 B 段勝利街 manual 測試（task 0.2） |

## E2E 驗收劇本

### 劇本 A — Local Web（`localhost:1420`，dev mode 走 mock-backend，task 5.1）
1. 開 `/cases/new`，輸入 `台南市永康區勝利街58巷4號`。
2. 斷言：不出現 `0001/0001/0001` 假成功；顯示 manual 補填欄位（段/地號/建號空白）。
3. 人工填入測試值 `勝利段 / 1043-0002 / 00000000` → 建立案件。
4. 斷言：case 保存 `confirmed_registry_match`；查詢紀錄有 discovery run（manual_required, cost=0）。
5. 留 Playwright artifact（截圖 + trace）。

### 劇本 B — Desktop App（Tauri，真打 COP，task 5.2）
1. 系統設定填客戶 COP 憑證。
2. 地址 discovery 失敗 → 查詢紀錄保存 diagnostics（COP no_match / NLSC denied）。
3. 人工確認已知鍵 `BA-0001-00020000`（測試鍵）→ formal COP pull 成功 → 保存 JSON + billing rows。
4. 同鍵再 pull → cache hit，cost=0，sourceRunId 指向原 run。
5. 產 PDF → billing 筆數不變。
6. 留：formal JSON、billing rows、cache hit run、error log、PDF artifact、macOS smoke report。

## 費用守則（避免燒 COP 費）

- live 測試一律 cache-first：先確認 `registry_query_runs` 有可重用 run 才不重打。
- live 測試只用已知鍵 `BA-0001-00020000`（已證實 5 service / 50 cents）。
- 任何 `--ignored` live test 預設不在 CI 跑，手動跑並留 JSON 證據。
- discovery 永遠 `total_cost_cents=0`，出現非 0 即為 bug。
