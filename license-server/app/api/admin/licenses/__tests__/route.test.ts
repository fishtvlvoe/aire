import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import type { LicenseRecord } from '../../../../../lib/store';
import { normalizeLicenseRecord } from '../../../../../lib/store';

// -------------------------------------------------------------------
// 紅燈測試說明
// -------------------------------------------------------------------
// 以下 import 對應 6 個尚未實作的 admin proxy route handler。
// 因為 4 個 route.ts 檔案都不存在，這些 import 會在模組載入時直接 fail，
// 全部 14 個 scenario 都會紅燈。等實作完成後才會逐一綠燈。
//
// 結構安排：
//   /admin/licenses/route.ts                (GET list / POST create)
//   /admin/licenses/revoke/route.ts         (POST)
//   /admin/licenses/transfer/route.ts       (POST)
//   /admin/licenses/update-info/route.ts    (PATCH)
//   /admin/licenses/unbind-machine/route.ts (POST)
// -------------------------------------------------------------------
import { GET as listGET, POST as createPOST } from '../route';
import { POST as revokePOST } from '../revoke/route';
import { POST as transferPOST } from '../transfer/route';
import { PATCH as updateInfoPATCH } from '../update-info/route';
import { POST as unbindPOST } from '../unbind-machine/route';

// -------------------------------------------------------------------
// In-memory KV mock：用 Map 模擬 @vercel/kv 行為，避免打到線上 KV
// -------------------------------------------------------------------
const kvStore = new Map<string, unknown>();

vi.mock('@vercel/kv', () => ({
  kv: {
    get: async (key: string) => kvStore.get(key) ?? null,
    set: async (key: string, value: unknown) => {
      kvStore.set(key, value);
    },
    keys: async (pattern: string) => {
      // 將 glob `*` 轉成正則 `.*` 比對
      const re = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return Array.from(kvStore.keys()).filter((k) => re.test(k));
    },
    del: async (key: string) => {
      kvStore.delete(key);
    },
  },
}));

// -------------------------------------------------------------------
// 測試用 fixture：建立 license 並寫入 in-memory KV
// 直接寫到 kvStore 不經 saveLicense，避免依賴尚未確定的 module 載入順序
// -------------------------------------------------------------------
function seedLicense(partial: Partial<LicenseRecord> & { licenseKey: string }): LicenseRecord {
  const record = normalizeLicenseRecord(partial);
  kvStore.set(`license:${record.licenseKey}`, record);
  if (record.email) {
    kvStore.set(`email-index:${record.email.toLowerCase()}`, record.licenseKey);
  }
  return record;
}

// 工具：構造各種 NextRequest
function buildGetRequest(query: string = ''): NextRequest {
  return new NextRequest(`http://localhost/api/admin/licenses${query ? `?${query}` : ''}`, {
    method: 'GET',
  });
}

