# COP API 參數格式參考

> 來源：COP 平台服務說明頁面（逐一驗證）+ docs/MOIAPIExample_TOKEN（官方範例程式碼）
> 更新：2026-05-19（經瀏覽器直接查 ServiceData 頁面確認）

## 認證流程

```
GET https://copapi.moi.gov.tw/cp/getToken
Header: Authorization: Basic base64(ClientID:SecretCode)
Response: { "access_token": "...", "expires_in": 300 }
```

## API Base URLs

| 環境 | Base URL |
|------|---------|
| 沙盒（測試） | `https://copapi.moi.gov.tw/sandbox/api` |
| 正式（生產） | `https://copapi.moi.gov.tw/cp/api` |

## 參數格式（重要！）

| 參數 | 長度 | 範例 | 說明 |
|------|------|------|------|
| unit | 2 碼 | `"BA"` | 事務所代碼（非 1 碼）|
| sec  | 4 碼 | `"0001"` | 段代碼 |
| no   | 8 碼 | `"00020000"` | 地號（主號4碼 + 副號4碼，不足補零）|
| CITY | 1 碼 | `"D"` | 縣市代碼（台南市=D）|

## 縣市代碼（CITY）

| 縣市 | 代碼 |
|------|------|
| 台北市 | A |
| 台中市 | B |
| 基隆市 | C |
| 台南市 | D |
| 高雄市 | E |
| 新北市 | F |
| 桃園市 | H |

## 台南市地政事務所代碼（UNIT，來源：API 012 QueryUnit）

| 代碼 | 名稱 |
|------|------|
| DA | 臺南地政事務所 |
| DB | 安南地政事務所 |
| DC | 東南地政事務所 |
| DD | 鹽水地政事務所 |
| DE | 白河地政事務所 |
| DF | 麻豆地政事務所 |
| DG | 佳里地政事務所 |
| DH | 新化地政事務所 |
| DI | 歸仁地政事務所 |
| DJ | 玉井地政事務所 |
| DK | 永康地政事務所（永康區） |

## API 服務清單（已驗證）

### MOI_API_001 地籍土地標示部資料服務
- **服務網址**: `https://copapi.moi.gov.tw/cp/api/LandDescription`
- **端點**: `/LandDescription/1.0/QueryByLandNo`
- **UUID**: `24ED4437-DD2B-4FC1-A246-1AEF73681E0B`
- **參數**: `[{"unit":"BA","sec":"0001","no":"00020000"}]`
- **回傳**: 土地面積、登記日期、公告地現值 (ALVALUE)、公告地價 (ALPRICE)、用途分區

### MOI_API_002 地籍土地所有權部資料服務
- **服務網址**: `https://copapi.moi.gov.tw/cp/api/LandOwnership`
- **端點**: `/LandOwnership/1.0/QueryByLimit`
- **UUID**: `8C8F0F4C-EF41-4426-A800-3EF15AA9886D`
- **參數**: `[{"unit":"BA","sec":"0001","no":"00020000","offset":1,"limit":100}]`

### MOI_API_003 地籍土地他項權利部資料服務
- **服務網址**: `https://copapi.moi.gov.tw/cp/api/LandOtherRights`
- **端點**: `/LandOtherRights/1.0/QueryByLimit`（注意：有 **s**）
- **UUID**: `467165FA-11B9-416A-BE89-90E86B20242C`
- **參數**: `[{"unit":"BA","sec":"0001","no":"00020000","offset":1,"limit":100}]`
- **注意**: 無他項權利時 STATUS=0 → 應視為空列表（非錯誤）

### MOI_API_004 地籍建物標示部資料服務
- **服務網址**: `https://copapi.moi.gov.tw/cp/api/BuildingDescription`
- **端點**: `/BuildingDescription/1.0/QueryByBuildNo`
- **UUID**: `EB95D5DC-2F03-41DA-8406-B69F2D7ECC15`
- **參數**: `[{"unit":"BA","sec":"0001","no":"00020000"}]`

### MOI_API_005 地籍建物所有權部資料服務
- **服務網址**: `https://copapi.moi.gov.tw/cp/api/BuildingOwnership`
- **端點**: `/BuildingOwnership/1.0/QueryByLimit`
- **UUID**: `5A582A73-3E5F-4528-B423-A95F79F9E216`
- **參數**: `[{"unit":"BA","sec":"0001","no":"00020000","offset":1,"limit":100}]`

### MOI_API_007 地號資料服務（依地段查地號）
- **服務網址**: `https://copapi.moi.gov.tw/cp/api/LandQuerySec`
- **端點**: `/LandQuerySec/1.0/QueryBySec` 或 `/LandQuerySec/1.0/QueryByXY`
- **UUID**: `6C8FA2C4-F824-42B8-B13C-3E6CBBFC6BE0`
- **說明**: 以地段或坐標查詢地號，每地段收費 10 元
- **注意**: 此 API 不是門牌查地號，是「已知地段代碼查所有地號」

### MOI_API_012 全國土地基本資料庫代碼資料服務
- **服務網址**: `https://openapi.moi.gov.tw/WEBAPI/LandQuery`（免費，無需 Bearer Token）
- **UUID**: `A5CCC85A-EEF3-4659-8829-DA21CD0DCC95`
- **收費**: 免費
- 端點列表（GET 請求，無需 token）：
  - `QueryCity` — 縣市代碼（無需參數）
  - `QueryTown?CITY=D` — 鄉鎮代碼（台南市）
  - `QueryUnit?CITY=D` — 事務所代碼（台南市各地政事務所）
  - `QueryZone` — 非都市土地使用分區
  - `QueryZoneDetail` — 非都市土地使用地類別

## 門牌查地號說明

COP 平台無「門牌 → 地號」直接對應的免費 API。
BuildingNo/QueryByAddress 端點需要另外訂閱（返回 COP317 錯誤）。
替代方案：
1. 取得 UNIT 代碼（QueryUnit，免費）
2. 取得鄉鎮代碼（QueryTown，免費）
3. 搭配 MOI_API_007 LandQuerySec 用地段代碼查詢（每地段 10 元）
4. 或由用戶手動輸入地號

## 沙盒測試範例（BA-0001-00020000）

```bash
TOKEN=$(curl -s -X GET "https://copapi.moi.gov.tw/cp/getToken" \
  -H "Authorization: Basic $(echo -n 'CLIENT_ID:SECRET' | base64)" \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['access_token'])")

curl -s -X POST \
  "https://copapi.moi.gov.tw/sandbox/api/LandDescription/1.0/QueryByLandNo" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '[{"unit":"BA","sec":"0001","no":"00020000"}]'
```

## 已知可用測試地號（正式環境 ✅）

| 地號 | COUNTY | 說明 |
|------|--------|------|
| BA-0001-00020000 | B（台中市） | 官方範例地號，生產環境 5 API 全部 STATUS=1，面積 72㎡ |
