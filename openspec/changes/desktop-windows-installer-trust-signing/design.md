## Context

AIRE 的主要客戶環境是 Windows，且前期會由 Fish 到客戶店裡現場安裝。現在的 Windows installer 由 GitHub Actions 產出，內部 UTM VM 能用來驗 runtime，但安裝過程出現 SmartScreen 或 Defender 警告時，代表 release trust 還沒有完成。

Microsoft 目前的 SmartScreen 行為重點是：

- SmartScreen 同時看發行者信譽與檔案 hash 信譽。
- 每個新 build 的檔案 hash 都會重新累積信譽。
- EV 憑證在 2024 後不再保證第一次下載就跳過 SmartScreen。
- Microsoft Store 是最穩定避免 SmartScreen 下載警告的通路。
- 非 Store 分發建議使用 Azure Artifact Signing 或等價正式 code signing。

參考來源：

- https://learn.microsoft.com/zh-tw/windows/apps/package-and-deploy/smartscreen-reputation
- https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options
- https://www.microsoft.com/en-us/wdsi/filesubmission

## Goals / Non-Goals

Goals:

- 讓 Windows installer 在 release gate 中具備可查的來源、hash、簽章狀態與 Windows VM 驗收紀錄。
- 導入正式 code signing 策略，使 Windows 顯示可信 publisher，不再是未知發行者。
- 建立 Defender 誤判申訴流程，避免把防毒警告當成單純 UI 警告忽略。
- 保留內部 UTM smoke 測試路線，但將它標記為 beta/internal-only，不等同客戶 release。

Non-Goals:

- 不處理 AIRE app 的業務功能 bug。
- 不承諾簽章後每個新版本第一次下載都零 SmartScreen 提示。
- 不以自簽憑證作為正式 release 解法。
- 不在這個 SR 內完成 Microsoft Store 上架，但要保留為長期替代路線。

## Release Trust Model

Windows release 要分成三層判定：

| 層級 | 目的 | 通過條件 |
| --- | --- | --- |
| Artifact provenance | 確認 installer 是 CI 產物 | workflow run、commit SHA、asset URL、sha256 全部記錄 |
| Code signing | 確認 publisher 可被 Windows 信任 | installer 有受信任憑證簽章，publisher 名稱正確 |
| Runtime acceptance | 確認 app 在 Windows 可用 | UTM Windows VM 安裝、啟動、跑地址到 PDF smoke |

短期內部驗收可以只通過 provenance + runtime acceptance，但正式客戶 release 必須通過 code signing。若 Defender 報出具體 malware 名稱，無論 runtime 是否可跑，都要先走誤判申訴或阻擋 release。

## Signing Strategy

優先方案是 Azure Artifact Signing：

- 適合 GitHub Actions 與 CI/CD。
- 不需要硬體 token。
- 需要完成 Microsoft 組織身分驗證。
- 簽章後仍可能出現新檔案 SmartScreen 低信譽提示，但警告應顯示可信 publisher，而不是未知發行者。

備援方案是傳統 OV/EV code signing 憑證：

- 可接受，但成本較高，管理憑證與私鑰的流程較重。
- EV 不再保證第一次下載就完全無 SmartScreen。
- 若採用傳統憑證，私鑰不得落在 repo 或一般 artifact 中。

長期方案是 Microsoft Store：

- 如果 AIRE 後續要讓客戶自行下載安裝，Store 是最穩定降低 SmartScreen friction 的通路。
- Store 上架不是本次 SR 的實作範圍，但 release 文件要保留決策點。

## CI / Release Pipeline

GitHub Actions release pipeline 需要新增 Windows signing stage：

1. Windows build 產出 installer。
2. 簽章 stage 使用正式 signing provider 對 installer 簽章。
3. 驗證 stage 檢查 installer hash、簽章 chain、publisher subject 與 timestamp。
4. 上傳 release asset 前保存 trust metadata JSON。
5. UTM Windows VM smoke 使用已簽章 installer，不使用未簽章暫存 build。

trust metadata 至少包含：

- workflow run URL
- commit SHA
- installer filename
- installer sha256
- signing provider
- certificate subject
- certificate thumbprint
- timestamp authority
- signature verification result
- SmartScreen/Defender observation
- Windows VM smoke evidence paths

## Defender False Positive Flow

如果 Windows Defender 或 Microsoft Security 顯示具體威脅名稱，處理順序是：

1. 停止對外 release。
2. 保存 warning screenshot、Defender detection name、installer sha256、download URL 與 workflow run。
3. 在 Microsoft Security Intelligence portal 提交檔案分析。
4. 將 submission id 或 portal evidence 放進 release trust artifact。
5. 只有在 Microsoft 判定 clean 或重新簽章重建後，才可恢復 release gate。

若只有 SmartScreen 低信譽警告，但沒有 Defender malware detection，內部 smoke 可以繼續；正式 release 仍需要簽章與 release note 說明。

## Verification Plan

- Static verification: script 檢查 installer sha256、簽章狀態、publisher、timestamp 與 trust metadata schema。
- CI verification: GitHub Actions Windows job 必須在 upload release asset 前執行 trust verification。
- VM verification: UTM Windows VM 安裝已簽章 installer，截圖保存安裝過程與 app 啟動畫面。
- Release document verification: acceptance checklist 明確標示 internal-only 與 customer-release-ready 的差異。

## Risks

- Azure Artifact Signing 組織驗證可能需要時間，SR 應允許先完成文件與 pipeline skeleton。
- 新版本 hash 仍可能出現 SmartScreen 低信譽提示，不能把零提示當成唯一成功條件。
- 如果 release pipeline 同時支援 x64 與 ARM64，兩個 installer 都要獨立簽章與驗證。
