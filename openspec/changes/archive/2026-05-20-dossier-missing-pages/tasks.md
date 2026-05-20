## 1. TDD 紅燈測試

- [x] [P] 1.1 完成「tax-calculation-engine provides pure functions for AIRE tax types」TDD 紅燈：建立 `src/lib/__tests__/tax-calculator.test.ts`，測試 stampTax(1000000,800000,1.0)→1800、deedTax(1000000)→60000、buildingTax(200000,"residential")→2400、buildingTax(200000,"commercial")→6000、零值輸入→0，驗收：npx vitest run 該檔全部失敗
- [x] [P] 1.2 完成「location-map-api integrates Nominatim geocoding and Overpass facility queries」和「map-api module wraps geocoding and facility queries」TDD 紅燈：建立 `src/lib/__tests__/map-api.test.ts`，mock fetch，測 geocodeAddress 成功/{MapGeocodingError、fetchAmenities 成功/MapAmenitiesError，驗收：npx vitest run 全部失敗
- [x] [P] 1.3 完成「Page 6 renders six fixed legal notices」TDD 紅燈：建立 `src/components/__tests__/DossierPage6Notices.test.tsx`，驗 data-notice-index="1"-"6" 全部存在，驗收：npx vitest run 全部失敗
- [x] [P] 1.4 完成「Page 8 renders land value tax notes」TDD 紅燈：建立 `src/components/__tests__/DossierPage8TaxNotes.test.tsx`，驗 7 個附注存在且第5個含"非都市土地持分面積>700m²"，驗收：npx vitest run 全部失敗
- [x] [P] 1.5 完成「Page 7 renders buyer/seller fee table with auto-calculated taxes」TDD 紅燈：建立 `src/components/__tests__/DossierPage7FeeTable.test.tsx`，傳入 contractPrice=1000000/officialLandValue=800000/shareRatio=1/buildingCurrentValue=200000/usage="residential"，驗 data-testid="fee-stamp-tax" 含"1800"、data-testid="fee-deed-tax" 含"60000"、data-testid="fee-building-tax" 含"2400"，驗收：npx vitest run 全部失敗
- [x] [P] 1.6 完成「Surrounding facilities map renders from address」TDD 紅燈：建立 `src/components/__tests__/DossierSurroundingMap.test.tsx`，mock map-api，驗成功時 data-testid="surrounding-map-container" 存在、geocoding 失敗顯示"地圖載入失敗，請確認地址"，驗收：npx vitest run 全部失敗

## 2. 核心邏輯實作

- [x] 2.1 完成「tax-calculation-engine provides pure functions for AIRE tax types」實作：建立 `src/lib/tax-calculator.ts`，匯出 stampTax(contractPrice,officialValue,shareRatio)=(contractPrice+officialValue×shareRatio)×0.001、deedTax(contractPrice)=contractPrice×0.06、buildingTax(buildingCurrentValue,usage)=住家×0.012/營業×0.03、landPriceTax(landCurrentValue,daysDiff)=landCurrentValue×(daysDiff/365)×0.002，所有結果四捨五入整數，零值回傳 0，驗收：npx vitest run src/lib/__tests__/tax-calculator.test.ts 全部通過
- [x] 2.2 完成「location-map-api integrates Nominatim geocoding and Overpass facility queries」實作：建立 `src/lib/map-api.ts`，geocodeAddress(address)呼叫 Nominatim(countrycodes=tw)空回傳拋 MapGeocodingError；fetchAmenities(lat,lng,radiusM)呼叫 Overpass 拋 MapAmenitiesError on failure；Amenity={id,type,name,lat,lng}，驗收：npx vitest run src/lib/__tests__/map-api.test.ts 全部通過

## 3. 靜態頁面元件（parallel）

- [x] [P] 3.1 完成「Page 6 renders six fixed legal notices」實作：建立 `src/components/DossierPage6Notices.tsx`，無 props，render 6 項法條 section，每項 data-notice-index="N"，法條：(1)平均地權條例第47條 (2)房地合一稅稅率 (3)農地使用限制 (4)建物使用用途 (5)重購退稅 (6)自用增值稅優惠，驗收：npx vitest run DossierPage6Notices 全部通過
- [x] [P] 3.2 完成「Page 8 renders land value tax notes」實作：建立 `src/components/DossierPage8TaxNotes.tsx`，無 props，render 7 項附注 section，第5項含「非都市土地持分面積>700m²」，驗收：npx vitest run DossierPage8TaxNotes 全部通過

## 4. 動態元件實作（依賴 2.1/2.2）

- [x] 4.1 完成「Page 7 renders buyer/seller fee table with auto-calculated taxes」實作：建立 `src/components/DossierPage7FeeTable.tsx`，接收 TaxInputs{contractPrice,officialLandValue,shareRatio,buildingCurrentValue,transactionDate,usage}，呼叫 tax-calculator.ts，渲染含 data-testid="fee-stamp-tax/fee-deed-tax/fee-building-tax" 費用表，LVT 行顯示「土地增值稅依地政機關核定，請洽詢稅捐稽徵處」，底部免責聲明，驗收：npx vitest run DossierPage7FeeTable 全部通過
- [x] 4.2 完成「Surrounding facilities map renders from address」實作：建立 `src/components/DossierSurroundingMap.tsx`，props address:string，mount 後呼叫 geocodeAddress+fetchAmenities(radius=1000)，leaflet 渲染 data-testid="surrounding-map-container"，geocoding 失敗顯示「地圖載入失敗，請確認地址」，設施查詢失敗顯示「周遭設施查詢失敗」，驗收：npx vitest run DossierSurroundingMap 全部通過

## 5. 表單擴充與 HTML 預覽整合

- [x] 5.1 修改 `src/components/disclosure-form-residential.tsx`：加入 transaction_price(number)、transfer_date(date)、usage_type(select:住家/營業) 欄位，透過既有 onChange prop 帶入 formState，驗收：render 後三欄位存在，onChange 觸發時 formState.transaction_price/transfer_date/usage_type 有值
- [x] 5.2 完成「tax-fee-pages renders complete Pages 7 and 8 with auto-calculated taxes」整合：修改 `src/components/DisclosureHtmlPreview.tsx` 加入 taxInputs?: TaxInputs prop，頁面序列末尾插入 DossierPage6Notices、DossierPage7FeeTable(taxInputs)、DossierPage8TaxNotes、DossierSurroundingMap(address)，taxInputs undefined 時 Page7 顯示「—」，驗收：render 含 taxInputs 後 data-testid="fee-stamp-tax" 值為 1800
