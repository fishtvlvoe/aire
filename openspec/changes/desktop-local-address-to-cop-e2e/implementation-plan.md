# Implementation Plan — desktop-local-address-to-cop-e2e

> 給 Codex 執行的細部實作計畫。讀完 proposal.md / design.md / tasks.md 後，照本檔分 Wave 寫程式。
> 規劃者：Claude Code（Opus）2026-05-25。執行者：Codex（依各 Wave `[執行]` 標記）。
> 本檔不取代 design.md，是 design.md 的 Implementation Contract 細化 + WIP 處置 + TDD 失敗矩陣。

---

## 0. 給 Codex 的鐵律（每個 Wave 都適用）

1. **先紅燈再實作**。每個 Wave 先寫該 Wave 的失敗測試（失敗矩陣表列出測試名 + 預期錯誤），跑出全紅燈，才寫實作。
2. **不准假成功**：`0001/0001/0001`、raw address 直接打 formal COP、未確認候選付費查詢、PDF 產出時重打 paid COP — 任一出現即為錯誤實作。
3. **`build/test green ≠ 完成**。每個涉及外部資料流的 Wave 必須留實際產出物（JSON / 截圖 / billing rows）。
4. **不新建 SQLite 表**。discovery / cache / billing / error 全部寫入既有 `registry_query_runs` + `registry_query_api_calls`（013 migration）與 `cases.land_registry_data`（012）。需要新欄位才開 migration 014，並先在本檔登記。
5. **TS 與 Rust shape 必須同步**。改了 `DiscoveryResult` TS 型別，對應 Rust struct 同步改，不可只改一邊。
6. **完成前不打包 App**、不做 Windows/macOS release acceptance、不做 auto-update。
7. 繁體中文註解 / commit / 測試描述；程式碼識別字英文。

---

## 1. WIP 處置裁定

WIP patch 已備份：`/tmp/aire-local-address-to-cop-wip.patch`（699 行）。逐檔處置：

| 檔案 | 裁定 | 動作 |
| --- | --- | --- |
| `src/lib/mock-backend.ts` | **保留全部** | 四塊改動（裕農路 `dev_fixture`、勝利街 `manual_required`、formal pull write-back、`persistState()`）對齊 design，直接保留 |
| `src/lib/__tests__/mock-backend.test.ts` | **保留全部** | 三個測試直接驗 contract |
| `src/lib/__tests__/land-registry-api.test.ts` | **保留全部** | dev/production env 分支測試有效；Wave 1 收緊 guard 時順帶把 `!== "production"` 改成 `=== "development"` 並更新此測試 |
| `src/lib/land-registry-api.ts` | **部分保留** | 保留 `ParcelInfo.source` 加 `"dev_fixture"` + addressLookup dev bypass；Wave 1 補 `DiscoveryResult` wrapper 型別、guard 收緊為 `=== "development"` |
| `src/app/(dashboard)/cases/new/page.tsx` | **還原並改正** | 移除「把 `dev_fixture` 加進 trusted」那行；改 `isTrustedAddressLookupParcel()` 讀 `parcel.trusted_for_pdf === true`（唯一可信判準），不靠 `source` 字串 |
| `src/app/(dashboard)/cases/new/__tests__/new-case-page.test.tsx` | **部分保留** | 還原 A 段（裕農路 mock 改 `cop_moi`→`dev_fixture` 觸發 trusted 的部分）→ 改成驗證 `dev_fixture` **不可信**；保留 B 段「勝利街 manual 補填流程」測試 |

**動作順序**：Wave 0 先做還原/改正（page.tsx + new-case-page.test A 段），其餘保留檔在對應 Wave 隨實作一起 commit。

---

## 2. 六大決策裁定

### 決策 1 — WIP 保留拆小步（已裁定，見 §1）

### 決策 2 — Discovery result schema（正式型別）

把 design.md Implementation Contract 正式化為共用型別。**TS 與 Rust 一一對應**。

**TypeScript**（`src/lib/land-registry-api.ts`，新增 export）：
```ts
export type DiscoveryStatus = "candidate_found" | "manual_required" | "confirmed" | "error";
export type DiscoverySource = "cop_address" | "nlsc_cad" | "dev_fixture" | "manual";

export interface DiscoveryCandidate {
  sectionName: string;
  sectionCode: string;
  landNumber: string;
  buildingNumber?: string;     // land-only case 可空
  source: DiscoverySource;
  confidence?: number;
  trustedForPdf: boolean;       // dev_fixture / nlsc_cad 一律 false；唯一可信判準
}

