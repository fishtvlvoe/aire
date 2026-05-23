## Alignment

Fish 要的不是「可以產一份半空白 PDF」，而是：

```
屋主同意 + 地址 + 屋主姓名
  -> AIRE 真的打地政 API
  -> 把有回來的謄本/圖資/法規/公司資訊放進 PDF
  -> 沒回來的欄位才標補件或待確認
```

目前錯在資料層級被混在一起：

| 資料類型 | 意義 | 可以做什麼 | 不可以做什麼 |
| --- | --- | --- | --- |
| 地址候選 `public_candidate` | 只證明地址可能對到某地號/建號 | 建立案件、提示待確認 | 當正式謄本輸出 |
| 正式 API `moi_api` | 已授權、正式調閱回傳 | 進 PDF、進正式欄位 | 被候選資料覆蓋 |
| 手動/屋主提供 `manual` | 使用者或屋主提供 | 進 PDF 並標來源 | 偽裝成 API 回傳 |
| mock | 開發假資料 | 測試 UI | 客戶 PDF 或交付驗收 |

## Current State Seen In Browser

Fish 目前看到兩個瀏覽器資料不一致，是因為一般 browser dev path 會 fallback 到 `mock-backend`，資料存在各瀏覽器自己的 localStorage `aire-mock-store`。因此：

- Chrome A、新 Chrome profile、Safari 會各有自己的案件清單與補件狀態。
- 這不是正式 SaaS 共用資料庫，也不是 Tauri native SQLite 的權威資料。
- 在這個 CR 完成前，browser localhost 只能當 UI 測試；正式驗收要走 native/Tauri 或共享 backend path。

產品需要避免誤導使用者：若目前是 browser mock state，頁面 SHALL 明確標示這是「本瀏覽器本機測試資料」，並提供匯出/匯入或重置輔助；客戶交付流程 SHALL 不以此作為真實資料來源。

## Required Data Flow

### 1. 新增案件

新增案件可以做地址候選判斷，但只能存成候選層：

- `registry_candidates`: 地址 lookup 與公開/候選資訊。
- `registry_trusted`: 正式 API 或人工確認資訊。
- `registry_failures`: 每個 API 的失敗原因與是否可重試。

若目前仍使用單一 `land_registry_data` 欄位，內部 schema 必須能清楚分層，且 PDF assembly 不得把 candidate 當 trusted。

### 2. 屋主授權

授權狀態不可只是一個 UI dialog。授權成功後應有可驗證狀態：

- `recordConsent(caseId)` 成功。
- UI 顯示此案件已具備正式查詢前提。
- 正式 pull button 或自動正式 pull 可執行。
- 若缺 API key、權限或餘額，顯示可行修復訊息。

### 3. 正式地政 Pull

有授權後至少要嘗試：

- 建物標示資料。
- 建物所有權資料。
- 他項權利/抵押權資料。
- 土地標示、土地所有權、地價/分區等與物件相關資料。

輸入不可只用 `lot_number = 0001`。地址 lookup 回傳若沒有足夠正式 parcel id/building id，系統要讓使用者補建號/地號，或使用已知可查 API 做下一步查詢。

目前建物案件的 PDF assembly 只指定 `building_registry`、`building_ownership`、`mortgages`，因此物調表土地區塊會缺：

- 地段、地號、使用分區、土地面積。
- 土地權利範圍、持分面積。
- 建蔽率、容積率。

建物欄位則依賴 `building_registry` 與 `building_ownership` 的欄位映射；若正式 pull 沒跑、只拿到 candidate、或 API 回傳 key 名稱未被 mapper 支援，就會缺：

- 建物面積、登記坪數、主建坪數、附屬建物、公共設施、車位坪數。
- 法定用途、主要建材、建築完成日、屋齡、樓層、建物權利範圍。

下列欄位不是地政 API 必然會給，系統 SHALL 提供補件欄位並標來源：

- 建物現況。
- 格局。
- 座向。
- 管理費。

「所有權人」有兩個來源：正式所有權資料或案件手動輸入。使用者在工作台修改姓名時，系統 SHALL 寫回案件 `owner_name` 或補件資料，並重新驅動所有權人比對與 PDF assembly；不得只改畫面上的暫存 input。

### 4. PDF Assembly

PDF assembly 規則：

```
trusted moi_api/manual -> 直接填 PDF
candidate only -> 顯示待確認，不阻止正式 pull
failed -> 顯示原因與重試/補件
mock -> 不得進客戶 PDF
```

若 persisted payload 只有候選或 failed，`assembleDossierData()` 不得提早結束正式 API pull。

### 5. 圖資

位置圖、空拍圖、街景/外觀圖要分成三種狀態：

- 已取得圖片 bytes：PDF 必須嵌入圖片。
- 使用者已上傳：PDF 使用上傳圖。
- 未取得：PDF 顯示空白框與補件說明。

驗收不能只看 PDF 下載成功，必須用 `pdfimages -list` 或視覺檢查確認圖片真的存在。

### 6. 設定與品牌欄位

設定頁需要完整保存並回填 PDF。這些是固定的全域交付設定，不屬於單一案件：

