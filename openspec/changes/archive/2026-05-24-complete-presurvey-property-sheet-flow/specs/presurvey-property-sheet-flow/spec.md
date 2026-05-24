## Purpose

定義 AIRE 物調表前置作業流程：房仲在正式委託前，先用地址與可取得資料產出可帶去談委託的物調表，回來後再補件與修正。

## ADDED Requirements

### Requirement: Pre-survey property sheet can use available registry data

系統 SHALL 在物調表階段先帶入地政或公開來源已取得的基本資料，並以欄位狀態標示是否仍待確認。

#### Scenario: Registry data is available before formal supplement

- **GIVEN** 使用者輸入完整地址且地政查詢取得建物或土地資料
- **WHEN** 系統建立物調表案件
- **THEN** 物調表 SHALL 顯示可取得的資料
- **AND** 尚未補件確認的欄位 SHALL 標示為待確認或已帶入

#### Scenario: Registry data is unavailable

- **GIVEN** 地址查詢失敗或權限不足
- **WHEN** 系統建立物調表案件
- **THEN** 系統 SHALL 允許建立待確認案件
- **AND** 物調表 SHALL 顯示查詢失敗原因
- **AND** 系統 SHALL NOT 填入假資料

### Requirement: Add case flow has one primary registry lookup path

新增案件 SHALL 以地址輸入後的地政判斷作為唯一主要流程，不得同時呈現重複的新增案件與地政查詢入口。

#### Scenario: User creates a case from address

- **GIVEN** 使用者在新增案件頁輸入地址
- **WHEN** 使用者執行地政判斷
- **THEN** 系統 SHALL 顯示地址定位、土地建物候選資料與查詢狀態
- **AND** 建立案件後 SHALL 進入物調表流程

### Requirement: Supplement and field questions are one workflow

補件與現場必問 SHALL 在物調表流程內整合，不得讓使用者在不同頁面看到重複且互相不回寫的功能。

#### Scenario: User fills field questions

- **GIVEN** 物調表有現場必問項目
- **WHEN** 使用者填寫答案或上傳照片
- **THEN** 系統 SHALL 儲存內容
- **AND** 物調表預覽與 PDF SHALL 使用更新後資料

#### Scenario: User uploads map assets

- **GIVEN** 物調表缺少地籍圖、空拍圖、格局圖或地標圖
- **WHEN** 使用者上傳檔案
- **THEN** 系統 SHALL 將檔案關聯到案件
- **AND** PDF SHALL 將該圖資放入對應框位

### Requirement: Case pages do not duplicate navigation intent

一級選單已代表的功能 SHALL 不在頁面內容中重複以相同意義的選單或假按鈕呈現。

#### Scenario: User opens data source page

- **GIVEN** 使用者開啟資料來源頁
- **WHEN** 頁面載入
- **THEN** 頁面 SHALL 只顯示資料來源、可帶入、不可查與補件邊界
- **AND** 頁面 SHALL NOT 顯示授權序號、方案升級、Super Admin 或品牌設定

### Requirement: Customer-facing copy hides engineering API names

客戶介面 SHALL 使用中文業務名稱描述服務與狀態，不得把 MOI_API、CAD API 或 MCP Hub 等工程名稱作為主要文案。

#### Scenario: Fee row is shown

- **GIVEN** 系統顯示地政查詢費用
- **WHEN** 使用者查看費用紀錄或物調表費用摘要
- **THEN** 系統 SHALL 顯示中文服務名稱、筆數、金額與狀態
- **AND** 工程 API 代碼 SHALL 只可出現在除錯或操作日誌

### Requirement: PDF output represents missing data honestly

PDF SHALL 允許在物調表階段輸出，但 SHALL 對缺漏資料保留空白或待確認標示，不得產生假地址、假屋主、假圖資或假實價登錄。

#### Scenario: Floor plan is not uploaded

- **GIVEN** 案件尚未上傳或產生格局圖
- **WHEN** 使用者輸出 PDF
- **THEN** PDF SHALL 顯示格局圖空白框
- **AND** PDF SHALL NOT 插入預設假圖

### Requirement: Workbench controls are actionable

所有看起來可點擊的按鈕、分頁、上傳框與操作圖示 SHALL 有可驗證的行為；尚未實作的項目 SHALL 改成狀態文字或開發中標示。

#### Scenario: Backend is not connected

- **GIVEN** 某功能尚未完成後端串接
- **WHEN** 使用者查看物調表
- **THEN** 系統 SHALL NOT 顯示會誤導成可操作的按鈕
- **AND** 可保留非阻塞狀態文字或開發中標示
