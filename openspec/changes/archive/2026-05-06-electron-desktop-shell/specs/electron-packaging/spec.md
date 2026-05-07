## ADDED Requirements

### Requirement: Next.js Standalone Packaging

Electron 主程序 SHALL 在生產模式下使用 Next.js standalone output 啟動內嵌 HTTP server，不依賴外部 node_modules。

#### Scenario: 生產模式啟動

- **WHEN** 用戶雙擊「不動產 AI 系統」app icon
- **THEN** Electron 主程序啟動 `.next/standalone/server.js`，等待 HTTP server ready 後建立 BrowserWindow 載入頁面

#### Scenario: Port 衝突自動遞增

- **WHEN** 預設 port 3000 已被佔用
- **THEN** 系統自動嘗試 3001-3010，使用第一個可用 port

##### Example: Port 3000 被佔用

- **GIVEN** 系統上已有程序佔用 port 3000
- **WHEN** Electron 主程序嘗試啟動 Next.js server
- **THEN** server 啟動在 port 3001，BrowserWindow 載入 `http://localhost:3001`

### Requirement: macOS 打包

electron-builder SHALL 產出 macOS `.dmg` 安裝檔，支援 Apple Silicon (arm64) 和 Intel (x64) 架構。

#### Scenario: macOS DMG 產出

- **WHEN** 執行 `npm run build:mac`
- **THEN** 在 `dist-electron/` 產出 `不動產 AI 系統-{version}-arm64.dmg` 和 `不動產 AI 系統-{version}-x64.dmg`

### Requirement: Windows 打包

electron-builder SHALL 產出 Windows NSIS `.exe` 安裝程式，支援繁體中文安裝介面。

#### Scenario: Windows NSIS 產出

- **WHEN** 執行 `npm run build:win`
- **THEN** 在 `dist-electron/` 產出 `不動產 AI 系統 Setup {version}.exe`

### Requirement: App 品牌設定

安裝檔和應用程式 SHALL 使用以下品牌資訊：

- productName: `不動產 AI 系統`
- appId: `com.nucleusflow.real-estate-ai`
- App icon: 1024x1024 PNG 轉換為 `.icns`（macOS）和 `.ico`（Windows）

#### Scenario: App icon 顯示

- **WHEN** 用戶在 macOS Dock 或 Windows 工作列查看
- **THEN** 顯示「不動產 AI 系統」專屬 icon（建築輪廓 + AI 元素，深藍色調）

##### Example: macOS Dock icon

- **GIVEN** 用戶在 macOS 上安裝「不動產 AI 系統.app」
- **WHEN** app 執行中，用戶查看 Dock
- **THEN** Dock 顯示 build/icon.icns 對應的 1024x1024 icon，名稱為「不動產 AI 系統」

### Requirement: 無框視窗外觀

BrowserWindow SHALL 不顯示網址列、書籤列、瀏覽器工具列，僅保留系統級視窗控制（最小化/最大化/關閉）。

#### Scenario: macOS 視窗外觀

- **WHEN** app 在 macOS 上啟動
- **THEN** 視窗使用 `hiddenInset` title bar style，交通燈按鈕內嵌在視窗左上角

#### Scenario: Windows 視窗外觀

- **WHEN** app 在 Windows 上啟動
- **THEN** 視窗保留標準框架（最小化/最大化/關閉按鈕在右上角），不顯示網址列

##### Example: Windows 視窗尺寸

- **GIVEN** app 在 Windows 11 上首次啟動
- **WHEN** BrowserWindow 建立完成
- **THEN** 視窗初始大小 1280x800，最小可縮至 1024x600，無網址列和書籤列
