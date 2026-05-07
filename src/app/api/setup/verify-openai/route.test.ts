import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

const { setOpenAIApiKey } = vi.hoisted(() => ({
  setOpenAIApiKey: vi.fn(),
}));

vi.mock('@/lib/codex-client/key-store', () => ({
  setOpenAIApiKey,
}));

describe('POST /api/setup/verify-openai', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setOpenAIApiKey.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns { valid: true } for a valid key', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      }),
    );

    const request = new Request('http://localhost/api/setup/verify-openai', {
      method: 'POST',
      body: JSON.stringify({ apiKey: 'sk-proj-valid123' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const payload = (await response.json()) as { valid: boolean };

    expect(response.status).toBe(200);
    expect(payload).toEqual({ valid: true });
    expect(setOpenAIApiKey).toHaveBeenCalledWith('sk-proj-valid123');
  });

  it('returns invalid message for invalid key', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      }),
    );

    const request = new Request('http://localhost/api/setup/verify-openai', {
      method: 'POST',
      body: JSON.stringify({ apiKey: 'sk-proj-invalid' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const payload = (await response.json()) as { valid: boolean; error: string };

    expect(response.status).toBe(200);
    expect(payload).toEqual({ valid: false, error: 'API Key 無效' });
    expect(setOpenAIApiKey).not.toHaveBeenCalled();
  });

  it('returns timeout message when OpenAI is unreachable', async () => {
    const err = new Error('network timeout');
    err.name = 'AbortError';
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(err));

    const request = new Request('http://localhost/api/setup/verify-openai', {
      method: 'POST',
      body: JSON.stringify({ apiKey: 'sk-proj-valid123' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    const payload = (await response.json()) as { valid: boolean; error: string };

    expect(response.status).toBe(200);
    expect(payload).toEqual({ valid: false, error: '無法連線 OpenAI，請檢查網路' });
    expect(setOpenAIApiKey).not.toHaveBeenCalled();
  });
});
