## ADDED Requirements

### Requirement: Disabled button tooltip explanation
The "測試連線" button in the land registry API settings section SHALL display a tooltip with text "請先填入 Client ID 和安全碼" when the button is in disabled state. The button SHALL be disabled when either the Client ID or security code input field is empty. When both fields contain non-empty values, the button SHALL become enabled and the tooltip SHALL be removed.

#### Scenario: Hover disabled button
- **WHEN** Client ID is empty and user hovers over the disabled "測試連線" button
- **THEN** a tooltip "請先填入 Client ID 和安全碼" is displayed

#### Scenario: Both fields filled enables button
- **WHEN** user enters values in both Client ID and security code fields
- **THEN** the "測試連線" button becomes enabled (not greyed out) and the tooltip is removed
