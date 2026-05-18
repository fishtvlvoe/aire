# MOI_API_003 — 地籍土地他項權利部資料服務

> UUID: `467165FA-11B9-416A-BE89-90E86B20242C`
> 服務說明頁: https://cop.land.moi.gov.tw/Services/service_Introduce/service_desc_467165FA-11B9-416A-BE89-90E86B20242C.html
> **收費：單筆一元**
> 更新：2026-05-19

## 端點

```
POST https://copapi.moi.gov.tw/cp/api/LandOtherRights/1.0/QueryByLimit
```

注意：是 `LandOtherRights`（有 s），不是 `LandOtherRight`。

## 功能介面

| 介面名稱 | 中文說明 | 單次查詢條件上限 | 回傳上限 |
|---------|---------|--------------|--------|
| QueryByRegisterNo | 依所有權登記次序查詢 | 25 筆 | — |
| QueryByLimit | 依筆數查詢 | 1 筆 | 100 筆 |
| QueryByReceiveNO | 依收件年字號查詢 | 25 筆 | — |

## QueryByLimit 輸入參數

| 參數名稱 | 必填 | 說明 |
|---------|------|------|
| unit | 必填 | 地政事務所代碼（2字元） |
| sec | 必填 | 段代碼（4字元） |
| no | 必填 | 地號（8字元，主號4碼+副號4碼） |
| offset | 必填 | 起始索引號（需大於0，從1開始） |
| limit | 必填 | 回傳筆數（正整數，上限100） |

## 回傳資料結構

STATUS=0 代表無他項權利記錄（正常情況），應視為空列表而非錯誤。
STATUS=1 代表有資料，RESPONSE 陣列包含以下結構：

### LANDOTHERIGHTS（他項權利部）

| 欄位 | 說明 |
|-----|------|
| ORNO | 他項權利登記次序 |
| RIGHTTYPE | 權利種類（代碼參照 API 012 代碼27） |
| RIGHTPERSON | 權利人（債權人/抵押權人名稱） |
| SETTING | 擔保債權總金額 |
| RDATE | 登記日期 |
| REASON | 登記原因（代碼參照 API 012 代碼06） |
| RECEIVEYEAR | 收件年期 |
| RECEIVENO1 | 收件字 |
| RECEIVENO2 | 收件號 |
| SETRIGHT | 設定權利範圍類別 |
| SRDENOMINATOR | 設定權利範圍持分分母 |
| SRNUMERATOR | 設定權利範圍持分分子 |
| AREA | 設定權利範圍面積 |
| CERTIFICATENO | 證明書字號 |
| CLAIMRIGHT | 債權權利範圍類別 |
| CRDENOMINATOR | 債權權利範圍持分分母 |
| CRNUMERATOR | 債權權利範圍持分分子 |

### OTHERRIGHTFILE（他項權利檔）

| 欄位 | 說明 |
|-----|------|
| OTFNO | 他項權利檔號 |
| CCPT_RVT | 擔保債權總金額 / 權利價值類別 |
| CCP_RV | 擔保債權總金額 / 權利價值 |
| DURATIONTYPE | 存續期間類別 |
| STARTDATE | 存續期間起始日期 |
| ENDDATE | 存續期間終止日期 |
| ITYPE_LRTYPE | 利息(率)或地租類別 |
| ID_LRD | 利息(率)或地租說明 |

### OWNER（債權人）

| 欄位 | 說明 |
|-----|------|
| LTYPE | 類別 |
| LID | 統一編號 |
| LNAME | 姓名 |
| LADDR | 地址 |

## 使用範例

```json
POST /LandOtherRights/1.0/QueryByLimit
[{"unit":"BA","sec":"0001","no":"00020000","offset":1,"limit":100}]
```

回傳（無他項權利）：
```json
{"STATUS": 0, "MESSAGE": "取得服務資訊失敗"}
```

回傳（有抵押）：
```json
{
  "STATUS": 1,
  "RESPONSE": [{
    "LANDOTHERIGHTS": [{
      "RIGHTPERSON": "台灣銀行",
      "SETTING": "1000000",
      "RIGHTTYPE": "...抵押權..."
    }]
  }]
}
```