export interface DiscoveryError {
  source: DiscoverySource;
  code: string;                 // address_discovery_unavailable | public_cadastral_denied | cop_address_no_match | ...
  message: string;
  httpStatus?: number;
  rawSummary?: string;
}

export interface DiscoveryResult {
  status: DiscoveryStatus;
  source: DiscoverySource;
  trustedForPdf: boolean;
  candidates: DiscoveryCandidate[];
  errors: DiscoveryError[];
  totalCostCents: 0;            // discovery 永遠 0
}
```

**Rust**（`src-tauri/src/land_registry/` 新增 `discovery.rs` 或併入既有型別模組，serde rename camelCase）：
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiscoveryResult {
    pub status: DiscoveryStatus,        // serde lowercase: candidate_found | manual_required | confirmed | error
    pub source: DiscoverySource,        // cop_address | nlsc_cad | dev_fixture | manual
    pub trusted_for_pdf: bool,
    pub candidates: Vec<DiscoveryCandidate>,
    pub errors: Vec<DiscoveryError>,
    pub total_cost_cents: i64,          // discovery 恆 0
}
```

**漸進策略**：既有 `land_registry_address_lookup` 回傳 `Vec<ParcelInfo>`。新增 `land_registry_address_discover() -> DiscoveryResult`，內部呼叫既有 lookup 取 `Vec<ParcelInfo>` → 映射成 `candidates` + 包狀態/錯誤。**不直接破壞既有 lookup 簽名**，前端 `addressLookup()` 升級為呼叫新 discover command 並回 `DiscoveryResult`。

### 決策 3 — dev_fixture 與 trusted_for_pdf 語意（鎖定）

- `trusted_for_pdf` 是**唯一**可信判準。任何 trusted 判斷一律讀此布林，**禁止用 `source` 字串判 trusted**。
- `dev_fixture`：僅供本機 E2E 的明確 fixture，`trustedForPdf` **永遠 false**。可帶入欄位方便流程，但仍須走人工 confirm，formal pull 仍要 confirmed key。
- `nlsc_cad` 候選：預設 `trustedForPdf=false`（NLSC 多回 permission denied，且非正式謄本）。
- 只有「`source=cop_address` 或 `manual`，經 `confirm_case_registry_match` 確認，且 formal COP pull 成功回寫」的 entry 才 `trustedForPdf=true`。
- **勝利街測試值 `勝利段 / 1043-0002 / 00000000` 是人工確認流程測試值，非真實建號**。程式註解與測試描述都要標明，禁止當真實謄本。

### 決策 4 — Tauri/Rust 保存 discovery diagnostics（重用既有表）

每次 `land_registry_address_discover`（成功或失敗）寫一筆 `registry_query_runs`：

| 欄位 | discovery run 寫法 |
| --- | --- |
| `input_kind` | `"address"` |
| `input_address` / `normalized_address` | 原始 / 正規化地址 |
| `registry_key` | 候選的 section/land/building 組合；無候選時空字串或 `address:<addr>` |
| `confirmation_status` | `"discovery"`（013 無 CHECK 約束，可直接寫） |
| `status` | `"candidate_found"` / `"manual_required"` / `"error"` |
| `total_cost_cents` | `0` |
| `cop_payload_json` | COP QueryByAddress 原始回應摘要 |
| `generated_json` | 正規化後的 `candidates` |
| `error_summary_json` | `DiscoveryError[]`（COP count=0 / NLSC denied 都記這裡） |
| `created_at` / `fetched_at` | 時間戳 |

COP 回 0 → `error_summary_json` 記 `cop_address_no_match`；NLSC denied → 記 `public_cadastral_denied`。前端「查詢紀錄」讀這些 run 顯示客戶文案 + 管理明細。

### 決策 5 — formal COP pull 只吃 confirmed key（核心缺口，新建 2 個 Rust command）

**現況**：前端 `confirmCaseRegistryMatch()` / `formalPullData()` 在 Rust 端**沒有對應 command**（只有 mock-backend）。Rust 端只有底層 `land_registry_pull_data(parcel_id, api_ids)`。這條流程在 Desktop 端是斷的 → 必須補。

**新建 command 1：`confirm_case_registry_match`**（`src-tauri/src/commands/cases.rs` 或新 `land_registry/confirm.rs`）
```rust
#[tauri::command]
pub async fn confirm_case_registry_match(
    case_id: String,
    section_name: String,
    section_code: Option<String>,
    land_no: String,
    building_no: Option<String>,
    source: String,            // cop_address | manual（dev_fixture/nlsc_cad 不可確認為 trusted）
    db: State<'_, DbState>,
) -> Result<ConfirmedRegistryMatch, IpcError>
```
- 寫入 `cases.land_registry_data` 的 `confirmed_registry_match`（schema `aire.registry-provenance.v1`）。
- 同步寫一筆 `registry_query_runs`（`confirmation_status="confirmed"`, `confirmed_at`, `confirmed_type`）。
- 回傳 confirmed registry key 供後續 formal pull 使用。
- **building case 必須有 building_no；land-only case 允許 building_no 空**（依 case-management spec）。