function buildJsonRequest(
  url: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  body: unknown,
): NextRequest {
  return new NextRequest(`http://localhost${url}`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  // 每個 it 開始時清空 KV，避免 fixture 污染
  kvStore.clear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

// ===================================================================
// Admin proxy list endpoint - GET /api/admin/licenses
// ===================================================================
describe('GET /api/admin/licenses (list endpoint)', () => {
  // -----------------------------------------------------------------
  // Scenario 1：list licenses with cookie session → 200 正確 shape
  // 對應 spec: "list licenses with cookie session"
  // -----------------------------------------------------------------
  it('returns 200 with paginated payload including index field', async () => {
    seedLicense({
      licenseKey: 'THREE-AAAA-BBBB-CCCC',
      contactName: 'Alice',
      company: 'Foo Co.',
      email: 'alice@foo.com',
      status: 'activated',
    });

    const req = buildGetRequest('page=1&pageSize=20');
    const res = await listGET(req);

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body).toMatchObject({
      total: 1,
      page: 1,
      pageSize: 20,
    });
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items).toHaveLength(1);

    // 每個 item 必須包含 index 與 spec 列舉的所有欄位
    const item = body.items[0];
    expect(item).toEqual(
      expect.objectContaining({
        index: expect.any(Number),
        licenseKey: 'THREE-AAAA-BBBB-CCCC',
        status: expect.any(String),
        email: expect.anything(),
        contactName: expect.anything(),
        company: expect.anything(),
        machineId: null,
        createdAt: expect.any(String),
        activatedAt: expect.anything(),
        expiresAt: null,
        features: expect.any(Array),
      }),
    );
  });

  // -----------------------------------------------------------------
  // Scenario 2：pageSize=0 → 400 invalid_pagination
  // 對應 spec: "pagination boundary"
  // -----------------------------------------------------------------
  it('returns 400 invalid_pagination when pageSize=0', async () => {
    const req = buildGetRequest('page=1&pageSize=0');
    const res = await listGET(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: 'invalid_pagination' });
  });

  // -----------------------------------------------------------------
  // Scenario 3：pageSize=101 → 400 invalid_pagination
  // 對應 spec: "pagination boundary"
  // -----------------------------------------------------------------
  it('returns 400 invalid_pagination when pageSize=101', async () => {
    const req = buildGetRequest('page=1&pageSize=101');
    const res = await listGET(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: 'invalid_pagination' });
  });

  // -----------------------------------------------------------------
  // Scenario 4：status=invalid → 400 invalid_status
  // 對應 spec: query parameter validation table
  // -----------------------------------------------------------------
  it('returns 400 invalid_status when status is not a valid LicenseStatus', async () => {
    const req = buildGetRequest('page=1&pageSize=20&status=invalid');
    const res = await listGET(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: 'invalid_status' });
  });

  // -----------------------------------------------------------------
  // Scenario 5：search=fish 過濾結果（種 3 筆，僅 1 筆匹配）
  // 對應 spec: "search=fish&page=1&pageSize=20" → filtered by haystack match
  // -----------------------------------------------------------------
  it('filters items by search query against haystack (contactName)', async () => {
    seedLicense({
      licenseKey: 'THREE-AAAA-1111-1111',
      contactName: 'Fish',
      company: 'Acme',
      email: 'fish@acme.com',
      status: 'activated',
    });
    seedLicense({
      licenseKey: 'THREE-BBBB-2222-2222',
      contactName: 'Alice',
      company: 'Foo',
      email: 'alice@foo.com',
      status: 'activated',
    });
    seedLicense({
      licenseKey: 'THREE-CCCC-3333-3333',
      contactName: 'Bob',
      company: 'Bar',
      email: 'bob@bar.com',
      status: 'issued',
    });

    const req = buildGetRequest('page=1&pageSize=20&search=fish');
    const res = await listGET(req);

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.total).toBe(1);
    expect(body.items).toHaveLength(1);
    expect(body.items[0].contactName).toBe('Fish');
  });
});

// ===================================================================
// Admin proxy create endpoint - POST /api/admin/licenses
// ===================================================================
describe('POST /api/admin/licenses (create endpoint)', () => {
  // -----------------------------------------------------------------
  // Scenario 6：count=3 → 200，items.length=3，每個 licenseKey unique，KV 有寫入
  // 對應 spec: "create batch of licenses"
  // -----------------------------------------------------------------
  it('creates a batch of 3 licenses with unique keys persisted to KV', async () => {
    const req = buildJsonRequest('/api/admin/licenses', 'POST', {
      count: 3,
      expiresAt: null,
      issuedBy: 'fish',
      features: ['disclosure-document'],
    });
    const res = await createPOST(req);

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(Array.isArray(body.items)).toBe(true);
    expect(body.items).toHaveLength(3);

    // 每個 licenseKey 須 unique
    const keys = body.items.map((i: { licenseKey: string }) => i.licenseKey);
    expect(new Set(keys).size).toBe(3);

    // 每個 item 應該帶 status='issued'、createdAt、expiresAt、features
    for (const item of body.items) {
      expect(item).toEqual(
        expect.objectContaining({
          licenseKey: expect.any(String),
          status: 'issued',
          createdAt: expect.any(String),
          features: ['disclosure-document'],
        }),
      );
      expect(item.expiresAt).toBeNull();
    }

    // KV 必須有對應的 license:<key> 紀錄
    for (const k of keys) {
      expect(kvStore.has(`license:${k}`)).toBe(true);
    }
  });

  // -----------------------------------------------------------------
  // Scenario 7：count=0 → 400 invalid_count
  // 對應 spec: "count boundary"
  // -----------------------------------------------------------------
  it('returns 400 invalid_count when count=0', async () => {
    const req = buildJsonRequest('/api/admin/licenses', 'POST', {
      count: 0,
      expiresAt: null,
      issuedBy: 'fish',
      features: ['disclosure-document'],
    });
    const res = await createPOST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: 'invalid_count' });
  });

  // -----------------------------------------------------------------
  // Scenario 8：count=101 → 400 invalid_count
  // 對應 spec: "count boundary"
  // -----------------------------------------------------------------
  it('returns 400 invalid_count when count=101', async () => {
    const req = buildJsonRequest('/api/admin/licenses', 'POST', {
      count: 101,
      expiresAt: null,
      issuedBy: 'fish',
      features: ['disclosure-document'],
    });
    const res = await createPOST(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: 'invalid_count' });
  });
});

