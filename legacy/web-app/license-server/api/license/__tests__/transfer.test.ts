import { beforeEach, describe, expect, it, vi } from 'vitest';

const hasValidAdminToken = vi.fn();
const getLicense = vi.fn();
const revokeLicense = vi.fn();
const saveLicense = vi.fn();
const generateSerialKey = vi.fn();
const kvDel = vi.fn();

vi.mock('@vercel/kv', () => ({
  kv: {
    del: kvDel,
  },
}), { virtual: true });

vi.mock('../../../lib/admin-auth', () => ({
  hasValidAdminToken,
}));

vi.mock('../../../lib/serial', () => ({
  generateSerialKey,
}));

vi.mock('../../../lib/store', () => ({
  getLicense,
  revokeLicense,
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

describe('POST /api/license/transfer', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    hasValidAdminToken.mockReturnValue(true);
    generateSerialKey.mockReturnValue('THREE-NEW1-NEW2-NEW3');
    revokeLicense.mockResolvedValue({ ok: true });
    saveLicense.mockResolvedValue(undefined);
  });

  it('returns 401 when unauthorized', async () => {
    hasValidAdminToken.mockReturnValue(false);
    const { default: handler } = await import('../transfer');
    const req = { method: 'POST', headers: { authorization: 'Bearer bad' }, body: { oldKey: 'THREE-OLD', reason: 'test' } } as any;
    const res = createRes();
    await handler(req, res as any);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: '未授權' });
  });

  it('returns 404 when old key not found', async () => {
    getLicense.mockResolvedValue(null);
    const { default: handler } = await import('../transfer');
    const req = { method: 'POST', headers: { authorization: 'Bearer token' }, body: { oldKey: 'THREE-NOT-FOUND', reason: 'lost' } } as any;
    const res = createRes();
    await handler(req, res as any);

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: '舊序號不存在' });
  });

  it('returns 400 when old key is revoked', async () => {
    getLicense.mockResolvedValue({ licenseKey: 'THREE-OLD', active: false, status: 'revoked' });
    const { default: handler } = await import('../transfer');
    const req = { method: 'POST', headers: { authorization: 'Bearer token' }, body: { oldKey: 'THREE-OLD', reason: 'refund' } } as any;
    const res = createRes();
    await handler(req, res as any);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: '舊序號已停用' });
  });

  it('creates a new license and revokes old one', async () => {
    getLicense
      .mockResolvedValueOnce({
        licenseKey: 'THREE-OLD1-OLD2-OLD3',
        email: 'old-owner@example.com',
        contactName: '舊客戶',
        company: '舊公司',
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
      .mockResolvedValueOnce({ licenseKey: 'THREE-NEW1-NEW2-NEW3', status: 'issued' });

    const { default: handler } = await import('../transfer');
    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer token' },
      body: {
        oldKey: 'THREE-OLD1-OLD2-OLD3',
        reason: 'customer transfer',
        newEmail: 'NEWOWNER@EXAMPLE.COM',
        newContactName: '新客戶',
        newCompany: '新公司',
      },
    } as any;
    const res = createRes();

    await handler(req, res as any);

    expect(revokeLicense).toHaveBeenCalledWith('THREE-OLD1-OLD2-OLD3', 'customer transfer');
    expect(saveLicense).toHaveBeenCalledTimes(1);

    const savedArg = saveLicense.mock.calls[0]?.[0];
    expect(savedArg).toMatchObject({
      licenseKey: 'THREE-NEW1-NEW2-NEW3',
      email: 'newowner@example.com',
      contactName: '新客戶',
      company: '新公司',
      status: 'issued',
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ success: true, revokedKey: 'THREE-OLD1-OLD2-OLD3', newKey: 'THREE-NEW1-NEW2-NEW3' });
  });

  it('rolls back old license when save fails', async () => {
    const old = {
      licenseKey: 'THREE-OLD',
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
    };

    getLicense.mockResolvedValueOnce(old);
    saveLicense.mockRejectedValueOnce(new Error('kv down'));

    const { default: handler } = await import('../transfer');
    const req = { method: 'POST', headers: { authorization: 'Bearer token' }, body: { oldKey: 'THREE-OLD', reason: 'x' } } as any;
    const res = createRes();
    await handler(req, res as any);

    expect(saveLicense).toHaveBeenCalledTimes(2);
    expect(saveLicense.mock.calls[1]?.[0]).toEqual(old);
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: 'transfer_failed' });
  });
});
