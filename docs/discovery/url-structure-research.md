# 台灣房屋交易網站 URL 結構調研報告

> 調研日期：2026-03-19
> 目的：確認能否用程式自動組合搜尋連結，讓用戶點擊後直接看到特定區域的物件

## 結論摘要

| 網站 | 可程式化組合 URL | 難度 | 備註 |
|------|-----------------|------|------|
| 591 售屋 | ✅ 可以 | 低 | 查詢參數，需要 regionid/section 代碼表 |
| 591 新建案 | ✅ 可以 | 低 | 類似 591 售屋 |
| 好房網 | ✅ 可以 | 低 | 路徑式，用中文城市名 |
| 樂屋網 | ❌ 403 封鎖 | 高 | 伺服器直接拒絕非瀏覽器請求，URL 結構待確認 |
| 信義房屋 | ✅ 可以 | 中 | 路徑式英文命名，需要城市/區域英文代碼表 |
| 永慶房屋 | ✅ 可以 | 低 | 路徑式，用中文城市名 |
| 實價登錄 | ❌ 不行 | 高 | SPA 架構，無法用 URL 參數帶入查詢 |
| Google Maps | ✅ 可以 | 低 | 標準 URL 格式 |

---

## 1. 591 售屋網（sale.591.com.tw）

### URL 格式

```
https://sale.591.com.tw/?shType=list&regionid={縣市代碼}&section={區域代碼}&kind={房型}&price={最低}_{最高}&area={最低坪}_{最高坪}
```

### 範例 URL

```
# 台南市全區住宅
https://sale.591.com.tw/?shType=list&regionid=15&kind=9

# 台南市東區住宅，500-1000 萬，20-50 坪
https://sale.591.com.tw/?shType=list&regionid=15&section=67&kind=9&price=500_1000&area=20_50

# 台南市關鍵字搜尋
https://sale.591.com.tw/?shType=list&regionid=15&keywords=東區成功路
```

### 完整參數列表

| 參數 | 說明 | 範例值 |
|------|------|--------|
| `shType` | 顯示方式 | `list`（列表）|
| `regionid` | 縣市代碼 | 1=台北、3=新北、15=台南、17=高雄 |
| `section` | 行政區代碼 | 需查對照表（各縣市不同） |
| `kind` | 房型 | 9=住宅、10=套房、8=車位、22=法拍、24=其他 |
| `price` | 價格範圍（萬） | `300_1000`（300-1000 萬）|
| `area` | 坪數範圍 | `20_50`（20-50 坪）|
| `unitprice` | 單價範圍 | 格式同上 |
| `keywords` | 關鍵字 | 社區名、街道名、地址 |
| `houseage` | 屋齡 | 待查 |
| `shape` | 格局 | 待查 |
| `publish_day` | 刊登時間 | 待查 |
| `direction` | 朝向 | 待查 |
| `floor` | 樓層 | 待查 |
| `toilet` | 衛浴數 | 待查 |
| `fitment` | 裝潢 | 待查 |
| `life` | 生活機能 | 待查 |
| `role` | 刊登身份 | 待查 |
| `parking` | 車位 | 待查 |
| `metro` | 捷運站 | 站點代碼 |
| `station` | 火車站 | 站點代碼 |
| `school` | 學校 | 學校代碼 |
| `shopping` | 商圈 | 商圈代碼 |

### 已知 regionid 代碼

| 代碼 | 縣市 |
|------|------|
| 1 | 台北市 |
| 3 | 新北市 |
| 6 | 桃園市 |
| 15 | 台南市 |
| 17 | 高雄市 |

> 注意：section 代碼需要另外建表，591 沒有公開文件。可以從搜尋頁面的 HTML 中爬取。

### App Deep Link

未發現標準 deep link。591 有 App，但搜尋頁面上未見 `intent://` 或 `591://` 格式的連結。

---

## 2. 591 新建案（newhouse.591.com.tw）

### URL 格式

```
https://newhouse.591.com.tw/home/housing/search?rid={縣市代碼}&sid={行政區代碼}
```

### 範例 URL

