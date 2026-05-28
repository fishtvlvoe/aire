## Context

AIRE 的正確交付順序是：先完成本機 Web 版，再把同一套能力封裝成 Mac / Windows App。App 版不是第二套產品流程；它只替換登入授權入口，改為從 SaaS 取得 AIRE 授權碼，其餘地址查詢、R02 discovery、COP formal pull、本機 DB、cache、案件、物調、HTML 預覽、PDF 與查詢紀錄都要與本機 Web 版一致。

Fish 已明確修正主流程認知：應先打 EasyMap R02 找地段、地號、建號，再用 confirmed registry key 打 COP 正式資料。COP 不應作為主流程的模糊地址 discovery 入口，因為模糊地址可能產生多筆件號與高額費用，且目前 live probe 顯示直接地址查詢不可靠。例外是使用者在零成本 discovery 失敗後明確同意付費時，可打一次地址轉地號/建號 resolver；resolver 只產生候選，不等於正式 COP 謄本資料。

## Goals / Non-Goals

Goals:

- 讓本機 Web 完整跑通地址輸入、R02 discovery、使用者確認、COP formal pull、本機保存、cache、防重複、物件自動帶入、物調與 PDF。
- 讓 UI/UX 對客戶保持簡單：客戶只看到案件資料、確認動作、費用與結果，不看到 API、JSON、COP、R02、sourceRunId 等技術詞。
- 讓 App 封裝繼承 Web 已驗收流程，避免 Web 做好後 App 又重複出現 mock、空資料、查不到或 PDF 重新付費查詢。
- 讓客戶地政查詢資料留在客戶本機 AIRE DB，不進 OPCOS / SaaS 雲端 DB。
- 讓 discovery 失敗時仍可建立 `registry_pending` 案件，並把缺漏地政鍵、權狀、謄本、圖資與人工確認集中在補件流程。
- 讓設定資訊架構只保留客戶會理解的品牌設定、操作日誌、方案設定，避免把個人設定、品牌交付、授權與升級入口混在一起。

Non-Goals:

- 不重做 UI 骨架。
- 不做 SaaS parity。
- 不做 auto-update。
- 不讓未確認地址或 mock 資料觸發正式 COP 查詢。
- 不把 raw JSON 做成客戶下載功能。
- 不把同一張 PDF 圖資當成所有案件或所有物件共用的全域資產。
- 不在本 SR 重做整個側邊欄視覺版型，只調整必要命名、分組與狀態呈現。

## Architecture Decisions

### Decision: Web is source of truth; App is parity wrapper

本機 Web 是第一階段唯一驗收標準。Mac / Windows App 必須沿用 Web 的 domain service、資料格式、E2E 劇本與資料保存規則。App 版唯一允許差異是登入授權：App 從 SaaS 取得 AIRE 授權碼，成功後用 OS 安全儲存 session。

如果 Web 可查但 App 不可查，視為 App 封裝錯誤。如果 App 又出現 mock 假成功、空資料或 browser partial success，視為未完成。

### Decision: R02-first discovery, COP-after-confirmation

標準流程：

```text
/cases/new 輸入地址
  -> classify input kind: doorplate | land_descriptor | incomplete
  -> normalize address
  -> 查本機 discovery cache
  -> cache miss 時由 local proxy 或 Tauri/Rust 查 EasyMap R02
     - doorplate: 門牌清單 -> 門牌 detail -> 座標反查地段/地號/建號
     - land_descriptor: 地段清單 -> 地號定位 -> 土地明細/建號候選
     - incomplete: 進 manual_required，不打外部付費查詢
  -> 保存 R02 raw JSON / parsed JSON / errors / sourceRunId
  -> 顯示可理解候選資料
  -> 若 zero-cost 找不到建號且使用者明確同意，可打一次付費地址轉地號/建號 resolver
  -> resolver 回傳仍只進候選清單，不自動 confirmed
  -> 使用者選定單一候選，或人工補正地段/地號/建號
  -> 產生 confirmed registry key
  -> 預估正式查詢費用
  -> 使用者確認後才打 COP
  -> 保存 COP raw JSON / parsed JSON / billing / cache / errors
  -> 自動帶入案件、物調、預覽與 PDF
```

