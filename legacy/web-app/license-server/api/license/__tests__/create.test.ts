import { beforeEach, describe, expect, it, vi } from 'vitest';

const hasValidAdminToken = vi.fn();
const generateSerialBatch = vi.fn();
const saveLicense = vi.fn();

vi.mock('../../../lib/admin-auth', () => ({
  hasValidAdminToken,
}));

vi.mock('../../../lib/serial', () => ({
  generateSerialBatch,
}));

vi.mock('../../../lib/store', () => ({
  saveLicense,
}));

function createRes() {
  const response = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return response;
}

describe('POST /api/license/create', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    hasValidAdminToken.mockReturnValue(true);
    generateSerialBatch.mockReturnValue(['THREE-AAAA-BBBB-CCCC']);
    saveLicense.mockResolvedValue(undefined);
  });

  it('returns 201 with created items', async () => {
    const { default: handler } = await import('../create');
    const req = {
      method: 'POST',
      body: { count: 1, expiresAt: '2999-01-01T00:00:00.000Z', features: ['disclosure-document'] },
      headers: { authorization: 'Bearer token' },
    } as any;
    const res = createRes();

    await handler(req, res as any);

    expect(res.statusCode).toBe(201);
    expect((res.body as any).items).toHaveLength(1);
    expect(saveLicense).toHaveBeenCalledTimes(1);
  });

  it('returns 401 when unauthorized', async () => {
    hasValidAdminToken.mockReturnValue(false);
    const { default: handler } = await import('../create');
    const req = { method: 'POST', body: { count: 1 } } as any;
    const res = createRes();

    await handler(req, res as any);
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: 'unauthorized' });
  });

  it('returns 400 invalid_count for bad count', async () => {
    const { default: handler } = await import('../create');
    const req = { method: 'POST', body: { count: 0 } } as any;
    const res = createRes();

    await handler(req, res as any);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'invalid_count' });
  });
});

