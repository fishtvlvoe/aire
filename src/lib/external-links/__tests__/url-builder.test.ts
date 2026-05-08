import { describe, expect, it } from 'vitest';
import {
  buildExternalUrl,
  buildAllExternalUrls,
  PLATFORM_LABELS,
  type ExternalPlatformId,
} from '../url-builder';

describe('buildExternalUrl', () => {
  describe('591 實價登錄', () => {
    it('台北市中正區（city-only：sectionId 占位 0）', () => {
      const result = buildExternalUrl('591-price', '台北市', '中正區');
      // 591 sectionId 暫為 0 占位 → fallback 城市層
      expect(result).toEqual({
        url: 'https://market.591.com.tw/?regionid=1',
        coverage: 'city-only',
      });
    });

    it('台北市（不指定行政區）→ 城市層', () => {
      const result = buildExternalUrl('591-price', '台北市');
      expect(result.url).toBe('https://market.591.com.tw/?regionid=1');
      expect(result.coverage).toBe('city-only');
    });

    it('未覆蓋的縣市 → 平臺首頁', () => {
      const result = buildExternalUrl('591-price', '澎湖縣', '望安鄉');
      expect(result).toEqual({
        url: 'https://market.591.com.tw/',
        coverage: 'platform-home',
      });
    });
  });

  describe('591 待售物件', () => {
    it('高雄市苓雅區', () => {
      const result = buildExternalUrl('591-buy', '高雄市', '苓雅區');
      expect(result.url).toContain('regionid=17');
      expect(result.url.startsWith('https://www.591.com.tw/')).toBe(true);
    });
  });

  describe('信義房屋', () => {
    it('台南市東區（含中文 URL encode）', () => {
      const result = buildExternalUrl('sinyi', '台南市', '東區');
      expect(result.coverage).toBe('full');
      // URL 應包含 encoded 的「台南市-東區-zip」
      expect(result.url).toContain('sinyi.com.tw/buy/list/');
      expect(decodeURIComponent(result.url)).toContain('台南市-東區-zip');
    });

    it('新北市（無行政區）', () => {
      const result = buildExternalUrl('sinyi', '新北市');
      expect(result.coverage).toBe('city-only');
      expect(decodeURIComponent(result.url)).toContain('新北市-zip');
    });

    it('未覆蓋縣市 → 平臺首頁', () => {
      const result = buildExternalUrl('sinyi', '金門縣');
      expect(result.coverage).toBe('platform-home');
      expect(result.url).toBe('https://www.sinyi.com.tw/');
    });
  });

  describe('樂屋網', () => {
    it('台中市西屯區（zipcode=407）', () => {
      const result = buildExternalUrl('rakuya', '台中市', '西屯區');
      expect(result.coverage).toBe('full');
      expect(result.url).toContain('zipcode=407');
    });

    it('桃園市（無行政區）', () => {
      const result = buildExternalUrl('rakuya', '桃園市');
      expect(result.coverage).toBe('city-only');
      expect(result.url).toBe('https://www.rakuya.com.tw/');
    });
  });
});

describe('buildAllExternalUrls', () => {
  it('回傳四個平臺結果，順序穩定', () => {
    const results = buildAllExternalUrls('台北市', '大安區');
    expect(results).toHaveLength(4);
    expect(results.map((r) => r.platform)).toEqual([
      '591-price',
      '591-buy',
      'sinyi',
      'rakuya',
    ]);
  });

  it('每個結果都有正確的 label', () => {
    const results = buildAllExternalUrls('高雄市');
    results.forEach((r) => {
      expect(r.label).toBe(PLATFORM_LABELS[r.platform as ExternalPlatformId]);
      expect(r.result.url.length).toBeGreaterThan(0);
    });
  });
});
