import { beforeEach, describe, expect, it, vi } from 'vitest';

const hasValidAdminToken = vi.fn();
const getLicense = vi.fn();
const saveLicense = vi.fn();
const kvDel = vi.fn();

vi.mock('../../../lib/admin-auth', () => ({
  hasValidAdminToken,
}));

vi.mock('@vercel/kv', () => ({
  kv: {
    del: kvDel,
  },
}));

vi.mock('../../../lib/store', () => ({
  getLicense,
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

describe('PATCH /api/license/update-info', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    hasValidAdminToken.mockReturnValue(true);
  });

  it('returns 401 when unauthorized', async () => {
    hasValidAdminToken.mockReturnValue(false);
    const { default: handler } = await import('../update-info');
    const req = { method: 'PATCH', headers: { authorization: 'Bearer bad' }, body: { key: 'THREE-AAA' } } as any;
    const res = createRes();
    await handler(req, res as any);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: '未授權' });
  });

  it('returns 404 when license not found', async () => {
    getLicense.mockResolvedValue(null);
    const { default: handler } = await import('../update-info');
    const req = { method: 'PATCH', headers: { authorization: 'Bearer token' }, body: { key: 'THREE-NOT-FOUND' } } as any;
    const res = createRes();
    await handler(req, res as any);

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: '序號不存在' });
  });

  it('updates email and deletes old email index', async () => {
    getLicense
      .mockResolvedValueOnce({
        licenseKey: 'THREE-AAAA-BBBB-CCCC',
        email: 'old@example.com',
        contactName: null,
        company: null,
        machineId: null,
        allowedCidr: '0.0.0.0/0',
        features: ['disclosure-document'],
        createdAt: '2026-01-01T00:00:00.000Z',
        activatedAt: '2026-01-01T00:00:00.000Z',
        expiresAt: null,
        active: true,
        status: 'activated',
        issuedBy: 'admin',
        revokedAt: null,
        revokedReason: null,
      })
      .mockResolvedValueOnce({
        licenseKey: 'THREE-AAAA-BBBB-CCCC',
        email: 'new@example.com',
        contactName: '王小明',
        company: '三艾股份有限公司',
      });

    const { default: handler } = await import('../update-info');
    const req = {
      method: 'PATCH',
      headers: { authorization: 'Bearer token' },
      body: { key: 'THREE-AAAA-BBBB-CCCC', email: 'NEW@EXAMPLE.COM', contactName: '王小明', company: '三艾股份有限公司' },
    } as any;
    const res = createRes();

    await handler(req, res as any);

    expect(kvDel).toHaveBeenCalledWith('email-index:old@example.com');
    expect(saveLicense).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      license: { licenseKey: 'THREE-AAAA-BBBB-CCCC', email: 'new@example.com' },
    });
  });
});
