## Context

目前系統正處於從舊版 Session 機制（使用 SESSION_COOKIE 與 getSessionUser）過渡到 NextAuth (JWT) 的階段。部分路由（如 /api/me）仍在使用舊機制，導致認證邏輯分歧。此外，ESLint 受外部 Adobe 腳本目錄干擾，且存在 React Hook 依賴缺失與未使用變數等程式碼品質問題。

## Goals / Non-Goals

**Goals:**
- 統一後端認證入口，廢棄舊版 Session 機制。
- 排除 ESLint 雜訊，修復 React Hook 警告。
- 清理未使用變數，還原 CI 綠燈。

**Non-Goals:**
- 不進行大規模功能更新。
- 不修改第三方腳本的內容。

## Decisions

### 統一使用 resolveCurrentUser 作為認證解析器
- **理由**：resolveCurrentUser 已經實作在 src/lib/auth/resolve-user.ts，能正確處理 NextAuth JWT 並解析出 DB 中的使用者資訊。統一入口可避免認證分歧。
- **Alternatives Considered**:
    - **保留 getSessionUser 並補齊資料**：理由是被否決，因為維護兩套 session 機制（DB-based 與 JWT-based）會增加複雜度且容易出錯。
    - **直接在 Handler 呼叫 getToken**：理由是被否決，因為每個 handler 都要重複實作「從 token 到 DB user」的轉換邏輯，不利於維護。

### 調整 ESLint globalIgnores 排除外部腳本
- **理由**：docs/影片製作標準化/** 下的 Adobe 腳本為外部系統代碼，不應受本專案 Lint 規則限制。
- **Alternatives Considered**:
    - **修復外部腳本 lint 錯誤**：理由是被否決，這些不是本專案開發的代碼，修復它們不具經濟效益。
    - **將腳本移出 docs 目錄**：理由是被否決，目前的目錄結構是根據交付給客戶的文件組織而定的，隨意更動會影響客戶使用。

## Implementation Contract

- **Behavior**: /api/me 應改為回傳由 NextAuth JWT 解析出的使用者資料。npm run lint 在本機執行時應不再回報 docs 下的 script 錯誤。
- **Interface**:
    - 移除 src/lib/auth.ts 中的 getSessionUser 導出。
    - src/app/api/me/route.ts 的 GET handler 改用 resolveCurrentUser(req)。
- **Acceptance Criteria**:
    - 登入後訪問 /api/me 能正確拿回用戶資料。
    - npm run lint 通過且無 docs 目錄下的錯誤。
    - 所有 React Hook 警告消失。
- **Scope Boundaries**:
    - **In Scope**: src/app/api/me/route.ts 的修改、eslint.config.mjs 的修改、React Hook 依賴修復、未使用變數清理。
    - **Out of Scope**: 任何前端 UI 邏輯變更、非 Linter 點名的變數移除。

## Risks / Trade-offs

- **[Risk]** 廢棄 getSessionUser 導致未察覺的路由失效 → **Mitigation**: 執行 grep -r "getSessionUser" src 確保所有引用點都被處理。
- **[Risk]** 修復 React Hook 依賴（如 useMemo）可能觸發不必要的重新計算 → **Mitigation**: 審核 submitFieldVisit 等依賴項是否穩定（是否用了 useCallback），確保不會造成無限渲染或效能顯著下滑。
