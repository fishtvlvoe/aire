## ADDED Requirements

### Requirement: query-trigger-on-demand

The case detail page SHALL display a "查實價登錄" button in the 實價登錄 section. The button SHALL trigger the `query_real_price` Tauri IPC command only when clicked; it SHALL NOT auto-execute on page mount.

#### Scenario: User triggers real price query

WHEN a user clicks "查實價登錄" on the case detail page
THEN `safeInvoke("query_real_price", { district, keyword, limit: 20 })` SHALL be called
AND the button SHALL show a loading state while waiting for the response

##### Example:
- Case address: "台南市東區裕農路288巷17號8樓之1"
- Extracted: district="東區", keyword="裕農路"
- IPC call: query_real_price({ district: "東區", keyword: "裕農路", limit: 20 })

### Requirement: address-auto-parse

The frontend SHALL extract `district` and `keyword` from the case's stored address field. The extraction rule SHALL be: district = 第3個行政區劃單位（區/鎮/市）, keyword = 路名（路/街/大道/巷，取第一個）.

#### Scenario: Taipei address parsed correctly

WHEN case address is "台北市信義區松仁路100號"
THEN district SHALL be "信義區" and keyword SHALL be "松仁路"

##### Example:
- Input address: "台北市信義區松仁路100號"
- district: "信義區"
- keyword: "松仁路"

#### Scenario: Tainan address parsed correctly

WHEN case address is "台南市東區裕農路288巷17號8樓之1"
THEN district SHALL be "東區" and keyword SHALL be "裕農路"

##### Example:
- Input address: "台南市東區裕農路288巷17號8樓之1"
- district: "東區"
- keyword: "裕農路"

### Requirement: result-display-card

The `RealPricePanel` component SHALL display each returned trade record as a card showing: 地址（土地區段位置建物門牌）, 成交總價（總價元，格式：NT$X,XXX,XXX）, 坪數（建物移轉總面積平方公尺 × 0.3025，取小數點後1位）, 交易日期（iso_trade_date）, 單價/坪（單價元/平方公尺 ÷ 0.3025，格式：NT$X,XXX/坪）.

#### Scenario: Trade record displayed correctly

WHEN API returns a record with 總價元=8500000, 建物移轉總面積平方公尺=33.2, 單價元/平方公尺=256024, iso_trade_date="2024-03-15"
THEN the card SHALL show: 成交總價 NT$8,500,000, 坪數 10.0 坪, 單價 NT$77,527/坪, 交易日期 2024-03-15

##### Example:
- Input: 總價元=8500000, 面積=33.2㎡, 單價=256024元/㎡
- Output: NT$8,500,000 / 10.0 坪 / NT$77,527/坪

### Requirement: empty-and-error-states

The `RealPricePanel` SHALL handle three states: loading（顯示 spinner）, empty（顯示「查無符合條件的實價登錄資料」）, error（顯示「查詢失敗，請稍後再試」+ 錯誤訊息）.

#### Scenario: No results returned

WHEN Twinkle Hub returns an empty array
THEN RealPricePanel SHALL display "查無符合條件的實價登錄資料"

##### Example:
- API result: []
- UI: shows empty state message

#### Scenario: API error

WHEN safeInvoke returns an error string
THEN RealPricePanel SHALL display "查詢失敗：" followed by the error message

##### Example:
- Error: "TWINKLE_HUB_API_KEY not configured"
- UI: "查詢失敗：TWINKLE_HUB_API_KEY not configured"
