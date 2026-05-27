# settings-plan-upgrade-profile-redesign Specification

## Purpose

TBD - created by archiving change 'settings-plan-upgrade-profile-redesign'. Update Purpose after archive.

## Requirements

### Requirement: Plans and upgrade SHALL replace duplicate entitlement pages

The app SHALL expose one customer-facing plans page named `方案與升級` instead of separate `功能開關` and `授權與升級` pages.

#### Scenario: Sidebar has one plans entry

- **WHEN** the user expands 系統設定
- **THEN** the sidebar shows 個人設定、地政授權、方案與升級
- **AND** it does not show 功能開關 or 授權與升級 as separate entries

##### Example: consolidated settings navigation

- **GIVEN** the user is on `/settings`
- **WHEN** the 系統設定 sidebar group is expanded
- **THEN** visible links include 個人設定、地政授權、方案與升級
- **AND** visible links do not include 功能開關

---
### Requirement: Plans page SHALL use three plan cards

The plans page SHALL present three plan cards: 基本款、進階款、高級款. Upgrade actions SHALL navigate to the external upgrade path and SHALL NOT imply local payment is already implemented.

#### Scenario: Three plan cards are visible

- **GIVEN** the URL is `/settings?section=plans`
- **WHEN** the page renders
- **THEN** 基本款、進階款、高級款 are visible
- **AND** the page does not show MCP Hub

#### Scenario: Current plan and upgrade plans are distinct

- **WHEN** the plans page renders for a basic-plan user
- **THEN** 基本款 is marked 目前方案
- **AND** 進階款 and 高級款 have 前往升級 actions

##### Example: basic current plan

- **GIVEN** the current plan is 基本款
- **WHEN** the user opens `/settings?section=plans`
- **THEN** 基本款 shows 目前方案
- **AND** 進階款 and 高級款 show 前往升級

---
### Requirement: Available features SHALL be understandable and not broken toggles

The plans page SHALL show currently available feature controls only for features usable in the current test build. Upgrade-only capabilities SHALL appear inside plan cards, not as disabled controls scattered across the page.

#### Scenario: Toggle stays inside track

- **WHEN** the plans page renders
- **THEN** every visible toggle thumb remains inside its toggle track

##### Example: available feature toggle

- **GIVEN** the test build enables 地籍圖整理
- **WHEN** the plans page renders
- **THEN** the 地籍圖整理 toggle is enabled
- **AND** its thumb stays inside the toggle track bounds

---
### Requirement: Personal settings SHALL be the default settings landing page

The bottom profile entry and `/settings` SHALL show personal settings, not the plans page.

#### Scenario: Personal settings sections are visible

- **WHEN** the user opens `/settings`
- **THEN** the page heading is 個人設定
- **AND** 帳號與授權管理、更新密碼、個人名稱與 Email、品牌色、目前操作紀錄 are visible

---
### Requirement: Engineering labels SHALL be hidden from customer upgrade UI

Customer-facing upgrade UI SHALL use business labels such as 實價登錄 and SHALL NOT display internal engineering names such as MCP Hub.

#### Scenario: MCP label is hidden

- **WHEN** the user opens `/settings?section=plans`
- **THEN** no text `MCP Hub` appears
- **AND** the user sees 實價登錄 as the business feature name
