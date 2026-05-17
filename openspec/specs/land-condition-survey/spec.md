# land-condition-survey Specification

## Purpose

TBD - created by archiving change 'disclosure-smart-draft'. Update Purpose after archive.

## Requirements

### Requirement: Render land condition survey pages

The system SHALL render "現況調查表" (Condition Survey) pages for land-type cases with 35 questions following the client's sequential numbering format (建安不動產版). Each question SHALL display as a row with question number, question text, and checkbox options (☐ or ☑).

#### Scenario: Draft mode — all checkboxes blank

- **WHEN** surveyData is null (draft/unfilled state)
- **THEN** all 35 questions SHALL render with ☐ (unchecked boxes) for all options

#### Scenario: Completed mode — filled answers

- **WHEN** surveyData contains answers for questions
- **THEN** answered questions SHALL display ☑ for selected options and ☐ for unselected options

#### Scenario: Question 14 special layout (嫌惡設施)

- **WHEN** rendering question 14 (嫌惡設施 ~25 items)
- **THEN** the system SHALL render all ~25 sub-items as a multi-column checkbox grid within the question row

---
### Requirement: Land survey data persistence

The system SHALL persist land survey answers in the `disclosure_drafts.survey_data` JSON column as a `LandSurveyData` object with 35 boolean/null fields.

#### Scenario: Save partial survey progress

- **WHEN** a user fills questions 1-10 and saves
- **THEN** questions 1-10 SHALL have boolean values and questions 11-35 SHALL be null

#### Scenario: Load existing survey data

- **WHEN** reopening a case with previously saved survey data
- **THEN** the system SHALL restore all previously answered values
