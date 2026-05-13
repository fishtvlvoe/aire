# AIRE 安裝指南

> 適用對象：Fish 到客戶現場安裝 AIRE 桌面 App 的 SOP
> 客戶情境：不動產仲介公司，店面有專屬電腦，Windows 或 macOS

## 一、安裝前準備（出發前確認）

| 項目 | 確認方式 |
| --- | --- |
| 序號 | 在 opcOS 後台 `/admin/licenses` 已發放並標示給此客戶 |
| 安裝檔 | 從 GitHub Releases 下載對應平台 `.msi`（Windows）或 `.dmg`（macOS）放隨身碟 |
| 客戶店面網路 IP | 提前向客戶詢問固定 IP（Phase 2 才需要鎖定 IP，Phase 1 暫不用） |
| 客戶公司資訊 | 公司全名、地址、電話、統編、Logo 圖檔（PNG） |
| 客戶老闆與助理姓名、聯絡 | 用於 Phase 2 角色密碼設定 |
| 客戶地政 API Key | Phase 3 才用，Phase 1 不需要 |

## 二、現場安裝流程（約 30 分鐘）

### Step 1：安裝軟體

**Windows**：
1. 把 `AIRE-<version>-x64.msi` 從隨身碟複製到客戶桌面
2. 雙擊 → 「下一步」→ 安裝路徑用預設 → 「下一步」→ 「安裝」
3. 完成後桌面出現「AIRE」捷徑

**macOS**：
1. 把 `AIRE-<version>-aarch64.dmg`（M 系列）或 `AIRE-<version>-x64.dmg`（Intel）從隨身碟複製
2. 雙擊 .dmg → 把 `AIRE.app` 拖到 Applications
3. 第一次啟動：右鍵「打開」（macOS Gatekeeper 警告）

### Step 2：啟用序號

1. 開啟 AIRE，首次啟動會跳到啟用畫面
2. 輸入客戶序號（格式 `AIRE-XXXX-XXXX-XXXX`）
3. 點「啟用」按鈕
4. 等系統呼叫 opcOS API、成功後跳到主畫面（案件列表）

**錯誤處理**：
- 「序號無效」：核對序號字串、檢查 opcOS 後台是否該序號為 active 狀態
- 「已綁定其他電腦」：請 Fish 在 opcOS 後台「裝置管理」解除舊裝置綁定
- 「無法連線 opcOS」：檢查網路、確認 `OPCOS_API_BASE_URL` 環境變數（前期應為 `https://opcos.fishot.com` 或測試環境）

### Step 3：設定公司資訊（Phase 1 暫存於 settings）

1. 點右上角「設定」
2. 填入：
   - 公司全名（顯示在 PDF 封面）
   - 地址（顯示在 PDF 封面）
   - 電話（顯示在 PDF 封面）
   - 統一編號（顯示在 PDF 封面）
3. 上傳公司 Logo（建議 512×512 PNG，會顯示在 PDF 封面右上）

### Step 4：建一個測試案件確認流程

1. 點「新增案件」
2. 選擇物件類型「成屋」
3. 輸入測試資料：
   - 地號：`測試-001`
   - 地址：`測試地址`
   - 屋主姓名：`測試屋主`
4. 進入案件編輯頁，在「標示」tab 隨意填幾欄
5. 等右上角 indicator 顯示「已儲存 HH:mm:ss」確認自動儲存有效
6. 關閉視窗，重開 AIRE，回到案件 → 確認欄位值恢復
7. 在編輯頁點「匯出 PDF」→ 選輸出目錄（建議桌面）→ 確認產出 PDF
8. 開啟 PDF 看排版是否正確（先用 Phase 1 明文 PDF；Phase 2 才加密）

### Step 5：教學與交接

1. 給客戶看「老闆操作」教學影片（網址在 opcOS `/products/aire/`）：
   - 如何新增案件
   - 如何填表單（5 個 tab）
   - 如何匯出 PDF
   - 如何看歷史案件
2. 給客戶看「助理操作」教學影片
3. 把測試案件刪除（保留乾淨的初始狀態）
4. 加 Fish 為 LINE 好友以便後續支援

## 三、Phase 1 已知限制（客戶要先知道）

| 功能 | Phase 1 | 未來 Phase |
| --- | --- | --- |
| 序號驗證 | ✓ | — |
| 案件 CRUD | ✓ | — |
| 表單填寫 + 草稿自動儲存 | ✓ | — |
| 輸出 PDF | ✓（明文） | Phase 2 加密 |
| IP 鎖定店面網路 | ✗ | Phase 2 |
| 老闆/助理角色分權 | ✗ | Phase 2 |
| 地政 API 自動拉謄本 | ✗（手動輸入） | Phase 3 |
| 現況調查表紙本列印 | ✗（直接螢幕勾選） | Phase 3 |
| 自動更新 | ✗（手動重灌） | Phase 4 |

## 四、安裝後維運

### 客戶換電腦

1. 客戶聯絡 Fish 或自己在 opcOS `/products/aire/devices` 解除舊裝置
2. Fish 帶序號去新電腦重做 Step 1-5
3. 舊電腦執行 AIRE 會看到「授權已被遠端撤銷」訊息

### 升級版本

Phase 1 沒自動更新。Fish 把新版安裝檔帶去現場：
1. 卸載舊版（保留資料：本機 SQLite 在 `~/Library/Application Support/aire/`（macOS）或 `%APPDATA%\aire\`（Windows）不會被刪）
2. 安裝新版
3. 開啟 AIRE 確認資料還在

Phase 4 之後改自動更新。

### 客戶反映 bug

1. 請客戶截圖錯誤訊息
2. 請客戶把 `~/Library/Application Support/aire/logs/aire.log`（macOS）或對應 Windows 路徑寄給 Fish
3. 開 Spectra debug change 處理

## 五、緊急聯絡

- Fish：（電話 / LINE ID）
- opcOS 平台 status：`https://opcos.fishot.com/status`（Phase 1 後上）
- GitHub issues：`https://github.com/fishtvlvoe/aire/issues`

## 六、現場 SOP 檢查清單

- [ ] 序號已備（紙本一份、手機備份一份）
- [ ] 隨身碟有 `.msi` / `.dmg`
- [ ] 客戶 Logo 在手機或隨身碟
- [ ] 已加客戶老闆 LINE
- [ ] 安裝 + 啟用 + 測試案件 + 匯出 PDF 完成
- [ ] 教學影片網址給客戶
- [ ] 拍一張現場安裝完成照（紀念）
