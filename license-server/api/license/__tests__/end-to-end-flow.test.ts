import { beforeEach, describe, expect, it, vi } from 'vitest';

type LicenseStatus = 'issued' | 'activated' | 'revoked';

interface LicenseRecord {
  licenseKey: string;
  email: string | null;
  allowedCidr: string;
  features: string[];
  createdAt: string;
  activatedAt: string | null;
  expiresAt: string | null;
  active: boolean;
  status: LicenseStatus;
  issuedBy: string | null;
  revokedAt: string | null;
  revokedReason: string | null;
}

const store = new Map<string, LicenseRecord>();

const getLicense = vi.fn(async (key: string) => store.get(key) ?? null);
const saveLicense = vi.fn(async (record: LicenseRecord) => {
  store.set(record.licenseKey, record);
});
const isIpInCidr = vi.fn(() => true);
const listLicenses = vi.fn(async ({ status, page, pageSize }: { status?: LicenseStatus; page: number; pageSize: number }) => {
  const rows = [...store.values()]
    .filter((item) => !status || item.status === status)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const start = (page - 1) * pageSize;
  return {
    items: rows.slice(start, start + pageSize),
    total: rows.length,
    page,
    pageSize,
  };
});
const revokeLicense = vi.fn(async (key: string, reason?: string) => {
  const current = store.get(key);
  if (!current) return null;
  const revoked: LicenseRecord = {
    ...current,
    status: 'revoked',
    active: false,
    revokedAt: new Date().toISOString(),
    revokedReason: reason ?? null,
  };
  store.set(key, revoked);
  return revoked;
});

const generateSerialBatch = vi.fn((count: number) =>
  Array.from({ length: count }, (_, index) => `THREE-E2E-${String(index + 1).padStart(4, '0')}-TEST`),
);

vi.mock('../../../lib/store', () => ({
  getLicense,
  saveLicense,
  isIpInCidr,
  listLicenses,
  revokeLicense,
}));

vi.mock('../../../lib/serial', () => ({
  generateSerialBatch,
}));

function makeRes() {
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

describe('license flow e2e', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    store.clear();
    process.env.LICENSE_ADMIN_TOKEN = 'admin-token';
  });

  it('supports create -> handoff -> activate -> verify -> revoke', async () => {
    const { default: createHandler } = await import('../create');
    const createReq = {
      method: 'POST',
      headers: { authorization: 'Bearer admin-token' },
      body: { count: 1, issuedBy: 'consultant' },
    } as any;
    const createRes = makeRes();
    await createHandler(createReq, createRes as any);

    expect(createRes.statusCode).toBe(201);
    const created = createRes.body as { items: Array<{ licenseKey: string }> };
    const licenseKey = created.items[0]?.licenseKey;
    expect(licenseKey).toBeDefined();

    const { default: listHandler } = await import('../list');
    const listReq = {
      method: 'GET',
      headers: { authorization: 'Bearer admin-token' },
      query: { status: 'issued', page: '1', pageSize: '20' },
    } as any;
    const listRes = makeRes();
    await listHandler(listReq, listRes as any);

    expect(listRes.statusCode).toBe(200);
    const listBody = listRes.body as { items: Array<{ licenseKey: string; status: string }> };
    expect(listBody.items.some((item) => item.licenseKey === licenseKey && item.status === 'issued')).toBe(true);

    const { default: activateHandler } = await import('../activate');
    const activateReq = {
      method: 'POST',
      body: { email: 'customer@example.com', licenseKey },
    } as any;
    const activateRes = makeRes();
    await activateHandler(activateReq, activateRes as any);
    expect(activateRes.statusCode).toBe(200);

    const { default: verifyHandler } = await import('../verify');
    const verifyReq = {
      method: 'POST',
      body: { email: 'customer@example.com', licenseKey },
      headers: { 'x-forwarded-for': '203.0.113.10' },
      socket: { remoteAddress: '203.0.113.10' },
    } as any;
    const verifyRes = makeRes();
    await verifyHandler(verifyReq, verifyRes as any);
    expect(verifyRes.statusCode).toBe(200);
    expect(verifyRes.body).toMatchObject({ valid: true });

    const { default: revokeHandler } = await import('../revoke');
    const revokeReq = {
      method: 'POST',
      headers: { authorization: 'Bearer admin-token' },
      body: { licenseKey, reason: 'refund' },
    } as any;
    const revokeRes = makeRes();
    await revokeHandler(revokeReq, revokeRes as any);
    expect(revokeRes.statusCode).toBe(200);
    expect(revokeRes.body).toMatchObject({ ok: true, status: 'revoked', revokedReason: 'refund' });

    const verifyAfterRevokeRes = makeRes();
    await verifyHandler(verifyReq, verifyAfterRevokeRes as any);
    expect(verifyAfterRevokeRes.statusCode).toBe(403);
    expect(verifyAfterRevokeRes.body).toEqual({ valid: false, reason: 'license_inactive' });
  });
});