預設 discovery 永遠是 zero-cost。付費地址轉地號/建號 resolver 是使用者明確同意後的例外流程，不能自動 fallback、不能 fan-out，也不能直接產正式資料。正式 COP 查詢仍必須有 confirmed registry key。

### Decision: Input kind controls the discovery route

系統必須先判斷使用者輸入屬於三種型態：

- `doorplate`: 有縣市、行政區、路街巷弄與門牌號碼，走 R02 門牌 discovery。
- `land_descriptor`: 有縣市、行政區、地段名稱與地號，走 R02 地段/地號 discovery。
- `incomplete`: 無法判定，或缺少必要欄位，直接進 `manual_required`，不打正式 COP。

輸入語意同時決定物件意圖：含路、街、巷、弄、號、樓、之號等門牌語意時，物件意圖是建物；含「段」與地號時，物件意圖是土地。地段地號不是門牌。土地物件輸入地段與地號時，系統要自動判定為土地 discovery 路徑，查出土地候選；若土地明細含建號，再把建物候選列出供使用者選擇。門牌 discovery 若查不到，但同縣市/行政區內存在相似路名或常見寫法差異，只能顯示修正建議並要求使用者重送 discovery，不得自動改寫成 confirmed key。若門牌/樓層輸入只定位到土地而沒有建號，案件仍是建物意圖，必須顯示「建號需人工確認」，不得自動改成土地案件。

Alternatives Considered:

- 所有輸入都丟門牌 parser：否決，因為地段地號不是門牌，會讓土地案件永遠查不到或進錯 API。
- 對疑似錯字自動改正後繼續查：否決，因為地址別名與錯字可能對到不同標的，必須由使用者確認。

### Decision: Candidate selection is a paid-query gate

候選資料只代表「可能是這個物件」，不是正式查詢目標。若 R02 回傳多筆土地候選、建號候選或低信心候選，UI 必須讓使用者選定一筆，或改走人工補正。選定前正式 COP 按鈕不可用，後端也必須拒絕 formal pull。

付費查詢禁止 fan-out：

- 多筆候選未選定，不打 COP。
- 使用者未確認，不打 COP。
- 疑似錯字只顯示建議，不打 COP。
- `registry_pending` 案件可以建立，但不打 COP。
- PDF/預覽產生時不重打 COP。

這條規則要同時存在於 UI 與後端 gate。不能只把按鈕 disabled 當成完成，因為 App、測試或未來 API 仍可能繞過 UI。

### Decision: Paid address-to-parcel resolver is an explicit exception

當門牌或樓層地址已被判定為建物意圖，但 R02/便民系統只找到地號或完全找不到可用建號時，系統可以顯示一個明確的「付費查詢建號」動作。此動作只允許使用者主動點擊，不得由系統自動觸發。

付費 resolver 的用途是把使用者確認要查的精準地址送到 COP `MOI_API_037 / BuildingNo QueryByAddress` 或等效的地址轉地號/建號 API，取得地段、地號、建號候選。這不是 formal pull，不能把回傳候選直接當成 confirmed key，也不能直接進 PDF。若回傳多筆候選，UI 必須讓使用者選一筆；若回傳一筆，也仍要顯示確認；若失敗，案件維持 `registry_pending` 或人工補件。

地號的角色固定如下：

- 地號可以查土地正式資料，但只能在土地 key confirmed 後進 formal land COP。
- 地號可用於 R02 detail 或 NLSC cadastral 類來源反查建號候選，但這些結果仍是候選。
- 只有地號不能保證鎖定單一建物；建物 formal COP 仍需要建號。
- 門牌/樓層輸入若只查到地號，仍是建物意圖 pending，不得自動降級為土地案件。

付費 resolver 的防浪費規則：

- 只對使用者目前確認的單一 normalized address 或使用者選定的修正地址打一次。
- 不對多筆候選、相似地址、附近門牌或系統猜測結果做批次 fan-out。
- 呼叫前必須顯示費用提示與「可能查無結果但仍可能產生費用」的 readable 說明。
- 呼叫後必須保存 run type、api call row、費用、錯誤、raw/parsed JSON、sourceRunId 與候選結果。

