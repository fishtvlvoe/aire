# product-ui-demo-alignment Specification

## Purpose

把 `UI-UX-DEMO-REFERENCE/registry-autofill-workbench.html` 與 `UI-UX-DEMO-REFERENCE/registry-autofill-settings.html` 轉成正式產品契約，避免只把幾個元件放進產品、但主流程、資料呈現、設定分類、前後端端口仍與 demo 不一致。

## ADDED Requirements

### Requirement: Product UI SHALL use the demo HTML files as the source of truth

AIRE 正式產品的地政自動填寫工作台與系統設定 SHALL 以 `UI-UX-DEMO-REFERENCE/registry-autofill-workbench.html` 和 `UI-UX-DEMO-REFERENCE/registry-autofill-settings.html` 作為 UI/UX 參考基準。

主產品路由 SHALL 不以舊版五步 wizard、零散 key-in page、或只有兩個項目的 sidebar 作為主要使用者體驗。

實作 SHALL 保留 demo 的資訊架構：資料夾式一級選單、案件與章節左欄、欄位審核右欄、設定分類頁、升級 toggle、費用與資料邊界集中在設定或查帳頁。

#### Scenario: Product route matches demo-level information architecture

- **GIVEN** 使用者開啟案件工作台
- **WHEN** 畫面完成載入
- **THEN** 主選單 SHALL 顯示「案件管理、地政資料、產出文件、系統設定」等一級分類
- **AND** 案件工作台 SHALL 顯示「案件與章節」與「欄位審核」兩個主要工作區
- **AND** 畫面 SHALL NOT 只顯示舊版五步 wizard
- **AND** 畫面 SHALL NOT 只顯示 demo 之外的簡化版「案件管理 / 設定」兩項導覽

### Requirement: Sidebar SHALL provide folder navigation, collapse, and profile entry

主選單 SHALL 使用與 workbench demo 相同的資料夾式分類與子選單。

主選單 SHALL 有明確收合按鈕與客戶頭像個人設定入口。

主選單 SHALL 只展開目前所在資料夾；其他一級資料夾 SHALL 以可開合按鈕呈現，避免所有子選單同時攤開造成畫面雜訊。

系統規則、方案說明、屋主資料邊界、費用歸屬、PDF 圖資欄位 SHALL NOT 以底部提示卡常駐在主選單或案件工作台。

#### Scenario: Sidebar exposes the expected folders

- **GIVEN** 使用者在桌面版開啟 AIRE
- **WHEN** 主選單展開
- **THEN** 「案件管理」SHALL 包含「案件總覽、說明書工作台、補件清單」
- **AND** 「地政資料」SHALL 包含「地政查詢、資料來源、費用紀錄」
- **AND** 「產出文件」SHALL 包含「PDF 預覽、列印與匯出」
- **AND** 「系統設定」SHALL 包含「地政授權、功能開關、授權與升級」
- **AND** 使用者 SHALL 可以從側欄底部開啟個人設定

#### Scenario: Sidebar folders avoid always-expanded clutter

- **GIVEN** 使用者位於「案件管理」路由
- **WHEN** 側欄展開
- **THEN** 系統 SHALL 顯示「案件管理」子選單
- **AND** 系統 SHALL NOT 同時顯示其他資料夾的所有子選單
- **WHEN** 使用者點擊「地政資料」資料夾
- **THEN** 系統 SHALL 展開「地政資料」子選單

### Requirement: New case flow SHALL be address-first with registry fallback

新增案件流程 SHALL 先讓使用者輸入地址或既有地政識別資料，由地政查詢判斷土地、建物、農舍、透天等資料組成。

人工選擇物件類型 SHALL 只在地政查不到、回傳多筆候選、或使用者刻意用地號/建號開案時顯示。

#### Scenario: Address lookup classifies the case automatically

- **GIVEN** 使用者在新增案件輸入可查詢地址
- **WHEN** 地政查詢找到土地與建物資料
- **THEN** 系統 SHALL 顯示土地筆數、建物筆數、判斷結果與需要審核的章節
- **AND** 系統 SHALL 隱藏人工物件類型下拉選單
- **AND** 系統 SHALL 導向 demo 定義的說明書工作台

#### Scenario: Ambiguous lookup shows manual selection only as fallback

- **GIVEN** 地址查詢失敗或回傳多個候選
- **WHEN** 使用者需要繼續建案
- **THEN** 系統 SHALL 以白話說明「查不到」或「需要人工確認」
- **AND** 系統 SHALL 顯示候選清單或人工物件類型選擇

### Requirement: Workbench SHALL show customer-facing field review, supplement, source, and cost states

