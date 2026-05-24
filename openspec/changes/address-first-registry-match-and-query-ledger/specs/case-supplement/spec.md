## ADDED Requirements

### Requirement: Supplement workbench SHALL load questions by confirmed property type

The case supplement workbench SHALL load field-visit and secretary-supplement questions from the structured question bank derived from `0520/不動產說明書/0417-old`. The question set SHALL be selected by confirmed property type and SHALL separate registry-backed fields from manual-only fields.

#### Scenario: Building type loads building questions

- **WHEN** the confirmed property type is `highrise-building`, `huaxia-building`, `apartment`, `townhouse`, or `villa`
- **THEN** the workbench SHALL load building field-visit questions and building secretary-supplement questions
- **AND** registry-backed fields already filled from COP SHALL be shown as locked source fields

#### Scenario: Land type loads land questions

- **WHEN** the confirmed property type is `farmland`, `residential-land`, `agricultural-building-land`, `industrial-land`, or `type-d-building-land`
- **THEN** the workbench SHALL load land field-visit questions and land secretary-supplement questions
- **AND** registry-backed land fields already filled from COP SHALL be shown as locked source fields

### Requirement: Supplement workbench SHALL separate left supplement fields and right preview

The case supplement workbench SHALL render missing and manual-only fields on the left and an HTML disclosure preview on the right. The preview SHALL update after the user changes supplement answers and SHALL expose a PDF download action after required confirmation gates pass.

#### Scenario: Manual-only field appears on the left

- **WHEN** the confirmed property type requires leakage, wall condition, emergency space, garage, elevator, water tower, or access condition
- **THEN** the workbench SHALL show the required field on the left supplement pane
- **AND** the field SHALL NOT be marked auto-filled from COP

##### Example: High-rise manual-only fields

- **GIVEN** confirmed property type is `highrise-building`
- **WHEN** the supplement workbench loads
- **THEN** the left pane SHALL include leakage, wall condition, elevator, water tower, and access condition fields

#### Scenario: Preview updates after supplement answer

- **WHEN** the user enters a supplement answer on the left pane
- **THEN** the right HTML preview SHALL update with the new answer
- **AND** PDF download SHALL use the same preview data

##### Example: Leakage answer appears in preview

- **GIVEN** the leakage field is empty
- **WHEN** the user enters `客廳天花板無明顯漏水痕跡`
- **THEN** the right HTML preview SHALL display `客廳天花板無明顯漏水痕跡`

### Requirement: Supplement workbench SHALL preserve candidate reference mode

The workbench SHALL support candidate reference mode for unresolved or unconfirmed registry candidates. Candidate reference mode SHALL mark all registry-derived values as reference and SHALL block formal PDF download.

#### Scenario: Candidate reference mode blocks formal PDF

- **WHEN** a case has only candidate registry data and no confirmed registry key
- **THEN** the workbench SHALL show candidate values as reference
- **AND** the formal PDF download action SHALL be disabled

##### Example: Unconfirmed candidate label

- **GIVEN** candidate land number `0070-0000` is not confirmed
- **WHEN** the workbench renders candidate reference mode
- **THEN** the preview SHALL label the land number `參考資料，尚未對標確認`
- **AND** the formal PDF download action SHALL be disabled
