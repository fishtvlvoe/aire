/**
 * 組外連 URL 給業務點按鈕：591 實價登錄 / 591 待售 / 信義房屋 / 樂屋網。
 *
 * 系統不發任何 request 到第三方平臺，只組 URL 給瀏覽器以新分頁打開。
 * 對應表來自 region-mapping.ts；找不到行政區 → fallback 到城市層；找不到城市 → fallback 到平臺首頁。
 */

import { getRegionMapping } from './region-mapping';

export type ExternalPlatformId = '591-price' | '591-buy' | 'sinyi' | 'rakuya';

export type ExternalUrlResult = {
  url: string;
  /** 'full' = 城市 + 行政區 ID 都帶到；'city-only' = 只帶城市 ID（行政區未對應）；'platform-home' = 連對應表都沒，導到首頁 */
  coverage: 'full' | 'city-only' | 'platform-home';
};

const PLATFORM_HOME: Record<ExternalPlatformId, string> = {
  '591-price': 'https://price.591.com.tw/',
  '591-buy': 'https://buy.591.com.tw/',
  sinyi: 'https://www.sinyi.com.tw/',
  rakuya: 'https://www.rakuya.com.tw/',
};

export const PLATFORM_LABELS: Record<ExternalPlatformId, string> = {
  '591-price': '591 實價登錄',
  '591-buy': '591 待售物件',
  sinyi: '信義房屋',
  rakuya: '樂屋網',
};

/**
 * 根據縣市、行政區與平臺，組出對應的搜尋 URL。
 *
 * @param platform - 目標平臺
 * @param city - 縣市名稱（含「市」「縣」）
 * @param district - 行政區（選填）
 * @returns
 *   - `{ url, coverage: 'full' }` — 帶到精準的縣市 + 行政區
 *   - `{ url, coverage: 'city-only' }` — 只帶縣市（行政區未對應或省略）
 *   - `{ url, coverage: 'platform-home' }` — 縣市完全沒覆蓋，導到平臺首頁
 */
export function buildExternalUrl(
  platform: ExternalPlatformId,
  city: string,
  district?: string,
): ExternalUrlResult {
  const mapping = getRegionMapping(city, district);
  if (!mapping) {
    return { url: PLATFORM_HOME[platform], coverage: 'platform-home' };
  }

  switch (platform) {
    case '591-price':
      return build591PriceUrl(mapping);
    case '591-buy':
      return build591BuyUrl(mapping);
    case 'sinyi':
      return buildSinyiUrl(mapping);
    case 'rakuya':
      return buildRakuyaUrl(mapping);
    default: {
      const exhaustive: never = platform;
      throw new Error(`Unknown platform: ${exhaustive as string}`);
    }
  }
}

type Mapping = NonNullable<ReturnType<typeof getRegionMapping>>;

function build591PriceUrl(m: Mapping): ExternalUrlResult {
  const params = new URLSearchParams();
  params.set('regionid', String(m.city.regionId591));
  const sectionId = m.district?.sectionId591;
  if (sectionId && sectionId > 0) {
    params.set('section', String(sectionId));
    return { url: `https://price.591.com.tw/list?${params.toString()}`, coverage: 'full' };
  }
  return { url: `https://price.591.com.tw/list?${params.toString()}`, coverage: 'city-only' };
}

function build591BuyUrl(m: Mapping): ExternalUrlResult {
  const params = new URLSearchParams();
  params.set('regionid', String(m.city.regionId591));
  const sectionId = m.district?.sectionId591;
  if (sectionId && sectionId > 0) {
    params.set('section', String(sectionId));
    return { url: `https://buy.591.com.tw/?${params.toString()}`, coverage: 'full' };
  }
  return { url: `https://buy.591.com.tw/?${params.toString()}`, coverage: 'city-only' };
}

function buildSinyiUrl(m: Mapping): ExternalUrlResult {
  const cityPart = encodeURIComponent(m.city.slugSinyi);
  if (m.district) {
    const districtPart = encodeURIComponent(m.district.slugSinyi);
    return {
      url: `https://www.sinyi.com.tw/buy/list/${cityPart}-${districtPart}-zip/`,
      coverage: 'full',
    };
  }
  return {
    url: `https://www.sinyi.com.tw/buy/list/${cityPart}-zip/`,
    coverage: 'city-only',
  };
}

function buildRakuyaUrl(m: Mapping): ExternalUrlResult {
  const params = new URLSearchParams();
  params.set('city', String(m.city.cityCodeRakuya));
  const zipcode = m.district?.zipcodeRakuya;
  if (zipcode && zipcode > 0) {
    params.set('zipcode', String(zipcode));
    return {
      url: `https://www.rakuya.com.tw/sale/sale_search?${params.toString()}`,
      coverage: 'full',
    };
  }
  return {
    url: `https://www.rakuya.com.tw/sale/sale_search?${params.toString()}`,
    coverage: 'city-only',
  };
}

/**
 * 列出所有平臺的 URL（給 UI 一次渲染四顆按鈕用）。
 */
export function buildAllExternalUrls(
  city: string,
  district?: string,
): Array<{ platform: ExternalPlatformId; label: string; result: ExternalUrlResult }> {
  const platforms: ExternalPlatformId[] = ['591-price', '591-buy', 'sinyi', 'rakuya'];
  return platforms.map((platform) => ({
    platform,
    label: PLATFORM_LABELS[platform],
    result: buildExternalUrl(platform, city, district),
  }));
}
