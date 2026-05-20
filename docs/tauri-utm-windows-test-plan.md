# AIRE Tauri Windows 版 UTM 測試流程

日期：2026-05-21

這份文件是給「在 Mac 上測 Windows 版 AIRE」使用。目標不是只看程式有沒有 build 成功，而是確認客戶真的拿到 Windows 安裝檔後，可以安裝、開啟、授權、拉謄本、保存資料、匯出 PDF。

## 一句話結論

Windows 版要在 Windows 裡驗收。Mac 可以用 UTM 開 Windows VM 來測；GitHub Actions 可以產 Windows 安裝檔，但最後仍要把安裝檔放進 Windows VM 跑一次。Mac 交叉編譯已能產 NSIS `setup.exe`，但只能算初步 build 通過。

## 目前專案狀態

- AIRE 是 Tauri v2 App。
- macOS Apple Silicon `.dmg` 已可在本機產出。
- Windows NSIS `*-setup.exe` 已可在 Mac 透過交叉編譯產出；Windows VM 安裝驗收尚未完成。
- Release workflow 應使用 Tauri / pnpm，不應再使用 Electron / npm / electron-builder。
- 2026-05-21 已下載 Microsoft 官方 Windows 11 ARM64 25H2 繁中 ISO：`/Users/fishtv/Downloads/Win11_25H2_Chinese_Traditional_Arm64_v2.iso`。
- 2026-05-21 已建立 UTM VM：`/Users/fishtv/Library/Containers/com.utmapp.UTM/Data/Documents/Windows.utm`。
- 2026-05-21 已建立 VM 共享資料夾：`/Users/fishtv/Downloads/AIRE-VM-Share`，其中已放入 `AIRE_0.1.0_x64-setup.exe`。
- 目前尚未啟動 Windows installer，Windows 安裝與 AIRE 實測留待之後執行。

## 需要準備的東西

- Mac。
- UTM。
- Windows 11 安裝映像。
- AIRE 專案原始碼。
- 網路連線。
- GitHub 帳號；若要測 GitHub Actions 發版，還需要 repo push / workflow 權限。

## Step 1：建立 Windows VM

Apple Silicon Mac 建議：

- 建 Windows 11 ARM VM。

Intel Mac 建議：

- 建 Windows 11 x64 VM。

流程：

1. 打開 UTM。
2. 建立新的 Windows VM。
3. CPU / RAM 依機器狀況分配；建議至少 4 CPU、8 GB RAM。
4. 磁碟建議至少 80 GB。
5. 安裝 Windows。
6. Windows 安裝完成後，安裝 UTM SPICE Guest Tools。
7. 重新啟動 Windows VM。

## Step 2：設定 Mac 與 Windows 共享資料夾

建議用 UTM 的 SPICE WebDAV，因為它對 Windows 支援較好。

流程：

1. 關閉 Windows VM。
2. 到 UTM VM 設定。
3. 開啟 Sharing / Shared Directory。
4. 選擇 Mac 上要共享的資料夾，例如 `/Users/fishtv/Development/products/AIRE` 或另一個專門放 build 產物的資料夾。
5. 啟動 Windows VM。
6. 在 Windows 內確認共享資料夾可以看到。

注意：

- 如果用共享資料夾直接跑 build 很慢，可以把專案複製到 Windows VM 內的本機磁碟再 build。
- 若共享資料夾看不到，先確認 SPICE Guest Tools 已安裝並重開機。

## Step 3：安裝 Windows build 依賴

在 Windows VM 裡安裝：

1. Git。
2. Node.js 22。
3. pnpm。
4. Rust stable。
5. Visual Studio Build Tools。
6. WebView2 Runtime。

Visual Studio Build Tools 安裝時要勾選：

- Desktop development with C++。
- Windows SDK。
- MSVC C++ build tools。

如果要 build `.msi`：

- 確認 Windows Optional Features 裡的 VBSCRIPT 啟用。
- 如果 build 時出現 `failed to run light.exe`，優先檢查 VBSCRIPT。

PowerShell 基本確認：

```powershell
git --version
node --version
corepack enable
pnpm --version
rustc --version
cargo --version
```

## Step 4：取得 AIRE 專案

方法 A：用 Git clone

```powershell
git clone <AIRE_REPO_URL>
cd AIRE
```