### Decision: Local Web uses local proxy, Desktop uses Tauri/Rust, contract shared

本機 Web 的 browser 不直接打 EasyMap R02 或 COP。它只打 same-origin local API，由 Node local proxy 執行 discovery。Desktop App 走 Tauri/Rust command。兩者必須回傳同一份 `DiscoveryResult` 與 `FormalPullResult` contract，避免 Web / App 分叉。

Production browser build outside Desktop App 不開放 local discovery proxy，應回 `local_proxy_unavailable` 或等效狀態。

### Decision: Customer UI hides backend complexity

客戶 UI 文案使用：找到物件資料、需要確認、已帶入既有資料、預估查詢費用、查詢完成、查詢失敗。不得在主要 UI 顯示 API、JSON、COP、R02、sourceRunId、payload、adapter、parser 等技術詞。

技術明細仍保存於本機 DB，可在管理/除錯明細中檢視，但不得增加客戶操作負擔。

### Decision: Local DB owns customer registry data

客戶地政資料、查詢紀錄、raw JSON、parsed JSON、費用、錯誤與 cache metadata 儲存在客戶本機 AIRE DB。OPCOS / SaaS 只保存帳號、方案、授權、AIRE 授權碼、device session / entitlement 狀態，不保存客戶查詢 JSON。

既有 `registry_query_runs` 與 `registry_query_api_calls` 是優先使用的 ledger。若缺少穩定 cache key，新增 migration 014 補 `api_set_hash` 或等效欄位與索引，但不得破壞既有資料。

### Decision: Duplicate prevention is warning + autofill, not hard block

同一物件可能有多個案件，所以不得用 hard unique block 禁止建立新案件。系統應：

- normalized address 命中既有 discovery 時，自動帶入地段、地號、建號候選。
- confirmed registry key 命中既有案件時，提示「系統中已有同樣資訊」，提供開啟既有案件或建立新案件。
- registry key + API set 命中既有正式查詢時，走 cache hit，費用 0，sourceRunId 指向原始付費 run。
- 地址相似但不確定相同時，只顯示可能重複，不自動合併。

### Decision: Minimal COP API set follows confirmed property type

R02 或人工確認後有建號，視為建物流程，只查建物所需正式 API。沒有建號時走土地流程，只查土地所需正式 API。系統在正式查詢前顯示預估費用，避免模糊地址自動造成多筆高額查詢。

案件分類由系統自動帶入但允許客戶修正。R02 只做粗分類：建物或土地。COP 正式資料回來後，再用 MAINUSE、建物型態、樓層、總樓層、使用分區等資料細分到既有 property type 類別，例如 farmland、townhouse、apartment、highrise、residential-land、farmhouse、studio、storefront、factory、industrial-land、commercial-land、village-land、other-land。

土地流程與建物流程的物調表不同。建物物調表優先收樓層、總樓層、格局、屋況、建物用途、管理型態、格局圖與室內照片。土地物調表優先收使用分區、地目/使用現況、臨路、面寬、深度、農地/商業用地/住宅用地/工業用地/其他分類、地籍圖、空拍圖與地標圖。PDF 只能使用該案件/物件已保存的正式資料與補件圖資。

### Decision: Registry pending cases keep sales flow moving

便民/R02 discovery 找不到地段、地號、建號時，建立案件不應失敗。系統應建立 `registry_pending` 案件，保留地址、客戶輸入、discovery diagnostics 與缺漏欄位，並把案件導到補件/人工確認流程。正式 COP 查詢、正式地政欄位可信標記與 PDF trusted output 仍必須等 `registry_confirmed`。

Alternatives Considered:

- 繼續要求地段與地號才能建立案件：否決，因為上游查不到時業務會被卡死，無法先收權狀、謄本、稅單、屋主提供資料與圖資。
- 把 discovery failure 視為正式查詢失敗：否決，因為 discovery 是 zero-cost candidate step，不是正式 COP 付費流程。

### Decision: Property types use customer-facing detailed categories

