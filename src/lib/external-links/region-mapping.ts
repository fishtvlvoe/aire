/**
 * 縣市與行政區對應到第三方平臺（591 / 信義房屋 / 樂屋網）的查詢 ID。
 *
 * 用途：給 url-builder.ts 組外連 URL 用，讓業務點按鈕直接打開預先帶查詢條件的搜尋頁。
 *
 * ⚠️ 591 sectionId 與樂屋 zipcode 部分為占位值（TODO 標註），需業務驗證後補正確值。
 *    URL 結構與函式介面已固定，未來只需更新對應表即可。
 */

export type CityCoverage = {
  /** 591 全站使用的縣市代碼 */
  regionId591: number;
  /** 信義房屋 URL slug 用的中文縣市名 */
  slugSinyi: string;
  /** 樂屋網 city query param 數值 */
  cityCodeRakuya: number;
};

export type DistrictCoverage = {
  /** 591 行政區 section ID（TODO: 部分為占位 0，待人工查證） */
  sectionId591: number;
  /** 信義房屋 URL slug 用的中文行政區名 */
  slugSinyi: string;
  /** 樂屋網 zipcode（3 碼郵遞區號，TODO: 部分為占位 0） */
  zipcodeRakuya: number;
};

export type RegionMappingResult = {
  city: CityCoverage;
  district?: DistrictCoverage;
  /** 'full' = 縣市 + 行政區都對應到；'city-only' = 找到縣市但行政區沒對應，fallback 到縣市層搜尋 */
  coverage: 'full' | 'city-only';
};

type CityEntry = CityCoverage & {
  name: string;
  districts: Record<string, DistrictCoverage>;
};

/**
 * 6 都對應表（涵蓋 90% 物件量）。
 * 其他縣市會 fallback 到「縣市層」搜尋（不指定行政區）。
 */
