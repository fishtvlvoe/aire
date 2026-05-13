import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchDataAPI, getDataApiBaseUrl } from '../index';
import { queryRealPrice } from '../real-price';
import { queryEarthquake } from '../earthquake';
import { parseTranscriptRemote } from '../transcript';

const ORIGINAL_DATA_API_URL = process.env.DATA_API_URL;

describe('api-client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (ORIGINAL_DATA_API_URL === undefined) {
      delete process.env.DATA_API_URL;
    } else {
      process.env.DATA_API_URL = ORIGINAL_DATA_API_URL;
    }
  });

  describe('getDataApiBaseUrl', () => {
    it('回 null when DATA_API_URL 未設定', () => {
      delete process.env.DATA_API_URL;
      expect(getDataApiBaseUrl()).toBeNull();
    });

    it('去除 trailing slash', () => {
      process.env.DATA_API_URL = 'https://api.example.com//';
      expect(getDataApiBaseUrl()).toBe('https://api.example.com');
    });
  });

  describe('fetchDataAPI', () => {
    it('未設 DATA_API_URL → 回 unavailable，不發網路請求', async () => {
      delete process.env.DATA_API_URL;
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      const result = await fetchDataAPI('/api/data/real-price?city=台南');
      expect(result.available).toBe(false);
      expect(result.data).toBeNull();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('成功 200 → 回 available + data', async () => {
      process.env.DATA_API_URL = 'https://api.example.com';
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ data: [{ address: 'X' }], total: 1 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      const result = await fetchDataAPI<{ data: unknown[]; total: number }>(
        '/api/data/real-price?city=台南',
      );
      expect(result.available).toBe(true);
      expect(result.data?.total).toBe(1);
    });

    it('500 錯誤 → 回 unavailable + error 訊息', async () => {
      process.env.DATA_API_URL = 'https://api.example.com';
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('boom', { status: 500, statusText: 'Internal Server Error' }),
      );
      const result = await fetchDataAPI('/api/data/real-price?city=台南');
      expect(result.available).toBe(false);
      expect(result.error).toContain('500');
    });

    it('timeout → 回 unavailable + error 訊息', async () => {
      process.env.DATA_API_URL = 'https://api.example.com';
      vi.spyOn(globalThis, 'fetch').mockImplementation(
        (_input, init) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => {
              reject(new DOMException('aborted', 'AbortError'));
            });
          }),
      );
      const result = await fetchDataAPI('/api/data/real-price?city=台南', { timeoutMs: 50 });
      expect(result.available).toBe(false);
      expect(result.error).toMatch(/timeout/);
    });

    it('傳 object body → 自動 JSON.stringify + 設 Content-Type', async () => {
      process.env.DATA_API_URL = 'https://api.example.com';
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );
      await fetchDataAPI('/api/data/parse-transcript', {
        method: 'POST',
        body: { foo: 'bar' },
      });
      const init = fetchSpy.mock.calls[0]?.[1];
      expect(init?.body).toBe(JSON.stringify({ foo: 'bar' }));
      expect((init?.headers as Record<string, string>)?.['Content-Type']).toBe('application/json');
    });
  });

  describe('queryRealPrice', () => {
    it('組正確 URL（含 city + district）', async () => {
      process.env.DATA_API_URL = 'https://api.example.com';
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ data: [], total: 0 }), { status: 200 }),
      );
      await queryRealPrice({ city: '台南市', district: '東區', year: 2024 });
      const url = fetchSpy.mock.calls[0]?.[0] as string;
      expect(url).toContain('city=');
      expect(url).toContain('district=');
      expect(url).toContain('year=2024');
    });

    it('未設 DATA_API_URL → unavailable', async () => {
      delete process.env.DATA_API_URL;
      const result = await queryRealPrice({ city: '台南市' });
      expect(result.available).toBe(false);
    });
  });

  describe('queryEarthquake', () => {
    it('組正確 URL（lat + lng + radius）', async () => {
      process.env.DATA_API_URL = 'https://api.example.com';
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ data: [], total: 0 }), { status: 200 }),
      );
      await queryEarthquake({ lat: 22.99, lng: 120.21, radius: 10 });
      const url = fetchSpy.mock.calls[0]?.[0] as string;
      expect(url).toContain('lat=22.99');
      expect(url).toContain('lng=120.21');
      expect(url).toContain('radius=10');
    });
  });

  describe('parseTranscriptRemote', () => {
    it('空字串 → unavailable，不發請求', async () => {
      process.env.DATA_API_URL = 'https://api.example.com';
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      const result = await parseTranscriptRemote('   ');
      expect(result.available).toBe(false);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('正確 POST text/plain', async () => {
      process.env.DATA_API_URL = 'https://api.example.com';
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ fields: {}, confidence: 0.5 }), { status: 200 }),
      );
      await parseTranscriptRemote('TEST_TRANSCRIPT');
      const init = fetchSpy.mock.calls[0]?.[1];
      expect(init?.method).toBe('POST');
      expect(init?.body).toBe('TEST_TRANSCRIPT');
      expect((init?.headers as Record<string, string>)?.['Content-Type']).toBe('text/plain');
    });
  });
});
