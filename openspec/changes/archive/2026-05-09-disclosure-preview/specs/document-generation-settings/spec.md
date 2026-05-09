## MODIFIED Requirements

### Requirement: Admin template settings page includes background image management

The admin template settings page (src/app/admin/(dashboard)/templates/page.tsx) SHALL include a "Template Background" section below the existing color scheme and logo sections. This section allows uploading, previewing, and deleting background images for the cover page and content page.

#### Scenario: Background section renders on template settings page

- **WHEN** admin navigates to the template settings page
- **THEN** the page shows three sections in order: (1) Color Scheme selector, (2) Logo uploader, (3) Template Background uploader with two slots (cover page and content page)

#### Scenario: Background thumbnail preview

- **WHEN** a background image has been uploaded for the cover page
- **THEN** the cover page slot shows a thumbnail preview (max height 200px) of the uploaded image with a delete button

#### Scenario: No background uploaded

- **WHEN** no background image has been uploaded for a page slot
- **THEN** the slot shows a dashed-border placeholder with an upload button labeled "Upload Background"
