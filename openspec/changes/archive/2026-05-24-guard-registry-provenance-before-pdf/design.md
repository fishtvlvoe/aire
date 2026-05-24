## Goals

- 讓 AIRE 能清楚回答：這個欄位是 MOI/COP 正式成功回傳、人工輸入、公開候選，還是探索/失敗資料。
- 讓 PDF 組裝端能分辨物調表階段與補件完成後狀態：物調表可帶候選/公開資料去現場談，補件完成後才把欄位升級成已確認資料。
- 讓裕農路 live 驗收 JSON 清楚呈現卡住的位置，避免後續工程師或客戶誤讀。

## Non-Goals

- 不解決客戶 COP 帳號缺服務授權的問題。
- 不把公開候選地號、建號當正式地址查詢結果。
- 不處理付費帳務完整後台；費用帳務另由既有 usage ledger SR 處理。

## Findings From 裕農路驗收

| 分類 | 結果 | 風險 |
| --- | --- | --- |
| `MOI_API_037` 門牌查建號 | 7 種地址 payload 都回 `COP317` | 帳號未授權，不可宣稱已由地址查到建號 |
| 公開候選建號 | `DC-1556-00165000` 等 4 筆可打建物 API 成功 | 可驗證 API client，但不是地址 API 正式判斷結果 |
| 公開候選地號 | `DC-1556-00700000` 可打土地 API 成功 | 可驗證 API client，但來源需標示為候選 |
| raw endpoint 嘗試 | `MOI_API_007/011/015/038/040/041/046` 皆 0 成功 | 探索結果不得進正式資料 |
| PDF 組裝 | 目前接受未包 provenance 的 `land_registry_data` | 舊資料或 mock/candidate payload 可能被誤用 |

## Product Flow Correction

AIRE 的真實業務流程不是「先拿到屋主正式謄本，才能產出文件」。正確流程是房仲既有的物調表流程：

```text
簽約前開發/談判
  → 產出物調表資料，帶候選資料、公開資料、待確認欄位去現場談
  → 屋主口頭確認或補充
  → 補件階段把未確認欄位補齊、修正、上傳正式文件
  → 物調表欄位升級為已確認資料，再進正式說明書/合約流程
```

因此 provenance guard 的目的不是阻止物調表產出，而是讓物調表欄位知道自己是否已確認。候選地號、公開資料、NLSC CAD、實價登錄與屋主口頭資訊都可以出現在物調表，但必須顯示來源與狀態。補件完成後，欄位才可升級為 `manual_confirmed` 或正式 MOI/COP 來源。

## Data Model

新增前端 provenance envelope：

```ts
type RegistryTrustedSource = "moi_api" | "manual";
type RegistryUntrustedSource = "public_candidate" | "raw_probe" | "mock" | "unknown";

interface RegistryProvenanceEntry {
  apiId: string;
  source: RegistryTrustedSource | RegistryUntrustedSource;
  status: "success" | "manual_confirmed" | "failed" | "unauthorized" | "candidate" | "probe";
  trustedForPdf: boolean;
  data?: Record<string, unknown>;
  error?: string;
  sourceNote?: string;
}

interface RegistryProvenancePayload {
  schema: "aire.registry-provenance.v1";
  generatedAt: string;
  parcelId?: string;
  entries: Record<string, RegistryProvenanceEntry>;
}
```

## Implementation Contract

### PullParcelDataButton

- 成功的 `ApiResult` 必須包成 `source = "moi_api"`、`status = "success"`、`trustedForPdf = true`。
- 手動補件資料必須包成 `source = "manual"`、`status = "manual_confirmed"`、`trustedForPdf = true`。
- 失敗 API 不得進入儲存 payload 的正式 entries；UI 可顯示錯誤，但不能把錯誤資料存成 PDF 可用資料。
- 匯出的 JSON 必須包含 provenance schema。

### assembleDossierData

- 正式版 PDF：若 `caseRow.land_registry_data` 是 provenance envelope，只讀取 `trustedForPdf = true` 且 `status` 為 `success` 或 `manual_confirmed` 的 entries。
- 正式版 PDF：若 `caseRow.land_registry_data` 是舊版 raw payload，預設不得當成正式地政資料輸出到 PDF；僅保留 `floor_plan_photo` legacy fallback。
- 正式版 PDF：若 runtime `land_registry_pull_data` 回傳 source 為 `mock`，不得進 PDF。
- 正式版 PDF：若 runtime `land_registry_pull_data` 回傳未標記來源，預設不得進 PDF。
- 物調表 PDF：可顯示候選/公開/待確認資料，但欄位必須標示 `pre_survey`、來源與待補件狀態。
- 補件完成後：人工確認或正式文件上傳的欄位才能轉為 `manual_confirmed`，並可進正式版。

### 裕農路 live runner

- `external_reference_inputs` 必須只作候選輸入，不得命名成正式地政結果。
- `raw_moi_endpoint_attempts` 必須只作探索紀錄。
- summary 必須輸出 `trusted_api_success_count`、`untrusted_candidate_count`、`unauthorized_count`、`raw_probe_success_count`。

## Verification

- TypeScript unit tests 檢查 provenance helper。
- PDF assemble tests 檢查舊 raw payload、mock payload、candidate/probe payload 不會進 PDF。
- Rust live test compile/ignored check 通過。
- Spectra analyze + validate 0 Critical/Warning。
