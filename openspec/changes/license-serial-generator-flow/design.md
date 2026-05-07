## Context

目前 license-server 已有 `activate` / `verify` / `features` / `updates/check`，但缺少「預先建立序號」與「序號庫存管理」能力，導致現場交付時只能臨時啟用。現況也存在腳本 `scripts/generate-license.ts` 期待 `/api/license/create` 但後端未實作，形成流程斷點。此變更需要同時調整 `license-server` API、KV 資料模型與 CLI，屬於跨模組流程整合，且涉及管理操作安全性。

## Goals / Non-Goals

**Goals:**

- 建立可預先產號的管理流程，讓顧問可在交付前準備序號清單。
- 建立「預建序號 → 客戶啟用綁定」雙階段授權生命周期。
- 提供最小可用的序號管理能力（建立、查詢、停用），並保留可追蹤欄位。
- 以 API + CLI 完成，不依賴 UI 後台，確保可立即落地。

**Non-Goals:**

- 不新增完整 Web 後台管理介面。
- 不導入計費、訂閱、金流或發票整合。
- 不調整 auto-updater 與 R2 發佈路徑。
- 不做多租戶 RBAC；先以單一管理密鑰保護管理 API。

## Decisions

### Decision 1: 授權資料仍使用 Vercel KV，擴充序號狀態欄位

- Approach: 沿用現有 `license:<key>` 與 `email-index:<email>` 結構，新增狀態欄位（`status`, `createdAt`, `issuedBy`, `activatedAt`, `revokedAt`, `revokedReason`），避免更換儲存層。
- Rationale: 現有 license-server 已依賴 `@vercel/kv`，可在不改部署形態下直接增量擴充。
- Alternatives Considered:
  1. 改用 SQLite / D1 儲存授權主表：可做複雜查詢，但會改變部署與維運模型，超出本次 scope。
  2. 改用外部 SaaS（Auth0/Firebase）管理授權：整合成本高且與既有 API 不相容。

### Decision 2: 新增管理 API（create/list/revoke）並以 `LICENSE_ADMIN_TOKEN` 保護

- Approach: 新增 `POST /api/license/create`、`GET /api/license/list`、`POST /api/license/revoke`，管理端需帶 `Authorization: Bearer <token>`。
- Rationale: 可立即支援顧問端「先產號再交付」，且安全邊界清楚。
- Alternatives Considered:
  1. 沿用 `activate` 作為產號入口：會混淆顧問管理行為與客戶啟用行為，導致資料語意錯亂。
  2. 僅靠 IP allowlist 保護管理 API：在行動網路與外出交付情境不穩定且維護成本高。

### Decision 3: 啟用流程改為「只能啟用預先建立且未啟用序號」

- Approach: `POST /api/license/activate` 僅接受 `status=issued` 的序號，成功後轉為 `activated` 並綁定 email。
- Rationale: 符合商業交付流程，避免任意 licenseKey 在現場被動態創建。
- Alternatives Considered:
  1. 保留現況（activate 可自動創建）：無法控制序號池，容易產生未授權濫發。
  2. 改用一次性 activation token 取代序號：安全性佳，但會增加現場交付操作複雜度。

### Decision 4: CLI 產號腳本支援批次輸出並固定以 Asia/Taipei 解析到期日

- Approach: `scripts/generate-license.ts` 支援 `--count` 與 `--expires`，輸出 CSV/純文字清單，並在腳本層明確驗證到期時間（Asia/Taipei）。
- Rationale: 顧問現場常需一次發放多組序號，批次輸出可直接貼給客戶或列入交付文件。
- Alternatives Considered:
  1. 只提供單筆產號：可行但人工成本高，容易複製錯誤。
  2. 把批次邏輯做在 shell script：可快速完成，但可維護性與測試性差。

## Risks / Trade-offs

- [Risk] 管理 token 外洩可能導致未授權產號 → Mitigation：僅在 server 環境變數保存，API 全部拒絕無 token 請求，並在 audit 欄位記錄 issuedBy。
- [Risk] KV `keys()` 在序號量增大時查詢變慢 → Mitigation：`list` API 預設分頁與 status filter，避免一次全量回傳。
- [Risk] 舊資料缺少新欄位導致程式判斷錯誤 → Mitigation：在 store 層做向下相容 normalize（缺欄位時補預設值）。
- [Risk] 時區解析不一致造成到期日提前/延後 → Mitigation：在 CLI 與 API 統一以 Asia/Taipei 規則解析並輸出 ISO 時間。

## Migration Plan

1. 部署 license-server 新版（create/list/revoke + activate 條件限制 + store normalize）。
2. 設定 `LICENSE_ADMIN_TOKEN` 到部署平台（Vercel Project Env）。
3. 升級顧問端 CLI 腳本（`scripts/generate-license.ts`）並驗證能呼叫 `POST /api/license/create`。
4. 先在測試環境建立 5 組序號，完成「預建→啟用→驗證→停用」全流程演練。
5. 正式環境切換流程：停止使用「現場臨時創建」，改為「預建序號交付」。

Rollback strategy:

- 若新流程異常，回滾至前一版 license-server，並暫時恢復既有 activate 行為。
- 回滾期間保留已建立序號資料，不刪除 KV 紀錄；待修復後重新啟用新 API。

## Open Questions

- 是否需要在 `create` API 支援 `features` 覆寫，讓不同客戶在建立序號時即設定方案層級？
- 是否需要新增 `POST /api/license/bulk-create`，降低多筆建立時的網路往返成本？
- 是否要在下一期加入最小 Web 管理頁（僅查詢與停用），避免 CLI 依賴？
