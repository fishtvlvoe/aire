## Context

AIRE 目前已具備地政 API 設定、COP 查詢、快取、費用紀錄、物件類型、補件與 PDF 產出能力，但地址輸入、地段地號建號對標、正式 COP 查詢關卡、後台可查紀錄與重複查詢省費尚未形成同一條產品流程。

本 change 將「地址優先」改成可追溯流程：使用者輸入地址或土地資料後，系統先取得候選地段、地號、建號；完成人工確認後才打 COP；打過的 registry key 自動重用舊 JSON；每次查詢都在後台留下 JSON、費用、錯誤 Log 與測試資料。

## Goals / Non-Goals

**Goals:**

- 地址輸入能收束到地址、地段、地號、建號，正式查詢前提供人工確認關卡。
- 土地輸入能收束到地政事務所、地段、地號，直接判斷土地用途分類與是否需要建號。
- COP 查詢前能估算費用，COP 查詢後能保存每支 API 的費用、錯誤與 JSON。
- 後台設定頁能搜尋查詢紀錄、檢視 JSON、費用、錯誤 Log，並匯出 JSON/CSV。
- 同一物件已查過時自動帶入既有資料，本次費用為 0。
- 物件分類與補件題庫能依大樓、華廈、公寓、透天、別墅、農地、建地、農建地、工業地載入。

**Non-Goals:**

- 不記錄 AI prompt、AI 推理、chain-of-thought 或模型內部過程。
- 不把 EasyMap R02 / 便民系統資料當成正式謄本資料。
- 不繞過 COP 權限或付費限制。
- 不重做 AIRE 既有主要導覽與版型。
- 不讓未確認候選資料產生正式不動產說明書。

## Decisions

### Registry key is source of truth

已確認的地政 key 是快取與正式查詢的主鍵。建物 key 使用 `officeCode + sectionCode + landNo + buildingNo`，土地 key 使用 `officeCode + sectionCode + landNo`。地址只保留為輸入與比對資料，不作為正式快取主鍵。

Alternatives Considered:

- 以原始地址當主鍵：同一地址存在全形半形、臺台、巷弄空白、樓層寫法差異，會造成重複扣費與錯誤合併。
- 以 case id 當主鍵：同一物件在不同案件重複出現時無法重用 COP JSON，費用會重複發生。

### EasyMap is discovery only

EasyMap R02 / 便民系統只負責 key discovery、候選地號建號與人工對標輔助。正式土地成本、建物成本、標示、所有權與他項權利資料以 COP 回傳 JSON 為準。

Alternatives Considered:

- 直接把 EasyMap 資料寫入正式說明書：EasyMap 是查詢與候選來源，非正式謄本資料來源，正式文件風險過高。
- 地址一進來就直接打 COP：地址不完整或候選不唯一時會浪費付費 API，且查到錯物件仍會有成本。

### Query ledger is product data

查詢 JSON、費用、錯誤 Log、測試資料與快取命中紀錄要存在本機 SQLite 並呈現在設定頁 UI。它不是本機散落檔案，也不是需要 AI 才能翻出的工程紀錄。

Alternatives Considered:

- 寫入本機 JSON 檔：使用者無法在產品內搜尋、比對、匯出，也不利於主管追溯測試。
- 只寫開發 log：正式客戶現場無法用 UI 追溯 COP 錯誤、費用與 JSON。

### Cache hit creates a zero-cost run

同一 registry key 已有有效 COP JSON 時，新案件仍建立一筆 query run，但標記 `cacheHit = true`、`sourceRunId` 指向原查詢、`totalCostCents = 0`，不再呼叫 COP。

Alternatives Considered:

- 快取命中不建立 run：系統無法說明本次資料從哪裡來，也無法在測試紀錄看到此次操作。
- 快取命中仍重新呼叫 COP：同一地址或同一地號會重複扣費，違背省費目標。

### Classifier returns evidence and confirmation status

物件分類器回傳 `suggestedType`、`evidence`、`missingEvidence`、`needsConfirmation`。有樓層、電梯、車庫、土地使用分區等證據時自動建議；缺少電梯、車庫、水塔、通行狀況時要求人工確認。

Alternatives Considered:

- 用 AI 自由判斷類別：分類依賴規則與證據，不需要模型推理，也不能記錄 AI 內部過程。
- 只分土地與建物：物調題庫、補件欄位與現場必問需要更細的類別，兩類不足以產出正確問題。

### Question bank drives supplement UI

`0520/不動產說明書/0417-old` 題庫要整理為結構化 question bank，依物件分類載入現場必問與秘書後補。補件工作台左側顯示缺漏欄位與可填資料，右側即時顯示 HTML 預覽與 PDF 下載。

Alternatives Considered:

- 將題庫寫死在單一表單：後續客戶修改題庫時改動成本高，且不同物件類型容易混在一起。
- 只產生空白 PDF 再人工填：無法把 COP 可確定資料自動帶入，也無法追溯缺漏欄位。

## Implementation Contract

### Data model

所有時間欄位以 UTC Unix seconds 儲存，UI 顯示時轉為 Asia/Taipei。

