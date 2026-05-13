## ADDED Requirements

### Requirement: PDF template overlay rendering

The system SHALL produce a PDF by overlaying form field values onto a pre-existing template PDF located at `src/resources/templates/residential.pdf` (for residential cases) or `src/resources/templates/land.pdf` (for land cases), using `pdf-lib` to load the template and `drawText` to render field values at coordinates defined in `src/lib/pdf-layout.ts`.

##### Example: layout coordinate table format

- **GIVEN** `pdf-layout.ts` exports `residentialLayout` containing entries `{ field: 'land_lot_no', page: 0, x: 120, y: 720, size: 12 }`
- **WHEN** the PDF renderer processes the residential template
- **THEN** the value of `land_lot_no` is drawn on page 0 at coordinates (120, 720) at font size 12

#### Scenario: Residential PDF generated

- **WHEN** the user clicks `匯出 PDF` on a residential case with `land_lot_no='台南市東區大同段123-4'`
- **THEN** the system generates a PDF where `123-4` and its prefix appear at the layout coordinate for `land_lot_no` on the residential template

#### Scenario: Land PDF generated

- **WHEN** the user clicks `匯出 PDF` on a land case
- **THEN** the system generates a PDF using `land.pdf` template overlaid with the land form payload

### Requirement: Embedded Traditional Chinese font

The system SHALL embed a subset Traditional Chinese font (`NotoSansTC-Regular` subset) into every generated PDF; the subset MUST contain at minimum the 5000 most common Traditional Chinese characters plus Latin and digit glyphs.

#### Scenario: Chinese characters render in output PDF

- **WHEN** a PDF is generated containing the string `台南市東區大同段123-4`
- **THEN** opening the PDF in any standards-compliant PDF reader displays all characters correctly without missing glyph boxes

#### Scenario: PDF file size constraint

- **WHEN** a residential PDF is generated for a fully populated case
- **THEN** the resulting file size is less than 3 megabytes

### Requirement: Output file path and post-export behavior

The system SHALL prompt the user with a system file dialog for the output location (defaulting to the OS Downloads folder with a suggested filename of `<case_no_or_id>_<property_type>_<YYYYMMDD>.pdf`), and after a successful write SHALL update `cases.status` to `exported` and write an entry to `operation_log`.

##### Example: default filename

- **GIVEN** a residential case with `case_no='AIRE-001'`, generated on 2026-05-14
- **WHEN** the user clicks `匯出 PDF`
- **THEN** the suggested filename is `AIRE-001_residential_20260514.pdf`

#### Scenario: User cancels save dialog

- **WHEN** the user clicks `匯出 PDF` and then cancels the file dialog
- **THEN** no file is written, `cases.status` is unchanged, and no `operation_log` row is created

#### Scenario: Export success updates status

- **WHEN** the PDF is written successfully to the chosen path
- **THEN** `cases.status` transitions to `exported`, an `operation_log` row is written with `action='pdf_export'`, `result='ok'`, payload containing the output path, and the UI displays `匯出成功` along with a button `開啟所在資料夾`

### Requirement: Failure modes during export

The system SHALL surface PDF export failures as user-visible errors and SHALL NOT update `cases.status` on failure.

##### Example: failure scenarios

| Failure | Cause | UI message | DB effect |
| --- | --- | --- | --- |
| Template missing | `residential.pdf` not found at expected path | `找不到說明書底板檔案` | no change |
| Font load failure | embedded font file corrupted | `字型載入失敗` | no change |
| Disk full | output path on full volume | `磁碟空間不足，無法寫入 PDF` | no change |
| Path locked | target file open in another program | `檔案被其他程式占用，請關閉後重試` | no change |

#### Scenario: Template not found

- **WHEN** the renderer attempts to load `residential.pdf` and the file is missing
- **THEN** the system displays `找不到說明書底板檔案` and writes `operation_log` with `result='error'`, payload `{ reason: 'template_missing' }`

#### Scenario: Disk full during write

- **WHEN** the PDF write fails with a disk-full error
- **THEN** the system displays `磁碟空間不足，無法寫入 PDF` and `cases.status` remains at the previous value
