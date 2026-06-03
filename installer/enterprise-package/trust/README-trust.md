# trust/ 目錄說明

## 內容

本目錄存放 AIRE 企業內部分發包的信任材料：

| 檔案 | 說明 |
|------|------|
| `AIRE-RootCA.cer` | 企業內部 root CA 憑證。需匯入受信任的根憑證授權單位。 |
| `AIRE-Publisher.cer` | 發行者 code signing 憑證。需匯入受信任的發行者。 |

## 部署方式

請依 `README.md` Step 2 說明部署信任鏈，或執行：

```powershell
# 需要 Administrator
..\scripts\install-trust.ps1
```

## 注意

- 這些憑證是企業內部使用，不是 Microsoft/公開 CA 發行的憑證。
- 僅在企業管控裝置（GPO / Intune）部署，不適合個人裝置。
- cert 到期日請在匯入後確認（certlm.msc → 憑證詳細資料）。