```
# 高雄市全區新建案
https://newhouse.591.com.tw/home/housing/search?rid=17

# 桃園市中壢區新建案
https://newhouse.591.com.tw/home/housing/search?rid=6&sid=67
```

### 參數列表

| 參數 | 說明 | 範例值 |
|------|------|--------|
| `rid` | 縣市代碼（同 regionid） | 6=桃園、15=台南、17=高雄 |
| `sid` | 行政區代碼（同 sectionid）| 67=中壢區 |
| `page` | 頁碼 | 1、2、3... |
| `per_page` | 每頁筆數 | 預設 20 |

### 個案詳情頁

```
https://newhouse.591.com.tw/{hid}
# 例如：https://newhouse.591.com.tw/138645
```

---

## 3. 好房網 HouseFun（buy.housefun.com.tw）

### URL 格式

```
https://buy.housefun.com.tw/region/{城市}_{區域}/?od={排序}&pg={頁碼}
```

**特色**：使用中文城市名直接放在路徑中（URL-encoded）。

### 範例 URL

```
# 台南市東區
https://buy.housefun.com.tw/region/臺南市_東區/

# 台北市大安區，按總價低到高排序
https://buy.housefun.com.tw/region/臺北市_大安區/?od=PriceUp

# 台南市東區，降價物件
https://buy.housefun.com.tw/region/臺南市_東區/降價_tag/

# 第 2 頁
https://buy.housefun.com.tw/region/臺南市_東區/?pg=2
```

### 排序參數（od）

| 值 | 說明 |
|----|------|
| `Default` | 預設 |
| `PriceUp` | 總價低→高 |
| `PriceDown` | 總價高→低 |
| `UnitPriceUp` | 單價低→高 |
| `UnitPriceDown` | 單價高→低 |
| `PriceReductionDown` | 降價幅度大→小 |
| `RegAreaUp` | 坪數小→大 |
| `RegAreaDown` | 坪數大→小 |
| `PostDateDown` | 上架日期新→舊 |
| `UpdateDown` | 刷新時間新→舊 |
| `PopularDown` | 月熱門度高→低 |

### 標籤篩選

在路徑中加入標籤：
- `實境找房_tag`
- `降價_tag`
- `新上架_tag`
- `屋主_tag`

### 注意事項

- 城市名用「臺」不是「台」（臺南市、臺北市）
- 價格和坪數的篩選參數未在 URL 中發現，可能由前端 JavaScript 處理

---

## 4. 樂屋網 Rakuya（www.rakuya.com.tw）

### 狀態：403 封鎖

伺服器對非瀏覽器的請求一律回傳 403 Forbidden，無法直接抓取頁面驗證。

### 推測 URL 格式（待驗證）

```
https://www.rakuya.com.tw/sell/result?city={城市代碼}&area={區域代碼}
```

- `city`：縣市代碼（推測與 591 相同或類似）
- `area`：行政區代碼

> 需要用瀏覽器手動驗證這些參數是否有效。

---

## 5. 信義房屋（www.sinyi.com.tw）

### URL 格式

```
https://www.sinyi.com.tw/buy/list/{城市英文名}/{區域英文名}
```

### 範例 URL

```
# 台南市全區
https://www.sinyi.com.tw/buy/list/Tainan-city

# 台南市東區
https://www.sinyi.com.tw/buy/list/Tainan-city/East-district

# 台北市大安區
https://www.sinyi.com.tw/buy/list/Taipei-city/Daan-district
```

### URL 路徑結構

```
/buy/list/{City}-city/{District}-district/{排序}/{頁碼}
```

### 已知城市英文代碼

| 代碼 | 城市 |
|------|------|
| `Taipei-city` | 台北市 |
| `NewTaipei-city` | 新北市 |
| `Taoyuan-city` | 桃園市 |
| `Taichung-city` | 台中市 |
| `Tainan-city` | 台南市 |
| `Kaohsiung-city` | 高雄市 |

### 注意事項

- 信義房屋使用 SPA 架構，頁面以 JavaScript 渲染
- 區域英文名稱的命名規則需要建表（例：大安區 = Daan-district、東區 = East-district）
- 篩選條件（價格、坪數等）可能透過查詢參數或 hash 傳遞，需進一步驗證

---