方法 B：從 Mac 共享資料夾複製

1. 在 Windows 打開共享資料夾。
2. 複製 AIRE 專案到 Windows 本機磁碟，例如 `C:\Users\<user>\Development\AIRE`。
3. 用 PowerShell 進入該資料夾。

## Step 5：在 Windows VM 內跑基本檢查

```powershell
pnpm install
pnpm type-check
pnpm test
```

通過條件：

- Type check 沒有錯。
- Test 沒有錯。

如果錯誤來自 Windows 環境缺套件，先補依賴；如果錯誤是 AIRE 功能問題，要回到 Spectra 任務修正。

## Step 6：在 Windows VM 內打包

```powershell
pnpm tauri build
```

完成後檢查輸出：

```powershell
dir src-tauri\target\release\bundle\msi
dir src-tauri\target\release\bundle\nsis
```

預期會看到：

- `.msi`
- 或 `*-setup.exe`

只要有 build 成功，還不能算完成；下一步必須安裝。

## Step 7：安裝 Windows 版 AIRE

1. 雙擊 `.msi` 或 `*-setup.exe`。
2. 依安裝精靈完成安裝。
3. 從 Start Menu 或桌面捷徑開啟 AIRE。

通過條件：

- 安裝流程不報錯。
- AIRE 可以開啟。
- 視窗尺寸正常，不要出現內容被切掉或 UI 跑版。

## Step 8：AIRE 功能驗收

在 Windows 版 App 裡跑以下流程：

1. 登入或啟用授權。
2. 建立案件。
3. 選房屋版。
4. 輸入地號 / 建號。
5. 拉謄本。
6. 檢查謄本資料預覽。
7. 另存謄本 payload。
8. 關閉 App。
9. 重新開啟 App。
10. 回到同一案件。
11. 確認謄本資料仍存在。
12. 填寫現場必問。
13. 填寫秘書後補。
14. 匯出 PDF。
15. 打開 PDF。

## Step 9：PDF 驗收

PDF 必須確認：

- 中文沒有亂碼。
- 使用 Noto Sans TC 或等效可讀字型。
- 沒有 `待補`。
- 沒有 `未填` 被印在應留白的位置。
- 不要有不必要頁碼。
- 現況調查表保留可手寫的空白或勾選框。
- 生活機能不要列太多；公園 1 個、捷運 1 個、市場 1 到 2 個即可。
- 位置圖與生活機能圖若可合併，不要重複佔頁。
- 預覽內容與下載 PDF 內容一致。

## Step 10：把結果寫回 SDD

測完後，把結果寫回：

- `openspec/changes/aire-house-disclosure-workbench-mvp/artifacts/tauri-windows-mac-test-plan.md`
- `openspec/changes/aire-house-disclosure-workbench-mvp/artifacts/external-dependencies-before-paid-launch.md`

要記錄：

- Windows VM 類型：ARM 或 x64。
- Windows 版本。
- Node / pnpm / Rust 版本。
- 是否產出 `.msi`。
- 是否產出 `*-setup.exe`。
- 安裝檔路徑。
- 安裝是否成功。
- AIRE 是否能開啟。
- 謄本資料是否能保存。
- PDF 是否通過驗收。
- 失敗錯誤訊息。
- 修正方式。

## 如果今天不能跑 UTM

可以先做：

1. 確認 GitHub Actions release workflow 是 Tauri / pnpm。
2. 確認 `src-tauri/tauri.conf.json` 有 Windows installer 策略。
3. 等 CI 產出 Windows 安裝檔後，再下載到 UTM Windows VM 測。
4. 若只是要先拿到 Windows NSIS 初測安裝檔，可在 Mac 執行：

```bash
export PATH="$HOME/.cargo/bin:/opt/homebrew/opt/llvm/bin:$PATH"
pnpm tauri build --runner cargo-xwin --target x86_64-pc-windows-msvc --no-sign
```

目前已實測產出：

- `src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/AIRE_0.1.0_x64-setup.exe`

注意：這個檔案尚未在 Windows VM 安裝驗收，也尚未簽章。

不能先勾完成：

- Windows VM build。
- Windows 安裝檔安裝。
- Windows 版 App 功能驗收。
- Windows PDF 驗收。

這些一定要等實機測過才可以勾。
