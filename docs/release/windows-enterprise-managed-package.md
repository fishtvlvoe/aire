# AIRE Windows 企業內部分發包

> **⚠ 適用範圍：僅限企業 IT 管控的 Windows 裝置**
> 本包不適用於個人電腦或非受管裝置。
> 本包不等於正式客戶公發版（`customer-release-ready`）。

---

## 1. 打包內容與目錄結構

企業內部分發包的標準輸出為一個 zip 壓縮包，解壓後結構如下：

```
AIRE-enterprise-<version>/
├── AIRE-<version>-Setup.exe          # AIRE Windows installer
├── README.md                          # 本說明文件
├── manifest.json                      # checksum / sha256 manifest
│
├── trust/                             # 信任材料
│   ├── README-trust.md                # 信任鏈部署說明
│   ├── AIRE-RootCA.cer                # root certificate（企業內部 CA）
│   └── AIRE-Publisher.cer             # publisher certificate（code signing）
│
└── scripts/                           # 安裝與驗證腳本
    ├── install.ps1                     # 自動安裝腳本（PowerShell）
    ├── install-trust.ps1               # 信任鏈匯入腳本（需 Admin）
    └── verify-checksum.ps1             # sha256 驗證腳本
```

### 各元件說明

| 元件 | 必要 | 說明 |
|------|------|------|
| `AIRE-<version>-Setup.exe` | ✅ | AIRE Windows 主安裝檔 |
| `README.md` | ✅ | 本說明文件，含信任鏈部署順序與驗收步驟 |
| `manifest.json` | ✅ | 所有檔案的 sha256 checksum |
| `trust/AIRE-RootCA.cer` | ✅ | 企業內部 root CA 憑證 |
| `trust/AIRE-Publisher.cer` | ✅ | 發行者 code signing 憑證 |
| `trust/README-trust.md` | ✅ | 信任鏈部署說明（GPO / Intune 操作步驟） |
| `scripts/install.ps1` | ✅ | 安裝 AIRE 的 PowerShell 腳本 |
| `scripts/install-trust.ps1` | ✅ | 匯入 root CA 與 publisher cert 的腳本（需 Admin） |
| `scripts/verify-checksum.ps1` | ✅ | 驗證所有檔案 sha256 與 manifest.json 一致 |

---

## 2. 適用邊界（Managed Device Boundary）

> **本企業分發包僅適用於以下環境，其他情境 out of scope。**

### ✅ 適用（In Scope）

- 企業 IT 透過 GPO、Intune 或 MDM 已部署信任鏈的 Windows 裝置
- 企業 IT 已將 root CA 匯入受管裝置的 Trusted Root Certification Authorities
- 企業 IT 已將 publisher cert 匯入 Trusted Publishers
- 部署環境為企業管控（domain-joined 或 Intune-enrolled）裝置

### ❌ 不適用（Out of Scope）

| 情境 | 說明 |
|------|------|
| 個人電腦（非受管裝置） | 信任鏈未部署，SmartScreen / UAC 會攔截 |
| 客戶自行下載安裝 | 本包不是公開下載頁，不設計為自助安裝 |
| 正式客戶公發版 | 正式公發需通過 Azure Trusted Signing gate，見 `windows-installer-trust.md` |
| 試用版評估後的正式採購 | 正式採購版需走 `customer-release-ready` 流程 |

---

## 3. 企業內部分發 ≠ 正式客戶公發版

本包明確標示為 **`enterprise-managed-internal`**，不得被視為或升格為 `customer-release-ready`。

| 標籤 | 意義 | 本包適用？ |
|------|------|-----------|
| `internal-only` | 未簽章，只供開發測試 | ❌ |
| `pilot-ready` | 可供客戶試用，尚無正式簽章 | ❌ |
| `enterprise-managed-internal` | 企業受管裝置內部分發，信任鏈由 IT 部署 | ✅ |
| `customer-release-ready` | 正式客戶公發版，需 Azure Trusted Signing | ❌ |

> **禁止**：任何人不得把本包的 release status 改為 `customer-release-ready`，
> 即使本包可在企業受管裝置正常安裝。

---

## 4. 部署流程（客戶 IT 執行）

### 前提條件

- [ ] IT 具備目標裝置的管理員權限
- [ ] 目標裝置為企業管控（GPO / Intune / MDM）
- [ ] IT 已備妥用於部署 Group Policy 或 Intune 設定的工作站

### Step 1：驗證檔案完整性

```powershell
# 在取得分發包後，先驗證 sha256
.\scripts\verify-checksum.ps1
```

預期輸出：所有檔案 `PASS`，任何 `FAIL` 代表檔案損毀，停止部署。

### Step 2：部署信任鏈（需 Admin / GPO / Intune）

**選項 A：PowerShell 手動部署（單機）**

```powershell
# 需要以 Administrator 執行
.\scripts\install-trust.ps1
```

**選項 B：GPO 批次部署**

