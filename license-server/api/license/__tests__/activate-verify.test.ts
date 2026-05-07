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
      machineId: null,
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
      body: { email: 'Customer@Example.com', licenseKey: 'THREE-AAAA-BBBB-CCCC', machineId: 'machine-1' },
    } as any;
    const res = createRes();
    await handler(req, res as any);

    expect(res.statusCode).toBe(200);
    expect(saveLicense).toHaveBeenCalledTimes(1);

    const savedArg = saveLicense.mock.calls[0]?.[0];
    expect(savedArg.machineId).toBeDefined();
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
      machineId: null,
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

  it('activate is idempotent for same machine + same email', async () => {
    const { hashMachineId } = await import('../../../lib/machine-id');

    getLicense.mockResolvedValue({
      licenseKey: 'THREE-AAAA-BBBB-CCCC',
      status: 'activated',
      active: true,
      email: 'customer@example.com',
      machineId: hashMachineId('machine-1'),
      allowedCidr: '0.0.0.0/0',
      features: ['disclosure-document'],
      createdAt: '2026-01-01T00:00:00.000Z',
      activatedAt: '2026-01-01T00:00:00.000Z',
      expiresAt: null,
      issuedBy: 'admin',
      revokedAt: null,
      revokedReason: null,
    });

    const { default: handler } = await import('../activate');
    const req = {
      method: 'POST',
      body: { email: 'customer@example.com', licenseKey: 'THREE-AAAA-BBBB-CCCC', machineId: 'machine-1' },
    } as any;
    const res = createRes();
    await handler(req, res as any);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true, features: ['disclosure-document'] });
    expect(saveLicense).toHaveBeenCalledTimes(0);
  });

  it('activate rejects activated license on different machine', async () => {
    const { hashMachineId } = await import('../../../lib/machine-id');

    getLicense.mockResolvedValue({
      licenseKey: 'THREE-AAAA-BBBB-CCCC',
      status: 'activated',
      active: true,
      email: 'customer@example.com',
      machineId: hashMachineId('machine-1'),
      allowedCidr: '0.0.0.0/0',
      features: ['disclosure-document'],
      createdAt: '2026-01-01T00:00:00.000Z',
      activatedAt: '2026-01-01T00:00:00.000Z',
      expiresAt: null,
      issuedBy: 'admin',
      revokedAt: null,
      revokedReason: null,
    });

    const { default: handler } = await import('../activate');
    const req = {
      method: 'POST',
      body: { email: 'customer@example.com', licenseKey: 'THREE-AAAA-BBBB-CCCC', machineId: 'machine-2' },
    } as any;
    const res = createRes();
    await handler(req, res as any);

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: '此序號已綁定其他電腦' });
  });

  it('activate rejects activated license on different email', async () => {
    getLicense.mockResolvedValue({
      licenseKey: 'THREE-AAAA-BBBB-CCCC',
      status: 'activated',
      active: true,
      email: 'customer@example.com',
      machineId: null,
      allowedCidr: '0.0.0.0/0',
      features: ['disclosure-document'],
      createdAt: '2026-01-01T00:00:00.000Z',
      activatedAt: '2026-01-01T00:00:00.000Z',
      expiresAt: null,
      issuedBy: 'admin',
      revokedAt: null,
      revokedReason: null,
    });

    const { default: handler } = await import('../activate');
    const req = {
      method: 'POST',
      body: { email: 'other@example.com', licenseKey: 'THREE-AAAA-BBBB-CCCC', machineId: 'machine-1' },
    } as any;
    const res = createRes();
    await handler(req, res as any);

    expect(res.statusCode).toBe(409);
    expect(res.body).toEqual({ error: 'License already activated for a different email' });
  });

  it('activate can bind machineId when already activated but unbound', async () => {
    const { hashMachineId } = await import('../../../lib/machine-id');

    getLicense.mockResolvedValue({
      licenseKey: 'THREE-AAAA-BBBB-CCCC',
      status: 'activated',
      active: true,
      email: 'customer@example.com',
      machineId: null,
      allowedCidr: '0.0.0.0/0',
      features: ['disclosure-document'],
      createdAt: '2026-01-01T00:00:00.000Z',
      activatedAt: '2026-01-01T00:00:00.000Z',
      expiresAt: null,
      issuedBy: 'admin',
      revokedAt: null,
      revokedReason: null,
    });

    const { default: handler } = await import('../activate');
    const req = {
      method: 'POST',
      body: { email: 'customer@example.com', licenseKey: 'THREE-AAAA-BBBB-CCCC', machineId: 'machine-1' },
    } as any;
    const res = createRes();
    await handler(req, res as any);

    expect(res.statusCode).toBe(200);
    expect(saveLicense).toHaveBeenCalledTimes(1);

    const savedArg = saveLicense.mock.calls[0]?.[0];
    expect(savedArg.machineId).toBe(hashMachineId('machine-1'));
  });

  it('verify rejects machine mismatch when license is bound', async () => {
    const { hashMachineId } = await import('../../../lib/machine-id');

    getLicense.mockResolvedValue({
      licenseKey: 'THREE-AAAA-BBBB-CCCC',
      status: 'activated',
      active: true,
      email: 'customer@example.com',
      machineId: hashMachineId('machine-1'),
      allowedCidr: '0.0.0.0/0',
      features: ['disclosure-document'],
      createdAt: '2026-01-01T00:00:00.000Z',
      activatedAt: '2026-01-01T00:00:00.000Z',
      expiresAt: null,
      issuedBy: 'admin',
      revokedAt: null,
      revokedReason: null,
    });

    const { default: handler } = await import('../verify');
    const req = {
      method: 'POST',
      body: { email: 'customer@example.com', licenseKey: 'THREE-AAAA-BBBB-CCCC', machineId: 'machine-2' },
      headers: { 'x-forwarded-for': '203.0.113.10' },
      socket: { remoteAddress: '203.0.113.10' },
    } as any;
    const res = createRes();
    await handler(req, res as any);

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ valid: false, reason: 'machine_mismatch' });
  });
});