**新建 command 2：`land_registry_formal_pull_data`**（`src-tauri/src/land_registry/pull.rs`，包在既有 `land_registry_pull_data` 外）
```rust
#[tauri::command]
pub async fn land_registry_formal_pull_data(
    case_id: String,
    api_ids: Vec<String>,
    db: State<'_, DbState>,
    keyring: State<'_, KeyringState>,
    ipc: State<'_, AsyncIpcState>,
    billing: State<'_, LandRegistryBillingState>,
) -> Result<PullResult, IpcError>
```
邏輯（嚴格順序）：
1. 讀 `cases.land_registry_data.confirmed_registry_match`。**無 → 回 `registry_match_required`，`total_cost_cents=0`，不打任何 API**。
2. 由 confirmed key 組 `parcel_id`。
3. **Cache 查詢**：查 `registry_query_runs` 是否有同 `registry_key` + 同 query date 且 `status="success"` 的 run。
   - 有 → 寫新 run：`cache_hit=1`, `total_cost_cents=0`, `source_run_id=<原 run id>`，回 cache 結果。**不打 API**。
   - 無 → 進 4。
4. 委派既有 `land_registry_pull_data(parcel_id, api_ids)` 真打 COP。
5. 寫 `registry_query_runs`（`status="success"`/`"error"`, `cop_payload_json`, `total_cost_cents`）+ 每個 service 寫 `registry_query_api_calls`（`cost_cents`, `cop_code`, `transaction_id`）→ **billing 持久化**。
6. 成功 → 回寫 `cases.land_registry_data.entries[apiId]`（`trustedForPdf=true`, `source="moi_api"`, `status="success"`）。
7. raw address / dev_fixture / unconfirmed → 一律步驟 1 擋下。

前端 `land-registry-api.ts` 的 `formalPullData` / `confirmCaseRegistryMatch` 簽名對齊上面，移除「指向不存在 command」的死路。

### 決策 6 — 證明 PDF/物調只用 saved JSON（事實 + 三層證明）

**事實**：`assemble-dossier-data.ts:510` 已只讀 `caseRow.land_registry_data` 經 `extractTrustedOfficialRegistryData()` 過濾 `trustedForPdf===true && status==="success" && source==="moi_api"`，**不觸發查詢**。要做的是「鎖死 + 證明」：

1. **單元測試**：對 `assembleDossierData` 注入 spy 包住 `formalPullData`/`pullData`/COP client，斷言 PDF 組裝全程 **paid call spy 呼叫次數 = 0**。
2. **E2E 證明**：formal pull 後記錄 billing 筆數 N → 產 HTML/PDF → 再查 billing 筆數 = N（不增）。
3. **candidate-only 情境**：case 只有 candidate/dev_fixture/manual、無 formal JSON 時，PDF 顯示 pre-survey 參考 + 強制警告，**正式謄本欄位不得標 trusted**（測試斷言 `apiData` 為空 + 警告存在）。

---

## 3. Wave 拆解（含 TDD 失敗矩陣）

> 每 Wave：先寫失敗矩陣的紅燈測試 → 跑全紅 → 寫實作 → 跑綠 → CR → commit。
> `[執行]` = 由 Codex 寫程式；`[CR]` = Claude 主對話做 code review + 整合。

### Wave 0 — WIP 收斂（前置，必須先做）

| Task | 動作 | 檔案 |
| --- | --- | --- |
| 0.1 | 還原 page.tsx「dev_fixture 加進 trusted」那行 | `cases/new/page.tsx` |
| 0.2 | `isTrustedAddressLookupParcel()` 改讀 `trusted_for_pdf === true` | `cases/new/page.tsx` |
| 0.3 | new-case-page.test A 段改成驗 `dev_fixture` 不可信（紅→綠） | `new-case-page.test.tsx` |

**失敗矩陣**：
| 測試名 | 預期（紅燈時） |
| --- | --- |
| `dev_fixture candidate is NOT treated as trusted` | 改正前：`dev_fixture` 被當 trusted → 斷言失敗 |

**驗收**：`pnpm vitest run` 該檔綠 + `pnpm type-check` 綠。commit：`fix(cases): dev fixture must not be PDF-trusted`。

