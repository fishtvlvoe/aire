## ADDED Requirements

### Requirement: 側邊欄移除產出文件資料夾

The dashboard sidebar SHALL group PDF output actions under case management behavior instead of a standalone output folder.

- **WHEN** the sidebar renders in expanded mode
- **THEN** it SHALL show primary folders `案件管理`, `地政資料`, and `系統設定`
- **THEN** it SHALL NOT show a primary folder labelled `產出文件`
- **THEN** it SHALL NOT show sidebar links labelled `PDF 預覽` or `列印與匯出`

#### Scenario: settings query active state is unique

- **GIVEN** current URL is `/settings?section=plans`
- **WHEN** the sidebar renders
- **THEN** the `方案與升級` link SHALL be visually active
- **THEN** the `個人設定` link SHALL NOT be visually active
