## ADDED Requirements

### Requirement: Field visit form renders dynamically based on property type

The system SHALL render a three-tab form on the field visit page:
- Tab 1: 共通欄位 (common fields, all types)
- Tab 2: 類型專屬欄位 (type-specific fields, varies by type)
- Tab 3: 秘書後補 (supplementary fields, filled by secretary)

The form SHALL load the field schema from the property-type-registry for the selected type and render the appropriate fields.

#### Scenario: Load form for farmland listing

- **WHEN** a user opens the fill form page for a `farmland` listing
- **THEN** Tab 1 SHALL show common fields (委託總價、物件地址、優缺點)
- **THEN** Tab 2 SHALL show land_common fields + farmland type_specific fields (灌溉、農路、農作物 etc.)
- **THEN** Tab 3 SHALL show land supplementary fields (謄本標示部、公告現值 etc.)

#### Scenario: Load form for townhouse listing

- **WHEN** a user opens the fill form page for a `townhouse` listing
- **THEN** Tab 2 SHALL show building_common fields + townhouse type_specific fields (騎樓、車庫、前後側院 etc.)

### Requirement: Common fields are identical across all types

The system SHALL always render the following common fields in Tab 1 regardless of property type:
- 委託總價（數字，萬元）
- 物件地址（文字）
- 用途（文字）
- 現況（選擇：空屋/自住/出租中）
- 優點 1-3（文字）
- 缺點 1-3（文字）
- 照片上傳說明（說明文字）

#### Scenario: Common fields always present

- **WHEN** a user opens any listing's fill form
- **THEN** 委託總價 and 物件地址 fields SHALL always be visible in Tab 1

### Requirement: Building common fields apply to all building-category types

The system SHALL render the following fields in Tab 2 for all building-category types (in addition to type_specific):
- 車位停車方式（勾選：坡道平面/坡道機械/升降機械/一樓平面）
- 陽台座向、大樓座向
- 銷售樓別
- 租金、管理方式、管理費
- 每層幾戶、電梯數
- 建設公司、社區大樓名稱
- 最近學校/公園/市場/商圈名稱

#### Scenario: Building common fields for apartment

- **WHEN** user opens fill form for `apartment` type
- **THEN** 車位停車方式 and 管理費 SHALL appear in Tab 2 before type-specific fields

### Requirement: Land common fields apply to all land-category types

The system SHALL render the following fields in Tab 2 for all land-category types:
- 土地謄本、地籍圖（文件說明）
- 使用分區、地目、使用編定
- 地段/地號、地坪
- 是否持分、持分比例
- 臨路寬、面寬、深度
- 是否角地、是否雙面臨路、是否無尾巷
- 是否有通行權、是否可到車、是否有水電
- 現況使用、是否有地上物

#### Scenario: Land common fields for residential-land

- **WHEN** user opens fill form for `residential-land` type
- **THEN** 地坪 and 使用分區 SHALL appear in Tab 2 before type-specific fields

### Requirement: Form saves data as structured JSON

The system SHALL save field visit form data as JSON to `field_visit_data` column with structure:
```json
{
  "common": { ... },
  "building_common": { ... },  // only for building types
  "land_common": { ... },      // only for land types
  "type_specific": { ... }
}
```

#### Scenario: Save farmland field visit data

- **WHEN** user submits field visit form for a `farmland` listing
- **THEN** the system SHALL save JSON with `common`, `land_common`, and `type_specific` keys
- **THEN** listing status SHALL advance to `field-visit-complete`
