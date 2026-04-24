## ADDED Requirements

### Requirement: professional-pdf-templates

- The survey (property_survey) PDF SHALL use a dedicated HTML/CSS template with A4 format, Noto Serif TC font, and page headers/footers, replacing the current pre-formatted text output.
- The sales DM (sales_dm) PDF SHALL use a dedicated HTML/CSS template with the same professional styling standards.
- Both templates SHALL follow the existing dossier template pattern (HTML template + CSS stylesheet rendered via Puppeteer).
- Templates SHALL support dynamic data injection (Mustache or template literal substitution).

#### Scenario: survey PDF generation

- **WHEN** a user requests a survey PDF for a completed listing
- **THEN** the system SHALL render the survey.html template with the listing's data injected
- **AND** the resulting PDF SHALL be A4 with Noto Serif TC font, page headers (logo + address), and page footers (page number + date)
- **AND** content sections (基本資訊、建物現況、權利狀態、周邊環境) SHALL use table-based layout, not `<pre>` text

#### Scenario: sales-dm PDF generation

- **WHEN** a user requests a sales-dm PDF for a listing
- **THEN** the system SHALL render the sales-dm.html template with the listing's data injected
- **AND** the resulting PDF SHALL be A4 with marketing-oriented design (large headlines, bullet highlights, photo blocks)
- **AND** the page header SHALL show 物件名稱 + 總價; page footer SHALL show 經紀人聯絡資訊

#### Scenario: dossier PDF unchanged

- **WHEN** a user requests a dossier (disclosure) PDF
- **THEN** the system SHALL continue to use the existing dossier template (no regression from v3.0)
- **AND** survey/sales-dm template changes SHALL NOT affect dossier rendering
