import { beforeEach, describe, expect, it, vi } from 'vitest';

const hasValidAdminToken = vi.fn();
const revokeLicense = vi.fn();

vi.mock('../../../lib/admin-auth', () => ({
  hasValidAdminToken,
}));

vi.mock('../../../lib/store', () => ({
  revokeLicense,
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

describe('POST /api/license/revoke', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    hasValidAdminToken.mockReturnValue(true);
  });

  it('returns 200 when revoke succeeds', async () => {
    revokeLicense.mockResolvedValue({
      status: 'revoked',
      revokedAt: '2026-01-01T00:00:00.000Z',
      revokedReason: 'customer-cancelled',
    });
    const { default: handler } = await import('../revoke');
    const req = {
      method: 'POST',
      body: { licenseKey: 'THREE-AAAA-BBBB-CCCC', reason: 'customer-cancelled' },
      headers: { authorization: 'Bearer token' },
    } as any;
    const res = createRes();

    await handler(req, res as any);
    expect(res.statusCode).toBe(200);
    expect((res.body as any).status).toBe('revoked');
  });

  it('returns 404 when key is not found', async () => {
    revokeLicense.mockResolvedValue(null);
    const { default: handler } = await import('../revoke');
    const req = { method: 'POST', body: { licenseKey: 'THREE-NOT-FOUND-KEY1' } } as any;
    const res = createRes();

    await handler(req, res as any);
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: 'license_not_found' });
  });
});

