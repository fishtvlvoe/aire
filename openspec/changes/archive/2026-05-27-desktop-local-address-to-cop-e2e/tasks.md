## 0. SR 收斂與守門

- [x] 0.1 覆蓋 Requirement: Local Web SHALL gate Desktop App parity，並覆蓋 Decision: Web is source of truth; App is parity wrapper；更新本 SR artifacts，明確標記本機 Web 先完成，App 僅替換 SaaS AIRE 授權碼登入，其餘完全一致；以 `spectra analyze desktop-local-address-to-cop-e2e --json` 與 `spectra validate desktop-local-address-to-cop-e2e` 驗證。
- [x] 0.2 覆蓋 Requirement: Address-to-COP E2E SHALL preserve evidence；更新 active SR / release 文件順序，標記本 SR 通過前不得做 App 封裝驗收、Windows 驗收或 auto-update，並要求 E2E 證據包含查詢 JSON、費用、cache hit、sourceRunId、error log、PDF artifact 與本機 DB 證據；以文件審查驗證。
- [x] 0.3 覆蓋 Decision: Settings IA separates brand, audit log, and plan state；本 SR 開始執行後，每完成一個任務必須在驗證證據存在後同步把本檔對應 checkbox 改成 `[x]`，未打勾不得回報完成；以 `git diff -- openspec/changes/desktop-local-address-to-cop-e2e/tasks.md` 與任務驗證輸出審查。
- [x] 0.4 覆蓋 Decision: Paid address-to-parcel resolver is an explicit exception、Requirement: Paid address-to-parcel resolver SHALL be explicit and candidate-only、Requirement: Land number SHALL have bounded meaning、Requirement: Paid resolver cost SHALL be explicit and separately logged；把「零成本失敗後，使用者可明確同意付費地址轉地號/建號 resolver」與「地號只能查土地/候選、不能當建物 confirmed key」補進 proposal/design/spec/tasks；以 `spectra analyze desktop-local-address-to-cop-e2e --json` 與 `spectra validate desktop-local-address-to-cop-e2e` 驗證。

## 1. 本機 Web R02 discovery

- [x] 1.1 覆蓋 Requirement: Address discovery SHALL be R02-first and zero-cost，並覆蓋 Decision: R02-first discovery, COP-after-confirmation；定義 Web / Tauri 共用 `DiscoveryResult` contract，能表達 R02 候選、manual required、error、cache hit、trustedForPdf=false、totalCostCents=0；以 TS unit test 與 Rust serde test 驗證。
- [x] 1.2 覆蓋 Requirement: Local Web SHALL use same-origin discovery proxy，並覆蓋 Decision: Local Web uses local proxy, Desktop uses Tauri/Rust, contract shared；實作本機 Web same-origin local proxy，browser 只打 localhost API，由 server-side proxy 查 EasyMap R02；以 server unit test 驗證 browser 不直接打外部服務。
- [x] 1.3 覆蓋 Requirement: Web and Desktop SHALL share discovery contract；實作 R02 parser 與 Desktop discovery response normalization，把地址查回的候選轉成同一份地段、地號、建號候選 contract；保存 raw JSON、parsed JSON、錯誤與 sourceRunId；以 fixture parser test 驗證多地址與空結果。
- [x] 1.4 覆蓋 Requirement: Duplicate property entry SHALL autofill and warn；`/cases/new` 在 discovery 前先查 normalized address cache；命中時自動帶入既有候選並顯示「已帶入既有資料」；以 component test 驗證。
- [x] 1.5 覆蓋 Requirement: Mock and fixture data SHALL NOT become trusted registry data；禁止 mock `0001/0001/0001`、dev fixture、browser partial success 被視為正式成功；以 existing new-case tests 與新增 regression tests 驗證。
- [x] 1.6 覆蓋 Requirement: Discovery input SHALL be classified before lookup，並覆蓋 Decision: Input kind controls the discovery route；實作 `doorplate | land_descriptor | incomplete` input classifier，門牌走 R02 門牌路徑，地段地號走 R02 地段/地號路徑，不完整輸入回 `manual_required`；以 unit test 驗證台南門牌、高雄門牌、台南勝利段地號、不完整地段四類。
- [x] 1.7 覆蓋 Requirement: Address correction suggestions SHALL NOT become confirmation；R02 查不到但偵測疑似路名錯字/別名時只顯示修正建議，不產生 confirmed key、不打 COP；以 server unit test 驗證 `苓雅路二段` 建議檢查 `苓雅二路` 且 paid call count=0。
- [x] 1.8 覆蓋 Requirement: Discovery contract SHALL expose input kind and selection gate，並覆蓋 Requirement: Multiple candidates SHALL require one selected target，並覆蓋 Decision: Candidate selection is a paid-query gate；DiscoveryResult 補 `requiresCandidateSelection`、candidate confidence 與 selected target 狀態，多筆土地/建號候選未選定時只保存 evidence；以 parser/server tests 驗證多候選不自動確認。
- [x] 1.9 覆蓋 Requirement: Land number SHALL have bounded meaning；實作地號用途邊界：地段地號可走土地 discovery/formal land path，並可用 R02 detail 或可用零成本 cadastral 來源反查建號候選；但只有地號時不得建立建物 confirmed key；以 server/unit tests 驗證地號反查候選、NLSC/上游 denied 診斷、建物 formal COP blocked。

