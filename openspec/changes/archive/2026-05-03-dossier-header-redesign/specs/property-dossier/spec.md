## ADDED Requirements

### Requirement: cover-table-fields

The PDF dossier cover table SHALL display exactly the following rows in order:
1. 物件編號 — sourced from `supplementary_data.case_number`; blank if absent
2. 物件名稱 — sourced from `supplementary_data.property_name`; blank if absent
3. 公司名稱 — sourced from `supplementary_data.company_name`, falling back to the `COMPANY_NAME` environment variable; blank if both absent
4. A three-cell row (no row header) containing: 承辦人（`supplementary_data.case_handler`）, 店長（`supplementary_data.shop_manager`）, 經紀人（`supplementary_data.agent_name` or `field_visit_data.agent_name`）

The table SHALL NOT contain an address row or a 案件編號 column.

#### Scenario: all fields present

- **WHEN** supplementary_data includes case_number = "A-001", property_name = "星鑽特區 美麗家園", company_name = "建安不動産", case_handler = "王小明", shop_manager = "陳大為", agent_name = "阿賀"
- **THEN** the PDF cover table shows exactly those four rows with those values

##### Example: cover table layout

| Row | Left cell | Right cell(s) |
|-----|-----------|---------------|
| 1 | 物件編號 | A-001 |
| 2 | 物件名稱 | 星鑽特區 美麗家園 |
| 3 | 公司名稱 | 建安不動産 |
| 4 | (no header) | 承辦人：王小明 ｜ 店長：陳大為 ｜ 經紀人：阿賀 |

#### Scenario: case_handler and shop_manager absent

- **WHEN** supplementary_data does not include case_handler or shop_manager
- **THEN** the corresponding cells in row 4 are blank (no placeholder text)

### Requirement: property-name-subtitle

Below the H1「不動產說明書」heading, the PDF SHALL render the property name as a subtitle element. The subtitle SHALL use the same value as `supplementary_data.property_name`. If absent, the subtitle element SHALL be empty (not hidden).

#### Scenario: property name present

- **WHEN** supplementary_data.property_name = "星鑽特區 美麗家園"
- **THEN** the page shows "不動產說明書" as the main heading and "星鑽特區 美麗家園" as the subtitle immediately below

#### Scenario: property name absent

- **WHEN** supplementary_data.property_name is empty
- **THEN** the subtitle element renders as an empty line (no placeholder text appears)

##### Example: empty subtitle HTML output

| supplementary_data.property_name | Rendered subtitle HTML |
|----------------------------------|------------------------|
| "" (empty string) | `<p class="dossier-subtitle"></p>` |
| undefined | `<p class="dossier-subtitle"></p>` |
