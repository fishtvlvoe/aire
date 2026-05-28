# AIRE Windows Installer — 開發者指引

> ⚠️ 所有步驟需在 **Windows 環境**（真機或 VM）執行。
> macOS/Linux 上無法編譯 NSIS 或產出 Windows installer。

---

## 1. 前置需求

| 工具 | 版本需求 | 取得方式 |
|------|---------|---------|
| NSIS | 3.09+ | https://nsis.sourceforge.io/Download |
| Node.js | 18+ (build 用) | https://nodejs.org |
| pnpm | 9+ | `npm i -g pnpm` |
| Git | 任意 | https://git-scm.com |

---

## 2. 下載 Bundled Node.js Runtime

AIRE installer 內嵌 Node.js Windows binary，**不要求終端使用者自裝 Node**。

### 步驟

1. 前往 https://nodejs.org/dist/

2. 選擇與專案相符的版本（建議 LTS，目前 **v22.x**）

3. 下載 **node-v22.x.x-win-x64.zip**（非安裝版，zip 解壓即用）

4. 解壓後，**只需要以下檔案**放入 `installer/node-runtime/`：

   ```
   installer/node-runtime/
     node.exe          ← 必須
     (其餘 npm, npx 等不需要)
   ```

5. 確認路徑正確：

   ```powershell
   installer\node-runtime\node.exe --version
   # 應輸出 v22.x.x
   ```

> 理由：只放 `node.exe` 可大幅減少 installer 體積。
> launch-aire.mjs 只需 node.exe 執行，不需要 npm/npx。

### 版本鎖定

建議將使用的 Node 版本記錄在 `installer/PROVENANCE.md` 的 `Node Version` 欄位，確保每次 build 一致。

---

## 3. 執行 Build

```powershell
# 切換到 AIRE 專案根目錄
cd C:\path\to\AIRE

# 安裝相依
pnpm install --frozen-lockfile

# Next.js 生產 build（含 standalone output）
pnpm build

# 打包 local runtime（產出 dist-local-runtime/）
node scripts/build-local-runtime.mjs

# 確認 dist-local-runtime/ 存在
dir dist-local-runtime\server.js
```

---

## 4. 編譯 NSIS Installer

```powershell
# 確認 makensis 在 PATH 中
makensis /VERSION

# 編譯（從專案根目錄執行）
makensis installer\aire-installer.nsi

# 產出位置
# out\AIRE-0.1.3-Setup.exe
```

> 若出現 `Can't open file "installer\node-runtime\node.exe"` 錯誤，
> 表示 Step 2 尚未完成。

---

## 5. 待驗收清單（Windows 真機/VM）

在 Windows 10 或 11 真機執行以下步驟，確認每項 ✅ 才算通過：

### 安裝驗收

- [ ] 執行 `AIRE-0.1.3-Setup.exe`，安裝過程無錯誤對話框
- [ ] 安裝目錄正確：`%LOCALAPPDATA%\Programs\AIRE\`
- [ ] 桌面出現 **AIRE** 捷徑
- [ ] 開始功能表出現 **AIRE** 資料夾及捷徑
- [ ] `控制台 > 程式和功能` 可見 AIRE 0.1.3

### 啟動驗收

- [ ] 雙擊桌面捷徑 → **不出現** 黑色 terminal 視窗
- [ ] 系統預設瀏覽器自動開啟 `http://127.0.0.1:3000`（或下一個可用 port）
- [ ] 頁面正常顯示 AIRE 主畫面（不是 Next.js 錯誤頁）
- [ ] `/api/health` 回傳 `{"ok":true}`

### 功能驗收

- [ ] 可新增案件（房屋地址、地籍資料輸入）
- [ ] 草稿書（Draft）可產出 PDF
- [ ] COP 簽約書可產出 PDF
- [ ] 上傳補件照片／格局圖正常嵌入頁面

### 資料持久性驗收

- [ ] 重新啟動 AIRE → 先前建立的案件資料仍在
- [ ] 確認資料目錄存在：`%LOCALAPPDATA%\AIRE\`

### 解安裝驗收

- [ ] 從 `控制台 > 程式和功能` 解除安裝 AIRE
- [ ] 程式目錄 `%LOCALAPPDATA%\Programs\AIRE\` 已刪除
- [ ] 桌面及開始功能表捷徑已移除
- [ ] **資料目錄 `%LOCALAPPDATA%\AIRE\` 預設保留**（未勾選清除選項時）
- [ ] 勾選「同時刪除所有案件資料」後，資料目錄被刪除

---

## 目錄結構說明

```
installer/
  aire-installer.nsi    ← NSIS 主腳本（本檔的 source of truth）
  launch-aire-win.vbs   ← 無 terminal 視窗啟動器（由 NSIS 安裝到根目錄）
  node-runtime/         ← bundled Node.js binary（不入版控，手動放置）
    .gitkeep
    node.exe            ← 手動下載後放這裡
  PROVENANCE.md         ← build 元數據範本（CI 自動覆寫）
  README.md             ← 本文件
```

---

## 常見問題

**Q: 安裝程式要求管理員權限怎麼辦？**
A: 正常情況不應要求。若出現，確認 `RequestExecutionLevel user` 在 .nsi 中正確設定。

**Q: 桌面捷徑圖示顯示不正確？**
A: 確認 `public/favicon.ico` 存在且格式正確（需包含多尺寸，建議 16/32/48/256px）。

**Q: 啟動後瀏覽器沒有自動開啟？**
A: 查看 `%LOCALAPPDATA%\AIRE\aire-launch.log`（若 launcher 有寫 log），或手動訪問 `http://127.0.0.1:3000`。

**Q: `dist-local-runtime/` 打包後 installer 超過 500MB？**
A: 正常。node_modules（含 better-sqlite3 native binding）體積大；LZMA 壓縮後應在 150-250MB 範圍。
