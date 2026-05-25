# full-product-flow-ia-ux-acceptance Specification

## Purpose

TBD - created by archiving change 'full-product-flow-ia-ux-acceptance'. Update Purpose after archive.

## Requirements

### Requirement: Customer navigation SHALL expose each workflow once

AIRE SHALL expose each customer workflow through one primary sidebar location and SHALL NOT repeat the same workflow as a page-internal category menu or a second sidebar section.

#### Scenario: Sidebar contains unique workflow destinations

- **WHEN** the user opens the app shell
- **THEN** the sidebar groups customer workflows as 案件管理、地政資料、產出文件、系統設定
- **AND** 新增案件 appears under 案件管理
- **AND** 地政資料 does not contain a separate 地政查詢 link to the same create-case flow

##### Example: unique workflow destinations

- **GIVEN** the user expands all sidebar groups
- **WHEN** visible links are inspected
- **THEN** 新增案件 appears once
- **AND** 地政查詢 appears zero times

#### Scenario: Page content does not repeat sidebar categories

- **WHEN** the user opens any settings section
- **THEN** the page does not render a second 設定分類 menu inside the content area

##### Example: settings content area

- **GIVEN** the URL is `/settings?section=features`
- **WHEN** the content area renders
- **THEN** there is no heading named 設定分類

---
### Requirement: Customer pages SHALL render only their own scope

Each customer-facing page SHALL render only the content needed for its selected workflow scope.

#### Scenario: Settings sections remain independent

- **WHEN** the user opens 功能開關
- **THEN** the page shows exactly one 授權與升級 toggle list
- **AND** the page does not show 授權管理、實價登錄 MCP Hub, or Super Admin

##### Example: feature section independence

- **GIVEN** the URL is `/settings?section=features`
- **WHEN** the page renders
- **THEN** there is exactly one 授權與升級 heading
- **AND** 授權管理、實價登錄 MCP Hub、Super Admin are absent

#### Scenario: Land data sections remain independent

- **WHEN** the user opens 資料來源
- **THEN** the page shows land-data source boundaries
- **AND** the page does not show authorization cards, API credential forms, MCP Hub, or Super Admin

##### Example: source page independence

- **GIVEN** the URL is `/settings?section=registry-rules`
- **WHEN** the page renders
- **THEN** 屋主資料邊界 is visible
- **AND** 地政 API 設定、實價登錄 MCP Hub、Super Admin are absent

#### Scenario: Billing section remains independent

- **WHEN** the user opens 費用紀錄
- **THEN** the page shows fee ownership and monthly usage
- **AND** the page does not show license activation or upgrade controls

##### Example: billing page independence

- **GIVEN** the URL is `/settings?section=billing`
- **WHEN** the page renders
- **THEN** 費用歸屬 and 本月使用量 are visible
- **AND** 授權管理 is absent

---
### Requirement: Create-case flow SHALL be address-first and guarded

The create-case flow SHALL use address-first registry detection before allowing case creation.

#### Scenario: User cannot create before registry decision

- **WHEN** the user enters an address but has not clicked 判斷地政資料
- **THEN** the system blocks case creation
- **AND** displays 請先按「判斷地政資料」確認土地或建物資料，再建立案件。

##### Example: create guard

- **GIVEN** the user enters `台南市永康區勝利街58巷4號1樓`
- **WHEN** the user submits before clicking 判斷地政資料
- **THEN** no case is created
- **AND** the guard message is displayed

#### Scenario: Normal building address is classified as building

- **WHEN** the user enters 台南市永康區勝利街58巷4號1樓
- **THEN** fallback classification displays 建物
- **AND** it does not display 農地 or 農舍

---
### Requirement: Workbench SHALL not show fake executable controls

The case workbench SHALL not present unfinished backend actions as normal executable buttons.

#### Scenario: Backend-incomplete actions are not primary controls

- **WHEN** the user opens a case workbench
- **THEN** the page does not show active-looking 重新查詢 or 產生補件清單 buttons unless their backend action is implemented and tested
- **AND** the page SHALL show read-only status summaries or explicit unavailable copy instead

##### Example: workbench action visibility

- **GIVEN** backend supplement generation is not implemented
- **WHEN** the user opens `/cases/<id>`
- **THEN** no active button named 產生補件清單 is visible

---
### Requirement: Full product flow SHALL have automated acceptance coverage

The implementation SHALL include automated acceptance tests that click through the customer-visible flow from case creation to settings.

#### Scenario: E2E walks the full visible workflow

- **WHEN** the full product flow E2E test runs
- **THEN** it visits 新增案件、案件總覽、說明書工作台、補件清單、資料來源、費用紀錄、PDF 預覽、列印與匯出、地政授權、功能開關、授權與升級
- **AND** each page has a unique heading and no duplicate same-scope controls