### Wave 1 — Discovery schema + 本機 Web 安全路徑（tasks 2.1, 2.2）

| Task | 動作 |
| --- | --- |
| 1.1 | 新增 `DiscoveryResult` 等 TS 型別（決策 2）+ Rust struct |
| 1.2 | guard 收緊 `!== "production"` → `=== "development"` |
| 1.3 | mock-backend 對齊 DiscoveryResult shape（已大致到位，補狀態欄位） |

**失敗矩陣**：
| 測試名 | 預期錯誤訊息/斷言 |
| --- | --- |
| `discovery: COP returns zero → manual_required` | status=`manual_required`, errors[].code=`cop_address_no_match`, totalCostCents=0 |
| `discovery: NLSC permission denied → manual_required` | errors[].code=`public_cadastral_denied`, status≠confirmed |
| `discovery: 裕農路 dev fixture → candidate_found untrusted` | source=`dev_fixture`, candidates[].trustedForPdf=false |
| `discovery: 勝利街 → manual_required no fake parcel` | candidates=[], 不含 `0001/0001/0001` |
| `discovery: generic mock placeholder kept blank` | status=`manual_required`, errorCode=`mock_placeholder_untrusted` |

**驗收**：上述 vitest 全綠 + type-check。檔案：`land-registry-api.ts`, `mock-backend.ts`, `__tests__/*`。

### Wave 2 — Tauri discovery diagnostics 保存（task 2.3）

| Task | 動作 |
| --- | --- |
| 2.1 | 新增 Rust `land_registry_address_discover() -> DiscoveryResult`，包既有 lookup |
| 2.2 | discovery run 寫入 `registry_query_runs`（決策 4 欄位對照） |
| 2.3 | COP count=0 / NLSC denied 寫 `error_summary_json` |

**失敗矩陣**（Rust integration test，`src-tauri/tests/`）：
| 測試名 | 預期 |
| --- | --- |
| `address_discover_saves_run_on_no_match` | 寫一筆 run，confirmation_status=`discovery`, total_cost_cents=0, error_summary_json 含 `cop_address_no_match` |
| `address_discover_saves_nlsc_denied` | error_summary_json 含 `public_cadastral_denied` |
| `address_discover_never_zero_cost_paid` | total_cost_cents=0，無 api_calls row |

**驗收**：`cargo test --manifest-path src-tauri/Cargo.toml land_registry`（不含 live）綠 + query record detail 可讀出 diagnostics。

### Wave 3 — Confirmed key + formal pull gate（tasks 3.1, 3.2, 3.3）

| Task | 動作 |
| --- | --- |
| 3.1 | 新建 Rust `confirm_case_registry_match`（決策 5 command 1）+ 註冊 generate_handler |
| 3.2 | 新建 Rust `land_registry_formal_pull_data`（決策 5 command 2，gate + cache + 委派 + 回寫） |
| 3.3 | 前端 `formalPullData`/`confirmCaseRegistryMatch` 對齊新 command |

**失敗矩陣**：
| 測試名 | 預期 |
| --- | --- |
| `formal_pull_rejects_raw_address` | 回 `registry_match_required`, total_cost_cents=0, 無 api_calls |
| `formal_pull_rejects_dev_fixture` | 同上（dev_fixture 不可付費查詢） |
| `formal_pull_rejects_unconfirmed_candidate` | 同上 |
| `confirm_then_formal_pull_succeeds` | confirm 後可 pull；building case 缺 building_no → 確認失敗 |
| `formal_pull_known_key_live`（live, --ignored） | 已知鍵 `BA-0001-00020000` 5 service 成功，total_cost=50，寫 cop_payload_json + api_calls |

**驗收**：unit/integration 綠 + `cargo test --test cop_api_live -- --ignored` 留 `/tmp/criterion2-cop-live.json` 等效證據。

### Wave 4 — 費用/cache/error log（tasks 4.1, 4.2）

| Task | 動作 |
| --- | --- |
| 4.1 | cache hit run 寫 `cache_hit=1`, `total_cost_cents=0`, `source_run_id` |
| 4.2 | billing 持久化：每 service 寫 `registry_query_api_calls.cost_cents`（取代純記憶體 BillingLog 的丟失問題） |
| 4.3 | error 客戶文案 + 管理明細從 `error_summary_json` 讀出顯示 |

