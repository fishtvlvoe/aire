## REMOVED Requirements

### Requirement: activation-page-form

This requirement is removed. The license activation form is moved to the settings page (settings-page spec, requirement settings-license-section). The /activation route SHALL redirect to /settings instead of displaying the activation form.

#### Scenario: activation form no longer renders

- **WHEN** the user navigates to /activation
- **THEN** the activation form SHALL NOT be displayed
- **AND** the page SHALL redirect to /settings instead

##### Example: form removal verification

- **GIVEN** the /activation page has been updated
- **WHEN** the user navigates to /activation
- **THEN** no serial key input field is rendered
- **AND** no "啟動" button is rendered
- **AND** the browser location changes to /settings

## ADDED Requirements

### Requirement: activation-redirect

The /activation route SHALL redirect to /settings to maintain backward compatibility with existing deeplinks or bookmarks.

#### Scenario: activation page redirects

- **WHEN** the user navigates to /activation
- **THEN** the browser SHALL redirect to /settings

##### Example: old bookmark redirect

- **GIVEN** a user has bookmarked /activation
- **WHEN** they open the bookmark
- **THEN** the browser redirects to /settings
