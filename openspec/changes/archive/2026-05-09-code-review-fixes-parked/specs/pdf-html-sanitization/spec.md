## ADDED Requirements

### Requirement: Sanitize Markdown HTML output before PDF rendering

The system SHALL sanitize HTML output from marked() before inserting into PDF templates rendered by Puppeteer.

#### Scenario: Clean Markdown content

- **WHEN** LLM generates standard Markdown (headings, lists, tables, bold, italic)
- **THEN** the sanitized HTML preserves all safe formatting

#### Scenario: Script injection attempt

- **WHEN** LLM output contains `<script>alert('xss')</script>`
- **THEN** the script tag is stripped from the HTML before PDF rendering

#### Scenario: Event handler injection

- **WHEN** LLM output contains `<img onerror="fetch('evil.com')" src="x">`
- **THEN** the onerror attribute is stripped; img tag is preserved if src is safe

### Requirement: HTML allowlist

Only safe HTML tags SHALL be permitted: p, h1-h6, ul, ol, li, table, thead, tbody, tr, td, th, strong, em, br, a, img, blockquote, pre, code, span, div, hr.

#### Scenario: Allowed tag passes through

- **WHEN** HTML contains `<table><tr><td>data</td></tr></table>`
- **THEN** the table markup is preserved in the sanitized output

#### Scenario: Disallowed tag is stripped

- **WHEN** HTML contains `<iframe src="evil.com"></iframe>`
- **THEN** the iframe tag is removed from the sanitized output