## 6. 永慶房屋（buy.yungching.com.tw）

### URL 格式

```
https://buy.yungching.com.tw/region/{城市}-{區域}_house/
```

### 範例 URL

```
# 台南市東區
https://buy.yungching.com.tw/region/臺南市-東區_house/

# 台北市大安區
https://buy.yungching.com.tw/region/臺北市-大安區_house/

# 台南市全區
https://buy.yungching.com.tw/region/臺南市_house/
```

### URL 路徑結構

```
/region/{城市名}-{區域名}_{物件類型}/
```

- 物件類型：`house`（房屋）、可能有 `land`（土地）等
- 城市名用「臺」（臺南市、臺北市）
- 城市和區域之間用 `-` 分隔

### 篩選參數

- `od`：排序方式（`default` 等）
- 其他篩選條件需要進一步確認

### 注意事項

- Angular SPA 架構，部分內容需 JavaScript 渲染
- 使用中文路徑（URL-encoded）

---

## 7. 內政部實價登錄（lvr.land.moi.gov.tw）

### 狀態：無法用 URL 參數直接查詢

- 完全 SPA 架構，頁面以 JavaScript 動態渲染
- 查詢操作由前端表單 + AJAX 完成
- 無法用 URL 參數帶入特定區域或查詢條件
- 連首頁都無法穩定用 WebFetch 取得內容

### 替代方案

1. **內政部開放資料 API**：https://plvr.land.moi.gov.tw/DownloadOpenData
   - 可下載 CSV/XML 格式的實價登錄資料
   - 按季度更新
2. **直接連結到首頁**，讓用戶自行操作：
   ```
   https://lvr.land.moi.gov.tw/
   ```

---

## 8. Google Maps 搜尋

### URL 格式

```
# 搜尋特定地址
https://www.google.com/maps/search/?api=1&query={地址}

# 搜尋地址附近的房屋
https://www.google.com/maps/search/?api=1&query=房屋+{地址}

# 用座標搜尋
https://www.google.com/maps/search/?api=1&query={緯度},{經度}

# 用 place 搜尋
https://www.google.com/maps/@{緯度},{經度},{縮放}z
```

### 範例 URL

```
# 搜尋台南市東區成功路
https://www.google.com/maps/search/?api=1&query=台南市東區成功路

# 搜尋台南市東區附近的房屋仲介
https://www.google.com/maps/search/?api=1&query=房屋仲介+台南市東區

# 指定座標 + 縮放
https://www.google.com/maps/@22.9908,120.2133,15z
```

### App Deep Link

```
# Android Intent
intent://maps.google.com/maps?q=台南市東區#Intent;scheme=https;package=com.google.android.apps.maps;end

# iOS Universal Link（自動開 App）
https://maps.apple.com/?q=台南市東區

# Google Maps Universal Link（iOS/Android 都會開 App）
https://www.google.com/maps/search/?api=1&query=台南市東區
```

---

## 程式化組合建議

### 最容易實作的（推薦優先）

1. **好房網** — 直接用中文城市名組 URL，最簡單
2. **永慶房屋** — 同樣用中文城市名
3. **591 售屋** — 需要建一張 regionid/section 代碼對照表
4. **Google Maps** — 標準 API，最穩定

### 需要額外工作的

5. **信義房屋** — 需要建英文城市/區域代碼表
6. **591 新建案** — 需要 rid/sid 代碼表（同 591 售屋）

### 不建議或無法做的

7. **樂屋網** — 403 封鎖，需確認實際 URL 格式
8. **實價登錄** — SPA 架構，無法用 URL 帶參數

### 代碼對照表需求

要實作完整功能，需要建以下對照表：

| 對照表 | 適用網站 | 來源 |
|--------|---------|------|
| regionid → 縣市 | 591 售屋、新建案 | 爬取 591 首頁選單 |
| section → 行政區 | 591 售屋、新建案 | 爬取 591 各縣市搜尋頁 |
| 城市英文代碼 → 中文 | 信義房屋 | 爬取信義房屋網站地圖 |
| 區域英文代碼 → 中文 | 信義房屋 | 同上 |

好房網和永慶不需要代碼表，直接用中文名稱即可。
