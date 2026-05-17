# html-pdf-blocks Specification

## Purpose

HTML 版不動產說明書的業務邏輯元件庫，提供物件資料表、成交行情、費用一覽、現況調查表等 HTML 元件。對應 PDF 版 jsx 元件的功能，但使用純 HTML 生成方式以支援選擇複製內容。

## Requirements

### Requirement: HTML 版物件資料表

系統 SHALL 提供 HtmlPropertyDataSheet 元件，渲染物件資料表（交易種類、價金、附贈設備、付款方式等欄位），使用 HtmlFieldTable 格式。

#### Scenario: 渲染物件資料表

- **WHEN** 傳入 CaseDossierData 含 propertySheet 欄位
- **THEN** 渲染含「壹、產權調查表」標題的表格頁面

---
### Requirement: HTML 版成交行情表

系統 SHALL 提供 HtmlTransactionHistory 元件，以多欄表格顯示附近成交行情（地址、面積、總價、單價、交易日期）。

#### Scenario: 有成交資料時

- **WHEN** data.transactionHistory 有 3 筆以上資料
- **THEN** 渲染表頭 + 每筆一列的表格

---
### Requirement: HTML 版生活機能表

系統 SHALL 提供 HtmlLifeAmenities 元件，顯示周邊設施（學校、醫院、公園、捷運、市場）的名稱和距離。

#### Scenario: 有設施資料時

- **WHEN** data.amenities 有資料
- **THEN** 渲染分類表格列出各設施

---
### Requirement: HTML 版費用一覽表

系統 SHALL 提供 HtmlTaxFeeOverview 元件，分買方/賣方列出費用項目和金額。

#### Scenario: 費用表渲染

- **WHEN** data.fees 有資料
- **THEN** 渲染賣方費用 + 買方費用兩區塊的表格

---
### Requirement: HTML 版增值稅概算表

系統 SHALL 提供 HtmlLandValueTax 元件，渲染一般/優惠增值稅計算。

#### Scenario: 增值稅計算渲染

- **WHEN** data.taxCalculation 有資料
- **THEN** 渲染公告現值、前次移轉現值、漲價總額、稅額等欄位

---
### Requirement: HTML 版現況調查表（土地）

系統 SHALL 提供 HtmlLandConditionSurvey 元件，渲染 35 題 checkbox 問卷。草稿模式全部顯示 ☐。

#### Scenario: 草稿模式（空白問卷）

- **WHEN** surveyData 為空或未填答
- **THEN** 35 題全部顯示 ☐（空白勾選框）

---
### Requirement: HTML 版現況調查表（成屋）

系統 SHALL 提供 HtmlBuildingConditionSurvey 元件，渲染成屋版問卷（38 題基地調查 + 建物瑕疵/設備/管理/停車）。

#### Scenario: 草稿模式

- **WHEN** surveyData 為空
- **THEN** 所有題目顯示 ☐

---
### Requirement: HTML 版位置圖

系統 SHALL 提供 HtmlLocationMap 元件。有圖片時渲染 img，無圖片時顯示佔位文字「位置圖（待取得地圖資料後自動填入）」。

#### Scenario: 無圖片時

- **WHEN** data.locationMapUrl 為空
- **THEN** 顯示中文佔位文字

---
### Requirement: HTML 版外觀圖

系統 SHALL 提供 HtmlExteriorPhoto 元件。有圖片時渲染 img，無圖片時顯示佔位文字「外觀照片（待取得街景資料後自動填入）」。

#### Scenario: 無圖片時

- **WHEN** data.exteriorPhotoUrl 為空
- **THEN** 顯示中文佔位文字