// ===================================================================
// Admin proxy revoke endpoint - POST /api/admin/licenses/revoke
// ===================================================================
describe('POST /api/admin/licenses/revoke', () => {
  // -----------------------------------------------------------------
  // Scenario 9：revoke active license → 200，KV revoked + revokedAt + revokedReason='client churn'
  // 對應 spec: "revoke an active license"
  // -----------------------------------------------------------------
  it('revokes an active license and updates KV with reason and timestamp', async () => {
    const target = seedLicense({
      licenseKey: 'THREE-RVOK-1111-2222',
      email: 'live@example.com',
      contactName: 'Live User',
      status: 'activated',
    });

    // 確認種好時是 activated
    expect(target.status).toBe('activated');

    const req = buildJsonRequest('/api/admin/licenses/revoke', 'POST', {
      licenseKey: target.licenseKey,
      reason: 'client churn',
    });
    const res = await revokePOST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });

    // KV 紀錄要變 revoked + revokedAt set + revokedReason='client churn'
    const stored = kvStore.get(`license:${target.licenseKey}`) as LicenseRecord | undefined;
    expect(stored).toBeDefined();
    expect(stored!.status).toBe('revoked');
    expect(stored!.active).toBe(false);
    expect(stored!.revokedAt).toEqual(expect.any(String));
    expect(stored!.revokedReason).toBe('client churn');
  });

  // -----------------------------------------------------------------
  // Scenario 10：revoke unknown license → 404 not_found
  // 對應 spec: "revoke unknown license"
  // -----------------------------------------------------------------
  it('returns 404 not_found when license does not exist', async () => {
    const req = buildJsonRequest('/api/admin/licenses/revoke', 'POST', {
      licenseKey: 'NOT_EXIST',
    });
    const res = await revokePOST(req);

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({ error: 'not_found' });
  });
});

// ===================================================================
// Admin proxy transfer endpoint - POST /api/admin/licenses/transfer
// ===================================================================
describe('POST /api/admin/licenses/transfer', () => {
  // -----------------------------------------------------------------
  // Scenario 11：transfer 到新公司 → 200 含 newLicenseKey；舊變 revoked、新存在 + contact 對
  // 對應 spec: "transfer to new company"
  // -----------------------------------------------------------------
  it('revokes old license and issues a new one with new contact info', async () => {
    const old = seedLicense({
      licenseKey: 'THREE-OLD0-0000-0000',
      email: 'old@old.com',
      contactName: 'Old User',
      company: 'Old Corp',
      status: 'activated',
    });

    const req = buildJsonRequest('/api/admin/licenses/transfer', 'POST', {
      licenseKey: old.licenseKey,
      newContactName: 'Mary',
      newCompany: 'Acme Inc.',
      newEmail: 'mary@acme.com',
      reason: 'company sold',
    });
    const res = await transferPOST(req);

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.ok).toBe(true);
    expect(typeof body.newLicenseKey).toBe('string');
    expect(body.newLicenseKey).not.toBe(old.licenseKey);

    // 舊 license 變 revoked
    const oldStored = kvStore.get(`license:${old.licenseKey}`) as LicenseRecord | undefined;
    expect(oldStored).toBeDefined();
    expect(oldStored!.status).toBe('revoked');

    // 新 license 存在，contact 資訊正確；status 應為 issued
    const newStored = kvStore.get(`license:${body.newLicenseKey}`) as LicenseRecord | undefined;
    expect(newStored).toBeDefined();
    expect(newStored!.status).toBe('issued');
    expect(newStored!.contactName).toBe('Mary');
    expect(newStored!.company).toBe('Acme Inc.');
    expect(newStored!.email).toBe('mary@acme.com');
  });
});

