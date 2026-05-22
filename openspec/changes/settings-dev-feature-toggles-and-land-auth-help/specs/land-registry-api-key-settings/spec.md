## ADDED Requirements

### Requirement: 地政授權頁提供官方註冊入口

The land registry API settings section SHALL provide a customer-facing official registration link before the Client ID and secret fields.

- **WHEN** the user opens `/settings?section=registry-auth`
- **THEN** the `地政 API 設定` section SHALL display a help block titled `申請說明`
- **THEN** the help block SHALL display `請使用自然人憑證或是工商憑證註冊帳號，即可開始使用。`
- **THEN** the help block SHALL include a link to `https://cop.moi.gov.tw/Register`
- **THEN** the help block SHALL NOT use the generic `敬請期待` placeholder for application instructions

#### Scenario: user can open official registration page

- **GIVEN** the user is on `/settings?section=registry-auth`
- **WHEN** the land API settings finish loading
- **THEN** a link named `前往地政註冊` is visible
- **AND** its href is `https://cop.moi.gov.tw/Register`
