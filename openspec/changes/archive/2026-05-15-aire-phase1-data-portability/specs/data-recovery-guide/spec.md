# data-recovery-guide Specification

## Purpose

Ship a customer-facing standard operating procedure document at `docs/data-recovery-guide.md` that walks the customer through backup, cross-machine import, forgot-master-password recovery, and the unrecoverable lost-recovery-code limitation, in Traditional Chinese.

## ADDED Requirements

### Requirement: Guide SHALL exist at `docs/data-recovery-guide.md` in Traditional Chinese

The system SHALL ship a Markdown file at `docs/data-recovery-guide.md` written entirely in Traditional Chinese with Taiwanese real-estate-industry vocabulary suitable for a non-technical store owner reader.

#### Scenario: File is present and Traditional Chinese

- **WHEN** the build artifact is unpacked
- **THEN** the file `docs/data-recovery-guide.md` exists AND its body matches the Traditional Chinese language tag (no Simplified Chinese variants in non-technical prose)

### Requirement: Guide SHALL cover four explicit customer scenarios

The system SHALL include exactly the following four sections, in this order: "情境 1：定期備份"（routine backup）, "情境 2：換電腦匯入資料"（cross-machine import）, "情境 3：忘記主密碼"（forgot master password）, "情境 4：救援碼也遺失"（lost recovery code as well）. Each section SHALL contain step-by-step numbered actions phrased as imperative instructions.

#### Scenario: Four-section structure is present

- **WHEN** the guide is rendered as Markdown
- **THEN** the table of contents lists the four section headings in the specified order

##### Example: TOC output

- **GIVEN** the file `docs/data-recovery-guide.md` shipped with the build
- **WHEN** running `grep -E "^## 情境" docs/data-recovery-guide.md`
- **THEN** the output is exactly four lines in this order:
  ```
  ## 情境 1：定期備份
  ## 情境 2：換電腦匯入資料
  ## 情境 3：忘記主密碼
  ## 情境 4：救援碼也遺失
  ```

### Requirement: Guide SHALL warn that lost recovery code means permanent data loss

The system SHALL include a red-bold warning at the top of the guide and at the start of "情境 3" stating that losing both the master password and the recovery code results in permanent loss of access to all encrypted case data, with no vendor-side recovery path. The warning SHALL be positioned so that it is visible without scrolling on a 1080p browser window when the document is opened.

#### Scenario: Warning is present at top of guide

- **WHEN** the guide opens in a browser at 1920x1080 viewport
- **THEN** the red-bold warning text "救援碼遺失將導致資料永久無法救援" is visible without scrolling

### Requirement: Guide SHALL document the recovery code physical-storage recommendations

The system SHALL include concrete physical-storage recommendations for the recovery code: store the printed recovery code in a physical safe or a fireproof box, do not photograph it with a phone that syncs to cloud services, and clear the printer spool after printing.

#### Scenario: Three storage recommendations are listed

- **WHEN** the reader navigates to the recovery code storage section of the guide
- **THEN** the document lists the three recommendations: physical safe, no cloud-syncing photographs, clear printer spool

##### Example: Recommendation list rendering

- **GIVEN** the section "救援碼實體保管建議" inside `docs/data-recovery-guide.md`
- **WHEN** the section is rendered
- **THEN** it contains three numbered items reading exactly:
  1. 將列印的救援碼放入實體保險箱或防火盒
  2. 不要用會自動同步雲端的手機拍照（含 iCloud / Google Photos / OneDrive 自動上傳）
  3. 列印完成後務必清空印表機列印佇列（spool）

### Requirement: Guide SHALL document the conflict resolution choices during import

The system SHALL explain in plain language what each of the three import conflict actions does (覆蓋 / 保留新版 / 跳過) and when to use each, with at least one realistic real-estate workflow example per action.

#### Scenario: Import conflict choices are documented

- **WHEN** the reader navigates to "情境 2"
- **THEN** the section explains 覆蓋, 保留新版, and 跳過 with one example each
