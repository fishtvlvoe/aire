## ADDED Requirements

### Requirement: Five-page UI flow covers the complete listing lifecycle

The system SHALL implement five pages in the Next.js application:
1. `/listings` — 物件列表頁
2. `/listings/new` — 新增物件（選類型）頁
3. `/listings/[id]/fill` — 資料填寫頁
4. `/listings/[id]/generating` — AI 產生中頁
5. `/listings/[id]/documents` — 文件輸出頁

#### Scenario: Navigate full flow for a new listing

- **WHEN** user clicks 新增物件 on the listing page
- **THEN** they SHALL be taken to `/listings/new`
- **WHEN** they select a type and click 下一步
- **THEN** they SHALL be taken to `/listings/[id]/fill`
- **WHEN** all data is filled and they click 產生文件
- **THEN** they SHALL be taken to `/listings/[id]/generating`
- **WHEN** generation completes
- **THEN** they SHALL be automatically redirected to `/listings/[id]/documents`

### Requirement: Listing page displays table with filter controls

The listing page SHALL display all listings in a table with the following columns:
- 物件地址
- 物件類型（顯示繁體中文名稱）
- 狀態（draft/field-visit-complete/ready-for-generation/documents-ready）
- 業務員
- 委託日期
- 操作（查看/繼續填寫/產生文件）

The page SHALL include filter controls:
- 物件類型篩選（下拉，含「全部」選項）
- 狀態篩選（下拉，含「全部」選項）

#### Scenario: Filter listings by type

- **WHEN** user selects 農地 from the type filter
- **THEN** only farmland listings SHALL be shown in the table

#### Scenario: Filter listings by status

- **WHEN** user selects 文件已產出 from the status filter
- **THEN** only listings with status `documents-ready` SHALL be shown

### Requirement: New listing page shows 13 types with availability state

The new listing page SHALL show all 13 property types as selectable cards in a grid layout. Types with `available: false` SHALL be displayed with a 「即將推出」badge and SHALL NOT be selectable.

#### Scenario: Select an available type

- **WHEN** user clicks the 農地 card
- **THEN** the card SHALL show a selected state (deep blue border + light blue background + checkmark)
- **THEN** the 下一步 button SHALL become active

#### Scenario: Attempt to select unavailable type

- **WHEN** user clicks a card marked 即將推出
- **THEN** nothing SHALL happen (card is not selectable)

### Requirement: Fill form page uses three-tab layout

The fill form page SHALL render a three-tab layout:
- Tab 1: 共通欄位 — always visible, same for all types
- Tab 2: 類型專屬欄位 — varies by property type, label shows type name
- Tab 3: 秘書後補 — secretary fields, visually distinct (lighter background)

Each tab SHALL show a completion indicator (filled / partially filled / empty).

#### Scenario: Tab completion indicator

- **WHEN** all required fields in Tab 1 are filled
- **THEN** Tab 1 SHALL show a green checkmark indicator

### Requirement: Generating page shows per-document progress

The generating page SHALL display a list of all 7 document types with their generation status:
- ✅ 已完成（green check）
- 🔄 產生中（orange spinner with text 產生中...）
- ⏳ 等待中（grey clock）

The page SHALL show an overall progress bar with count (e.g., 已完成 2/7) and estimated time remaining.

Upon completion, the page SHALL automatically redirect to the documents page.

#### Scenario: Auto-redirect on completion

- **WHEN** all 7 documents reach 已完成 status
- **THEN** the page SHALL automatically navigate to `/listings/[id]/documents` within 2 seconds

### Requirement: Document output page shows all 7 documents with download

The document output page SHALL display all 7 generated documents in a card grid:
- 物件調查表（property_dossier）
- 591 刊登文案（listing_591）
- 銷售 DM（sales_dm）
- 社群貼文 — Facebook / Instagram / Threads / TikTok / YouTube（social_posts）
- 短影音腳本（short_video_script）

Each card SHALL have a preview area and a 下載 button. The 物件調查表 card SHALL also show a 下載 PDF button.

A 重新產生 button SHALL be available per document.

#### Scenario: Download document

- **WHEN** user clicks 下載 on the 591 刊登文案 card
- **THEN** the system SHALL download a .txt file with the document content

#### Scenario: Download dossier PDF

- **WHEN** user clicks 下載 PDF on the 物件調查表 card
- **THEN** the system SHALL trigger PDF generation and download `dossier.pdf`

### Requirement: UI design follows established design system

All pages SHALL follow the established design system:
- Background: #F5F6FA (light grey)
- Primary color: #1B3A6B (deep blue)
- Accent color: #F5882B (orange)
- Text: #2D3142 (dark grey)
- Font: Manrope
- Card style: white background, rounded corners (8px), ambient shadow

#### Scenario: Consistent sidebar across all pages

- **WHEN** user navigates to any of the 5 pages
- **THEN** the left sidebar SHALL always be visible with 建安不動產 AI 系統 logo and navigation items
