## ADDED Requirements

### Requirement: Page 6 renders six fixed legal notices

The system SHALL render Page 6 of the disclosure document as a static component containing six fixed legal notice items with no runtime dependencies on case data or user input.

#### Scenario: All six notices present

- **GIVEN** any case (residential or land)
- **WHEN** `DossierPage6Notices` is rendered
- **THEN** all six notice items appear with `data-notice-index` attributes 1 through 6:
  1. 平均地權條例第47條 — 買賣雙方須申報成交資訊，委任地政士代理申報
  2. 房地合一稅 — 稅率依持有年限（≤2年45%、2-5年35%、5-10年20%、≥10年15%），過戶後30日內申報
  3. 農地使用限制 — 農地承購須符合資格，由買方自行確認
  4. 建物使用用途 — 須與登記用途相符，違規由買方負責
  5. 重購退稅 — 符合條件可申請，不保證核准
  6. 自用增值稅優惠稅率 — 須向稅捐稽徵處確認資格

#### Scenario: Component renders without case data

- **WHEN** `DossierPage6Notices` is rendered with no props
- **THEN** the component renders successfully without throwing errors and all six notices are visible