新增案件與案件編輯的 property type 選項必須至少包含大樓、公寓、透天、成屋、農舍、土地、農地、店面、工廠、其他。舊資料的 `residential` 可映射成成屋/建物預設族群，舊資料的 `land` 可映射成土地預設族群，但 UI 不得只剩兩個抽象選項。

Alternatives Considered:

- 保留 `residential | land` 兩種內部選項：否決，因為客戶實際分類需要可讀、可修正，且目前手測已確認 UI 選項不足。
- 只靠 COP 回來後自動分類，不讓使用者先選：否決，因為 `registry_pending` 案件在正式查詢前也需要業務分類。

### Decision: Supplement assets belong to a case object

地籍圖、空拍圖、格局圖、地標圖是補件資料，必須綁定目前案件/物件。資料來源或 PDF 設定頁不得提供看起來會套用到所有案件的全域圖資上傳。PDF 產生時只讀該案件/物件已保存的補件資產，缺圖時保留空白或標示未提供，不得重用其他案件圖片。

Alternatives Considered:

- 維持全域 PDF 圖資欄位：否決，因為每個不動產物件圖資不同，會造成錯誤套圖。
- 只允許 PDF 產生前一次性上傳：否決，因為補件流程才是業務收集資料的正確節點。

### Decision: Billing records are object-oriented and drillable

費用紀錄不只顯示服務列，還要顯示查詢目標類型與物件：戶建、土地、地址/地政鍵、狀態、交易序號與費用。每列正式查詢紀錄可開啟明細，查看 saved run、API call rows、cache/sourceRunId、錯誤與 readable diagnostics。

Alternatives Considered:

- 只顯示月使用量與總金額：否決，因為使用者無法追溯哪個物件被查、是否 cache、是否應收費。
- 直接顯示 raw JSON：否決，因為主要 UI 需要客戶可讀，raw/parsed JSON 只放管理明細。

### Decision: Settings IA separates brand, audit log, and plan state

設定區命名與分組固定為：品牌設定、操作日誌、方案設定。品牌設定負責 Logo、主題與交付文字；操作日誌負責系統操作紀錄；方案設定負責帳號身分/角色、方案、授權狀態、試用到期日或終身授權。`品牌與交付資訊` 改名為 `品牌設定`，`方案與升級` 改名為 `方案設定`。

Alternatives Considered:

- 保留一般設定、個人設定、品牌與交付資訊、方案與升級混合入口：否決，因為目前 UI 語意不一致，使用者不知道每頁負責什麼。
- 把方案設定做成銷售升級頁：否決，本機 App 目前最重要是清楚呈現授權與帳號狀態。

### Decision: PDF and preview never trigger paid query

物調補件、HTML 預覽與 PDF 只讀已保存的 case data 與 formal COP JSON。產生文件時禁止重新打付費 COP。若只有候選或人工參考資料，預覽可顯示但必須標示需要正式查詢或人工確認，不得標成正式可信謄本資料。

### Decision: Formal import must be inspectable before PDF

正式資料匯入（付費）不是黑箱狀態按鈕。使用者付費前必須看到預估費用與會查詢的項目；付費後必須在案件頁看到本次取得的欄位、欄位值、未取得原因、費用、查詢狀態，以及每個欄位會同步到哪個物件資料或 PDF 區塊。UI 不得只顯示「已完成」或只把明細藏在管理 JSON。

物件審核流程順序調整為：

```text
欄位初審
  -> 補件與現場
  -> 正式資料匯入（付費）
  -> 物件資料總覽
  -> PDF 檢查 / 預覽 / 匯出
```

`物件資料總覽` 是 PDF 前的文字版總表。它必須彙整案件資料、補件/現場資料、正式匯入資料、圖資資料與仍缺資料。`PDF 檢查` 必須列出即將進入 PDF 的文字內容與圖資狀態，再提供 PDF 預覽或匯出。頁首不得提供可跳過流程的 `預覽 PDF` 主 CTA。

### Decision: PDF completeness is field-level and reasoned

PDF 產生前後都必須可追蹤欄位狀態。建物流程至少追蹤：

