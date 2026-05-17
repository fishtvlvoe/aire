## ADDED Requirements

### Requirement: Render building condition survey pages

The system SHALL render "現況調查表" pages for building-type cases with ~58 questions: client's 38 questions (基地調查 1-35 + 稅費 36-38) PLUS official MOI building-specific supplements (~20 questions covering: 建物瑕疵 7 items, 設備 6 items, 管理 5 items, 停車位 6 items).

#### Scenario: Draft mode — all checkboxes blank

- **WHEN** surveyData is null
- **THEN** all ~58 questions SHALL render with ☐ for all options across 6-7 pages

#### Scenario: Completed mode — filled answers

- **WHEN** surveyData is populated
- **THEN** the system SHALL display ☑/☐ based on answers for all questions

#### Scenario: Building defect section (建物瑕疵)

- **WHEN** rendering building-specific supplement questions
- **THEN** the system SHALL include: 滲漏水, 壁癌, 違建, 火災, 危樓, 裂痕, 鋼筋外露 as separate question rows

#### Scenario: Equipment section (設備)

- **WHEN** rendering equipment questions
- **THEN** the system SHALL include: 電梯, 消防設備, 無障礙設施, 水電管線, 夾層, 居住安全 as separate question rows

#### Scenario: Scope limited to residential buildings

- **WHEN** propertyType is 公寓, 大樓, or 套房
- **THEN** the building condition survey SHALL render
- **WHEN** propertyType is 店面, 廠房, or 農舍
- **THEN** the building condition survey SHALL NOT render (out of scope for this version)

### Requirement: Building survey data persistence

The system SHALL persist building survey answers in `disclosure_drafts.survey_data` JSON column as a `BuildingSurveyData` object with ~58 boolean/null fields.

#### Scenario: Distinguish from land survey by property type

- **WHEN** loading survey data for a building-type case
- **THEN** the system SHALL deserialize as BuildingSurveyData (not LandSurveyData)
