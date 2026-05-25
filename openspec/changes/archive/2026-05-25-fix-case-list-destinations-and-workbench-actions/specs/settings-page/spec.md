## ADDED Requirements

### Requirement: Data source page SHALL provide PDF asset supplement slots

The 資料來源 page SHALL let basic-plan users manually provide PDF image assets when automated sources are not available. It SHALL show upload slots for 地籍圖、空拍圖、格局圖、地標圖.

#### Scenario: Basic plan user sees manual upload slots

- **WHEN** the user opens `/settings?section=registry-rules`
- **THEN** the page shows PDF 圖資欄位
- **AND** it shows upload entries for 地籍圖、空拍圖、格局圖、地標圖

#### Scenario: Upgrade value is separated from manual fallback

- **WHEN** the PDF asset slots render
- **THEN** each slot explains the basic plan manual fallback
- **AND** upgrade copy describes automation as optional enhancement, not as a blocker

##### Example: cadastral map slot

- **GIVEN** the user opens 資料來源
- **WHEN** PDF 圖資欄位 renders
- **THEN** 地籍圖上傳 is visible
- **AND** 基本款可手動上傳地籍圖檔 is visible
