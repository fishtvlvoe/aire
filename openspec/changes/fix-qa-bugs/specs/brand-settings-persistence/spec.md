## MODIFIED Requirements

### Requirement: Brand text fields stored and retrievable

The system SHALL persist 7 brand identity text fields: `agent_name`, `agent_cert_no`, `company_name`, `company_license_no`, `company_address`, `company_phone`, `realtor_name`. All fields are TEXT nullable. Persistence SHALL go through `StorageAdapter`: in production, `TauriStorageAdapter.saveBranding` calls IPC `save_brand_text_settings`; in development, `MockStorageAdapter.saveBranding` writes to `localStorage['aire-mock-store'].branding`. `StorageAdapter.getBranding` SHALL be called on page mount; returned values SHALL pre-populate the 7 text inputs. If `getBranding` returns null, all inputs render empty.

#### Scenario: Save and retrieve brand text settings

- **WHEN** user fills 公司名稱 as "大安不動產" and clicks 儲存
- **THEN** `StorageAdapter.saveBranding({ companyName: "大安不動產", ... })` is called and the value is persisted
- **AND WHEN** `StorageAdapter.getBranding` is called later (e.g., on next mount)
- **THEN** it returns `{ companyName: "大安不動產", ... }` with the saved value

#### Scenario: Fields restored on page reload in dev environment

- **WHEN** user saves brand settings in dev environment then reloads the page
- **THEN** `localStorage['aire-mock-store'].branding` contains the saved values
- **THEN** the 7 text inputs are pre-populated with the saved values (not empty)

#### Scenario: Empty state

- **WHEN** brand settings have never been saved
- **THEN** all 7 text inputs render empty (not null or undefined)
- **THEN** `aire-mock-store` has no `branding` key or `branding` is null

### Requirement: 品牌設定 page renders brand text form

The 品牌設定 settings tab SHALL render a form with 7 labelled text inputs for the brand identity fields, a 儲存 button, and a success toast on save. The form SHALL pre-populate with values returned by `StorageAdapter.getBranding` on mount.

#### Scenario: Page loads with saved data

- **WHEN** user navigates to 品牌設定 tab
- **THEN** all 7 text inputs are pre-populated with the values returned by `StorageAdapter.getBranding`

#### Scenario: Empty state on first visit

- **WHEN** brand settings have never been saved
- **THEN** all 7 text inputs render empty and the user can fill them in

##### Example: Dev environment roundtrip

- **GIVEN** `aire-mock-store.branding` is `{ agentName: "王小明", companyName: "大安不動產", agentCertNo: "A123456" }`
- **WHEN** user navigates to 品牌設定 tab
- **THEN** agent_name input shows "王小明", company_name input shows "大安不動產", agent_cert_no input shows "A123456"