說明書工作台 SHALL 顯示案件卡、地址與地政判斷、章節分類、本章完成度、欄位審核、資料來源、補件、費用、PDF 檢查等工作分頁。

欄位列 SHALL 顯示欄位名稱、目前值、資料來源、狀態、是否需補件、費用影響。顯示文字 SHALL 使用客戶可理解的繁體中文。

客戶工作台 SHALL NOT 顯示 `MOI_API_*`、`COP309`、transaction id、backend enum、`Basic`、`pro`、`advanced` 等工程或英文方案字。這些細節只能出現在費用紀錄、地政資料稽核、admin 或 debug view。

#### Scenario: Field review hides engineering labels

- **GIVEN** 欄位由 `MOI_API_005` 或 `MOI_API_037` 回填
- **WHEN** 客戶在欄位審核頁查看欄位
- **THEN** 來源 SHALL 顯示「建物所有權資料」、「門牌建號查詢」等中文名稱
- **AND** 狀態 SHALL 顯示「地政已帶入、需人工提供、待資料、查詢未成功」等中文狀態
- **AND** 客戶工作台 SHALL NOT 顯示原始 API 代碼或原始錯誤碼

### Requirement: Settings SHALL contain upgrade, registry rules, billing, PDF assets, and authorization categories

系統設定 SHALL 對齊 settings demo 的分類：「授權與升級、地政資料規則、費用與帳務、PDF 圖資欄位、地政授權」。

升級功能 SHALL 使用 iOS-style toggle。未升級 SHALL 灰色 disabled；已升級 SHALL 可開啟或關閉。

屋主資料邊界、費用歸屬、PDF 圖資位置、地政授權 SHALL 放在設定或專屬查帳頁，不得常駐在每個案件工作台。

#### Scenario: Settings owns the global rules

- **GIVEN** 使用者開啟系統設定
- **WHEN** 使用者點選「授權與升級」
- **THEN** 系統 SHALL 顯示 Google 地圖、空拍圖 / 街景參考、AI 格局圖整理、地籍圖整理等功能開關
- **AND** 未升級功能 SHALL 以 disabled toggle 顯示
- **AND** 已升級功能 SHALL 可以 toggle on/off
- **AND** 工作台 SHALL 不再顯示這些設定型說明卡

### Requirement: Cost and outcome ledger SHALL have visible customer and admin surfaces

地政查詢費用 SHALL 能在「地政資料 → 費用紀錄」或設定的費用入口查詢。

系統 SHALL 區分成功、失敗、0 元、免費 API、可計費失敗、回傳筆數與計算金額。客戶畫面 SHALL 用中文服務名稱與金額顯示；admin 或稽核畫面 SHALL 可以顯示 API code、交易序號、原始錯誤。

#### Scenario: Failed lookup is visible without charging by default

- **GIVEN** 地政查詢回傳查詢失敗
- **WHEN** 使用者查看費用紀錄
- **THEN** 費用紀錄 SHALL 顯示中文服務名稱、失敗狀態、0 元或規則定義的計費金額
- **AND** 客戶 SHALL 看得到為什麼沒有扣款或為什麼有扣款

### Requirement: Existing product-only capabilities SHALL be classified before reuse

目前產品中 demo 沒有的能力 SHALL 先被分類為「保留並移到設定/admin」、「保留但降為次要功能」、「另開 SR」、「移除主要流程」之一，不得直接塞進 demo-aligned 工作台。

#### Scenario: Legacy wizard is not the primary workflow

- **GIVEN** 舊版 `CaseWizard` 仍存在
- **WHEN** 使用者從案件總覽開啟案件
- **THEN** 主路由 SHALL 開啟 demo-aligned 工作台
- **AND** 舊版 wizard SHALL 只能保留在 legacy/dev/過渡路由或被逐步拆解重用

### Requirement: Visual verification SHALL compare implementation against the demo reference

完成實作前 SHALL 使用瀏覽器驗證正式產品畫面，而不只跑 build 或單元測試。

驗證 SHALL 至少覆蓋 1440px、1024px、768px 寬度，並確認 sidebar、工作台兩欄、設定分類、toggle、欄位列、文字不重疊。

#### Scenario: Browser screenshots pass visual gate

- **GIVEN** 實作已完成
- **WHEN** Playwright 或 browser tool 開啟正式產品與 demo reference
- **THEN** 截圖 SHALL 顯示資訊架構與 demo 一致
- **AND** 不得出現舊版主畫面、錯誤英文方案字、工程代碼、或與 demo 明顯不同的黑框/配色/間距
