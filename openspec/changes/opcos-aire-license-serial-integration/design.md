## Context

AIRE 現在的授權相關狀態分成三層：

```text
OPCOS 主站
  產生序號、保存 license、保存裝置啟用、顯示產品權限

AIRE 桌面 App
  輸入序號、呼叫 OPCOS 啟用/驗證、保存本機 token 與授權狀態

測試環境
  用假帳號、假組織、假序號、mock backend 驗證流程
```

使用者關心的是：跑完整個系統後，AIRE 不應該只是本機 UI 假狀態，而是要能接到 OPCOS 主站發出的序號。也就是使用者在 OPCOS 申請或被核發 AIRE 方案後，能拿到可用序號，回到 AIRE 啟用。

## Goals

- OPCOS 是正式序號與方案權限的 source of truth。
- OPCOS admin 能為 AIRE 產生序號，或核准 upgrade request 後自動產生序號。
- OPCOS 使用者產品頁能顯示 AIRE 授權狀態、完整序號、裝置數與下載入口。
- AIRE 設定頁能輸入序號並呼叫 OPCOS activate/verify API。
- AIRE 方案升級 CTA 導向 OPCOS AIRE 產品頁，而不是本機付款或假開關。
- 測試流程每次從乾淨假資料開始，避免舊 localStorage/mock store 污染驗收。

## Non-Goals

- 不把 AIRE 案件資料同步到 OPCOS。
- 不在 AIRE 桌面端保存 OPCOS session cookie。
- 不在本 SR 接金流 webhook；付費完成後自動核發可以在下一個 SR 做。
- 不支援多產品共用序號格式；本次先固定 AIRE。

## System Contract

### 正常流程

```text
1. 使用者在 OPCOS 登入
2. 使用者進入 OPCOS AIRE 產品頁
3. 沒有授權時：點擊申請升級，建立 AIRE upgrade request
4. Admin 核准 request 或手動產生 license
5. OPCOS 儲存 license key、productId=aire、planId、maxDevices、status=ACTIVE
6. OPCOS AIRE 產品頁顯示完整序號與 Mac 下載入口
7. 使用者在 AIRE 桌面 App 設定頁輸入序號
8. AIRE 呼叫 OPCOS POST /api/license/activate
9. OPCOS 寫入 device activation，回傳 active 狀態
10. AIRE 保存本機授權狀態，後續啟動呼叫 verify
```

### 資料邊界

| 資料 | Source of truth | AIRE 可保存 | OPCOS 可保存 |
| --- | --- | --- | --- |
| License key | OPCOS | Keychain 保存已啟用序號 | 是 |
| Device id | AIRE | SQLite settings | device activation fingerprint |
| 方案 plan | OPCOS | 本機快取顯示 | 是 |
| AIRE 案件資料 | AIRE | 是 | 否 |
| 地政 API key | 客戶本機 | Keychain | 否 |

### API Contract

AIRE 桌面端只依賴兩個正式端點：

- POST /api/license/activate
  - request: license_key, device_id, device_name, os_version
  - success: status=active, token, valid_until
  - errors: invalid_key, quota_exhausted, revoked, expired, ip_blocked

- POST /api/license/verify
  - request: license_key, device_id
  - success: valid=true, status=active, license.productId=aire, last_verified_at
  - errors: invalid_key, device_mismatch, ip_blocked, revoked, expired, rate_limited

### Settings Contract

- AIRE 個人設定顯示授權狀態與序號啟用入口。
- AIRE 方案與升級顯示基本款/進階款/高級款，但前往升級只導向 OPCOS AIRE 產品頁。
- 已啟用授權時，AIRE 顯示目前方案與最後驗證時間。
- 未啟用授權時，AIRE 顯示輸入序號與前往 OPCOS 取得序號的 CTA。

### Test Data Contract

- E2E 測試必須在 beforeEach 清空 AIRE mock store/localStorage，再 seed 測試帳號、測試組織、測試序號。
- 測試不得刪除 production 或開發者手上的真實案件資料。
- 若需要清掉舊 demo cases，只能清 test namespace，例如 case number prefix AIRE-E2E 或 mock store key。
- 驗收報告要說明「清掉的是測試假資料，不是正式資料」。

## Acceptance

- OPCOS unit/integration tests prove admin create license and approve upgrade request both create AIRE license keys in AIRE-XXXX-XXXX-XXXX format.
- OPCOS API tests prove activate and verify accept AIRE desktop snake_case payloads and enforce device/IP constraints.
- AIRE unit tests prove activate/verify client maps OPCOS success and known errors to customer-facing messages.
- AIRE settings tests prove 未啟用/已啟用/驗證失敗 states render correctly.
- E2E proves a seeded OPCOS license key can be displayed on product page, entered into AIRE, activated, and then verified.
- E2E reset helpers prove stale localStorage/mock store is cleared before each fake-data test run.

