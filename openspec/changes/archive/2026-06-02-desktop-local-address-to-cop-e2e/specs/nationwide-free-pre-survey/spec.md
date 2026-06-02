## ADDED Requirements

### Requirement: Nationwide free pre-survey SHALL remain available before any paid formal query

系統 SHALL 在全台地址輸入流程中，先提供免費前查能力，包括地址候選、附近實價登錄與免費可得的補齊欄位，且在使用者未明確選擇付費正式查詢前不得產生成本。

#### Scenario: Free pre-survey runs before paid formal query

- **GIVEN** 使用者在 `/cases/new` 輸入任一台灣地址
- **WHEN** 系統執行地址前查
- **THEN** 系統 SHALL 先顯示免費可得的候選資料與附近實價登錄
- **AND** SHALL NOT 自動觸發付費正式查詢

#### Scenario: User saves case using only free pre-survey data

- **GIVEN** 使用者已確認候選物件，但不打算執行付費正式查詢
- **WHEN** 使用者保存案件或進入預覽
- **THEN** 系統 SHALL 允許以免費前查資料繼續流程
- **AND** SHALL 將資料標示為 reference / pre-survey，而非 trusted COP

#### Scenario: Same land returns multiple building candidates

- **GIVEN** 便民系統以門牌定位到同一筆地號，且該地號底下有多個建號
- **WHEN** 系統建立地址前查候選
- **THEN** 系統 SHALL 將每個建號保留為獨立候選
- **AND** SHALL NOT 自動取第一個建號當作案件的正式查詢目標
- **AND** 使用者 SHALL 能在案件工作台重新查詢候選並重新確認正確地號 / 建號

#### Scenario: Floor-unit address narrows Z10Web building candidates

- **GIVEN** Z10Web 以門牌定位到同一土地且回傳多個建號
- **AND** 使用者輸入的地址包含樓層與戶別，例如 `8樓之一` 或 `8樓之1`
- **WHEN** 系統執行免費前查
- **THEN** 系統 SHALL 先保留 Z10Web 候選為 primary source
- **AND** 系統 SHALL 將國字樓層 / 戶別正規化為阿拉伯數字格式後，用 R02 做戶別交叉解析
- **AND** 若 R02 回傳的建號存在於 Z10Web 候選中，系統 SHALL 將候選縮小到該建號
- **AND** 系統 SHALL NOT 以候選排序位置推測目標建號

#### Scenario: Address whitespace does not change discovery result

- **GIVEN** 使用者輸入的地址在路段、巷、號、樓之間包含半形空白
- **WHEN** 系統執行免費前查
- **THEN** 系統 SHALL 將任意空白正規化後查詢
- **AND** 空白版與無空白版地址 SHALL 指向相同候選或相同人工確認狀態

#### Scenario: Chinese and Arabic address numbers resolve to the same candidate

- **GIVEN** 使用者輸入的同一門牌包含中文數字、阿拉伯數字或全形數字，例如 `中華東路三段24巷8號5樓`、`中華東路3段24巷8號5樓`、`中華東路３段二十四巷八號五樓之一`
- **WHEN** 系統執行免費前查
- **THEN** 系統 SHALL 將這些輸入正規化成可查詢的同義地址模型
- **AND** 系統 SHALL 依 Z10Web / R02 所需格式產生查詢變體
- **AND** 若便民系統可查得資料，這些輸入 SHALL 回到同一地段、地號與建號候選

### Requirement: Pre-signing output SHALL be free and marked as reference data

The system SHALL treat the pre-signing property output as a free pre-survey stage. This stage SHALL use only free address discovery, R02 / Z10Web reference fields, free real-price data, map data, amenity data, and user-entered case content, and SHALL NOT perform COP ownership, COP other-right, or electronic transcript queries.

#### Scenario: Pre-signing PDF is generated without COP cost

- **GIVEN** a case is not yet signed
- **AND** the user has confirmed the address-first property candidate
- **WHEN** the user previews or exports the pre-survey PDF
- **THEN** the system SHALL generate the PDF from free reference data and saved case content
- **AND** the system SHALL record zero COP cost for that pre-signing output
- **AND** the PDF SHALL mark formal ownership and other-right fields as post-signing supplement items when trusted formal data is absent

#### Scenario: Ownership and mortgage data are not queried before signing

- **GIVEN** a user is reviewing a pre-signing case
- **WHEN** the case has no signed-stage supplement confirmation
- **THEN** the system SHALL NOT call paid ownership, other-right, mortgage, or electronic transcript services
- **AND** the UI SHALL NOT present their absence as a failed free pre-survey lookup
- **AND** the UI SHALL explain that those fields belong to the post-signing formal supplement stage
