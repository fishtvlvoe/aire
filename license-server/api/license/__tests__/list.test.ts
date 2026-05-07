import { beforeEach, describe, expect, it, vi } from 'vitest';

const hasValidAdminToken = vi.fn();
const listLicenses = vi.fn();

vi.mock('../../../lib/admin-auth', () => ({
  hasValidAdminToken,
}));

vi.mock('../../../lib/store', () => ({
  listLicenses,
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

describe('GET /api/license/list', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    hasValidAdminToken.mockReturnValue(true);
    listLicenses.mockResolvedValue({
      items: [{ licenseKey: 'THREE-AAAA-BBBB-CCCC', status: 'issued' }],
      total: 1,
      page: 1,
      pageSize: 20,
    });
  });

  it('returns filtered inventory', async () => {
    const { default: handler } = await import('../list');
    const req = {
      method: 'GET',
      query: { status: 'issued', page: '1', pageSize: '20' },
      headers: { authorization: 'Bearer token' },
    } as any;
    const res = createRes();

    await handler(req, res as any);
    expect(res.statusCode).toBe(200);
    expect((res.body as any).items[0].status).toBe('issued');
  });

  it('returns 400 invalid_pagination', async () => {
    const { default: handler } = await import('../list');
    const req = { method: 'GET', query: { page: '0', pageSize: '1000' } } as any;
    const res = createRes();
    await handler(req, res as any);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'invalid_pagination' });
  });
});

