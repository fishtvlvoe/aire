## ADDED Requirements

### Requirement: Field visit form exposes chapter navigation helpers for external control

The `FieldVisitForm` component SHALL expose the following values and callbacks via either a forwarded ref or a dedicated callback prop (`onNavigationStateChange`), so the parent page can render navigation buttons outside the form:

1. `currentChapterId`: the ID of the currently active chapter tab.
2. `hasNextChapter`: boolean, true when there exists at least one chapter AFTER the current one that has fields (empty chapters SHALL be skipped).
3. `goToNextChapter()`: imperative callback that advances the active chapter to the next non-empty one; idempotent if already on the last non-empty chapter.
4. `isCurrentChapterComplete`: boolean, true when all required fields in the current chapter are filled.
5. `isComplete`: boolean, true when all required fields across all chapters are filled.

The existing chapter tab UI SHALL continue to render and remain directly clickable. The helpers above SHALL NOT replace or conflict with tab clicking.

#### Scenario: Parent page renders next-chapter button

- **WHEN** parent page receives `hasNextChapter === true` and `isCurrentChapterComplete === true`
- **THEN** parent page SHALL render an enabled `下一章節` button
- **WHEN** the user clicks that button
- **THEN** parent page SHALL call `goToNextChapter()` which advances the active chapter

#### Scenario: Skip empty chapter when advancing

- **WHEN** current chapter is `basic`, next chapter `property` has 0 fields, and chapter after `status` has 2 fields
- **AND** parent calls `goToNextChapter()`
- **THEN** active chapter SHALL become `status` (skipping `property`)

#### Scenario: No-op on last non-empty chapter

- **WHEN** current chapter is already the last chapter with fields
- **AND** parent calls `goToNextChapter()`
- **THEN** active chapter SHALL NOT change
- **AND** `hasNextChapter` SHALL be false

#### Scenario: Navigation helpers stay in sync with direct tab clicks

- **WHEN** the user directly clicks the `照片/文件` chapter tab
- **THEN** `currentChapterId` SHALL update to `media`
- **AND** `hasNextChapter` SHALL reflect whether any non-empty chapter follows `media`
