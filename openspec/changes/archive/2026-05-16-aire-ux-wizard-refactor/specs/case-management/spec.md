## MODIFIED Requirements

### Requirement: Case list view

The system SHALL provide a `/cases` page that lists all cases ordered by `updated_at DESC`, displaying columns: "案件名稱" (optional user-defined name), "地址/所有權人" (address as primary text, owner_name as secondary text below), "案件類型" (display as `成屋` or `土地`), "狀態" (display as `草稿` / `已完成` / `已匯出`), "建立日期" formatted as `YYYY/MM/DD HH:mm` in Asia/Taipei timezone, and "操作" (5 SVG icon action buttons defined in `case-list-actions` spec).

##### Example: list rendering

| Column | Source | Display rule |
| --- | --- | --- |
| 案件名稱 | `case_name` | Optional field; empty → show `—` |
| 地址/所有權人 | `address` + `owner_name` | Primary line: address; Secondary line: owner_name |
| 案件類型 | `property_type` | `residential` → `成屋`, `land` → `土地` |
| 狀態 | `status` | `draft` → `草稿`, `completed` → `已完成`, `exported` → `已匯出` |
| 建立日期 | `created_at` | Unix seconds → `YYYY/MM/DD HH:mm` in Asia/Taipei |
| 操作 | — | 5 SVG icon buttons (see `case-list-actions`) |

#### Scenario: Empty list state

- **WHEN** the user opens `/cases` with no cases in the database
- **THEN** the page displays the empty state message `尚無案件，按右上角「新增案件」開始` and a button labelled `新增案件`

#### Scenario: List with cases

- **WHEN** the user opens `/cases` with three cases in the database
- **THEN** all three rows are visible, ordered with the most recently updated at the top, each row showing address as primary text and owner name as secondary text

### Requirement: Create case flow

The system SHALL provide a `/cases/new` page that asks the user to select `property_type` (`residential` or `land`) and enter required field `address` and optional fields `owner_name` (label: "所有權人（選填）"), `case_name` (label: "案件名稱（選填）"), and `case_no` (label: "案件編號（選填）"). On submit, the system SHALL create the row in `cases` with `status='draft'` and navigate to `/cases/<id>`.

#### Scenario: Successful creation

- **WHEN** the user submits `property_type='residential'`, `address='台南市東區大同路100號'`, `owner_name='王小明'`
- **THEN** a new row is inserted with `status='draft'` and the browser navigates to `/cases/<new-id>`

#### Scenario: Missing required field is rejected

- **WHEN** the user submits with `address` empty
- **THEN** the form displays `地址為必填` next to the field and does NOT submit

#### Scenario: Property type is required

- **WHEN** the user submits without selecting `property_type`
- **THEN** the form displays `請選擇物件類型` and does NOT submit

## ADDED Requirements

### Requirement: Case data includes land registry data
The case record SHALL include a `land_registry_data` field (JSON object or null) to store the land registry query result. The `update_case` API SHALL accept `land_registry_data` as an optional parameter.

#### Scenario: Save land registry data
- **WHEN** `update_case` is called with `land_registry_data` containing query results
- **THEN** the case record stores the land registry data and subsequent reads return it

### Requirement: Case data includes case name
The case record SHALL include a `case_name` field (string, optional) for user-defined case names.

#### Scenario: Create case with name
- **WHEN** user creates a case with `case_name='和平東路案'`
- **THEN** the case record stores `case_name='和平東路案'` and the list displays it in the "案件名稱" column

### Requirement: Field label uses "所有權人"
All UI labels referring to the property owner SHALL use "所有權人" regardless of property type. The system SHALL NOT use "屋主", "地主", or "物件名稱 / 屋主".

#### Scenario: Residential case detail
- **WHEN** user views a residential case detail page
- **THEN** the owner field label reads "所有權人", not "屋主" or "物件名稱 / 屋主"

#### Scenario: Land case detail
- **WHEN** user views a land case detail page
- **THEN** the owner field label reads "所有權人", not "地主" or "物件名稱 / 地主"
