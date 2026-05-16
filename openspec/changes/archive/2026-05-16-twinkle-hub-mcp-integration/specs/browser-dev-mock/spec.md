## ADDED Requirements

### Requirement: mock-query-real-price

The browser mock backend SHALL handle `safeInvoke("query_real_price", { district, keyword, limit })` and return a fixed array of 3 mock trade records.

The mock records SHALL include realistic field values so the frontend component can be fully tested in browser dev mode.

#### Scenario: Mock returns 3 trade records for any district

WHEN safeInvoke("query_real_price") is called in browser dev mode with any district and keyword
THEN the mock SHALL return exactly 3 records within 300ms

##### Example:
- Input: { district: "東區", keyword: "裕農路", limit: 20 }
- Output: [
    { 土地區段位置建物門牌: "台南市東區裕農路288巷5號", 總價元: 7200000, 建物移轉總面積平方公尺: 28.5, 單價元/平方公尺: 252631, iso_trade_date: "2024-01-10" },
    { 土地區段位置建物門牌: "台南市東區裕農路300號3樓", 總價元: 9500000, 建物移轉總面積平方公尺: 38.2, 單價元/平方公尺: 248691, iso_trade_date: "2024-02-20" },
    { 土地區段位置建物門牌: "台南市東區裕農路310號2樓之1", 總價元: 6800000, 建物移轉總面積平方公尺: 26.0, 單價元/平方公尺: 261538, iso_trade_date: "2023-12-05" }
  ]
