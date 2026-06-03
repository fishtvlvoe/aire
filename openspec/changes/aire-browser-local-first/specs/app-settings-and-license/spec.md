# app-settings-and-license Specification (delta)

> 本檔為 `aire-browser-local-first` change 對既有能力 `app-settings-and-license` 的修改。
> 純瀏覽器版新增 device_id 綁定與 CF Worker 授權驗證路徑；既有桌面版 / Node 本地版的授權行為不變。
> 對應 design.md Decision 2（CF Worker gateway）、Decision 4（瀏覽器 Device ID）、Decision 5（better-auth 兩階段）。

## MODIFIED Requirements

### Requirement: Plan settings SHALL show account role and license state

Plan settings SHALL show the current account identity, account role, plan name, and authorization state. Trial accounts SHALL show the trial expiration date. Perpetual or buyout accounts SHALL show lifetime authorization or equivalent perpetual license language. In the browser edition, plan settings SHALL additionally show the bound device state and SHALL provide a self-service device unbinding action.

#### Scenario: Trial account opens plan settings

- **GIVEN** the current account is a trial account
- **WHEN** the user opens plan settings
- **THEN** the page SHALL show account identity, role, plan name, authorization state, and trial expiration date.

#### Scenario: Perpetual account opens plan settings

- **GIVEN** the current account has a perpetual or buyout license
- **WHEN** the user opens plan settings
- **THEN** the page SHALL show account identity, role, plan name, authorization state, and lifetime authorization or equivalent perpetual license language.

#### Scenario: Browser edition shows bound device and unbinding action

- **GIVEN** the browser edition is authorized and bound to a `device_id`
- **WHEN** the user opens plan settings
- **THEN** the page SHALL show the current bound device state (device name and bind status)
- **AND** the page SHALL provide a "解除綁定" (unbind device) action
- **AND** triggering the unbind action SHALL require master password verification before calling OPCOS `license/deactivate`.

## ADDED Requirements

### Requirement: Browser edition license verification SHALL route through the CF Worker gateway

In the browser edition, all license activation and verification SHALL be performed through the `aire.opcos.me` CF Worker gateway rather than a local runtime process. License credentials and OPCOS API tokens SHALL NOT be exposed to the browser client.

#### Scenario: Browser edition activates a license

- **GIVEN** an authenticated user in the browser edition has entered a License Key
- **WHEN** the application submits the activation request
- **THEN** the request SHALL be sent to `aire.opcos.me/api/license/activate`
- **AND** the request SHALL include the browser-generated `device_id`
- **AND** the OPCOS API token SHALL be applied by the CF Worker, never by the browser
- **AND** on success the account SHALL transition from trial mode to full authorized mode.

#### Scenario: Browser edition verifies license on launch

- **GIVEN** a previously authorized browser edition with a stored `device_id`
- **WHEN** the application launches
- **THEN** it SHALL verify the license via `aire.opcos.me/api/license/verify` with the stored `device_id`
- **AND** if the `device_id` no longer matches the bound device, the application SHALL fall back to trial mode and prompt the user to re-authorize or transfer the license.

### Requirement: Browser edition SHALL gate full features behind two-phase authentication and authorization

The browser edition SHALL require an authentication phase (better-auth email/password) followed by an authorization phase (OPCOS license activation). Users who complete authentication but not authorization SHALL be restricted to trial mode.

#### Scenario: Authenticated but unauthorized user is limited to trial

- **GIVEN** a user has completed better-auth authentication
- **AND** the user has not completed OPCOS license activation
- **WHEN** the user uses the application
- **THEN** the user SHALL operate in trial mode
- **AND** the number of cases SHALL be capped at 3
- **AND** the application SHALL surface a prompt to enter a License Key to unlock full features.
