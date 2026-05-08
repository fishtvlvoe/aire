## ADDED Requirements

### Requirement: simplified-template-selection

- The template management page SHALL display 6 predefined color scheme cards in a 3x2 grid layout.
- Each color scheme card SHALL show the header background color as a preview swatch (80px height) and the scheme name below.
- The selected color scheme SHALL be indicated with a ring-2 border in the primary brand color (#1B3A6B).
- The system SHALL store the selected color scheme ID in the feature_flags table (key=doc_color_scheme).
- The template management page SHALL provide a logo upload area that accepts PNG, JPG, and SVG files up to 1MB.
- Uploaded logos SHALL be saved to data/branding/logo.{ext}, overwriting any previous logo file.
- The logo preview SHALL render at a maximum size of 120x60px with object-fit: contain.
- A remove button SHALL delete the logo file and clear the doc_logo_path record in feature_flags.
- On page load, the system SHALL pre-select the previously saved color scheme and display the saved logo.
- The previous HTML template upload mechanism (Handlebars engine, HTML file storage, DOMPurify sanitization) SHALL be removed.

#### Scenario: Admin selects a color scheme and uploads logo

Given the admin navigates to /admin/templates
When the admin clicks the "森林綠" color scheme card
Then the card shows a ring-2 ring-[#1B3A6B] border indicating selection
When the admin uploads a 500KB PNG file via the logo upload area
Then the logo preview displays at max 120x60px with object-contain
When the admin clicks the save button
Then the system stores doc_color_scheme='forest' and doc_logo_path='data/branding/logo.png' in feature_flags

##### Example: Selecting forest scheme and uploading logo

PATCH /api/admin/templates body: { "colorScheme": "forest" }
POST /api/admin/templates/logo body: FormData with file=logo.png (500KB)
DB after save: feature_flags rows = [{key:'doc_color_scheme', value:'forest'}, {key:'doc_logo_path', value:'data/branding/logo.png'}]

#### Scenario: Admin removes logo

Given a logo is currently saved (doc_logo_path is not empty)
When the admin clicks the remove logo button
Then the logo file is deleted from data/branding/
And doc_logo_path is cleared in feature_flags
And the upload area reverts to the empty dashed-border state

##### Example: Color scheme options

| ID | Name | headerBg | headerText | accentColor |
|----|------|----------|------------|-------------|
| navy | 深藍經典 | #1B3A6B | #FFFFFF | #2563EB |
| slate | 石板灰 | #334155 | #FFFFFF | #64748B |
| warm | 暖棕 | #78350F | #FFFFFF | #D97706 |
| forest | 森林綠 | #14532D | #FFFFFF | #16A34A |
| white | 純白簡約 | #FFFFFF | #1E293B | #3B82F6 |
| burgundy | 酒紅 | #7F1D1D | #FFFFFF | #DC2626 |
