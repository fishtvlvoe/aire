## ADDED Requirements

### Requirement: 案件列表提供 PDF 預覽與匯出動作

The case overview SHALL expose PDF output actions directly on each case row.

- **WHEN** a user opens `/cases`
- **THEN** each case row SHALL include an action named `預覽 PDF`
- **THEN** each case row SHALL include an action named `匯出 PDF`
- **THEN** each case row SHALL NOT include a separate action named `開啟工作台`
- **WHEN** the user clicks `預覽 PDF`
- **THEN** the app SHALL navigate to `/cases/:id/preview`
- **WHEN** the user clicks `匯出 PDF`
- **THEN** the app SHALL call the existing `export_pdf` path for that case

#### Scenario: row click still opens workbench

- **GIVEN** a case row is visible on `/cases`
- **WHEN** the user clicks the row body instead of a row action
- **THEN** the app SHALL navigate to `/cases/:id`

### Requirement: 新增案件只保留單一地政判斷入口

The new case form SHALL use one primary action for registry detection before case creation.

#### Scenario: primary button performs registry detection first

- **WHEN** a user opens `/cases/new`
- **THEN** the address field area SHALL NOT show a second inline `判斷地政資料` button
- **THEN** the form primary button SHALL be labelled `判斷地政資料` before detection
- **WHEN** the user fills an address and clicks the primary `判斷地政資料` button
- **THEN** the app SHALL execute registry detection
- **THEN** the app SHALL NOT create a case in the same click
- **WHEN** classification is visible
- **THEN** the form primary button SHALL be labelled `建立案件`

### Requirement: 工作台補件操作不可是無功能按鈕

The workbench SHALL keep supplement, field-visit, source review, and cost review in user-facing steps with visible outcomes.

#### Scenario: supplement actions change visible workbench state

- **WHEN** a user opens the `補件/現場` tab in the workbench
- **THEN** the user SHALL see upload controls for `地籍圖`, `空拍圖`, `格局圖`, `地標圖`, and `LINE 照片`
- **THEN** the user SHALL see editable field-visit questions in the same panel
- **THEN** the user SHALL NOT see a separate `現場必問` button
- **THEN** the user SHALL NOT see a separate `手動上傳覆蓋` button

#### Scenario: workbench has one chapter navigation system

- **WHEN** a user opens the workbench
- **THEN** the top work tabs SHALL be the only chapter switching controls
- **THEN** the sidebar SHALL NOT render a duplicate `說明書章節` button group
- **THEN** the tabs SHALL be `欄位`, `資料來源`, `補件/現場`, and `PDF 檢查`

#### Scenario: registry source and fee are visible before PDF check

- **WHEN** a user opens the `欄位` tab
- **THEN** the user SHALL see the current registry query cost
- **WHEN** the user opens the `資料來源` tab
- **THEN** the user SHALL see imported fields, source services, and status labels
- **THEN** the user SHALL be able to preview and download the source JSON

### Requirement: 個人設定與方案升級分工清楚

The settings pages SHALL separate personal editing from license and plan management.

#### Scenario: profile settings are editable and do not include license blocks

- **WHEN** a user opens `/settings`
- **THEN** the user SHALL see editable controls for personal name, Email, password, brand color, and brand Logo
- **THEN** the user SHALL NOT see account/license management
- **THEN** the user SHALL NOT see a generic operation-log card

#### Scenario: plan upgrade owns account/license and feature toggles

- **WHEN** a user opens `/settings?section=plans`
- **THEN** the user SHALL see account/license management
- **THEN** the user SHALL see plan cards for `基本款`, `進階款`, and `高級款`
- **THEN** feature toggles SHALL use `未啟用` and `已啟用` labels instead of `開發中`
- **THEN** the reserved feature area SHALL state `目前正在開發中。`

### Requirement: PDF 圖資缺稿時保留空白格局框

PDF output SHALL not insert unapproved floor-plan drafts and SHALL keep a printable blank frame when no final floor-plan asset exists.

#### Scenario: no floor-plan asset exists

- **WHEN** a building PDF is rendered without uploaded floor-plan image and without approved AI floor-plan conversion
- **THEN** the PDF SHALL include a `格局圖` page with an empty frame
- **THEN** the frame SHALL NOT contain upload placeholder text

#### Scenario: draft AI floor-plan conversion exists

- **WHEN** a floor-plan conversion exists with status `draft`
- **THEN** the PDF dossier SHALL NOT include that conversion as an approved floor-plan page

### Requirement: PDF 成交行情測試資料需符合案件地址

PDF preview fallback data SHALL not show fixed unrelated real-price rows for a different district.

#### Scenario: Yongkang case uses Yongkang real-price rows

- **WHEN** the system queries mock real-price data for `台南市永康區勝利街58巷4號1樓`
- **THEN** returned rows SHALL contain `台南市永康區`
- **THEN** returned rows SHALL NOT contain `育農路`

#### Scenario: PDF transaction date is preserved

- **WHEN** real-price mock data returns a `date` field
- **THEN** PDF dossier assembly SHALL map it to the transaction date shown in the PDF
