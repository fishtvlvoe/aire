## Context

AIRE 桌面 App 的核心保護機制（middleware、next-auth 登入、electron-updater、License 驗證）已在 `desktop-commercial-complete` change 完成。目前缺兩個交付前必備項目：

1. **App Icon**：electron-builder 目前沒有自訂 icon，打包出的 .app / .exe 用 Electron 預設圖示
2. **Codex 授權**：客戶首次啟動後，需在 /setup 頁面輸入 OpenAI API Key 才能使用 AI 功能，目前此步驟不存在

現有相關程式碼：
- `src/app/setup/page.tsx`（172 行）：只有 License Key 輸入 Step 1
- `src/lib/codex-client/`：LLM adapter 已有 Codex adapter，但沒有 API Key 輸入/驗證/存放機制
- `electron-builder` 設定在 `package.json` 的 `build` 欄位

## Goals / Non-Goals

**Goals:**

- 客戶打包出的 App 有品牌辨識度的圖示
- 客戶首次啟動完成 License → OpenAI API Key 兩步驟後即可使用
- API Key 以加密形式存於本機，不明文寫入 .env 或 SQLite
- 生產模式鎖定只用 Codex adapter

**Non-Goals:**

- 不做 macOS Keychain / Windows Credential Manager 整合
- 不做 OAuth 自動授權流程
- 不做圖示的動態主題切換

## Decisions

### D1: Icon 產出工具鏈

使用 `png2icons` npm 套件從單一 1024x1024 PNG 產出 .icns 和 .ico。

**Alternatives Considered:**
1. Figma 手動匯出多尺寸 — 需要 Figma 帳號，客戶無法自行重新產出，不適合顧問案交付
2. macOS `iconutil` + ImageMagick — 跨平台不一致（Windows 沒有 iconutil），CI 環境需額外安裝

**決定理由**：png2icons 是純 Node.js 套件，在 macOS/Windows/Linux 都能跑，放在 `scripts/generate-icons.ts` 一行指令產出，開發者和 CI 都能用。

### D2: Icon 存放路徑

放在 `build/` 目錄：`build/icon.png`、`build/icon.icns`、`build/icon.ico`。

**Alternatives Considered:**
1. `assets/` 目錄 — electron-builder 慣例是 `build/`，放別處需額外設定 `directories.buildResources`
2. `electron/` 目錄 — 混淆 Electron 主程序碼與資源檔

**決定理由**：electron-builder 預設從 `build/` 讀取 icon，零設定即可生效。

### D3: API Key 加密存放方式

使用 Node.js `crypto.createCipheriv`（AES-256-GCM）加密 API Key，密文存入 SQLite `settings` 表。加密金鑰由機器特徵（hostname + username + app salt）衍生，用 `crypto.scryptSync` 產出。

**Alternatives Considered:**
1. 明文存 .env — 安全性不足，客戶可能誤提交到版控
2. macOS Keychain / Windows Credential Manager — 跨平台 API 不同，需要 `keytar` 等 native addon，增加 electron-builder 打包複雜度

**決定理由**：AES-256-GCM 提供足夠的本機保護強度，密鑰綁定機器特徵讓拷貝 DB 檔案到另一台機器無法解密。純 Node.js 實作不增加 native dependency。

### D4: API Key 驗證方式

呼叫 OpenAI `GET /v1/models` endpoint，用提供的 API Key 作為 Bearer Token。回 200 = 有效，回 401 = 無效。

**Alternatives Considered:**
1. 呼叫 `POST /v1/chat/completions` 發一個短 prompt — 會消耗客戶 token 額度
2. 不驗證，存了就算 — 客戶打錯 key 要到實際使用才發現錯誤，體驗差

**決定理由**：`GET /v1/models` 是唯讀、不消耗 token 的端點，適合做 key 有效性檢查。

### D5: Setup 頁面流程設計

在現有 `/setup` 頁面的 License Step 完成後，自動導向 `/setup/codex`（Step 2）。`/setup/codex` 是獨立頁面，包含 API Key 輸入框、驗證按鈕、成功後跳轉首頁。

**Alternatives Considered:**
1. 在同一個 `/setup` 頁面用 Stepper 元件做多步驟 — 原有 setup 頁面已有 172 行，再加 API Key 邏輯會過於冗長
2. 用 Modal 彈窗 — Electron 環境下 Modal 體驗不如獨立頁面

**決定理由**：獨立頁面職責單一、容易測試，Setup 主頁完成 License 後 `router.push('/setup/codex')` 即可。

### D6: 生產模式鎖定

`NEXT_PUBLIC_APP_MODE=production` 環境變數控制：
- 隱藏 LLM adapter 切換 UI
- `codex-client` 初始化時強制使用 Codex adapter
- 設定頁面不顯示其他 LLM provider 選項

**Alternatives Considered:**
1. 在 electron-builder 打包時刪除其他 adapter 的程式碼 — 增加 build 複雜度，且開發者 debug 時需要重新打包
2. 用 feature flag 資料庫表 — 過度工程化，一個環境變數即可解決

**決定理由**：環境變數是最簡單的開關，開發模式不設定此變數即可看到所有 adapter。

## Risks / Trade-offs

[機器特徵衍生金鑰] → 如果客戶更換電腦 hostname 或作業系統使用者名稱，已存的 API Key 會解密失敗。Mitigation：解密失敗時自動清除舊密文，引導客戶重新輸入 API Key。

[OpenAI API 驗證端點不穩定] → `GET /v1/models` 若暫時不可達，客戶無法完成 setup。Mitigation：加 timeout（5 秒）+ 提供「跳過驗證」按鈕讓客戶先進入系統，稍後再驗證。

[png2icons 套件維護性] → 該套件較冷門，未來可能停止維護。Mitigation：icon 產出是一次性操作（build 前跑一次），即使套件停更，產出的 .icns / .ico 檔案已存在，不影響後續打包。
