## Why

目前現場安裝流程缺少「預先產號」能力，導致顧問到客戶端時無法直接交付可用序號，只能臨時啟用或手動改資料。這會增加交付時間與出錯風險，且不利於後續授權管理與追蹤。

## What Changes

- 新增 License Serial 產號流程，提供可預先建立序號、設定有效期與預設功能清單的管理 API。
- 新增序號查詢與狀態管理能力，支援檢視未啟用/已啟用/停用序號與啟用資訊。
- 修改 license-server 啟用流程，讓「預先建立序號」與「客戶首次啟用綁定 email」形成完整雙階段流程。
- 修改 CLI 產號腳本，改為呼叫正式 `POST /api/license/create`，可批次產號並輸出可交付清單。
- 新增最小管理保護機制（管理金鑰）以限制產號與停用操作，避免未授權濫發序號。

## Non-Goals (optional)

- 不建立完整後台 UI（本次以 API + CLI 為主）。
- 不導入新的商業計費系統或金流整合。
- 不更動 Auto Update 下載來源架構（仍維持 license server + R2）。
- 不處理跨租戶權限模型（先以單一管理端操作為前提）。

## Capabilities

### New Capabilities

- `license-serial-generator`: 提供序號預先建立、批次產號、查詢與停用的授權管理能力。

### Modified Capabilities

- `license-server`: 調整啟用與驗證規格，使預建序號與啟用綁定流程一致。
- `license-management`: 補齊現場交付序號、啟用狀態追蹤與停用管理的規範。

## Impact

- Affected specs: `license-serial-generator`（new）, `license-server`（modified）, `license-management`（modified）
- Affected code:
  - New:
    - `license-server/api/license/create.ts`
    - `license-server/api/license/list.ts`
    - `license-server/api/license/revoke.ts`
    - `license-server/lib/serial.ts`
    - `license-server/lib/__tests__/serial.test.ts`
    - `license-server/api/license/__tests__/create.test.ts`
    - `license-server/api/license/__tests__/list.test.ts`
    - `license-server/api/license/__tests__/revoke.test.ts`
  - Modified:
    - `license-server/lib/store.ts`
    - `license-server/api/license/activate.ts`
    - `scripts/generate-license.ts`
    - `scripts/generate-license.test.ts`
    - `openspec/specs/license-server/spec.md`
    - `openspec/specs/license-management/spec.md`
  - Removed: none
- Dependencies 新增:
  - none
- 環境變數新增:
  - `LICENSE_ADMIN_TOKEN`（保護 create/list/revoke 管理端 API）
