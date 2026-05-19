## ADDED Requirements

### Requirement: Step count and ordering

The CaseWizard SHALL have 5 steps. Step 3 SHALL be "揭露資料". The former "實價登錄" SHALL become Step 4. The former "預覽匯出" SHALL become Step 5. Steps 1 and 2 SHALL remain unchanged.

#### Scenario: Progress indicator shows 5 steps

- **WHEN** a user opens any case in edit mode
- **THEN** the progress indicator displays 5 numbered steps: 基本資料, 地政資料, 揭露資料, 實價登錄（跳過）, 預覽匯出
