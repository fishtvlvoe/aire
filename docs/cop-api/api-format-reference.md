# COP API 參數格式參考

> 來源：docs/MOIAPIExample_TOKEN（官方範例程式碼）
> 更新：2026-05-19

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
| UNIT | 2 碼 | `"BA"` | 事務所代碼（非 1 碼）|
| SEC  | 4 碼 | `"0001"` | 段代碼 |
| NO   | 8 碼 | `"00020000"` | 地號（主號4碼 + 副號4碼，不足補零）|
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

## API 列表

### MOI_API_001 地籍土地標示部資料服務
- 端點：`/LandDescription/1.0/QueryByLandNo`
- 參數：`[{"unit":"BA","sec":"0001","no":"00020000"}]`
- 回傳：土地面積、使用分區、公告地價等

### MOI_API_002 地籍土地所有權部資料服務
- 端點：`/LandOwnership/1.0/QueryByLimit`
- 參數：`[{"unit":"BA","sec":"0001","no":"00020000","offset":1,"limit":100}]`

### MOI_API_003 地籍土地他項權利部資料服務
- 端點：`/LandOtherRights/1.0/QueryByLimit`
- 參數：`[{"unit":"BA","sec":"0001","no":"00020000","offset":1,"limit":100}]`
- 注意：無他項權利時 STATUS=0 → 應視為空列表（非錯誤）

### MOI_API_004 地籍建物標示部資料服務
- 端點：`/BuildingDescription/1.0/QueryByBuildNo`
- 參數：`[{"unit":"BA","sec":"0001","no":"00020000"}]`

### MOI_API_005 地籍建物所有權部資料服務
- 端點：`/BuildingOwnership/1.0/QueryByLimit`
- 參數：`[{"unit":"BA","sec":"0001","no":"00020000","offset":1,"limit":100}]`

### MOI_API_006 地籍建物他項權利部資料服務（建物抵押）
- 端點：`/BuildingOtherRight/1.0/QueryByLimit`
- 參數：`[{"unit":"BA","sec":"0001","no":"00020000","offset":1,"limit":100}]`

### MOI_API_007 門牌轉地建號（地址 → 地號）
- 端點：`/BuildingNo/1.0/QueryByAddress`
- 參數：`[{"CITY":"D","ADDRESS":"永康區勝利街58巷4號"}]`
- 注意：ADDRESS 不含縣市名，只含區以下地址

### MOI_API_012 全國地籍資料庫代碼資料服務
- 端點列表（代碼查詢，無需地號）：
  - `QueryCity` — 縣市代碼
  - `QueryTown?CITY=D` — 鄉鎮代碼（台南市）
  - `QueryUnit?CITY=D` — 事務所代碼（台南市各地政事務所）

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
