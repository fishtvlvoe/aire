## ADDED Requirements

### Requirement: Windows one-command install-and-launch SHALL be available from terminal

系統 SHALL 提供一個 Windows 專用終端機命令，完成安裝、runtime build 與啟動。

#### Scenario: Windows user runs one command from project root

- **GIVEN** 使用者在 Windows，且位於 AIRE 專案根目錄
- **WHEN** 執行 `npm run windows:one-click`
- **THEN** 系統 SHALL 依序執行 install、native build 核准/重建、runtime build、launch
- **AND** 啟動後 SHALL 自動開啟本機 AIRE 頁面

##### Example: Step order

| Input | Expected Output | Notes |
| ----- | --------------- | ----- |
| `npm run windows:one-click -- --dry-run` | 依序列出 `install -> approve-builds -> rebuild -> build-local-runtime -> launch` | 不實際執行命令 |

### Requirement: Non-Windows execution SHALL fail fast with explicit message

#### Scenario: macOS or Linux runs the Windows command

- **GIVEN** 使用者在非 Windows 平台
- **WHEN** 執行 `npm run windows:one-click`
- **THEN** 系統 SHALL 立即失敗並提示「此命令僅支援 Windows」
- **AND** SHALL 不執行任何安裝或建置步驟

### Requirement: One-click flow SHALL stop on first failing step

#### Scenario: dependency install step fails

- **GIVEN** install 步驟回傳非 0
- **WHEN** 執行 one-click 命令
- **THEN** 系統 SHALL 立即停止
- **AND** SHALL 顯示失敗的步驟名稱與命令
- **AND** SHALL 不再執行後續步驟
