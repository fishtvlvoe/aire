## ADDED Requirements

### Requirement: case-form-optional-land-lot

The new case form field "地號" (land lot number) SHALL be optional. The field SHALL remain visible but SHALL NOT block form submission when empty.

The placeholder text SHALL read: "可選填，例如：0001-0000（不確定可留空）"

#### Scenario: Case created without land lot number

WHEN a user submits the new case form with 地址="台南市東區裕農路288巷17號8樓之1", 物件類型="住宅", 案件編號="TEST-001", 地號=""
THEN case creation SHALL succeed
AND the created case SHALL have `land_lot_no = null`

##### Example:
- Input: { address: "台南市東區裕農路288巷17號8樓之1", type: "住宅", case_number: "TEST-001", land_lot_no: "" }
- Output: case created with id=TEST-001; land_lot_no=null

#### Scenario: Case created with land lot number

WHEN a user submits the new case form with 地號="0291-0000"
THEN case creation SHALL succeed with land_lot_no="0291-0000" stored

##### Example:
- Input: { land_lot_no: "0291-0000", address: "台南市東區", type: "住宅", case_number: "TEST-002" }
- Output: case created with land_lot_no="0291-0000"

### Requirement: case-form-optional-owner-name

The new case form field "屋主姓名" (owner name) SHALL be optional.

The minimum required fields for case creation SHALL be: 地址 (address), 物件類型 (property type), and 案件編號 (case number).

#### Scenario: Case created without owner name

WHEN a user submits the new case form with 屋主姓名 empty and the three required fields filled
THEN case creation SHALL succeed

##### Example:
- Input: { address: "台南市東區裕農路288巷", type: "住宅", case_number: "TEST-003", owner_name: "" }
- Output: case created successfully; owner_name=null

#### Scenario: Case created without both optional fields

WHEN a user submits the new case form with only 地址="台南市東區裕農路288巷", 物件類型="住宅", 案件編號="TEST-004" (地號 and 屋主姓名 both empty)
THEN case creation SHALL succeed

##### Example:
- Input: { address: "台南市東區裕農路288巷", type: "住宅", case_number: "TEST-004" }
- Output: case created; land_lot_no=null; owner_name=null

### Requirement: pull-parcel-data-visible

The case detail page (`/cases/:id`) SHALL display a "拉謄本" (pull parcel data) action entry point within the "地政資料" (land registry data) section.

The entry point SHALL be the `PullParcelDataButton` component which already exists in `src/components/PullParcelDataButton.tsx`.

#### Scenario: Parcel data button visible on case detail page

WHEN a user navigates to `/cases/TEST-001` (case detail page)
THEN a button with text "拉謄本" SHALL be present in the 地政資料 card section

##### Example:
- URL: http://localhost:3000/cases/TEST-001
- Expected: DOM contains a button element with text "拉謄本" inside the 地政資料 section

#### Scenario: Parcel data button is clickable

WHEN a user clicks "拉謄本" on the case detail page in browser dev mode
THEN the button SHALL trigger the land registry API query (or safeInvoke mock response)
AND SHALL NOT throw an uncaught error

##### Example:
- Action: click 拉謄本 on /cases/TEST-001 in browser dev mode
- Output: loading state shown; mock land registry data returned or mock response displayed

### Requirement: theme-card-color-preview

Each theme selection card (淡雅/科技優雅) SHALL display a color swatch preview consisting of the theme's primary color, secondary color, and background color as colored blocks.

The swatch SHALL replace the current empty gray placeholder area.

#### Scenario: Theme card shows color swatches

WHEN a user views the theme selection section in 設定 > 品牌外觀
THEN the 淡雅 card SHALL display 3 colored rectangles (primary, secondary, background)
AND the 科技優雅 card SHALL display 3 colored rectangles

##### Example:
- 淡雅 swatches: primary=#2D5A8E, secondary=#4A7EB5, background=#F5F7FA (representative values)
- 科技優雅 swatches: primary=#1A1A2E, secondary=#16213E, background=#0F3460

### Requirement: theme-preview-modal

The "預覽" button on each theme card SHALL open a Modal dialog containing a miniature demo 不動產 disclosure page rendered with the theme's CSS variables.

The demo SHALL include: document title, sample property address, sample property type, and a simple two-column layout. No real case data is required.

#### Scenario: Preview modal opens

WHEN a user clicks "預覽" on the 淡雅 theme card
THEN a Modal SHALL open with title "不動產說明書（預覽）"
AND the content SHALL be styled with 淡雅 theme colors

##### Example:
- Action: click 預覽 on 淡雅 card
- Output: Modal visible with demo address "台北市信義區市府路1號", rendered in 淡雅 color scheme

#### Scenario: Preview modal can be closed

WHEN the preview Modal is open
THEN clicking the × button OR clicking the backdrop outside the Modal SHALL close it

##### Example:
- Action: click backdrop outside the Modal
- Output: Modal disappears; settings page visible again
