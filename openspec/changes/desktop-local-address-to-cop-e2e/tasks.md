<!--
Each task description MUST state:
- the behavior or contract being delivered, and
- the verification target that proves completion.
子項（縮排）補實作細節：要動的檔案、新建的 command、TDD 紅燈測試名、驗收證據。
執行者：Codex 寫程式；主對話做 code review 與整合。先紅燈再實作。
-->

## 0. WIP 收斂（前置，先做）

WIP patch 已備份 `/tmp/aire-local-address-to-cop-wip.patch`。逐檔處置見 handoff「WIP 逐檔處置裁定」。本組只做必要還原/改正，其餘保留檔隨對應 Wave 一起 commit。

- [ ] 0.1 還原 `cases/new/page.tsx` 把 `dev_fixture` 加進 trusted 的那行，並把 `isTrustedAddressLookupParcel()` 改讀 `parcel.trusted_for_pdf === true`（唯一可信判準，不靠 source 字串）；以 vitest + type-check 驗證。
  - 檔案：`src/app/(dashboard)/cases/new/page.tsx`
  - 紅燈：`dev_fixture candidate is NOT treated as trusted`（改正前 dev_fixture 被當 trusted → 斷言失敗）
  - 依 design.md decision: dev_fixture vs trusted_for_pdf semantics
  - 證據：`pnpm vitest run` 該檔綠 + `pnpm type-check` 綠
- [ ] 0.2 修正 `new-case-page.test.tsx` A 段（裕農路 mock 改 dev_fixture 觸發 trusted 的部分）改成驗證 dev_fixture 不可信；保留 B 段「勝利街 manual 補填流程」測試；以 vitest 驗證。
  - 檔案：`src/app/(dashboard)/cases/new/__tests__/new-case-page.test.tsx`

## 1. SR 與交接

- [x] 1.1 建立 SR `desktop-local-address-to-cop-e2e`，明確列出本機 Web、Desktop App、地址 discovery、COP formal pull、費用/cache/error/JSON 與 PDF 的缺口；以 proposal/design/spec/tasks review 驗證。
- [x] 1.2 建立 `docs/handoff/desktop-local-address-to-cop-e2e-handoff.md`，記錄 live probe 結果、斷點、禁止事項與接手順序；以文件審查驗證。
- [x] 1.3 更新 `openspec/SR-ACTIVE-INDEX.md`，將此 SR 排在 `desktop-fullflow-r02-cop-parity` 前，並標示完成前不得打包 App；以 index review 驗證。

## 2. Discovery 狀態與保存

- [ ] 2.1 實作 Requirement: Address discovery records source status 與 decision: split discovery from formal COP pull，定義本機 Web 與 Tauri 共用的 discovery result/status 型別；以 unit test 驗證 COP 回 0、NLSC permission denied、dev fixture、manual-required 都可表達。
  - 檔案：`src/lib/land-registry-api.ts`（TS `DiscoveryResult` 等型別）、`src-tauri/src/land_registry/discovery.rs`（Rust struct，serde camelCase）
  - schema：見 design.md「Decision: Discovery result schema (TS + Rust)」
  - 漸進：新增 Rust `land_registry_address_discover() -> DiscoveryResult` 包既有 lookup，不破壞 `land_registry_address_lookup` 簽名
  - 紅燈：`discovery_cop_zero_manual_required`、`discovery_nlsc_denied_manual_required`、`discovery_dev_fixture_untrusted`、`discovery_generic_mock_kept_blank`
- [ ] 2.2 實作 Requirement: Local Web SHALL use a localhost discovery proxy 與 decision: Local Web gets a localhost discovery proxy, not direct browser scraping，新增 same-origin local discovery route，讓 `localhost:1420` 的 browser 只呼叫本機 API，不直接打 COP/NLSC/便民外部服務；以 server unit test 與 component test 驗證。
  - 檔案：`src/app/api/local/address-discovery/route.ts`、`src/lib/server/local-address-discovery-proxy.ts`、`src/lib/land-registry-api.ts`
  - 行為：development/local preview 啟用；production browser 回 `local_proxy_unavailable`；Tauri/Desktop 仍優先走 bridge command
  - source order 對齊 decision: Local proxy source order and failure contract：dev fixture → COP address adapter → public cadastral adapter → manual_required
  - 紅燈：`local_proxy_called_by_development_browser`、`production_browser_proxy_unavailable`、`browser_does_not_call_external_discovery_directly`