**失敗矩陣**：
| 測試名 | 預期 |
| --- | --- |
| `repeat_formal_pull_is_cache_hit` | 第二次同 key：cacheHit=true, totalCostCents=0, sourceRunId=原 run id |
| `formal_pull_writes_billing_rows` | 第一次：api_calls 有 N 筆 cost_cents 加總=run.total_cost_cents |
| `formal_pull_failure_records_error` | 失敗：error_code 記錄，total_cost_cents=0（無成功 service），UI 可讀 |
| `invalid_credential_records_cop_credential_required` | error_code=`cop_credential_required`, cost=0 |

**驗收**：integration 綠 + 查詢紀錄頁顯示費用/cache/error（component test）。

### Wave 5 — PDF 只讀 saved JSON（task 4.3）

| Task | 動作 |
| --- | --- |
| 5.1 | `assembleDossierData` paid-call spy 測試 |
| 5.2 | candidate-only → pre-survey 警告 + 不標 trusted |

**失敗矩陣**：
| 測試名 | 預期 |
| --- | --- |
| `pdf_assembly_no_paid_call` | formalPull/pullData/COP spy 呼叫次數=0 |
| `pdf_uses_saved_formal_json` | apiData 取自 saved entries（trustedForPdf=true） |
| `pdf_candidate_only_shows_warning` | apiData 空，pre-survey 警告存在，正式欄位不 trusted |

**驗收**：`pnpm vitest run` PDF 測試綠。

### Wave 6 — E2E + Spectra gate + 收斂（tasks 5.1, 5.2, 5.3, 5.4）

| Task | 動作 |
| --- | --- |
| 6.1 | Local Web Playwright smoke（見 §4 劇本 A） |
| 6.2 | Desktop App smoke（見 §4 劇本 B） |
| 6.3 | `spectra analyze desktop-local-address-to-cop-e2e --json` + `spectra validate` 0 warnings |
| 6.4 | 更新 release acceptance checklist + 列證據 + git status 乾淨 |

**驗收**：Playwright artifact + macOS app smoke report + spectra 0 warnings + 證據齊（見 §4）。

---

## 4. E2E 驗收劇本

### 劇本 A — Local Web（`localhost:1420`，dev mode 走 mock-backend）
1. 開 `/cases/new`，輸入 `台南市永康區勝利街58巷4號`。
2. 斷言：**不出現** `0001/0001/0001` 假成功；顯示 manual 補填欄位（段/地號/建號空白）。
3. 人工填入測試值 `勝利段 / 1043-0002 / 00000000` → 建立案件。
4. 斷言：case 保存 `confirmed_registry_match`；查詢紀錄有 discovery run（status=manual_required, cost=0）。
5. 留 Playwright artifact（截圖 + trace）。

### 劇本 B — Desktop App（Tauri，真打 COP）
1. 系統設定填客戶 COP 憑證。
2. 地址 discovery 失敗 → 查詢紀錄保存 diagnostics（COP no_match / NLSC denied）。
3. 人工確認已知鍵 `BA-0001-00020000`（測試鍵）→ formal COP pull 成功 → 保存 JSON + billing rows。
4. 同鍵再 pull → cache hit，cost=0，sourceRunId 指向原 run。
5. 產 PDF → billing 筆數不變。
6. 留：formal JSON、billing rows、cache hit run、error log、PDF artifact、macOS smoke report。

---

## 5. 費用守則（避免燒 COP 費）

- live 測試一律 cache-first：先確認 `registry_query_runs` 有可重用 run 才不重打。
- live 測試只用已知鍵 `BA-0001-00020000`（已證實 5 service / 50 cents）。
- 任何 `--ignored` live test 預設不在 CI 跑，手動跑並留 JSON 證據。
- discovery 永遠 `total_cost_cents=0`，若出現非 0 即為 bug。

---

## 6. 需 Fish 拍板的少數項（其餘已裁定）

1. **Rust command 命名**：本計畫新建 `confirm_case_registry_match` + `land_registry_formal_pull_data`（對齊前端與 mock）。若 Fish 想直接擴充既有 `land_registry_pull_data` 而不新建，請於 review 時指定。（推測：走新建，因 design/tasks/mock 都已是這形狀。）
2. **勝利街測試建號 `00000000`**：作為 land-only / 測試占位是否可接受？或 Fish 有真實可用測試地址？（推測：可接受，已標非真實謄本。）
3. **billing 來源唯一化**：本計畫以 `registry_query_api_calls` 為費用 SSOT，記憶體 `BillingLog` 降為快取視圖。若 Fish 要保留 BillingLog 為主，請指定。（推測：以 SQLite 表為準，因記憶體重啟丟失。）

以上 3 項不阻塞 Wave 0–2 開工；Wave 3 起若未拍板，依推測值執行。