const CITY_TABLE: Record<string, CityEntry> = {
  台北市: {
    name: '台北市',
    regionId591: 1,
    slugSinyi: '台北市',
    cityCodeRakuya: 1,
    districts: {
      // TODO: 591 sectionId 待人工查證
      中正區: { sectionId591: 0, slugSinyi: '中正區', zipcodeRakuya: 100 },
      大同區: { sectionId591: 0, slugSinyi: '大同區', zipcodeRakuya: 103 },
      中山區: { sectionId591: 0, slugSinyi: '中山區', zipcodeRakuya: 104 },
      松山區: { sectionId591: 0, slugSinyi: '松山區', zipcodeRakuya: 105 },
      大安區: { sectionId591: 0, slugSinyi: '大安區', zipcodeRakuya: 106 },
      萬華區: { sectionId591: 0, slugSinyi: '萬華區', zipcodeRakuya: 108 },
      信義區: { sectionId591: 0, slugSinyi: '信義區', zipcodeRakuya: 110 },
      士林區: { sectionId591: 0, slugSinyi: '士林區', zipcodeRakuya: 111 },
      北投區: { sectionId591: 0, slugSinyi: '北投區', zipcodeRakuya: 112 },
      內湖區: { sectionId591: 0, slugSinyi: '內湖區', zipcodeRakuya: 114 },
      南港區: { sectionId591: 0, slugSinyi: '南港區', zipcodeRakuya: 115 },
      文山區: { sectionId591: 0, slugSinyi: '文山區', zipcodeRakuya: 116 },
    },
  },
  新北市: {
    name: '新北市',
    regionId591: 3,
    slugSinyi: '新北市',
    cityCodeRakuya: 3,
    districts: {
      板橋區: { sectionId591: 0, slugSinyi: '板橋區', zipcodeRakuya: 220 },
      三重區: { sectionId591: 0, slugSinyi: '三重區', zipcodeRakuya: 241 },
      中和區: { sectionId591: 0, slugSinyi: '中和區', zipcodeRakuya: 235 },
      永和區: { sectionId591: 0, slugSinyi: '永和區', zipcodeRakuya: 234 },
      新莊區: { sectionId591: 0, slugSinyi: '新莊區', zipcodeRakuya: 242 },
      新店區: { sectionId591: 0, slugSinyi: '新店區', zipcodeRakuya: 231 },
      土城區: { sectionId591: 0, slugSinyi: '土城區', zipcodeRakuya: 236 },
      汐止區: { sectionId591: 0, slugSinyi: '汐止區', zipcodeRakuya: 221 },
      樹林區: { sectionId591: 0, slugSinyi: '樹林區', zipcodeRakuya: 238 },
      林口區: { sectionId591: 0, slugSinyi: '林口區', zipcodeRakuya: 244 },
      淡水區: { sectionId591: 0, slugSinyi: '淡水區', zipcodeRakuya: 251 },
    },
  },
  桃園市: {
    name: '桃園市',
    regionId591: 6,
    slugSinyi: '桃園市',
    cityCodeRakuya: 6,
    districts: {
      桃園區: { sectionId591: 0, slugSinyi: '桃園區', zipcodeRakuya: 330 },
      中壢區: { sectionId591: 0, slugSinyi: '中壢區', zipcodeRakuya: 320 },
      平鎮區: { sectionId591: 0, slugSinyi: '平鎮區', zipcodeRakuya: 324 },
      八德區: { sectionId591: 0, slugSinyi: '八德區', zipcodeRakuya: 334 },
      龜山區: { sectionId591: 0, slugSinyi: '龜山區', zipcodeRakuya: 333 },
      蘆竹區: { sectionId591: 0, slugSinyi: '蘆竹區', zipcodeRakuya: 338 },
    },
  },
  台中市: {
    name: '台中市',
    regionId591: 8,
    slugSinyi: '台中市',
    cityCodeRakuya: 8,
    districts: {
      北區: { sectionId591: 0, slugSinyi: '北區', zipcodeRakuya: 404 },
      北屯區: { sectionId591: 0, slugSinyi: '北屯區', zipcodeRakuya: 406 },
      西屯區: { sectionId591: 0, slugSinyi: '西屯區', zipcodeRakuya: 407 },
      南屯區: { sectionId591: 0, slugSinyi: '南屯區', zipcodeRakuya: 408 },
      東區: { sectionId591: 0, slugSinyi: '東區', zipcodeRakuya: 401 },
      南區: { sectionId591: 0, slugSinyi: '南區', zipcodeRakuya: 402 },
      中區: { sectionId591: 0, slugSinyi: '中區', zipcodeRakuya: 400 },
      西區: { sectionId591: 0, slugSinyi: '西區', zipcodeRakuya: 403 },
      太平區: { sectionId591: 0, slugSinyi: '太平區', zipcodeRakuya: 411 },
      豐原區: { sectionId591: 0, slugSinyi: '豐原區', zipcodeRakuya: 420 },
    },
  },
  台南市: {
    name: '台南市',
    regionId591: 15,
    slugSinyi: '台南市',
    cityCodeRakuya: 15,
    districts: {
      // 台南市直轄市行政區（業務主要服務區域 — 優先補正確 ID）
      東區: { sectionId591: 0, slugSinyi: '東區', zipcodeRakuya: 701 },
      南區: { sectionId591: 0, slugSinyi: '南區', zipcodeRakuya: 702 },
      北區: { sectionId591: 0, slugSinyi: '北區', zipcodeRakuya: 704 },
      中西區: { sectionId591: 0, slugSinyi: '中西區', zipcodeRakuya: 700 },
      安平區: { sectionId591: 0, slugSinyi: '安平區', zipcodeRakuya: 708 },
      安南區: { sectionId591: 0, slugSinyi: '安南區', zipcodeRakuya: 709 },
      永康區: { sectionId591: 0, slugSinyi: '永康區', zipcodeRakuya: 710 },
      仁德區: { sectionId591: 0, slugSinyi: '仁德區', zipcodeRakuya: 717 },
      歸仁區: { sectionId591: 0, slugSinyi: '歸仁區', zipcodeRakuya: 711 },
      新化區: { sectionId591: 0, slugSinyi: '新化區', zipcodeRakuya: 712 },
    },
  },
  高雄市: {
    name: '高雄市',
    regionId591: 17,
    slugSinyi: '高雄市',
    cityCodeRakuya: 17,
    districts: {
      苓雅區: { sectionId591: 0, slugSinyi: '苓雅區', zipcodeRakuya: 802 },
      新興區: { sectionId591: 0, slugSinyi: '新興區', zipcodeRakuya: 800 },
      前金區: { sectionId591: 0, slugSinyi: '前金區', zipcodeRakuya: 801 },
      三民區: { sectionId591: 0, slugSinyi: '三民區', zipcodeRakuya: 807 },
      左營區: { sectionId591: 0, slugSinyi: '左營區', zipcodeRakuya: 813 },
      鼓山區: { sectionId591: 0, slugSinyi: '鼓山區', zipcodeRakuya: 804 },
      楠梓區: { sectionId591: 0, slugSinyi: '楠梓區', zipcodeRakuya: 811 },
      鳳山區: { sectionId591: 0, slugSinyi: '鳳山區', zipcodeRakuya: 830 },
    },
  },
};

/**
 * 取得縣市 + 行政區對應到第三方平臺的查詢 ID。
 *
 * @param city - 縣市名稱（含「市」「縣」字尾，如 "台北市"、"新北市"）
 * @param district - 行政區名稱（含「區」「鄉」「鎮」字尾，如 "中正區"），選填
 * @returns
 *   - `null` — 找不到該縣市（偏鄉縣市未覆蓋）
 *   - `{ city, coverage: 'city-only' }` — 找到縣市但行政區未覆蓋，fallback 到縣市層搜尋
 *   - `{ city, district, coverage: 'full' }` — 縣市 + 行政區都找到
 */
export function getRegionMapping(
  city: string,
  district?: string,
): RegionMappingResult | null {
  const entry = CITY_TABLE[city];
  if (!entry) {
    return null;
  }

  const cityPart: CityCoverage = {
    regionId591: entry.regionId591,
    slugSinyi: entry.slugSinyi,
    cityCodeRakuya: entry.cityCodeRakuya,
  };

  if (!district) {
    return { city: cityPart, coverage: 'city-only' };
  }

  const districtEntry = entry.districts[district];
  if (!districtEntry) {
    return { city: cityPart, coverage: 'city-only' };
  }

  return { city: cityPart, district: districtEntry, coverage: 'full' };
}

/** 列出所有已覆蓋的縣市名稱（給 UI 顯示「未覆蓋區域」提示用） */
export function listCoveredCities(): string[] {
  return Object.keys(CITY_TABLE);
}
