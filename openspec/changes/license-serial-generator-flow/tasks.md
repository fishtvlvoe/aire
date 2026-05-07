## 1. 測試先行（TDD）

- [x] 1.1 撰寫 `Admin can pre-create serial keys` 測試：涵蓋 201 成功、401 未授權、400 invalid_count（license-server/api/license/__tests__/create.test.ts）
- [x] 1.2 [P] 撰寫 `Admin can list serial key inventory` 測試：涵蓋 status filter、invalid_pagination（license-server/api/license/__tests__/list.test.ts）
- [x] 1.3 [P] 撰寫 `Admin can revoke serial keys` 測試：涵蓋 200 成功、404 license_not_found（license-server/api/license/__tests__/revoke.test.ts）
- [x] 1.4 [P] 撰寫 `Activation requires pre-issued serial` 與 `Verification enforces lifecycle status` 測試（license-server/api/license/__tests__/activate-verify.test.ts）
- [x] 1.5 [P] 撰寫 `License generation CLI uses create API` 測試：批次 count 與缺少 LICENSE_ADMIN_TOKEN 失敗（scripts/generate-license.test.ts）

## 2. 序號資料模型與工具

- [x] 2.1 實作 Decision 1: 授權資料仍使用 Vercel KV，擴充序號狀態欄位（`license-server/lib/store.ts` normalize 與欄位擴充：status/createdAt/activatedAt/revokedAt/revokedReason）
- [x] 2.2 [P] 新增 `license-server/lib/serial.ts` 實作序號格式與批次產生邏輯，並補 `license-server/lib/__tests__/serial.test.ts`

## 3. 管理 API（create/list/revoke）

- [x] 3.1 實作 Decision 2: 新增管理 API（create/list/revoke）並以 `LICENSE_ADMIN_TOKEN` 保護（`POST /api/license/create`，license-server/api/license/create.ts）
- [x] 3.2 [P] 依同一 Decision 實作 `GET /api/license/list`（license-server/api/license/list.ts）
- [x] 3.3 [P] 依同一 Decision 實作 `POST /api/license/revoke`（license-server/api/license/revoke.ts）

## 4. 啟用與驗證流程調整

- [x] 4.1 實作 Decision 3: 啟用流程改為「只能啟用預先建立且未啟用序號」（修改 `license-server/api/license/activate.ts`）
- [x] 4.2 修改 `license-server/api/license/verify.ts` 以滿足 `Verification enforces lifecycle status`
- [x] 4.3 實作 `Consultant handoff uses pre-created serials` 對應的 setup error mapping（`src/app/api/license/init/route.ts`、`src/lib/license/server-verify.ts`）

## 5. CLI 與交付流程

- [x] 5.1 實作 Decision 4: CLI 產號腳本支援批次輸出並固定以 Asia/Taipei 解析到期日（修改 `scripts/generate-license.ts`）
- [x] 5.2 [P] 新增輸出檔格式（CSV）與 count 批次參數，確保與 `POST /api/license/create` request schema 一致

## 6. Code Review

- [x] 6.1 使用 kimi MCP 針對 license-server API、store、CLI 變更進行多檔安全與邏輯審查，覆核 `LICENSE_ADMIN_TOKEN` 驗證與 revoke 邊界條件

## 7. 部署與驗證

- [x] 7.1 在 license-server 部署環境新增 `LICENSE_ADMIN_TOKEN` 並驗證 create/list/revoke 端點可用
- [x] 7.2 以測試序號執行端對端驗證：create → handoff → activate → verify → revoke