- 登記坪數
- 主建坪數
- 附屬建物
- 公共設施
- 車位坪數
- 建物現況
- 法定用途
- 所有權人比對
- Logo
- 生活機能：市場、公園、學校、交通
- 實價登錄行情
- 土地增值稅估算
- 建物外觀照片

如果欄位沒有進 PDF，系統必須能區分原因：上游未回、資料已回但未存、已存但尚未映射、尚未補件、尚未設定、或需要正式資料。這些原因要出現在 `物件資料總覽` 或 `PDF 檢查`，不能只讓 PDF 空白。

土地增值稅第一版採估算，不宣稱正式稅額。估算可使用成交價、附近地段實價登錄行情、公告現值、前次移轉現值、持分等已知資料；缺必要欄位時顯示估算依據與缺漏欄位。正式稅額仍以稅捐機關資料為準。

自動位置圖、空拍圖、生活機能與街景/外觀圖可以失敗，但失敗不得靜默。街景或外觀定位錯誤時，補件流程必須提供現場外觀照片覆蓋欄位，PDF 優先使用案件/物件已保存的現場照片。

## Implementation Contract

- `DiscoveryResult` must include status, source, candidates, errors, trustedForPdf, normalizedAddress, totalCostCents=0, sourceRunId/cacheHit when reused.
- `DiscoveryResult` must include `inputKind`, intended object type, parsed input fields, candidate confidence, `requiresCandidateSelection`, suggested corrections when available, and a zero-cost guarantee.
- `FormalPullResult` must include confirmed registry key, selected API set, cost estimate, actual cost, cacheHit, sourceRunId, raw/parsed JSON references, and readable error state.
- Paid address-to-parcel resolver must be represented as a candidate-producing run, not as formal COP data; it requires explicit user confirmation, records cost/error evidence, and still requires candidate selection before formal COP.
- `/cases/new` must check local duplicate/cache before external discovery, save discovery attempts, and require confirmed registry key before formal COP.
- Formal COP server code must reject multiple unselected candidates and must prove `api_call_count=0` for unconfirmed discovery outcomes.
- `/cases/new` must allow `registry_pending` case creation when discovery cannot resolve section or land number, then route missing registry details to supplements/manual confirmation.
- Property type options must include customer-facing detailed categories and keep backward-compatible mapping for old `residential` and `land` values.
- Supplement image uploads must be saved under the current case/object and must not mutate global PDF settings or unrelated cases.
- Billing records must expose object type, target, status, transaction id, fee, cache/source metadata, and a drill-down detail view.
- Settings routes and labels must use `品牌設定`, `操作日誌`, and `方案設定`; logo uploads must show selected filename plus persisted status, and plan state must show role plus trial/perpetual authorization state.
- Implementation tasks are not complete until the corresponding `tasks.md` checkbox is changed from `[ ]` to `[x]` after verification evidence exists.
- App login must use SaaS AIRE 授權碼, then share the same post-login flow as Web.
- PDF assembly must have tests proving paid call count remains unchanged.
- Formal import preview must expose acquired fields, missing fields, costs, and PDF targets without exposing raw JSON in the main customer UI.
- PDF assembly must map saved formal data and supplement data into the PDF field table for registered area, main building area, auxiliary area, common area, parking area, legal use, owner comparison, estimated land value increment tax, real-price summary, life amenities, logo, and exterior photo fallback state.
- Missing PDF fields must have a readable reason in the workbench summary or PDF check step.

## Risks / Mitigations

- External R02 may change shape or block requests. Mitigation: save raw diagnostics, keep manual confirmation path, and test parser separately from UI.
- Live COP tests cost money. Mitigation: cache-first, known registry fixtures, explicit fee estimate, and cache hit assertions.
- Web/App parity may drift. Mitigation: one shared contract and same E2E scenario must run against local Web and App.
- Customers may be confused by technical terms. Mitigation: customer UI hides backend names; management details keep evidence.

## Rollback Plan

If automatic R02 discovery is unstable, keep manual confirmed registry key input and COP formal pull gate active. Never roll back to mock placeholder auto-success or PDF-time paid lookup.
