## ADDED Requirements

### Requirement: 序號激活頁面

系統 SHALL 提供 `/setup/license` 頁面，首次啟動且無有效授權時自動重導至此頁。

#### Scenario: 首次啟動無授權

- **WHEN** 用戶首次啟動 app 且 SQLite `licenses` 表無有效紀錄
- **THEN** 所有頁面請求被 Middleware 攔截，重導至 `/setup/license`（HTTP 301）

#### Scenario: 激活成功

- **WHEN** 用戶輸入有效序號 + Email，且序號未被其他機器激活
- **THEN** 系統呼叫 License Server activate API → 綁定 machineId → 寫入 SQLite `licenses` 表 → 重導至 `/login`

#### Scenario: 序號已被其他機器使用

- **WHEN** 用戶輸入已在另一台機器激活的序號
- **THEN** 顯示錯誤訊息「此序號已在另一台電腦激活，請聯繫技術支援」

##### Example: 重複激活

- **GIVEN** 序號 `RE-AI-abc123...` 已在 Machine-A 激活
- **WHEN** 用戶在 Machine-B 輸入同一序號
- **THEN** Server 回傳 HTTP 409 + `LICENSE_ALREADY_ACTIVATED`，頁面顯示錯誤

### Requirement: Middleware 授權攔截

Next.js Middleware SHALL 在每個 HTTP 請求驗證授權狀態，無效授權則阻擋存取。

#### Scenario: 有效授權請求

- **WHEN** 請求到達且 SQLite 有未過期的有效序號
- **THEN** 請求正常通過

##### Example: 正常存取物件列表

- **GIVEN** SQLite licenses 表有序號 RE-AI-abc123，expires 為 2027-12-31，machineId 匹配當前主機
- **WHEN** 用戶瀏覽 /listings 頁面
- **THEN** Middleware 查快取（或查 SQLite）→ 授權有效 → 請求正常通過，頁面載入物件列表

#### Scenario: 授權過期

- **WHEN** 請求到達且序號的 `expires` 日期已過
- **THEN** 重導至 `/setup/license` 並顯示「授權已過期，請聯繫技術支援續約」

#### Scenario: 授權快取

- **WHEN** 連續多個請求在 60 秒內到達
- **THEN** 僅第一次查詢 SQLite，後續用記憶體快取結果（TTL 60 秒）

### Requirement: Ed25519 序號驗證

序號 SHALL 使用 Ed25519 非對稱簽名，公鑰內嵌在 app 中驗證。

#### Scenario: 簽名驗證通過

- **WHEN** 序號的 Base64url payload 與 signature 經公鑰驗證一致
- **THEN** 解析 payload 中的 company、email、expires、machineId 欄位

#### Scenario: 簽名被竄改

- **WHEN** 序號的 payload 或 signature 被修改
- **THEN** 驗證失敗，回傳 `INVALID_SIGNATURE` 錯誤

### Requirement: Machine Fingerprint 綁定

系統 SHALL 生成唯一的主機指紋，用於綁定序號至特定電腦。

#### Scenario: macOS 指紋生成

- **WHEN** app 在 macOS 上執行
- **THEN** 讀取 `IOPlatformUUID`（透過 `ioreg` 命令），計算 SHA-256 取前 16 字元作為 machineId

#### Scenario: Windows 指紋生成

- **WHEN** app 在 Windows 上執行
- **THEN** 讀取 Registry `HKLM\SOFTWARE\Microsoft\Cryptography\MachineGuid`，計算 SHA-256 取前 16 字元作為 machineId