- [ ] 2.3 實作 Requirement: Local Web uses safe discovery path 與 decision: local Web gets a safe dev path, not fake success，讓 `localhost:1420` 可保存 discovery attempt，但不得把 mock placeholder 當成功；以 `/cases/new` component test 與 Playwright smoke 驗證。
  - 檔案：`src/lib/mock-backend.ts`（保留 WIP）、`src/lib/land-registry-api.ts`（guard 收緊 `!== "production"` → `=== "development"`）
  - 行為：未知地址如 `新竹市東區興學街14號5樓之3` 回 `manual_required` + `local_fixture_not_found`，候選空、欄位空白；裕農路 fixture 可以顯示候選但 `trustedForPdf=false`
  - 紅燈：`discovery_victory_st_manual_required_no_fake_parcel`、`discovery_unknown_address_local_fixture_not_found`（候選空、不含 `0001/0001/0001`）
- [ ] 2.4 實作 decision: every failed external source is product-visible in records，讓 Tauri discovery 保存 COP/NLSC 來源、錯誤與候選；以 Rust integration test 與 query record detail 驗證。
  - 檔案：`src-tauri/src/land_registry/pull.rs`（discovery 寫 `registry_query_runs`）
  - 存法：重用 013 表，`confirmation_status="discovery"`、`total_cost_cents=0`、`error_summary_json` 記 `cop_address_no_match` / `public_cadastral_denied`、`generated_json` 記 candidates（依 design.md decision: Reuse 013 ledger tables for discovery/cache/billing/error）
  - 紅燈：`address_discover_saves_run_on_no_match`、`address_discover_saves_nlsc_denied`、`address_discover_never_creates_paid_call`
  - 證據：`cargo test --manifest-path src-tauri/Cargo.toml land_registry` 綠

## 3. Confirmed key 與 COP formal pull

- [ ] 3.1 實作 Requirement: Create-case flow SHALL persist registry confirmation state，讓手動或候選確認後的地段/地號/建號保存於 case 與 registry run；以 mock-backend 與 Tauri case tests 驗證。
  - 新建 Rust command：`confirm_case_registry_match(case_id, section_name, section_code?, land_no, building_no?, source)`（見 design.md「Decision: Two new Rust commands gate formal pull」）+ 註冊 generate_handler
  - 存法：寫 `cases.land_registry_data.confirmed_registry_match` + 一筆 `registry_query_runs`（`confirmation_status="confirmed"`, `confirmed_at`）
  - 規則：building case 必須有 building_no；land-only 允許 building_no 空
  - 紅燈：`confirm_building_case_requires_building_no`、`confirm_persists_match_to_case`
- [ ] 3.2 實作 Requirement: Formal COP requires confirmed key，禁止 raw address、未確認候選、dev fixture 直接打付費查詢；以 unit/integration test 驗證 `registry_match_required` 且費用 0。
  - 新建 Rust command：`land_registry_formal_pull_data(case_id, api_ids)`，內部 gate → 委派既有 `land_registry_pull_data(parcel_id, api_ids)`
  - 前端 `land-registry-api.ts` 的 `formalPullData`/`confirmCaseRegistryMatch` 對齊新 command（移除指向不存在 command 的死路）
  - 紅燈：`formal_pull_rejects_raw_address`、`formal_pull_rejects_dev_fixture`、`formal_pull_rejects_unconfirmed_candidate`（皆回 `registry_match_required`, cost=0, 無 api_calls）