// ===================================================================
// Admin proxy update-info endpoint - PATCH /api/admin/licenses/update-info
// ===================================================================
describe('PATCH /api/admin/licenses/update-info', () => {
  // -----------------------------------------------------------------
  // Scenario 12：update contactName → 200 + KV 改了
  // 對應 spec: "update contact name"
  // -----------------------------------------------------------------
  it('updates contactName and persists change to KV', async () => {
    const target = seedLicense({
      licenseKey: 'THREE-UPDT-0000-1111',
      email: 'before@example.com',
      contactName: 'Before',
      company: 'Before Corp',
      status: 'activated',
    });

    const req = buildJsonRequest('/api/admin/licenses/update-info', 'PATCH', {
      licenseKey: target.licenseKey,
      field: 'contactName',
      value: 'John',
    });
    const res = await updateInfoPATCH(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    // 回應應該包含更新後的 license record
    expect(body).toEqual(
      expect.objectContaining({
        licenseKey: target.licenseKey,
        contactName: 'John',
      }),
    );

    // KV 紀錄應反映變更
    const stored = kvStore.get(`license:${target.licenseKey}`) as LicenseRecord | undefined;
    expect(stored).toBeDefined();
    expect(stored!.contactName).toBe('John');
  });

  // -----------------------------------------------------------------
  // Scenario 13：invalid field='machineId' → 400 invalid_field
  // 對應 spec: "invalid field is rejected"
  // -----------------------------------------------------------------
  it('returns 400 invalid_field when trying to update machineId', async () => {
    seedLicense({
      licenseKey: 'THREE-UPDT-0000-2222',
      status: 'activated',
    });

    const req = buildJsonRequest('/api/admin/licenses/update-info', 'PATCH', {
      licenseKey: 'THREE-UPDT-0000-2222',
      field: 'machineId',
      value: 'should-not-allow',
    });
    const res = await updateInfoPATCH(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: 'invalid_field' });
  });
});

// ===================================================================
// Admin proxy unbind-machine endpoint - POST /api/admin/licenses/unbind-machine
// ===================================================================
describe('POST /api/admin/licenses/unbind-machine', () => {
  // -----------------------------------------------------------------
  // Scenario 14：unbind a license with machineId → 200，KV machineId 變 null
  // 對應 spec: "unbind machine id"
  // -----------------------------------------------------------------
  it('clears machineId on the license and persists to KV', async () => {
    const target = seedLicense({
      licenseKey: 'THREE-UNBD-1234-5678',
      email: 'bound@example.com',
      machineId: 'sha256-of-machine-id-hash',
      status: 'activated',
    });

    // 種好的初始狀態應有 machineId
    expect(target.machineId).toBe('sha256-of-machine-id-hash');

    const req = buildJsonRequest('/api/admin/licenses/unbind-machine', 'POST', {
      licenseKey: target.licenseKey,
    });
    const res = await unbindPOST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });

    // KV machineId 應變 null
    const stored = kvStore.get(`license:${target.licenseKey}`) as LicenseRecord | undefined;
    expect(stored).toBeDefined();
    expect(stored!.machineId).toBeNull();
  });
});
