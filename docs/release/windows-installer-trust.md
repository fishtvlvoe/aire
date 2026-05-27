# Windows Installer Trust

## 白話結論

客戶要「正常安裝」不能靠教他按略過。AIRE Windows 版需要正式 code signing，讓 Windows 看到可信發行者；若防毒有具體偵測名稱，還要送 Microsoft Security Intelligence 複查。

目前已自動化：

- CI 產生 Windows installer。
- CI 可在 Windows runner 安裝並啟動 AIRE。
- CI 會產生 installer sha256、簽章狀態、publisher、timestamp、Defender/SmartScreen 觀察欄位與 release status metadata。
- 沒有有效簽章時，metadata 會標示 `internal-only`，不能當客戶 release。

還需要人工一次性完成：

- 建立 Azure Artifact Signing 帳號與 certificate profile。
- 完成 Microsoft 組織身分驗證。
- 在 GitHub repo 設定 OIDC 與 signing secrets。

## 建議方案

優先使用 Azure Artifact Signing。Microsoft 官方 action 可在 Windows runner 上簽署檔案，支援 GitHub Actions、Azure DevOps 與 Windows tooling。此做法不用把私鑰放進 repo，也不需要把硬體 token 接到 CI。

備援方案是傳統 OV/EV code signing 憑證。可行，但私鑰管理成本較高；EV 憑證也不能保證每個新 build 第一次下載就完全沒有 SmartScreen 低信譽提示。

長期如果要讓客戶自行下載，Microsoft Store 是最穩定降低 SmartScreen 摩擦的通路，但不屬於這次 SR。

## GitHub 設定

Repo secrets:

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`
- `AZURE_TRUSTED_SIGNING_ENDPOINT`
- `AZURE_TRUSTED_SIGNING_ACCOUNT`
- `AZURE_TRUSTED_SIGNING_CERT_PROFILE`

Repo variables:

- `WINDOWS_SIGNING_EXPECTED_PUBLISHER`: 預期顯示的發行者名稱，例如 `AIRE` 或正式公司名稱。

GitHub Environment:

- 建議建立 `windows-signing` environment。
- 建議要求人工 approval 才能執行 `customer_release=true` 的 workflow。

## Release 操作

內部測試：

```bash
gh workflow run release.yml --ref <branch>
```

客戶 release candidate：

```bash
gh workflow run release.yml --ref <tag-or-branch> -f customer_release=true
```

若 signing secrets 尚未設定，`customer_release=true` 應失敗；這是正確行為。

## Warning 分類

| 類型 | 意義 | 處理 |
| --- | --- | --- |
| SmartScreen low reputation | Windows 不熟悉這個 publisher/hash | 可做內部 smoke，但正式 release 仍需簽章與 metadata |
| Unknown publisher | 沒有可信 code signing | 不可交付客戶 |
| Defender malware / PUA detection | 防毒有具體偵測名稱 | 停止 release，提交 Microsoft Security Intelligence |

## Defender 誤判申訴資料

若 Defender 顯示具體偵測名稱，保存：

- installer 檔名與 sha256
- GitHub Actions run URL
- download/release URL
- Defender 偵測名稱
- warning 截圖
- Microsoft Security Intelligence submission id 或 submission 截圖

證據放在：

```text
artifacts/smoke/windows/trust/
```

## 驗證

本機或 CI 可執行：

```bash
node scripts/verify-windows-installer-trust.mjs \
  --installer path/to/AIRE_0.1.4_x64-setup.exe \
  --out artifacts/smoke/windows/trust/metadata.json
```

客戶 release gate 會要求：

- Authenticode signature 為 `valid`
- publisher subject 符合預期
- timestamp 存在
- Defender observation 沒有具體 malware detection
- Windows runtime smoke 有證據