## 2. UI/UX 與案件建立

- [x] 2.1 覆蓋 Decision: Customer UI hides backend complexity；改造 `/cases/new` 客戶文案，只顯示地址、找到物件資料、需要確認、預估費用、已使用既有資料等白話狀態，不顯示 API、JSON、COP、R02、sourceRunId；以 DOM tests 驗證禁用詞不出現在主要 UI。
- [x] 2.2 覆蓋 Requirement: Create-case flow SHALL persist registry confirmation state；使用者確認或人工補正地段、地號、建號後，保存 confirmed registry key 到 case 與 query run；以 mock-backend test 與 Tauri integration test 驗證。
- [x] 2.3 覆蓋 Decision: Duplicate prevention is warning + autofill, not hard block；偵測同 registry key 的既有案件，提示「系統中已有同樣資訊」，提供開啟既有案件與建立新案件；以 component test 驗證不 hard block。
- [x] 2.4 覆蓋 Requirement: Property type SHALL be auto-filled and editable；自動帶入案件分類：R02 粗判建物/土地，COP 正式資料後細分 property type；以 unit test 驗證建物、土地、農地、公寓、大樓、店面、工廠等分類。
- [x] 2.5 覆蓋 Requirement: Multiple candidates SHALL require one selected target；`/cases/new` 多筆土地/建號候選時 UI 必須顯示候選清單與單選確認，未選定前 formal COP CTA disabled 且建立案件只可為 `registry_pending`；以 DOM/component test 與手動 Chrome 驗證。
- [x] 2.6 覆蓋 Requirement: Survey fields SHALL differ for building and land cases；物調表依建物/土地顯示不同欄位，建物顯示樓層、格局、屋況、建物用途、格局圖，土地顯示使用分區、臨路、面寬深度、地籍/空拍/地標圖；以 component test 驗證。

## 3. COP formal pull、費用與 cache

- [x] 3.1 覆蓋 Requirement: Formal COP requires confirmed registry key；實作 formal pull gate：raw address、未確認候選、mock、dev fixture、空資料一律回 `registry_match_required`，不打付費 COP；以 integration test 驗證 cost=0 且無 API call rows。
- [x] 3.2 覆蓋 Requirement: Formal query cost SHALL be estimated before paid pull，並覆蓋 Decision: Minimal COP API set follows confirmed property type；根據 confirmed registry key 與 property type 選 minimal COP API set；正式查詢前顯示預估費用；以 unit test 驗證有建號只查建物必要 API、無建號只查土地必要 API。
- [x] 3.3 覆蓋 Requirement: Formal COP runs preserve cost, cache, source, and errors；正式 COP 成功後保存 raw JSON、parsed JSON、費用、api calls、confirmed API set、sourceRunId 與 case entries；以 Rust integration/live ignored test 驗證。
- [x] 3.4 再次覆蓋 Requirement: Formal COP runs preserve cost, cache, source, and errors；同 registry key + same API set 重查必須 cache hit，totalCostCents=0，sourceRunId 指向原 paid run；以 integration test 驗證。
- [x] 3.5 再次覆蓋 Requirement: Formal COP runs preserve cost, cache, source, and errors；COP 憑證錯誤、R02 錯誤、上游錯誤都要保存 readable error 與管理明細；以 unit/component test 驗證客戶文案與本機 DB error log。
- [x] 3.6 覆蓋 Requirement: Formal COP requires confirmed registry key；後端 formal pull 必須拒絕多筆未選候選、修正建議、`registry_pending` 與 `manual_required`，不能只靠 UI disabled；以 integration test 驗證每個狀態 `registry_match_required`、`totalCostCents=0`、paid API call count=0。
- [x] 3.7 覆蓋 Decision: Paid address-to-parcel resolver is an explicit exception、Requirement: Paid address-to-parcel resolver SHALL be explicit and candidate-only，並覆蓋 Requirement: Paid resolver cost SHALL be explicit and separately logged；新增使用者明確同意的付費地址轉地號/建號 resolver，呼叫 COP `MOI_API_037 / BuildingNo QueryByAddress` 或等效 adapter，只對單一 normalized address 執行一次，結果保存為候選與 resolver ledger，不建立 formal COP data；以 unit/integration test 驗證未點擊時 call count=0、點擊後只打一筆 resolver、回傳多候選仍需選定。
- [x] 3.8 覆蓋 Requirement: Formal COP requires confirmed registry key；formal pull 必須接受「付費 resolver 回來後由使用者選定的一筆候選」作為 confirmed registry key，但拒絕 resolver 未確認、多候選未選與 resolver 查無結果；以 integration test 驗證 resolver success -> selection -> formal pull，以及 resolver result without selection -> `registry_match_required`。

