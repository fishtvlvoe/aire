import { beforeEach, describe, expect, it, vi } from 'vitest';

const getLicense = vi.fn();
const saveLicense = vi.fn();
const isIpInCidr = vi.fn();

vi.mock('../../../lib/store', () => ({
  getLicense,
  saveLicense,
  isIpInCidr,
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

describe('license activate and verify lifecycle', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    isIpInCidr.mockReturnValue(true);
  });

  it('activate succeeds for issued license', async () => {
    getLicense.mockResolvedValue({
      licenseKey: 'THREE-AAAA-BBBB-CCCC',
      status: 'issued',
      active: true,
      email: null,
      allowedCidr: '0.0.0.0/0',
      features: ['disclosure-document'],
      createdAt: '2026-01-01T00:00:00.000Z',
      activatedAt: null,
      expiresAt: null,
      issuedBy: 'admin',
      revokedAt: null,
      revokedReason: null,
    });

    const { default: handler } = await import('../activate');
    const req = {
      method: 'POST',
      body: { email: 'Customer@Example.com', licenseKey: 'THREE-AAAA-BBBB-CCCC' },
    } as any;
    const res = createRes();
    await handler(req, res as any);

    expect(res.statusCode).toBe(200);
    expect(saveLicense).toHaveBeenCalledTimes(1);
  });

  it('activate rejects unknown key', async () => {
    getLicense.mockResolvedValue(null);
    const { default: handler } = await import('../activate');
    const req = {
      method: 'POST',
      body: { email: 'customer@example.com', licenseKey: 'THREE-NOT-FOUND-KEY1' },
    } as any;
    const res = createRes();
    await handler(req, res as any);

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ valid: false, reason: 'license_not_found' });
  });

  it('verify rejects issued key as not activated', async () => {
    getLicense.mockResolvedValue({
      licenseKey: 'THREE-AAAA-BBBB-CCCC',
      status: 'issued',
      active: true,
      email: 'customer@example.com',
      allowedCidr: '0.0.0.0/0',
      features: ['disclosure-document'],
      createdAt: '2026-01-01T00:00:00.000Z',
      activatedAt: null,
      expiresAt: null,
      issuedBy: 'admin',
      revokedAt: null,
      revokedReason: null,
    });

    const { default: handler } = await import('../verify');
    const req = {
      method: 'POST',
      body: { email: 'customer@example.com', licenseKey: 'THREE-AAAA-BBBB-CCCC' },
      headers: { 'x-forwarded-for': '203.0.113.10' },
      socket: { remoteAddress: '203.0.113.10' },
    } as any;
    const res = createRes();
    await handler(req, res as any);

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ valid: false, reason: 'license_not_activated' });
  });
});