```sql
CREATE TABLE registry_query_runs (
  id TEXT PRIMARY KEY,
  case_id TEXT,
  registry_key TEXT NOT NULL,
  input_kind TEXT NOT NULL,
  input_address TEXT,
  normalized_address TEXT,
  office_code TEXT,
  office_name TEXT,
  section_code TEXT,
  section_name TEXT,
  land_no TEXT,
  building_no TEXT,
  suggested_type TEXT,
  confirmed_type TEXT,
  confirmation_status TEXT NOT NULL,
  status TEXT NOT NULL,
  cache_hit INTEGER NOT NULL DEFAULT 0,
  source_run_id TEXT,
  total_cost_cents INTEGER NOT NULL DEFAULT 0,
  r02_payload_json TEXT,
  cop_payload_json TEXT,
  generated_json TEXT,
  error_summary_json TEXT,
  fetched_at INTEGER,
  expires_at INTEGER,
  confirmed_at INTEGER,
  created_at INTEGER NOT NULL,
  refresh_reason TEXT,
  FOREIGN KEY(source_run_id) REFERENCES registry_query_runs(id)
);

CREATE INDEX idx_registry_query_runs_registry_key ON registry_query_runs(registry_key);
CREATE INDEX idx_registry_query_runs_case_id ON registry_query_runs(case_id);
CREATE INDEX idx_registry_query_runs_created_at ON registry_query_runs(created_at);
CREATE INDEX idx_registry_query_runs_status ON registry_query_runs(status);

CREATE TABLE registry_query_api_calls (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  api_id TEXT NOT NULL,
  service_name TEXT,
  method TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  http_status INTEGER,
  cop_code TEXT,
  cop_message TEXT,
  transaction_id TEXT,
  cost_cents INTEGER NOT NULL DEFAULT 0,
  request_summary_json TEXT,
  response_summary_json TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY(run_id) REFERENCES registry_query_runs(id)
);

CREATE INDEX idx_registry_query_api_calls_run_id ON registry_query_api_calls(run_id);
CREATE INDEX idx_registry_query_api_calls_api_id ON registry_query_api_calls(api_id);
CREATE INDEX idx_registry_query_api_calls_cop_code ON registry_query_api_calls(cop_code);
```

### Runtime interfaces

- `resolve_registry_candidates(input)` returns address, section, land and building candidates from EasyMap/public sources without billing COP.
- `confirm_registry_match(runId, confirmedKey)` stores the user-confirmed key and unlocks formal COP queries.
- `pull_confirmed_registry_data(runId)` checks cache first, then calls COP only when no valid JSON exists or the user confirms refresh.
- `list_registry_query_runs(filters)` backs the Settings query-record UI.
- `get_registry_query_run(runId)` returns parsed JSON, raw stored JSON, API call rows, cost summary and error details.
- `export_registry_query_runs(filters, format)` exports JSON or CSV.

### Failure modes

- Multiple candidates return `confirmation_status = needs_selection` and block formal disclosure.
- No candidate returns `status = no_candidate` and records the input JSON without COP cost.
- COP authorization errors return `status = cop_error`, preserve COP code/message, and display the next action in Settings.
- Payload summaries MUST NOT contain client secret, access token, owner personal identifiers outside returned registry JSON, or raw authentication headers.
- Candidate data can generate pre-survey reference output only. Formal disclosure generation rejects unconfirmed registry keys.

### Acceptance criteria

- Unit tests cover address fixtures, land fixtures, classifier rules, cache hit behavior, cost aggregation and error logging.
- UI tests cover Settings query-record search, detail drawer JSON rendering, export actions and cache-hit zero-cost row.
- E2E tests cover the seven fixtures from this CR and assert every run leaves JSON, cost and status data.
- `spectra analyze address-first-registry-match-and-query-ledger --json` and `spectra validate address-first-registry-match-and-query-ledger` pass with no Critical or Warning findings.

## Risks / Trade-offs

- [Risk] EasyMap R02 DOM or response contract changes → Mitigation: isolate the adapter, store raw discovery JSON, record parser version and fail into `needs_manual_key_input`.
- [Risk] Candidate list contains multiple plausible building numbers → Mitigation: require user confirmation before COP formal pull and mark pre-survey output as reference only.
- [Risk] COP error payload contains sensitive data → Mitigation: store request summaries with redaction and preserve raw response only in encrypted local SQLite.
- [Risk] Cache returns stale official data → Mitigation: store `expires_at`, show fetched date, require explicit paid refresh with reason.
- [Risk] Property classifier overstates certainty → Mitigation: display evidence and missing evidence, then require manual confirmation for elevator, garage, water tower and access conditions.

## Migration Plan

1. Add SQLite migration for `registry_query_runs` and `registry_query_api_calls`.
2. Add repository and IPC commands behind existing Tauri bridge.
3. Add EasyMap discovery adapter and classifier tests before enabling UI calls.
4. Add Settings query-record UI and mock backend contract.
5. Add case workflow confirmation gate before formal COP pull.
6. Add fixture E2E tests and cost assertions.
7. Rollback by disabling the new confirmation gate and query-record UI while leaving tables intact; existing COP cache and billing log remain readable.

## Open Questions

- COP account permissions must be verified for 土地標示、土地所有權、土地他項權利、建物資訊 before live implementation.
- EasyMap R02 production access constraints must be verified before selecting DOM scraping, browser automation or official endpoint integration.
- The exact expiration period for official COP JSON must be set by product policy before implementation.
