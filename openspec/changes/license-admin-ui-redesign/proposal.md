## Why

序號管理後台的表格欄位不符合實際管理需求（缺客戶姓名與公司名稱、欄位順序不直覺、操作按鈕無說明），且首次安裝流程缺少建立管理員帳號步驟導致客戶卡死在登入頁、Codex CLI 未偵測會直接 crash、序號無機器綁定可被無限複製啟用。這些問題直接影響客戶端可用性與商業授權安全。

## What Changes

- 新增 序號管理表格加入「編號」欄位（流水號 001/002...），欄位順序改為：編號→序號→狀態→使用者→操作
- 修改 使用者欄位從單行 Email 改為三行顯示（客戶姓名、公司名稱、Email）
- 移除 建立日期欄位
- 新增 操作按鈕 Tooltip（複製序號到剪貼簿 / 停用此序號）
- 新增 使用者資料 Inline Edit 功能（點擊直接編輯姓名/公司/Email）
- 新增 停用+重發確認 Dialog（公司轉讓場景：停用舊序號 + 核發新序號）
- 新增 `PATCH /api/license/update-info` API（更新序號綁定的姓名/公司/Email）
- 新增 `POST /api/license/transfer` API（停用舊序號 + 核發新序號，原子操作）
- 修改 `GET /api/license/list` API 回傳擴充（加入 contactName、company、流水編號、搜尋支援）
- 修改 Vercel KV schema 擴充 contactName 和 company 欄位
- 新增 Setup 流程第 0 步：建立首位管理員帳號頁面（`/setup/admin`）
- 修改 Setup wizard 從兩步改為三步（License → 建管理員 → Codex API Key）
- 新增 `POST /api/setup/create-first-admin` API（僅 users 表為空時允許）
- 新增 machineId 綁定機制（啟用序號時綁定電腦指紋，換機需重新申請）
- 新增 Codex CLI 安裝偵測（啟動時檢查是否已安裝，未裝則顯示安裝指引）
- 修改 Electron 殼驗證（確認 mac/win 能正常打包啟動）

## Non-Goals

- 不做多團隊/分組權限系統（目前 admin/agent 二角色已足夠）
- 不做 OAuth/SSO 登入（維持本機帳密認證）
- 不做 Linux build target（只支援 Mac + Windows）
- 不做序號自助申請頁面（序號由 Fish 手動核發）
- 不做業務端密碼自助修改功能（由管理員重設）

## Capabilities

### New Capabilities

- `license-admin-dashboard`: 序號管理後台 UI 重設計（表格五欄、Inline Edit、停用+重發 Dialog、搜尋帶編號）
- `license-transfer`: 序號轉讓流程（停用舊序號 + 核發新序號的原子操作 API）
- `machine-id-binding`: 機器指紋綁定機制（啟用時綁定電腦特徵碼，防止序號盜用）
- `first-admin-setup`: 首次安裝建立管理員帳號流程（Setup wizard 第 0 步）
- `codex-cli-detection`: Codex CLI 安裝偵測與引導（啟動時檢查、缺少時顯示安裝指引）

### Modified Capabilities

- `license-server`: 擴充 Vercel KV schema（加 contactName、company）、新增 update-info 和 transfer API、list API 回傳擴充
- `license-management`: 啟用流程加入 machineId 綁定邏輯
- `desktop-launcher`: 啟動時加入 Codex CLI 偵測邏輯
- `electron-packaging`: 驗證 mac/win 打包流程正常

## Impact

- Affected specs: license-admin-dashboard（新）、license-transfer（新）、machine-id-binding（新）、first-admin-setup（新）、codex-cli-detection（新）、license-server（改）、license-management（改）、desktop-launcher（改）、electron-packaging（改）
- Affected code:
  - New: src/app/admin/licenses/page.tsx、src/app/api/license/update-info/route.ts、src/app/api/license/transfer/route.ts、src/app/setup/admin/page.tsx、src/app/api/setup/create-first-admin/route.ts、src/lib/machine-id.ts
  - Modified: src/app/api/license/list/route.ts、src/app/api/license/activate/route.ts、src/app/setup/page.tsx、src/middleware.ts、electron/launcher.ts、electron/main.ts
- Dependencies 新增: node-machine-id（機器指紋套件）
- 環境變數新增: 無
