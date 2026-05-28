# 全國土地使用分區資料查詢系統

## 基本資訊

| 項目 | 內容 |
|------|------|
| 網址 | https://luz.nlma.gov.tw/web/ |
| 所屬機關 | 內政部國土管理署城鄉發展分署 |
| 系統名稱 | 全國土地使用分區資料查詢系統 |
| 類型 | WebGIS 圖台（ArcGIS） |

## 功能概述

全國唯一可於單一網站查詢全國土地使用分區圖資之系統。整合都市計畫、非都市土地及國家公園使用分區資料，提供行政區、道路、門牌、地號查詢定位，以及土地使用分區面積統計、距離面積量測、底圖切換等功能。

系統底圖包含國土測繪中心提供的正射影像、通用版地圖、地籍圖（DMAPS）。

## 查詢能力矩陣

| 查詢條件 | 是否支援 | 說明 |
|----------|----------|------|
| **地號** | ✅ | 支援地號查詢定位 |
| **建號** | ❌ | 未提供建號查詢 |
| **地段** | ✅ | 可透過行政區查詢 |
| **地址/門牌** | ✅ | 支援道路、門牌查詢定位 |

## 操作方式

1. 進入系統後需通過 **reCAPTCHA 驗證**
2. 左側選單選擇「綜合定位」
3. 查詢方式包含：行政區、道路、門牌、地號
4. 定位後可查看土地使用分區屬性（都市計畫/非都市/國家公園）
5. 可進行面積統計與量測

## 憑證需求

| 項目 | 需求 |
|------|------|
| 查詢 | **不需要**登入（但需通過 reCAPTCHA） |
| 進階功能 | 部分功能需登入 |

## API / 開放資料狀況

### ArcGIS REST Services

系統使用 ArcGIS JavaScript API 3.35，後端為 ArcGIS Server。從頁面原始碼可發現以下服務端點：

| 服務 | URL |
|------|-----|
| 國家公園 | `https://giss.nlma.gov.tw/tcdmap/rest/services/TCDPDA/NATIONAL_PARK_LANDUSE_ZONE_3857/MapServer` |
| 都市計畫使用分區 | `https://giss.nlma.gov.tw/tcdmap/rest/services/TCDPDA/URBAN_LANDUSE_ZONE_3857/MapServer` |
| 非都市土地使用分區 | `https://giss.nlma.gov.tw/tcdmap/rest/services/TCDPDA/NON_URBAN_LANDUSE_ZONE_3857/MapServer` |
| 非都市土地使用編定 | `https://giss.nlma.gov.tw/tcdmap/rest/services/TCDPDA/NON_URBAN_LANDUSE_LAND_3857/MapServer` |
| 地籍圖 WMTS | `https://luz.nlma.gov.tw/wmtsservice/wmts_dmaps?` |
| 通用底圖 WMTS | `https://wmts.nlsc.gov.tw/wmts` |

### Token 機制

系統使用動態 Token（`M_CONFIG.Token`），會定期更新。直接呼叫 REST API 可能需要取得有效 Token。

## 對 AIRE 的潛在價值

| 價值項目 | 說明 |
|----------|------|
| 土地使用分區 | 可查詢特定地號的都市計畫/非都市使用分區 |
| 面積統計 | 可統計特定範圍內各分區面積比例 |
| 不動產說明書 | 可補充「土地使用分區」與「編定用途」章節 |

## 限制與注意事項

1. **reCAPTCHA 驗證** 會阻擋自動化程式操作
2. ArcGIS REST API 需有效 Token，Token 有時效性
3. 地籍圖資料為地政司及國土測繪中心一年提供一次，與地政事務所現況資料存在時間差
4. 圖資套疊結果僅供參考，實際資料以地政機關認定為準
5. SSL 憑證有問題

## 相關連結

- 國土規劃地理資訊系統：https://nsp.nlma.gov.tw/ngis/
