## MODIFIED Requirements

### Requirement: App 品牌設定

安裝檔和應用程式 SHALL 使用以下品牌資訊：

- productName: `不動產 AI 系統`
- appId: `com.nucleusflow.real-estate-ai`
- App icon: 1024x1024 PNG 轉換為 `.icns`（macOS）和 `.ico`（Windows），存放於 `build/` 目錄

electron-builder 設定 SHALL 在 `package.json` 的 `build` 欄位包含：
- `icon`: `build/icon.png`（electron-builder 自動依平台選用 .icns 或 .ico）
- `directories.buildResources`: `build`

#### Scenario: App icon 顯示

- **WHEN** 用戶在 macOS Dock 或 Windows 工作列查看
- **THEN** 顯示「不動產 AI 系統」專屬 icon（建築輪廓 + AI 元素，深藍色調）

#### Scenario: electron-builder icon resolution

- **WHEN** electron-builder runs for macOS target
- **THEN** it SHALL use `build/icon.icns` for the .app bundle
- **WHEN** electron-builder runs for Windows target
- **THEN** it SHALL use `build/icon.ico` for the .exe installer

##### Example: macOS Dock icon

- **GIVEN** `build/icon.icns` exists with valid 1024x1024 source
- **WHEN** app is installed and running on macOS
- **THEN** Dock displays the custom icon with product name「不動產 AI 系統」