1. 開啟「群組原則管理」→ 選擇目標 OU
2. 新增 GPO → 「電腦設定」→「Windows 設定」→「安全設定」→「公開金鑰原則」
3. 匯入 `trust/AIRE-RootCA.cer` 到「受信任的根憑證授權單位」
4. 匯入 `trust/AIRE-Publisher.cer` 到「受信任的發行者」
5. 套用 GPO 並等待 `gpupdate /force`

**選項 C：Intune 批次部署**

1. Intune → 「裝置」→「設定檔」→「建立設定檔」
2. 平台：Windows 10/11，類型：受信任的憑證
3. 分別匯入 `AIRE-RootCA.cer` 與 `AIRE-Publisher.cer`
4. 指派至目標裝置群組

### Step 3：安裝 AIRE

```powershell
# 自動安裝（靜默模式，適合 GPO 軟體部署）
.\scripts\install.ps1 -Silent

# 或手動執行 installer
.\AIRE-<version>-Setup.exe
```

### Step 4：驗收

完成安裝後，依「5. 驗收清單」執行確認。

---

## 5. 驗收清單

### 5.1 信任鏈驗收

| 項目 | 驗收方式 | 預期結果 |
|------|----------|----------|
| Root CA 已匯入 | `certlm.msc` → 受信任的根憑證授權單位 | 可見 AIRE RootCA |
| Publisher cert 已匯入 | `certlm.msc` → 受信任的發行者 | 可見 AIRE Publisher |
| Installer 簽章驗證 | 右鍵 installer → 內容 → 數位簽章 | 顯示有效簽章，無警告 |
| SmartScreen 不攔截 | 執行 installer | 無「Unknown publisher」警告 |

### 5.2 安裝驗收

| 項目 | 驗收方式 | 預期結果 |
|------|----------|----------|
| 安裝完成 | 執行 installer | 安裝精靈完成，無錯誤 |
| AIRE 可啟動 | 桌面或開始選單點擊 AIRE | App 正常開啟，無 crash |
| 主功能可用 | 輸入地址查詢 → 查看結果 | 查詢結果顯示正常 |

### 5.3 checksum 驗收

| 項目 | 驗收方式 | 預期結果 |
|------|----------|----------|
| Installer sha256 | `verify-checksum.ps1` | `PASS` |
| Trust cert sha256 | `verify-checksum.ps1` | `PASS` |
| Script sha256 | `verify-checksum.ps1` | `PASS` |

### 5.4 邊界確認

| 確認項目 | 預期狀態 |
|----------|----------|
| 本次部署環境 | 企業受管裝置（GPO / Intune / MDM） |
| Release 標籤 | `enterprise-managed-internal`（非 `customer-release-ready`） |
| 信任鏈來源 | 企業內部 CA（非 Azure Trusted Signing） |
| 適用範圍 | 企業管控環境，不延伸至個人裝置 |

---

## 6. manifest.json 格式

```json
{
  "version": "<AIRE-version>",
  "generated_at": "<ISO8601>",
  "release_status": "enterprise-managed-internal",
  "files": [
    {
      "path": "AIRE-<version>-Setup.exe",
      "sha256": "<hex>"
    },
    {
      "path": "trust/AIRE-RootCA.cer",
      "sha256": "<hex>"
    },
    {
      "path": "trust/AIRE-Publisher.cer",
      "sha256": "<hex>"
    },
    {
      "path": "scripts/install.ps1",
      "sha256": "<hex>"
    },
    {
      "path": "scripts/install-trust.ps1",
      "sha256": "<hex>"
    },
    {
      "path": "scripts/verify-checksum.ps1",
      "sha256": "<hex>"
    }
  ]
}
```

> **注意**：`release_status` 欄位必須為 `enterprise-managed-internal`。
> 此欄位是機器可讀的 release gate 輸入，不得手動改為 `customer-release-ready`。

---

## 7. 風險說明

| 風險 | 說明 | 緩解 |
|------|------|------|
| IT 未部署信任鏈就安裝 | Windows 會攔截，安裝失敗 | Step 2 必須在 Step 3 之前完成 |
| Defender 誤判 PUA | 即使信任鏈已部署仍可能觸發 | 依 `windows-installer-trust.md` 申訴流程處理 |
| 被誤認為正式客戶版 | 客戶可能要求升格為正式版 | 明確標示 `enterprise-managed-internal`，說明正式版路線 |
| cert 過期 | 企業內部 CA cert 有效期限 | 打包時確認 cert 有效期，並在說明中標注到期日 |

---

## 參考文件

- [windows-installer-trust.md](./windows-installer-trust.md) — 正式 code signing 路線（Azure Trusted Signing）
- [windows-customer-pilot-delivery.md](./windows-customer-pilot-delivery.md) — 客戶試用版交付說明
- openspec/changes/windows-enterprise-managed-signing-package/ — 本 SR 的 SDD 文件
