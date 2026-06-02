## Why

目前 AIRE 在 Windows 端要可用，至少要手動跑多個步驟（安裝依賴、組本機 runtime、啟動）。
對非工程背景同仁來說，這個流程太容易漏步，導致「有裝完但打不開」或「有開啟但 runtime 不完整」。

使用者要求是明確的：Windows 端要能用一個終端機指令完成安裝並直接打開可用介面。

## What Changes

- 新增 Windows 一鍵安裝啟動腳本，將以下流程串成單一命令：
  - 安裝依賴
  - 核准並重建 `better-sqlite3` native build
  - 建立 `dist-local-runtime`
  - 啟動 AIRE 並自動開瀏覽器
- 新增 npm script 入口，讓使用者在 Windows 終端機只需執行一行命令。
- 補上腳本單元測試，鎖定平台檢查與執行步驟順序。
- 更新 README 的 Windows 快速安裝說明。

## Non-Goals (optional)

- 不恢復 Tauri installer pipeline。
- 不處理 Windows code signing 與 release artifact 發佈。
- 不修改 AIRE 主功能流程（案件、查詢、PDF 業務邏輯）。

## Capabilities

### New Capabilities

- `windows-one-command-install-and-launch`: Windows 使用者可透過單一終端機命令完成安裝並自動開啟可用 AIRE runtime。

### Modified Capabilities

- （none）

## Impact

- Affected code:
  - `package.json`
  - `scripts/`（新增一鍵腳本與測試）
  - `README.md`
- Affected specs:
  - `openspec/changes/windows-one-command-install-and-launch/specs/windows-one-command-install-and-launch/spec.md`