- 承辦人。
- 經紀人。
- 經紀人證號。
- 不動產經紀業。
- 經紀業證號。
- 公司地址。
- 公司電話。

目前程式已有 `/settings/branding` 與 `BrandTextSettings`，但欄位 label 與 PDF 名稱不一致，且入口不夠清楚。修正後的資訊架構：

```
系統設定
  -> 品牌與交付資訊
     -> 承辦人
     -> 經紀人
     -> 經紀人證號
     -> 不動產經紀業
     -> 經紀業證號
     -> 公司地址
     -> 公司電話
```

欄位對應：

| UI Label | Storage key | PDF field |
| --- | --- | --- |
| 承辦人 | `agent_name` | `cover.handlingAgent` |
| 經紀人 | `realtor_name` | `cover.licensedAgentName` |
| 經紀人證號 | `agent_cert_no` 或遷移後 `realtor_license_no` | `cover.licensedAgentCertNo` |
| 不動產經紀業 | `company_name` | `cover.brokerageCompanyName` |
| 經紀業證號 | `company_license_no` | `cover.brokerageLicenseNo` |
| 公司地址 | `company_address` | `cover.companyAddress` |
| 公司電話 | `company_phone` | `cover.companyPhone` |

封面、頁首/頁尾、簽章欄不得只留空 label。

### 7. 補件欄位

「地政匯入資料」是來源稽核，不應只停在 read-only JSON。系統 SHALL 將所有缺口轉為可處理補件：

- `需人工提供`：自動建立對應輸入欄位，來源標示為屋主提供/人工。
- `待資料`：保留重試正式查詢與人工補值兩條路。
- `查詢未成功`：顯示原因、可重試條件，必要時提供手動建號/地號欄位。
- 已補值後，預覽、PDF 與 JSON export 都要能看見該補值與來源。

這些補件不得只存在某個瀏覽器的 localStorage；正式資料路徑 SHALL 寫回案件權威資料 store。

工作台「修改」按鈕 SHALL 有真實儲存語意：

```
點修改 -> 編輯欄位 -> 完成
  -> validate 欄位
  -> 寫回案件或補件資料
  -> 重新整理資料來源狀態
  -> PDF 預覽讀到同一份值
```

### 8. 法規內容

法規內容要有 source of truth，不可只靠目前幾條 hardcoded 文案：

- 優先使用本地 legal clauses cache。
- 可手動同步 OPCOS 法規來源。
- PDF 法規告知頁與必要章節要完整列出目前產品定義的法規集合。
- 若同步失敗，顯示版本/缺漏，不默默少列。

## Verification Plan

1. 用真實 native/Tauri 或 backend integration path 驗正式 pull，不接受 mock-only。
2. 用 `0005` 類似地址與屋主姓名重建案件，執行授權、正式 pull、PDF 預覽、PDF 匯出。
3. 在系統設定儲存固定公司/經紀資料，確認既有案件與新增案件 PDF 都讀取同一份設定。
4. 對門牌建號查詢失敗、姓名比對待資料等缺口填補件，確認預覽與 PDF 回填人工值。
5. 用 `pdftotext` 檢查謄本欄位、法規、公司/經紀資訊。
6. 用 `pdfimages -list` 檢查圖資是否真的嵌入。
7. 用 Playwright headed E2E 驗 UI，但只作為使用流程驗收，不作為 API 真實性證據。

## Implementation Notes

- PDF assembly 對只有 `candidate`/`failed` provenance 且已有屋主姓名的案件，會重新嘗試正式 `land_registry_pull_data`，並把 trusted `moi_api` 結果寫回案件 `land_registry_data`，避免候選資料阻斷正式資料。
- Provenance schema 保留 `public_candidate`、`moi_api`、`manual`、`mock/raw_probe` 邊界；正式 API 回傳的陣列資料（例如抵押權/他項權利清單）也可被保存與讀取，不再被物件型別過濾掉。
- 工作台補件欄位除了 browser-dev `get_workbench_supplement` 之外，會同步寫回 `manual_registry_supplement`；PDF assembly 可從案件權威資料讀取格局、座向、管理費與建物現況，並標示人工來源。
- 正式 pull 失敗會拆成 API key、授權/認證、餘額、權限與查無資料等可處理狀態；地址候選只有 `0001` 這類 placeholder 且沒有建號/地號時，PDF assembly 不會拿 placeholder 去打正式 API。
- Graphify 檢查確認法規有 `LegalNoticeBlock`、`list_legal_clauses`、HTML renderer 三條路徑；主說明書已改為優先讀取 `list_legal_clauses` cache，HTML/PDF 共用完整 fallback 法規集合，設定頁同步狀態既有測試通過。
- 物件資料表已補齊 trusted registry mapping：土地地段/地號/分區、土地面積、權利範圍、持分面積、建蔽率、容積率、所有權人、取得日期與建物面積/用途/建材/完成日/屋齡/樓層等欄位；實價登錄會過濾不同行政區地址。
- PDF 圖頁已有 bytes 時會嵌入位置圖、空拍圖、外觀與格局/規劃圖；browser mock banner 已加上 JSON 對齊與 `aire-mock-store` reset 指引，並明確標示 mock-only 不作正式交付證據。
