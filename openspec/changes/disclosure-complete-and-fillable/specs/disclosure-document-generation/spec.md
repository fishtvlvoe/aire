## ADDED Requirements

### Requirement: no-personal-greeting

The LLM prompt for disclosure document generation SHALL NOT produce any personal greeting, name, or salutation. The output SHALL begin directly with the chapter structure.

#### Scenario: no greeting in output

- **WHEN** a disclosure document is generated for any listing
- **THEN** the output does NOT contain any form of "您好", "老魚", personal name, or greeting sentence before the chapter content

### Requirement: waiting-fields-as-blank-underline-in-html

In the Puppeteer HTML template, all placeholder markers for unfilled fields SHALL render as `<span data-field-id="[id]" class="pdf-blank">______</span>` instead of the text "{{待補}}", so that:
1. The PDF visually shows an underline for missing data
2. The AcroForm overlay can locate the field by data-field-id

#### Scenario: blank field renders as underline

- **WHEN** company_name is absent from supplementary_data
- **THEN** the PDF cover shows "______" (underline) in the company name position, and an AcroForm text field is overlaid at that position
