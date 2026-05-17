# property-data-sheet Specification

## Purpose

TBD - created by archiving change 'disclosure-smart-draft'. Update Purpose after archive.

## Requirements

### Requirement: Render property data sheet for land type

The system SHALL render a "物件資料表" (Property Data Sheet) page in the PDF for land-type cases. Fields SHALL follow the client's land property survey template (土地物調表-母版.docx) layout: 委託總價, 坪數, 地段地號, 使用分區, 面積, 權利範圍, 持分面積, 建蔽率, 容積率, 所有權人, 取得日期.

#### Scenario: Land property data sheet renders with available data

- **WHEN** a land-type case has CaseDossierData with propertySheet populated
- **THEN** the PDF SHALL contain a property data sheet page with all populated fields displayed and empty fields shown as blank underlines

#### Scenario: Land property data sheet with missing data

- **WHEN** a land-type case has CaseDossierData with propertySheet partially populated
- **THEN** the PDF SHALL still render the page with blank underlines for missing fields (no error thrown)

---
### Requirement: Render property data sheet for building type

The system SHALL render a "物件資料表" page for building-type cases. Fields SHALL follow the client's building property survey template (建物物調表-母版.pdf) layout: 委託總價, 登記坪數, 主建坪數, 附屬建物, 公共設施, 車位, 樓層, 隔間, 方位, 管理費, 電梯, 建設公司, 社區名稱, 市場, 學校, 公園, 增值稅.

#### Scenario: Building property data sheet renders with full data

- **WHEN** a building-type case has CaseDossierData with propertySheet populated
- **THEN** the PDF SHALL contain a property data sheet page with building-specific fields (area breakdown, floor, management fee, elevator, etc.)

#### Scenario: Building property data sheet distinguishes area types

- **WHEN** the building property sheet includes area data
- **THEN** the system SHALL display 主建物坪數, 附屬建物坪數, 公共設施坪數, and 車位坪數 as separate fields