## 4. 本機 DB 與文件輸出

- [x] 4.1 覆蓋 Decision: Local DB owns customer registry data；盤點既有 `registry_query_runs` / `registry_query_api_calls` 是否足夠保存 normalized address、registry key、api_set_hash、cache 與 sourceRunId；不足時新增 migration 014 並加回溯安全測試。
- [x] 4.2 覆蓋 Requirement: Disclosure generation uses saved formal JSON only，並覆蓋 Decision: PDF and preview never trigger paid query；物調補件、HTML 預覽、PDF 只讀已保存 formal COP JSON；以 PDF assembly tests 驗證 paid call count 不增加。
- [x] 4.3 覆蓋 Requirement: Raw registry JSON SHALL remain local and non-downloadable；客戶不可下載 raw JSON；raw / parsed JSON 僅能在 App / local Web 內部管理明細檢視；以 UI tests 驗證無下載 CTA。
- [x] 4.4 覆蓋 Requirement: PDF SHALL reflect the confirmed object path；PDF 依 confirmed object type 套用建物或土地資料與該案件/物件補件圖資，不使用未選候選或其他案件圖資；以 PDF assembly tests 驗證建物/土地兩路徑與 paid call count 不增加。

## 5. Web / App E2E 驗收

- [x] 5.1 覆蓋 Requirement: Local Web SHALL gate Desktop App parity；Local Web E2E：啟動 `localhost:1420`，輸入多個地址，驗證 R02 discovery、manual required、候選確認、正式 COP、cache hit、物件頁自動帶入、PDF 使用保存資料。
- [x] 5.2 覆蓋 Requirement: Web and Desktop SHALL share discovery contract；Desktop App E2E：同一組場景在 macOS App 重跑；唯一差異是登入從 SaaS 取得 AIRE 授權碼，其餘結果必須與 Web 一致。
- [x] 5.3 Windows 路徑：若 VM 可跑，重跑 App smoke；若 VM 不可跑，至少產出 Windows runner/installer artifact、啟動證據與明確阻塞報告，不得只用 build 成功代替。
- [x] 5.4 覆蓋 Requirement: Address-to-COP E2E SHALL preserve evidence；更新 release acceptance checklist/report，附上 Playwright artifact、查詢 JSON、費用紀錄、cache hit、sourceRunId、error log、PDF artifact、本機 DB 證據與 macOS/Windows 驗收證據。
- [x] 5.5 覆蓋 Requirement: Address-to-COP E2E SHALL preserve evidence；建立 live discovery matrix，至少包含台南門牌、高雄正確門牌、高雄疑似錯字門牌、地段地號、查無地址、多候選建號，正式 COP 前驗證所有未確認案例 paid API call count=0；以 Playwright/headed Chrome artifact 與 saved JSON 驗證。
- [x] 5.6 覆蓋 Requirement: Paid address-to-parcel resolver SHALL be explicit and candidate-only；在 live/E2E matrix 增加付費 resolver opt-in 劇本：零成本查不到建號時不自動付費、UI 顯示費用與可能查無結果、使用者明確點擊後才打 resolver、結果進候選確認、未 confirmed 前不打 formal COP；以 Playwright/headed Chrome artifact、ledger rows 與 saved JSON 驗證。

## 6. 手測回饋修正批次