- [ ] 3.3 實作 Requirement: Known registry key can pull COP data，使用已知地政鍵跑 formal pull，保存正式 JSON、api calls 與費用；以 `cop_api_live` 或等效 live smoke 證據驗證。
  - 成功後回寫 `cases.land_registry_data.entries[apiId]`（`trustedForPdf=true`, `source="moi_api"`, `status="success"`）
  - 紅燈/live：`confirm_then_formal_pull_succeeds`、`formal_pull_known_key_live`（`--ignored`，已知鍵 `BA-0001-00020000`，5 service，total_cost=50）
  - 證據：`cargo test --test cop_api_live -- --ignored` 留 `/tmp/criterion2-cop-live.json` 等效 JSON

## 4. 費用、cache、error log 與 PDF

- [ ] 4.1 實作 Requirement: Formal COP runs preserve cost, cache, source, and errors 與 decision: fee guard is part of acceptance，第一次查詢寫費用與 JSON，第二次同 key 查詢 cache hit 且 `totalCostCents=0`；以 integration test 驗證 `sourceRunId`。
  - 存法：cache hit 寫 `registry_query_runs.cache_hit=1`, `total_cost_cents=0`, `source_run_id=<原 run>`；billing 持久化寫 `registry_query_api_calls.cost_cents`（取代記憶體 BillingLog 丟失問題）
  - 紅燈：`repeat_formal_pull_is_cache_hit`（cacheHit=true, cost=0, sourceRunId 指向原 run）、`formal_pull_writes_billing_rows`（api_calls cost_cents 加總=run.total_cost_cents）
- [ ] 4.2 實作 Requirement: Product-visible errors are retained，地址 discovery 與 formal pull 失敗都能在查詢紀錄看到客戶文案與管理明細；以 UI/component test 驗證。
  - 來源：`registry_query_runs.error_summary_json`；前端「查詢紀錄」讀出顯示
  - 紅燈：`formal_pull_failure_records_error`、`invalid_credential_records_cop_credential_required`（error_code=`cop_credential_required`, cost=0）
- [ ] 4.3 實作 Requirement: Disclosure generation uses saved formal JSON only，物調與 PDF 使用已保存 formal JSON 或已標示 candidate/manual reference，不在 PDF 產出時重新打付費 COP；以 PDF assembly test 驗證 paid call count 不增加。
  - 檔案：`src/lib/pdf-engine/assemble-dossier-data.ts`（已不觸發查詢，加測試鎖死）
  - 依 design.md decision: Prove PDF uses saved JSON only
  - 紅燈：`pdf_assembly_no_paid_call`（COP/pullData spy 呼叫=0）、`pdf_uses_saved_formal_json`、`pdf_candidate_only_shows_warning`（apiData 空 + 強制警告，正式欄位不 trusted）

## 5. E2E 與收斂

- [ ] 5.1 實作 Requirement: Local address-to-COP E2E gates app packaging 與 decision: app packaging waits，跑 Local Web E2E：`localhost:1420/cases/new` 輸入勝利街地址，不出現 `0001/0001/0001` 假成功；人工確認後可建立案件並保存 confirmed key；以 Playwright artifact 驗證。
  - 劇本見 handoff「E2E 驗收劇本 A」；測試值 `勝利段 / 1043-0002 / 00000000`（非真實建號）
- [ ] 5.2 跑 Desktop App E2E：設定 COP 憑證、地址 discovery 失敗可保存診斷、人工確認後 formal COP 成功、cache hit 成功、PDF 使用保存資料；以 macOS app smoke report 驗證。
  - 劇本見 handoff「E2E 驗收劇本 B」；證據：formal JSON / billing rows / cache hit run / error log / PDF artifact / macOS smoke report
- [ ] 5.3 跑 Spectra consistency gate：`spectra analyze desktop-local-address-to-cop-e2e --json` 與 `spectra validate desktop-local-address-to-cop-e2e` 通過。
- [ ] 5.4 完成後更新 release acceptance checklist/report，明確列出本 SR 證據；以文件審查與乾淨 git status 驗證。
