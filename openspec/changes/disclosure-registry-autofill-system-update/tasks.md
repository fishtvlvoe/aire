## 1. Field-source matrix

- [ ] [P] 1.1 覆蓋 Phase 1: 欄位來源矩陣。新增欄位盤點測試，讀取 `docs/dossier-implementation-spec.md`、`docs/0417-new/建安不動產欄位總表.md`、`docs/0417-old` 的農地/農舍/透天清單，驗證「Matrix SHALL classify every disclosure field by source and automation state」需要的章節、欄位鍵、物件類型、資料來源、automation state、service codes、required flag 都存在。
- [ ] 1.2 實作 `disclosure-field-source-matrix` 產生器與靜態輸出，將現有土地/成屋 schema 與文件欄位對齊，並滿足「Matrix SHALL identify blank-field gap reasons」：把缺口標成 `mapping_gap`、`integration_gap`、`manual_required` 或 `not_supported`。
- [ ] 1.3 產出欄位覆蓋報告，明確列出農地、農舍、透天別墅哪些欄位應由地政 API、GIS、公開資料、自動推導或人工補件完成，並滿足「Private owner identity SHALL be owner-provided and not reverse-looked-up」：私人屋主姓名只能標示為屋主提供、正式謄本/OCR 或人工輸入，MOI_API_009 只能作已知姓名比對。

## 2. MOI service catalog

- [ ] [P] 2.1 覆蓋 Phase 2: MOI/COP 服務目錄。新增 catalog parser 測試，以 `docs/cop-scrape/02-服務列表/pricing.json`、`merged_services.json`、`05-服務說明文件` 驗證「Catalog SHALL represent scraped COP/MOI service metadata」需要的服務代碼、名稱、價格、文件來源、權限與分類可被解析。
- [ ] 2.2 實作 `moi-service-catalog`，支援 `required`、`fallback`、`free_enrichment`、`billing_only`、`restricted`、`defer` 分類與 `free`、`auth_free`、`price_by_row`、`price_by_location`、`price_by_duration`、`restricted`、`unknown` 價格政策。
- [ ] 2.3 將 catalog 與 field-source matrix 交叉驗證，滿足「Catalog SHALL drive implementation coverage decisions」：凡 matrix 標成 `registry_api` 或 `gis_layer` 的欄位，必須能指出已串接服務、未串接服務、fallback 服務或不可用原因。

## 3. Outcome and cost ledger

- [ ] [P] 3.1 覆蓋 Phase 3: 成功/失敗與費用帳。新增 outcome classifier 單元測試，覆蓋「Outcome classifier SHALL classify transport, MOI, empty, domain, restricted, and parse results」需要的 HTTP 失敗、MOI 成功、`RETURNROWS = 0`、COP309、restricted、parse failure 六類結果。
- [ ] 3.2 實作 outcome classifier 與 cost calculator，滿足「Cost calculator SHALL apply catalog price policy to classified outcomes」：`domain_failure`、`restricted_failure`、`parse_failure` 預設不計費，且 `moi_success` 依 catalog price policy 計算。
- [ ] 3.3 擴充 land registry billing log 或新增 usage ledger migration，滿足「Usage ledger SHALL persist auditable call records」與「Every call SHALL be recorded with cost and transaction ID」：保存 service code、transaction id、MOI status/code/message、return rows、outcome、cost policy、billable amount、request fingerprint、case reference。
- [ ] 3.4 新增後台/API 查詢測試，驗證可依日期、服務、成功/失敗、歷程編號查詢總次數、成功次數、失敗次數、回傳筆數與未付款金額。

## 4. Registry autofill engine

- [ ] [P] 4.1 覆蓋 Phase 4: autofill engine。新增 autofill engine 測試，驗證「Autofill engine SHALL merge registry data into disclosure drafts without overwriting manual input」：地政資料可填欄位會帶入，手填欄位不被覆蓋。
- [ ] 4.2 實作 `registry-autofill-engine`，以 matrix 和 catalog 合併 land registry response、GIS/public data 與現有 draft，並滿足「Autofill engine SHALL expose gap reasons for unfilled fields」：輸出欄位值與 `filled_from_registry`、`mapping_gap`、`integration_gap`、`manual_required`、`not_supported` 狀態；私人屋主姓名不得由地政 lookup 反推，必須回傳 manual-required gap reason。
- [ ] 4.3 更新 `land-registry-field-mapping` 相關程式，滿足「Field mapping SHALL be config-driven, not hard-coded in Rust」：mapping 以 service code 與 field key 為主，不再只靠分散硬編欄位。

