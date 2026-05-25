## MODIFIED Requirements

### Requirement: Create case flow

新增案件流程 SHALL be the only customer-facing entry for address-based registry lookup. The page SHALL let users enter an address, review auto-filled section, land number and building number fields, confirm the data, and then start formal registry lookup. Customer-facing copy in this flow SHALL NOT mention R02, 便民系統, COP, API, Helper, adapter, parser, payload, or JSON.

#### Scenario: Address entry shows registry fields without technical source names

- **WHEN** the user opens `/cases/new`
- **AND** enters `台南市東區裕農路288巷17號8樓之1`
- **THEN** the page SHALL display fields for `地段`, `地號`, and `建號`
- **AND** the page SHALL display a customer-readable state such as `已自動補齊，請確認資料`
- **AND** the page SHALL NOT display R02, 便民系統, COP, API, Helper, adapter, parser, payload, or JSON

#### Scenario: Formal lookup stays disabled until registry data is confirmed

- **WHEN** the address has candidate registry data but the user has not confirmed it
- **THEN** the formal lookup action SHALL be disabled or blocked
- **AND** the system SHALL NOT create a paid registry API call
- **AND** the user SHALL see a customer-readable prompt to confirm or complete the data

#### Scenario: Multiple candidates require simple selection

- **WHEN** address discovery returns multiple candidate registry keys
- **THEN** the page SHALL display a simple selection UI using address, section, land number and building number
- **AND** the page SHALL NOT expose the internal discovery source name
- **AND** formal lookup SHALL remain blocked until one candidate is selected and confirmed
