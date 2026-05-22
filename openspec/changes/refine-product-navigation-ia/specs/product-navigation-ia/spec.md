# product-navigation-ia Specification

## Purpose

定義 AIRE 正式產品的一級、二級、三級導覽與點擊語意，避免側欄、頁內 tabs、案件列 CTA 在同一頁重複，讓使用者能預期每一次點擊後會到哪一層。

## ADDED Requirements

### Requirement: Product navigation SHALL follow a three-level information architecture

AIRE 產品導覽 SHALL 分為三層：

- 一級：全域產品模組，例如「案件管理、地政資料、產出文件、系統設定」。
- 二級：模組內頁面，例如「案件總覽、地政查詢、費用紀錄、授權與升級」。
- 三級：單一案件內工作台，例如「基本資料、地政資料、揭露資料、現場必問、補件、PDF 檢查」。

同一個畫面 SHALL NOT 同時重複顯示相同名稱的一級或二級導覽。

當使用者點擊一級或二級選單時，主內容區 SHALL 切換到該選單對應的工作情境。系統 SHALL NOT 把所有一級、二級、三級內容全部塞在同一個頁面中。

#### Scenario: Cases route stays at the second level

- **GIVEN** 使用者開啟 `/cases`
- **WHEN** 案件資料載入完成
- **THEN** 畫面 SHALL 顯示案件總覽與案件選擇
- **AND** 畫面 SHALL NOT 顯示與側欄重複的「案件總覽、說明書工作台、補件清單」頁內 tabs
- **AND** 畫面 SHALL NOT 顯示案件內三級模組內容

#### Scenario: Secondary navigation changes main content scope

- **GIVEN** 使用者在側欄點擊「案件總覽」
- **WHEN** 主內容完成載入
- **THEN** 主內容 SHALL 只顯示案件總覽、案件狀態與案件選擇
- **WHEN** 使用者在側欄點擊「說明書工作台」
- **THEN** 主內容 SHALL 顯示「請先選擇案件」或可進入工作台的案件選擇，不得同時攤開案件內所有工具
- **WHEN** 使用者在側欄點擊「補件清單」
- **THEN** 主內容 SHALL 切換為補件任務清單，不得顯示完整案件總覽與工作台內容

#### Scenario: Case detail route owns the third level

- **GIVEN** 使用者在 `/cases` 點擊一個案件
- **WHEN** 系統導向 `/cases/:id`
- **THEN** 畫面 SHALL 顯示該案件的工作台
- **AND** 案件內 SHALL 可以切換基本資料、地政資料、揭露資料、現場必問、補件、PDF 檢查等三級任務

### Requirement: Navigation entries SHALL have one click meaning

每個可點擊導覽入口 SHALL 只代表一個明確目的：

- 切換全域模組。
- 打開模組內二級頁。
- 進入或操作單一案件。

同一列或同一區塊 SHALL NOT 同時放兩個視覺上不同、但行為相同的主動作。

#### Scenario: Case row has a single primary action

- **GIVEN** 使用者位於案件總覽
- **WHEN** 一列案件顯示在畫面中
- **THEN** 系統 SHALL 提供一個主要方式進入案件工作台
- **AND** 若整列可點，任何「開啟工作台」按鈕 SHALL 與整列點擊完全相同行為
- **AND** 系統 SHALL NOT 讓使用者誤以為列點擊與按鈕點擊會進入不同功能

### Requirement: Case-scoped tools SHALL not appear before selecting a case

現場必問、正式補件、PDF 檢查、資料來源審核、欄位審核 SHALL 屬於單一案件工作台範圍。

這些工具 SHALL NOT 在未選擇案件的 `/cases` 總覽頁攤開。

#### Scenario: Field visit tools are case-scoped

- **GIVEN** 使用者開啟案件總覽
- **WHEN** 尚未選擇案件
- **THEN** 畫面 SHALL NOT 顯示「現場必問工作台」完整操作面板
- **WHEN** 使用者進入某一案件工作台
- **THEN** 系統 SHALL 在案件內提供現場必問入口

### Requirement: Customer-facing labels SHALL hide implementation enums

客戶前台 SHALL 使用中文業務詞呈現方案、狀態與功能可用性。

客戶前台 SHALL NOT 顯示 `BASIC`、`pro`、`advanced`、`MOI_API_*`、raw error code、backend enum。

#### Scenario: Upgrade-gated tools use customer language

- **GIVEN** 某個功能需要升級
- **WHEN** 客戶在前台看到該功能狀態
- **THEN** 系統 SHALL 顯示「尚未升級」、「基本方案」、「進階方案」或「已開啟」等中文文案
- **AND** 系統 SHALL NOT 顯示 `BASIC`、`pro`、`advanced`
