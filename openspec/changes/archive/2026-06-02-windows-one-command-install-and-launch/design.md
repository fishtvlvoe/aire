## Context

AIRE 目前採 browser-local-runtime 路線，使用者需要先完成依賴安裝、runtime build，再啟動本機 server。
在 Windows 端若逐步手動執行，常見失敗點是：

- 漏跑 `build:local-runtime`
- `better-sqlite3` native build 未核准/未重建
- 沒有用專案鎖定的 pnpm 版本

這次需求是把上述流程濃縮成單一可複製指令。

## Goals / Non-Goals

**Goals:**

- 提供 Windows 一個命令即可「安裝 + 建置 + 啟動 + 開瀏覽器」。
- 保留既有 `launch-aire.mjs` 啟動邏輯，不重寫 runtime。
- 讓失敗訊息可讀、可定位到哪一步失敗。

**Non-Goals:**

- 不做跨平台 one-command（本 change 只保證 Windows）。
- 不恢復 Tauri build/release workflow。
- 不改動正式產品流程與資料 schema。

## Decisions

### 決策 1：新增獨立 Windows 一鍵腳本，並由 npm script 封裝

不把大量鏈式命令直接塞進 `package.json`，改用 `scripts/windows-one-click.mjs` 管理。
好處是可以：

- 寫單元測試鎖步驟順序
- 給每步驟明確錯誤訊息
- 後續調整步驟不必修改長串 shell

### 決策 2：步驟固定為 install → approve-builds → rebuild native → build runtime → launch

這個順序是為了降低 Windows 新機首次啟動失敗率，特別是 `better-sqlite3` native binding。

### 決策 3：非 Windows 平台直接拒絕執行

此命令語意明確是「Windows 一鍵」。在 macOS/Linux 執行會直接報錯並結束，避免誤用。

## Implementation Contract

- Behavior:
  - 使用者在 Windows 專案根目錄執行 `npm run windows:one-click`。
  - 指令會依序完成依賴安裝、native build 核准與重建、runtime build、啟動 AIRE。
  - 啟動成功後由既有 launcher 自動開啟瀏覽器到本機 AIRE URL。

- Interface / data shape:
  - 新增 npm script 名稱：`windows:one-click`。
  - 新增腳本：`scripts/windows-one-click.mjs`。
  - 腳本輸出必須包含每一步的 step label，失敗時包含失敗步驟。

- Failure modes:
  - 非 Windows 執行：立即退出，提示僅支援 Windows。
  - 任一步驟 exit code 非 0：立即停止後續步驟，輸出失敗命令。
  - `launch` 失敗：保持非 0 結束碼，讓終端機可判斷失敗。

- Acceptance criteria:
  - `pnpm exec vitest run scripts/__tests__/windows-one-click.test.mjs --reporter=dot` 通過。
  - `npm run windows:one-click -- --dry-run` 可列出預期執行步驟（不實際執行）。
  - README 有 Windows 一鍵命令與用途說明。

- Scope boundaries:
  - In scope: Windows 一鍵安裝與啟動入口、測試、文件。
  - Out of scope: Tauri 安裝包、Windows 簽章、CI release 流程恢復。

## Risks / Trade-offs

- `corepack` 在少數 Windows 環境可能不可用，因此腳本需有可讀錯誤訊息。
- 一鍵命令包含 install + build，首次執行時間較長；但可換取操作簡化與一致性。
