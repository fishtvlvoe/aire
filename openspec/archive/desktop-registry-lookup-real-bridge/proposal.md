## Problem

`/cases/new` 目前在本機 web 開發模式會把 mock 地址查詢結果當成正式候選資料，導致一般地址被自動填成 `0001 / 0001 / 0001`，畫面還顯示已自動補齊。這會讓使用者以為已經查到地政資料，但實際上沒有打到桌面後端，也不能可靠地往正式查詢與 PDF 流程前進。

## Root Cause

`src/lib/land-registry-api.ts` 自行用 `__TAURI__` 判斷桌面環境，沒有使用專案既有 `safeInvoke` / `__TAURI_INTERNALS__` 橋接。非 Tauri 環境會直接 fallback 到 `mockInvoke`，而 `/cases/new` 沒有區分可信候選資料與 mock placeholder。

## Proposed Solution

- 地址查詢 wrapper 改用既有 Tauri bridge，並要求 `addressLookup` 只能在桌面環境呼叫正式後端。
- `/cases/new` 只接受可信來源的候選資料作為可確認欄位；mock、dev fallback 或無來源資料都不得自動補齊。
- 本機 web 模式只驗證 UI guard：顯示需要桌面版或人工確認，不得顯示已自動補齊或預填 placeholder。
- Tauri dev 與打包 App 才驗證正式地址查詢與後續 COP 流程。

## Non-Goals

- 不在此 change 實作 opcos.me 桌面登入、Google/LINE 桌面授權或常駐 session。
- 不重做設定頁、方案頁或品牌頁；這些留給獨立 cleanup CR。
- 不宣稱 web/SaaS 已具備正式地政查詢能力。

## Success Criteria

- 本機 web 輸入 `台南市永康區勝利街58巷4號` 不會出現 `0001 / 0001 / 0001` 自動成功。
- 非桌面模式會顯示客戶可讀的桌面版或人工確認提示。
- Tauri 環境的地址查詢走 `land_registry_address_lookup` IPC。
- 單元測試覆蓋非桌面拒絕 mock fallback、桌面 IPC 呼叫、`/cases/new` mock placeholder guard。

## Impact

- Affected code:
  - Modified: src/lib/land-registry-api.ts, src/app/(dashboard)/cases/new/page.tsx, src/app/(dashboard)/cases/new/__tests__/new-case-page.test.tsx
  - New: src/lib/__tests__/land-registry-api.test.ts
  - Removed: none
