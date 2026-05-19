# MOI_API_001地籍土地標示部資料服務

- serviceId: `24ED4437-DD2B-4FC1-A246-1AEF73681E0B`
- source: https://cop.moi.gov.tw/Service/service_Introduce/service_desc_24ED4437-DD2B-4FC1-A246-1AEF73681E0B.html
- sourceSha256: `24872ccc81f5caf8cb9db3e0a347d20b073274174ebb1f3853d019896a014a77`

MOI_API_001

# MOI_API_001地籍土地標示部資料服務

## 1.以地號查詢：QueryByLandNo
1.1.查詢參數
| 參數名稱 | 必選填 | 說明
| UNIT | 必填 | 事務所代碼，字元長度為2
| SEC | 必填 | 段代碼，字元長度為4
| NO | 必填 | 地號，字元長度為8
➔單次查詢上限25筆

1.2.輸出欄位
土地標示部：LANDREG
| 回傳欄位名稱 | 資料欄位中文
| RDATE | 登記日期(年月日)
| REASON | 登記原因(※代碼06)
| AREA | 面積
| ZONING | 使用分區
| LCLASS | 使用地類別
| ALVALUE | 公告地現值
| ALPRICE | 公告地價
| COUNTY | 縣市
| DISTRICT | 鄉鎮市區
| Y_COORDINATE | 視中心縱坐標
| X_COORDINATE | 視中心橫坐標
| MAPSHEET | 圖幅號
| BUILDINGCOUNT | 地上建物建號數量
※相關代碼對照請參閱本站服務目錄>搜尋[MOI_API_012全國土地基本資料庫代碼資料服務](https://cop.moi.gov.tw/ServiceList/ServiceData?id=A5CCC85A-EEF3-4659-8829-DA21CD0DCC95)，參考其[服務介面與回傳欄位說明。](https://cop.moi.gov.tw/Service/service_Introduce/service_desc_A5CCC85A-EEF3-4659-8829-DA21CD0DCC95.html)

其他登記事項：OTHERREG
| 回傳欄位名稱 | 資料欄位中文
| NUMBER | 其他登記事項序號
| CATEGORY | 其他登記事項代碼(※代碼30)
| CONTENT | 其他登記事項內容
※相關代碼對照請參閱本站服務目錄>搜尋[MOI_API_012全國土地基本資料庫代碼資料服務](https://cop.land.moi.gov.tw/ServiceList/ServiceData?id=A5CCC85A-EEF3-4659-8829-DA21CD0DCC95)，參考其[服務介面與回傳欄位說明。](https://cop.moi.gov.tw/Service/service_Introduce/service_desc_A5CCC85A-EEF3-4659-8829-DA21CD0DCC95.html)
