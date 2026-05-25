<!--
Each task description MUST state:
- the behavior or contract being delivered (what is observably true when the
  task is complete), and
- the verification target that proves completion (test, CLI invocation,
  analyzer check, manual assertion, or content review).

File paths are supporting context for locating the work, never the task
itself. "Edit file X" is not a valid task — it is missing both behavior and
verification.
-->

## 1. 對標資料模型與紀錄基礎

- [ ] 1.1 建立 `registry_query_runs` 與 `registry_query_api_calls` migration，交付 Data model、Query ledger is product data 與 Every registry workflow step SHALL create a query run 的資料契約；以 migration test 驗證 DDL、index、UTC 儲存與 Asia/Taipei 顯示欄位。
- [ ] 1.2 建立 Runtime interfaces 的 query-run repository 與 IPC/API contract，讓 Query run detail SHALL expose JSON cost and errors 可回傳 parsed JSON、raw JSON、API calls、total cost、errors；以 repository unit test 與 `GET /api/settings/land-registry-records/{runId}` route test 驗證。
- [ ] 1.3 建立 export service，讓 Query records SHALL export JSON and CSV 支援 JSON/CSV 匯出與 unsupported format 錯誤；以 route test 驗證 HTTP 200 與 HTTP 400。

## 2. 地址與土地反查對標

- [ ] 2.1 實作 EasyMap is discovery only adapter，讓 Address input SHALL resolve registry candidates before paid COP calls 回傳候選地段、地號、建號且不呼叫 COP；以 `resolve-address` unit test 驗證裕農路 fixture 與 zero-cost run。
- [ ] 2.1a 實作 Desktop App is the R02 execution boundary，讓 Desktop helper SHALL execute R02 discovery from the user's local environment 可由 Mac/Windows 本機瀏覽器或 WebView 開啟 R02 並擷取候選資料；以 desktop helper fixture test 驗證行政區、地政事務所、地段、地號、建號、樓層、用途與 `totalCostCents = 0`。
- [ ] 2.1b 實作 R02 cloud fallback，讓 R02 blocks cloud discovery but desktop helper can continue 在 SaaS R02 access denied 時建立 `r02_cloud_access_denied` zero-cost run 並提示改用桌面 Helper；以 route test 驗證 HTTP 502/diagnostic run 與後續 helper attach。
- [ ] 2.2 實作土地輸入 parser，讓 Land input SHALL resolve registry candidates without requiring address 可解析南化段 850-1 與港子前段 1090、1090-26；以 parser test 驗證 candidate 數量與 `buildingNo = null`。
- [ ] 2.3 實作 Failure modes 的人工確認 gate，讓 Confirmed registry match SHALL gate formal COP queries 只有 confirmed run 才能進入正式 COP；以 route test 驗證 multiple candidates 進入 `needs_selection` 並 block formal pull。
- [ ] 2.4 建立七個 fixture run，讓 Test fixtures SHALL produce persistent run data 留下 JSON、費用、狀態與分類；以 fixture integration test 驗證七筆測試資料都能從後台 detail endpoint 讀回。
- [ ] 2.5 實作 SaaS sync keeps candidate data separate from official data 與 desktop-to-SaaS sync，讓 Desktop helper SHALL sync confirmed registry matches to SaaS 可把 candidate JSON、confirmation、sourceRunId、adapter、parserVersion 與 cache metadata 寫回 SaaS 案件；以 API contract test 驗證 confirmed 後 SaaS 開啟正式 COP action、未 confirmed 時維持 reference only。
- [ ] 2.6 實作 desktop diagnostic persistence，讓 Desktop helper SHALL preserve diagnostics for support and iteration 在 DOM parse failed 時保存 parser version、缺失欄位、redacted raw summary 與 next action；以 integration test 驗證 Settings query-record detail 可直接顯示錯誤，不需要本機檔案或 AI。

## 3. 快取、費用與錯誤紀錄

- [ ] 3.1 改造 Registry key is source of truth 快取主鍵，讓 Cache SHALL store API responses keyed by parcel and query date 依 confirmed registry key 重用 COP JSON；以 cache unit test 驗證同物件不同地址寫法不重打 COP。
- [ ] 3.2 實作 Cache hit creates a zero-cost run，讓快取命中仍建立 query run 且 `cacheHit = true`、`sourceRunId`、`totalCostCents = 0`；以 integration test 驗證第二次同 key 查詢費用為 0。
- [ ] 3.3 阻擋未確認候選查快取，讓 Cache SHALL reject unconfirmed candidate keys 回傳 `registry_key_not_confirmed`；以 unit test 驗證 candidate_unconfirmed 與 needs_selection 都不能 formal lookup。
- [ ] 3.4 擴充 billing log，讓 Every call SHALL be recorded with cost and transaction ID 保留 run id、registry key、COP code/message、redacted summaries；以 billing log test 驗證成功、HTTP 503、COP317 三種紀錄。
- [ ] 3.5 實作 per-run 費用加總，讓 Billing log SHALL aggregate per-run total cost 顯示土地兩支與土地加建物六支 API 的總費用；以 cost aggregation test 驗證 `paidCallCount`、`freeCallCount`、`totalCostCents`。

