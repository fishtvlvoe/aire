## ADDED Requirements

### Requirement: Billing log SHALL expose customer-visible line items

The app SHALL expose land-registry billing log rows to the customer-facing 費用紀錄 page. Each row SHALL identify the service, target parcel/building/case, transaction id, success or failure status, and charged amount.

#### Scenario: Billing page shows backend line items

- **WHEN** the user opens `/settings?section=billing`
- **THEN** the page shows a 地政 API 查詢明細 table
- **AND** each row shows 服務、狀態、交易序號、費用

#### Scenario: Failed calls are zero cost

- **GIVEN** a billing row represents a failed land-registry call
- **WHEN** the billing page renders
- **THEN** the row shows 查詢失敗
- **AND** the fee is `0 元`

#### Scenario: AIRE plan fees are separated

- **WHEN** the billing page renders
- **THEN** the page explains that Google、空拍、AI 格局圖 belong to AIRE plan billing
- **AND** those plan features are not listed as land-registry API charge rows

##### Example: plan fee separation

- **GIVEN** Google 地圖 is enabled in the AIRE plan
- **WHEN** the user opens 費用紀錄
- **THEN** Google 地圖 is not shown as a 地政 API 查詢明細 row
- **AND** AIRE 方案功能 is visible in 費用歸屬