## 5. UI, PDF, and property-type coverage

- [ ] 5.1 覆蓋 Phase 6: UI/UX 審核工作台。新增 UI contract 測試或 Storybook/Playwright fixtures，驗證「Registry autofill review UX SHALL provide a review workspace for field status, source, gap, and cost」：三欄工作台、欄位狀態標籤、來源面板、費用摘要與補件清單都可見。
- [ ] 5.2 更新土地與成屋 disclosure form 測試，驗證「Land disclosure form fields」與「Residential disclosure form fields」：欄位旁可顯示地政帶入、API 未串、需人工、不可查等狀態，且不阻擋使用者手動完成。
- [ ] 5.3 更新土地與成屋表單 UI，滿足「Registry autofill review UX SHALL define accessible interaction states」：顯示欄位來源、缺口原因、費用提示、最後查詢狀態、loading、success、empty、error、partial 狀態，避免可查欄位默默空白。
- [ ] 5.4 新增 API 呼叫明細與費用稽核 UI，滿足「Registry autofill review UX SHALL provide an auditable MOI usage dashboard」：日期/服務/狀態/歷程編號篩選、統計卡、明細表、錯誤訊息抽屜、未付款金額與失敗不計費原因。
- [ ] 5.5 執行視覺驗證，針對 1440px、1024px、768px 截圖確認工作台不重疊、文字不溢出、focus state 可見、input 有 label、主要操作目標至少 44px。
- [ ] 5.6 覆蓋 Phase 5: 物件類型覆蓋順序。更新 property type registry，滿足「Property type registry defines 13 types」、「Property types SHALL expose registry coverage profiles」與「Coverage profile SHALL drive phased implementation priority」：為農地、農舍、透天別墅加入 registry coverage profile，並讓後續 13 類物件能逐步補齊。
- [ ] 5.7 覆蓋 Phase 7: 升級功能 UI 與端口預留。新增 `PremiumFeatureGate` UI 測試，滿足「Premium feature entitlement ports SHALL expose locked and unlocked feature UI」、「Premium feature menus SHALL appear only after entitlement」與「Premium feature controls SHALL use disabled and enabled toggle states」：Basic 主選單只顯示原本地政 workflow；Google 地圖、進階圖資、Street View、AI 格局圖在未授權時只於系統設定或後台顯示灰色 disabled toggle 與升級入口，不常駐在案件工作台右欄；已授權後才新增主選單或可開關 toggle。
- [ ] 5.8 新增 entitlement adapter、費用責任與端口測試，滿足「Premium feature slots SHALL reserve document locations and cost ownership」、「Premium feature entitlement ports SHALL provide stable frontend and backend feature ports」與「Premium feature ports SHALL protect local case privacy」：空拍圖、地標圖、地籍圖、房子原有格局圖都有預留 slot；`customer_moi`、`aire_included`、`aire_metered`、`manual_upload` 分類清楚；`get_entitlements`、`request_feature_upgrade`、`open_opcos_upgrade`、`generate_google_map_preview`、`generate_ai_floor_plan_schematic` 等端口在未實作或未授權時回傳可辨識錯誤，不 silent fail；升級請求只傳 account/device/license/plan/feature metadata，不傳屋主、地址、地建號、registry payload、PDF 或案件圖片。

## 6. SR consolidation and verification

- [ ] 6.1 將 `moi-api-coverage-fallback-cost-map` 與 `moi-api-usage-ledger-and-cost-audit` 標記為由本 SR 取代並 park，確保後續只從 `disclosure-registry-autofill-system-update` 追蹤。
- [ ] 6.2 執行 `spectra analyze disclosure-registry-autofill-system-update --json` 與 `spectra validate disclosure-registry-autofill-system-update`，修到沒有 Critical 或 Warning。
- [ ] 6.3 實作完成後執行相關單元測試、Rust 測試、前端表單測試與後台查詢測試，確認欄位覆蓋、費用計算、ledger 統計、UI 狀態都符合本 SR。
