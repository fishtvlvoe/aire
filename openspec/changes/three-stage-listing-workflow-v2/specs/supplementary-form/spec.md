## ADDED Requirements

### Requirement: Supplementary form renders fields for secretary to complete

The system SHALL render a supplementary data form in Tab 3 of the fill form page. This form is intended for secretary use after the business visits the property.

The form SHALL show different fields based on the property category:

**Building category common fields** (公寓/大樓/套房/透天/店面/廠房/農舍):
- 建號
- 權狀坪數（主建物/附屬建物/共有部分）
- 地號/建號核對
- 他項權利
- 樓層/總樓層核對
- 法定用途核對
- 建築完成日期核對
- 增建/頂加/外推/夾層範圍整理
- 租客/租期/押金/可否提前交付核對
- 合約書條件核對
- 照片命名整理
- 591/DM/FB/說明書一致性檢核

**Land category common fields** (農地/建地/商業地/工業地/鄉村/其他):
- 土地謄本標示部
- 土地謄本所有權部
- 土地謄本他項權利部
- 地籍圖對照
- 使用分區圖
- 國土或都計資料
- 公告現值
- 公告地價
- 歷史實登或行情
- 法規限制
- 權利與地號核對
- 地圖與照片整理

#### Scenario: Secretary opens supplementary tab for apartment

- **WHEN** secretary opens Tab 3 for an `apartment` listing
- **THEN** the system SHALL show building common supplementary fields including 建號 and 權狀坪數

#### Scenario: Secretary opens supplementary tab for farmland

- **WHEN** secretary opens Tab 3 for a `farmland` listing
- **THEN** the system SHALL show land common supplementary fields including 公告現值 and 法規限制
- **THEN** the system SHALL also show farmland type-specific supplementary fields: 農牧用地或地目核對、農舍可否、農用限制、套繪/分割限制

### Requirement: Type-specific supplementary fields append after category common

The system SHALL append type-specific supplementary fields after the category common fields in Tab 3.

Type-specific supplementary fields per implemented type:
- `farmland`: 農牧用地或地目核對、特定/一般農業區核對、農舍可否、農用限制、套繪/分割限制、農路/灌溉/排水法規、周邊實登/行情
- `townhouse`: 騎樓/車庫/夾層/頂夾範圍核對、樓層用途分配與照片整理、臨路/巷寬/角地資料核對
- `apartment`: 頂加/鐵皮/外推/違建/夾層範圍核對、樓梯間與公共空間照片整理、共管/管委資料核對
- `highrise`: 總戶數/公設比/管理費核對、車位權屬與獨立性核對、社區公設與集中收包裹資訊整理
- `residential-land`: 建蔽率、容積率、建築線核對、套繪/分割/合併限制、使用分區法規、道路退縮規定
- `farmhouse`: 合法農舍與土地建物權屬核對、農用資格/農用限制整理、農路/供水/供電/灌排資訊核對

#### Scenario: Farmland type-specific supplementary fields

- **WHEN** secretary views Tab 3 for a `farmland` listing
- **THEN** 農舍可否 and 農用限制 fields SHALL appear after the land common fields

### Requirement: Supplementary data saves as structured JSON

The system SHALL save supplementary form data as JSON to `supplementary_data` column with structure:
```json
{
  "building": { ... },     // only for building types
  "land": { ... },         // only for land types
  "type_specific": { ... }
}
```

Saving supplementary data SHALL advance listing status from `field-visit-complete` to `ready-for-generation`.

#### Scenario: Save supplementary data for townhouse

- **WHEN** secretary submits Tab 3 for a `townhouse` listing
- **THEN** supplementary_data SHALL contain `building` and `type_specific` keys
- **THEN** listing status SHALL advance to `ready-for-generation`