- [x] 6.1 覆蓋 Requirement: Registry pending cases SHALL be creatable after discovery failure，並覆蓋 Decision: Registry pending cases keep sales flow moving；`/cases/new` 在地址 discovery 找不到地段、地號或建號時仍能建立 `registry_pending` 案件，正式 COP 與 trusted PDF 仍被阻擋；以 component test、mock-backend test 與手動 `localhost:1420` 建案驗證。
- [x] 6.2 覆蓋 Requirement: Property type SHALL expose customer-facing categories，並覆蓋 Decision: Property types use customer-facing detailed categories；新增/編輯案件的物件類型至少顯示大樓、公寓、透天、成屋、農舍、土地、農地、店面、工廠、其他，舊 `residential` / `land` 資料仍可讀；以 unit test、DOM test 與手動 dropdown 驗證。
- [x] 6.3 覆蓋 Requirement: Supplement image assets SHALL belong to the current case object，並覆蓋 Decision: Supplement assets belong to a case object；把地籍圖、空拍圖、格局圖、地標圖上傳入口收斂到補件流程並綁定目前案件/物件，PDF 只讀該案件圖資且不得重用其他案件圖片；以 case asset tests、PDF assembly test 與手動補件驗證。
- [x] 6.4 覆蓋 Requirement: Billing records SHALL be grouped and drillable by registry object type，並覆蓋 Decision: Billing records are object-oriented and drillable；費用紀錄列出戶建/土地、查詢目標、狀態、交易序號與費用，點入明細可看 saved run、cache/sourceRunId、錯誤與 API call rows；以 component test、ledger unit test 與手動費用紀錄頁驗證。
- [x] 6.5 覆蓋 Requirement: Brand settings SHALL show persisted upload state，並覆蓋 Decision: Settings IA separates brand, audit log, and plan state；`品牌設定` Logo 上傳後顯示檔名、預覽或狀態、保存結果，重新整理後仍可看到已保存資訊；以 DOM test 與手動上傳驗證。
- [x] 6.6 覆蓋 Requirement: Settings navigation SHALL expose brand settings and audit log only，並覆蓋 Decision: Settings IA separates brand, audit log, and plan state；系統設定入口精簡成品牌設定與操作日誌，移除混淆的一般設定/個人設定綁定；以 navigation DOM test 與手動側邊欄驗證。
- [x] 6.7 覆蓋 Requirement: Plan settings SHALL show account role and license state，並覆蓋 Decision: Settings IA separates brand, audit log, and plan state；`方案與升級` 改為 `方案設定`，頁面顯示帳號身分/角色、授權狀態，試用顯示到期日，買斷顯示終身授權；以 DOM test 與手動方案設定頁驗證。
- [x] 6.8 覆蓋 Requirement: Address-to-COP E2E SHALL preserve evidence；補齊真實 Chrome/Playwright 驗收：`台南市永康區勝利街58巷4號` discovery 失敗可建立 pending 案件，人工補正後可 formal COP/cache/PDF，且所有已完成任務 checkbox 已更新為 `[x]`；以 headed Playwright、手動截圖與 `spectra analyze` / `spectra validate` 驗證。
- [x] 6.9 覆蓋 Requirement: Formal import results SHALL be visible before PDF，並覆蓋 Decision: Formal import must be inspectable before PDF；物件審核流程改成欄位初審、補件與現場、正式資料匯入、物件資料總覽、PDF 檢查，頁首不得有可跳過流程的預覽 PDF CTA；正式資料匯入完成後列出取得欄位、未取得原因、費用與 PDF 目標區塊；以 component test 驗證。
- [x] 6.10 覆蓋 Requirement: PDF SHALL include imported building detail fields or explain missing reasons，並覆蓋 Decision: PDF completeness is field-level and reasoned；用固定東和路 fixture 驗證登記坪數、主建坪數、附屬建物、公共設施、車位坪數、建物現況、法定用途、所有權人比對、Logo、生活機能與實價登錄要進 PDF 或在 PDF 檢查列出缺漏原因；以 PDF assembly test 與 `pdftotext` smoke 驗證。
- [x] 6.11 覆蓋 Requirement: Land value increment tax SHALL have an estimate mode；土地增值稅先做估算模式，缺公告現值、前次移轉現值、成交價或持分時列出缺漏，資料足夠時顯示估算與估算依據；以 unit test、PDF assembly test 與 PDF 檢查 DOM test 驗證。
- [x] 6.12 覆蓋 Requirement: PDF SHALL include imported building detail fields or explain missing reasons；建物外觀採自動街景/外觀參考加案件補件覆蓋，補件流程提供現場外觀照片欄位，PDF 優先使用案件外觀照片並在 PDF 檢查顯示覆蓋狀態；以 component test、asset/PDF assembly test 驗證。
