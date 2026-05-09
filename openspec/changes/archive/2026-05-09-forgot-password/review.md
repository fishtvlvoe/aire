# forgot-password 安全與邏輯審查（8.1）

日期：2026-05-09  
審查者：Codex（Kimi MCP 不可用，採同等檢查準則）

## 審查範圍

- `src/lib/email.ts`
- `src/lib/auth/password-reset-token.ts`
- `src/app/api/auth/forgot-password/route.ts`
- `src/app/api/auth/reset-password/route.ts`
- `src/app/forgot-password/page.tsx`
- `src/app/reset-password/page.tsx`
- `src/app/login/page.tsx`
- 對應測試檔與 middleware 放行設定

## 檢查重點

1. 是否避免 email 枚舉（forgot-password 一律回固定訊息）
2. token 簽章與用途驗證是否正確（purpose / exp / signature）
3. 密碼雜湊是否使用 bcrypt 並設定 cost
4. 錯誤處理是否不洩漏內部狀態
5. 密碼重設寫入是否具備審計追蹤

## 修正與結果

- 新增：reset-password 成功前先確認 token email 對應使用者存在，否則回 `401 重設連結無效`。
- 新增：密碼重設成功後寫入 `audit_logs`（`PASSWORD_RESET`）。
- 驗證：forgot-password 相關測試全綠（27 tests）。

## 結論

- Critical: 0
- Warning: 0
- Suggestion: 1（環境無法啟動 headless browser，7.1 截圖需在可啟動瀏覽器環境補跑）

