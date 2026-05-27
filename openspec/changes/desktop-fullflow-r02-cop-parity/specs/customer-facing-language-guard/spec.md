## ADDED Requirements

### Requirement: Customer-facing language guard

Customer-facing AIRE operation pages SHALL use customer task language and SHALL hide implementation service names. Forbidden words in normal operation copy are R02, 便民系統, COP, API, Helper, adapter, parser, payload and JSON. Management detail panels SHALL be allowed to show JSON and API rows only after explicit expansion from query records.

#### Scenario: New case flow uses task language

- **WHEN** the user opens `/cases/new`
- **THEN** visible copy SHALL use terms such as 地址, 地段, 地號, 建號, 資料確認 and 判斷地政資料
- **AND** visible copy SHALL NOT include R02, 便民系統, COP, API, Helper, adapter, parser, payload or JSON

#### Scenario: Query record detail can expose technical audit data

- **WHEN** an administrator explicitly opens a query record detail panel
- **THEN** the panel SHALL be allowed to show JSON and API rows for support
- **AND** the list page and customer workflow SHALL remain free of forbidden implementation terms
