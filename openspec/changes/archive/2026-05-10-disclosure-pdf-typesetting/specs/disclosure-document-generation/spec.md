## MODIFIED Requirements

### Requirement: System generates 16-chapter Markdown disclosure document

The system SHALL generate a disclosure document (不動產說明書) in structured Markdown format containing exactly 16 chapters. Each chapter heading SHALL follow the pattern `#### 章節 N：標題` where N is the chapter number (1–16). Chapters SHALL be separated by `---`.

The system SHALL support two document variants:
- **Building version** (建物版): for property types 公寓, 大樓華廈, 透天別墅, 套房, 店面, 廠房, 農舍 (7 types)
- **Land version** (土地版): for property types 農地, 建地, 商業地, 工業地, 鄉村區建地, 其他土地 (6 types)

Chapters 1–4, 10–16 SHALL have identical structure across both versions. Chapters 5–6 and 8–11 differ between building and land versions.

The PDF renderer SHALL parse the markdown using a token-based approach (marked.lexer) and render each token type with formal typesetting rules: headings centered at 16pt Bold, paragraphs at 12pt Regular with 1.5x line height, label-value pairs with fixed-width labels. All text SHALL be rendered within the content margin boundaries of each page.

#### Scenario: Building version chapter structure

WHEN property type is one of 公寓/大樓華廈/透天別墅/套房/店面/廠房/農舍
THEN the generated document SHALL contain chapters 1–16 as defined in the building version spec, with chapter 8 covering 建物現況調查

##### Example:
GIVEN property type is 公寓
WHEN disclosure document is generated
THEN output contains exactly 16 chapters with chapter 8 titled 建物現況調查

#### Scenario: Land version chapter structure

WHEN property type is one of 農地/建地/商業地/工業地/鄉村區建地/其他土地
THEN the generated document SHALL contain chapters 1–16 as defined in the land version spec, with chapters 8–11 covering 基地/土地現況調查表 p1–p4

##### Example:
GIVEN property type is 農地
WHEN disclosure document is generated
THEN output contains exactly 16 chapters with chapters 8-11 covering 基地/土地現況調查表

#### Scenario: PDF renders markdown with formal typesetting

WHEN the markdown content is converted to PDF
THEN chapter headings (level-2 and level-4) SHALL render centered with enlarged Bold font, paragraphs SHALL render with 1.5x line spacing and 12pt paragraph spacing, and all text SHALL stay within the defined content margin area.

##### Example:
GIVEN markdown containing `## 章節 2：重要告知` and paragraph text
WHEN converted to PDF
THEN pdftotext output contains "章節 2：重要告知" and visual inspection shows centered heading at 16pt
