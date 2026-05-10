## ADDED Requirements

### Requirement: PDF content pages SHALL use formal document typesetting

The PDF generator SHALL render markdown content using formal document typesetting rules instead of raw text dumping. All content pages (page 2 onward) SHALL follow the typesetting specification defined in the typesetting constants module.

#### Scenario: Section heading renders centered and enlarged

WHEN the markdown contains a level-2 heading (e.g., `## 章節 2：重要告知`)
THEN the PDF SHALL render the heading text centered horizontally within the content margin, using 16pt Bold font, with 18pt spacing above and 12pt spacing below.

##### Example:
GIVEN markdown `## 章節 2：重要告知`
WHEN rendered to PDF page
THEN text is centered within content margin (left 71pt to right 547pt), font size is 16pt Bold, 18pt space above and 12pt below

#### Scenario: Body paragraph renders with proper line spacing

WHEN the markdown contains a paragraph block
THEN the PDF SHALL render the paragraph text left-aligned within the content margin, using 12pt Regular font, with 1.5x line height and 12pt spacing after each paragraph.

##### Example:
GIVEN markdown paragraph "本物件位於..."
WHEN rendered to PDF
THEN text is left-aligned at x=71pt, font 12pt Regular, line height 18pt (12*1.5), 12pt gap after paragraph

#### Scenario: Label-value pair renders with aligned layout

WHEN the markdown contains a line matching the pattern `<label>：<value>` (Chinese colon) or `<label>: <value>` (ASCII colon)
THEN the PDF SHALL render the label left-aligned with a fixed width of 80pt, and the value text immediately after the label, continuing on the same baseline. If the label text exceeds 80pt width, the label SHALL be truncated to fit and the value SHALL still start at the 80pt offset.

##### Example:
GIVEN markdown line "交易方式：買賣"
WHEN rendered to PDF
THEN "交易方式" starts at x=71pt with 80pt width, "買賣" starts at x=151pt on same baseline

#### Scenario: Content margin constrains all text placement

WHEN any text element is rendered on a content page
THEN the text SHALL be placed within the content margin boundaries (left 12%, right 8%, top 12%, bottom 10% of A4 page dimensions) and SHALL NOT overlap with the decorative border area of the background image.

##### Example:
GIVEN A4 page (595.28×841.89pt)
WHEN text is rendered
THEN no text appears outside boundaries: left 71pt, right 547pt, top 101pt from top, bottom 84pt from bottom

#### Scenario: Header and footer use small unobtrusive text

WHEN a page header or footer is rendered
THEN it SHALL use 9pt Regular font, positioned outside the content margin area (in the top or bottom margin zone), and SHALL NOT visually compete with the main content.

##### Example:
GIVEN page 3 of PDF
WHEN header rendered
THEN "不動產仲介" at y=811pt left-aligned, "第 3 頁 / 共 11 頁" at y=811pt right-aligned, both 9pt Regular

### Requirement: PDF SHALL maintain typesetting without background images

The PDF generator SHALL produce identically typeset documents regardless of whether background images are configured. The content margin, font sizes, line spacing, and paragraph spacing SHALL remain the same with or without background images.

#### Scenario: No background image configured produces clean typeset PDF

WHEN feature_flags contains no doc_bg_cover or doc_bg_content entries
THEN the PDF SHALL generate with white page backgrounds but the same content margin, font sizes, heading centering, paragraph spacing, and label-value alignment as when background images are present.

##### Example:
GIVEN feature_flags empty
WHEN PDF generated
THEN page backgrounds are white, content margin still 71/48/101/84pt, headings still centered 16pt Bold

### Requirement: Bold font fallback to Regular when unavailable

The PDF generator SHALL attempt to load NotoSansTC-Bold.ttf for heading text. If the Bold font file does not exist, the generator SHALL fall back to NotoSansTC-Regular.ttf without interrupting PDF generation. The generator SHALL NOT attempt stroke-based bold simulation as an alternative, since CJK glyphs degrade with stroke outlines.

#### Scenario: Bold font missing triggers graceful fallback

WHEN NotoSansTC-Bold.ttf does not exist at the expected path
THEN the PDF generator SHALL use NotoSansTC-Regular.ttf for all text including headings, and SHALL NOT throw an error or produce an empty PDF.

##### Example:
GIVEN NotoSansTC-Bold.ttf does not exist at public/fonts/
WHEN PDF generated
THEN headings render using NotoSansTC-Regular.ttf, PDF size > 0 bytes, no error thrown
