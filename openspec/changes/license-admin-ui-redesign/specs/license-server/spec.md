## ADDED Requirements

### Requirement: License list API returns extended fields

The GET /api/license/list endpoint SHALL return each license with additional fields: contactName (string, default ""), company (string, default ""), and index (integer, sequential number based on response order). The endpoint SHALL support a search query parameter that performs case-insensitive partial matching against: index, key, contactName, company, and email.

#### Scenario: List returns extended fields
- **WHEN** admin sends GET /api/license/list with valid admin token
- **THEN** each license object includes contactName, company, and index fields

##### Example: Extended response shape
- **GIVEN** 2 licenses in KV: ABCD-1234 (contactName="王大明", company="大明不動產") and WXYZ-9876 (no contactName/company)
- **WHEN** admin sends GET /api/license/list
- **THEN** response contains: [{ index: 1, key: "ABCD-1234", contactName: "王大明", company: "大明不動產", ... }, { index: 2, key: "WXYZ-9876", contactName: "", company: "", ... }]

#### Scenario: Old licenses without contact info
- **WHEN** a license in Vercel KV lacks contactName and company fields
- **THEN** the API returns contactName: "" and company: ""

#### Scenario: Search by contact name
- **WHEN** admin sends GET /api/license/list?search=王大明
- **THEN** only licenses with contactName containing "王大明" are returned

#### Scenario: Search by company
- **WHEN** admin sends GET /api/license/list?search=大明不動產
- **THEN** only licenses with company containing "大明不動產" are returned

##### Example: Search matching
| search param | matches field | license key | included |
|---|---|---|---|
| "王大明" | contactName | ABCD-1234 | yes |
| "003" | index | third license | yes |
| "WXYZ" | key | WXYZ-9876 | yes |
| "nonexistent" | none | - | no (empty result) |

## ADDED Requirements

### Requirement: Update license contact info API

The system SHALL provide PATCH /api/license/update-info that updates contactName, company, and/or email for a given license key. When email is changed, the system SHALL update the email-index in Vercel KV (remove old index entry, create new one). The endpoint SHALL require LICENSE_ADMIN_TOKEN authorization.

#### Scenario: Update contact name only
- **WHEN** admin sends PATCH /api/license/update-info with { key: "ABCD-1234", contactName: "李小華" }
- **THEN** the system returns 200 with updated license object where contactName is "李小華"

#### Scenario: Update email with index sync
- **WHEN** admin sends PATCH /api/license/update-info with { key: "ABCD-1234", email: "new@test.com" } and old email was "old@test.com"
- **THEN** email-index:old@test.com no longer contains "ABCD-1234"
- **THEN** email-index:new@test.com contains "ABCD-1234"

#### Scenario: Key not found
- **WHEN** key does not exist in Vercel KV
- **THEN** the system returns 404 { error: "序號不存在" }

#### Scenario: Unauthorized request
- **WHEN** request lacks valid LICENSE_ADMIN_TOKEN
- **THEN** the system returns 401 { error: "未授權" }
