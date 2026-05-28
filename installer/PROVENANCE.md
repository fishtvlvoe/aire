# AIRE Installer Provenance

此檔案由 build pipeline 在每次打包時自動覆寫，記錄可重現構建所需的完整元數據。
手動參考範本如下；CI 應以腳本生成真實值取代占位符。

---

## Build Metadata

| 欄位           | 值（範本，CI 填入）           |
|---------------|------------------------------|
| Product       | AIRE                          |
| Version       | `{{PRODUCT_VERSION}}`         |
| Git Commit    | `{{GIT_COMMIT_SHA}}`          |
| Git Branch    | `{{GIT_BRANCH}}`              |
| Build Time    | `{{BUILD_TIMESTAMP_UTC}}`     |
| Build Machine | `{{RUNNER_OS}} / {{RUNNER}}`  |
| Node Version  | `{{NODE_VERSION}}`            |
| pnpm Version  | `{{PNPM_VERSION}}`            |

## Build Commands

```powershell
# 1. 安裝相依
pnpm install --frozen-lockfile

# 2. Next.js 生產 build（含 standalone output）
pnpm build

# 3. 打包 local runtime（產出 dist-local-runtime/）
node scripts/build-local-runtime.mjs

# 4. 下載 bundled Node.js runtime（見 installer/README.md）
# （或 CI 從快取還原）

# 5. 編譯 NSIS installer
# Windows 環境需先安裝 NSIS 3.x
makensis installer\aire-installer.nsi
```

## Artifact Manifest

| 檔案 | 說明 | 大小（CI 填入）|
|-----|------|---------------|
| `out/AIRE-{{VERSION}}-Setup.exe` | Windows 安裝程式 | `{{INSTALLER_SIZE_MB}} MB` |
| `dist-local-runtime/server.js`   | Next standalone 入口 | — |
| `dist-local-runtime/.next/`      | Next 靜態資產 | — |
| `dist-local-runtime/public/`     | 公開靜態檔 | — |
| `dist-local-runtime/node_modules/` | 含 better-sqlite3 native binding | — |
| `installer/node-runtime/node.exe` | bundled Node.js Windows binary | `{{NODE_EXE_SIZE_MB}} MB` |

## SHA256 Checksums（CI 填入）

```
{{INSTALLER_SHA256}}  AIRE-{{VERSION}}-Setup.exe
{{NODE_EXE_SHA256}}   node-runtime/node.exe
```

## CI 自動生成範例（PowerShell）

```powershell
# 在 makensis 之後執行
$version   = (Get-Content package.json | ConvertFrom-Json).version
$sha       = git rev-parse HEAD
$branch    = git rev-parse --abbrev-ref HEAD
$ts        = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
$nodeVer   = node --version
$pnpmVer   = pnpm --version
$instSize  = [math]::Round((Get-Item "out\AIRE-$version-Setup.exe").Length / 1MB, 2)
$instHash  = (Get-FileHash "out\AIRE-$version-Setup.exe" -Algorithm SHA256).Hash
$nodeHash  = (Get-FileHash "installer\node-runtime\node.exe" -Algorithm SHA256).Hash

# 以 sed / PowerShell Replace 填入 PROVENANCE.md 占位符，或直接生成新檔
```

---

*此範本由 Wave 4 Task 4.4 建立，版本：2025-05*