## 4. 分類與補件題庫

- [ ] 4.1 實作 Classifier returns evidence and confirmation status，讓 Property classifier SHALL distinguish building subtypes 回傳 highrise-building、huaxia-building、apartment 與 missing elevator confirmation；以 classifier unit test 驗證樓層與電梯規則。
- [ ] 4.2 實作透天/別墅規則，讓 Property classifier SHALL distinguish townhouse and villa 以車庫證據產生 townhouse-villa-needs-confirmation；以 classifier unit test 驗證有車庫需確認、無車庫為 townhouse。
- [ ] 4.3 實作土地分類規則，讓 Property classifier SHALL distinguish land categories 回傳 residential-land、farmland、agricultural-building-land、industrial-land、type-d-building-land；以 land classifier table test 驗證每個規則。
- [ ] 4.4 建立 Question bank drives supplement UI 匯入器，讓 Supplement workbench SHALL load questions by confirmed property type 從 `0520/不動產說明書/0417-old` 建立現場必問與秘書後補題庫；以 import snapshot test 驗證建物與土地題庫都有 registry-backed 與 manual-only 欄位。

## 5. 後台設定 UI 與補件工作台

- [ ] 5.1 實作 Settings 查詢紀錄列表，讓 Settings SHALL provide registry query records UI 與 Query records SHALL be searchable in Settings UI 可搜尋地址、地段、地號、建號、狀態、COP code、日期；以 component test 驗證 filters 呼叫 `GET /api/settings/land-registry-records` 並顯示費用與 cache-hit。
- [ ] 5.2 實作 Settings detail drawer，讓 Settings SHALL show query run JSON and error logs 顯示 parsed JSON、raw JSON、API rows、COP317 log 與 export action；以 component test 驗證不需要 AI 或本機檔案就能看錯誤。
- [ ] 5.3 實作 explicit refresh UI，讓 Settings SHALL support explicit paid refresh 只有 confirmed run 可付費重查並必填 refresh reason；以 route/component test 驗證 confirmed HTTP 200、unconfirmed HTTP 409。
- [ ] 5.4 實作左補件右預覽，讓 Supplement workbench SHALL separate left supplement fields and right preview 即時呈現 HTML preview 與 PDF download；以 UI test 驗證漏水、壁癌、車庫、電梯、水塔、通行狀況欄位與預覽同步。
- [ ] 5.5 實作候選參考模式，讓 Supplement workbench SHALL preserve candidate reference mode 標示參考資料且禁用正式 PDF；以 component test 驗證未 confirmed 時 PDF download disabled。

## 6. 說明書產出關卡

- [ ] 6.1 建立正式產出 gate，讓 Formal disclosure SHALL require confirmed registry match 對建物要求地址、office、section、landNo、buildingNo 與 COP JSON；以 route test 驗證缺 buildingNo 回 HTTP 409 `registry_match_required`。
- [ ] 6.2 建立候選參考產出，讓 Candidate data SHALL generate pre-survey reference only 顯示 `參考資料，尚未對標確認` 並阻擋正式 PDF；以 document-generation test 驗證 candidate 欄位標籤與 export disabled。
- [ ] 6.3 改造產出資料來源，讓 Disclosure generation SHALL use stored query JSON 產製文件時不再打 COP；以 integration test 驗證 generate disclosure 後 billing log 沒有新增 paid API call。

## 7. 驗證與交付

- [ ] 7.1 跑完整 CR consistency gate，確認 Acceptance criteria、所有 Requirement 與 design headings 都被 tasks 覆蓋；以 `spectra analyze address-first-registry-match-and-query-ledger --json` 驗證 0 Critical、0 Warning。
- [ ] 7.2 跑 Spectra validation，確認 CR artifact 格式可被歸檔；以 `spectra validate address-first-registry-match-and-query-ledger` 驗證通過。
- [ ] 7.3 執行相關前後端測試，確認七個 fixture、快取、費用、錯誤 Log、Settings UI、補件預覽與正式產出 gate 行為一致；以 `rtk npm test -- --runInBand`、`rtk cargo test land_registry` 或實作後等效測試指令驗證。
- [ ] 7.4 驗證 Mac/Windows 桌面交付，讓 Mac and Windows desktop deliverables SHALL be verified before handoff 對 R02 helper path 跑 macOS Tauri smoke、Windows runner/VM/CI installer smoke、SaaS sync confirmation 與失敗診斷 fixture；以 release verification report 保存測試輸出與可重跑指令。
