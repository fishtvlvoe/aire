## 1. 統一認證機制 (Unified Auth Implementation)

- [x] 1.1 [P] 實作「統一使用 resolveCurrentUser 作為認證解析器」：修改 src/app/api/me/route.ts 全面使用 resolveCurrentUser 取代 getSessionUser。達成 User login with credentials 需求中對認證邏輯統一的要求。驗證：登入後訪問 /api/me 能正確回傳用戶資料。
- [x] 1.2 [P] 從 src/lib/auth.ts 中移除已廢棄的 getSessionUser 函式與 SESSION_COOKIE 變數。實作 Legacy session management 需求的移除動作。驗證：全域 grep 搜尋不再出現該函式。

## 2. Lint 雜訊清理與品質修復 (Lint and Code Quality Cleanup)

- [x] 2.1 [P] 實作「調整 ESLint globalIgnores 排除外部腳本」：在 eslint.config.mjs 的 globalIgnores 中加入 docs/影片製作標準化/**。驗證：執行 npm run lint 不再出現 docs 目錄下的錯誤。
- [x] 2.2 [P] 修正 src/app/listings/[id]/fill/page.tsx 中 useMemo 遺漏的 submitFieldVisit 依賴。驗證：npm run lint 針對該檔案不再報 Hook 警告。
- [x] 2.3 [P] 修正 src/app/admin/(dashboard)/audit-logs/page.tsx 中 useEffect 遺漏的 load 依賴。驗證：npm run lint 針對該檔案不再報 Hook 警告。
- [x] 2.4 [P] 清理 src/lib/ocr/index.ts、src/app/api/listings/[id]/regenerate/route.ts 等檔案中被 Linter 標記為 unused 的變數。驗證：npm run lint 不再回報未使用變數錯誤。

## 3. CI 訊號驗證 (CI Signal Validation)

- [x] 3.1 執行完整的 npm run lint。驗證：指令成功結束（Exit Code 0）且無任何 error。
- [x] 3.2 執行完整的 npm run test。驗證：確保本次 cleanup 未對現有功能造成任何 regression。
