import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';

// 紅燈測試：route.ts 尚未建立，import 應該直接 fail。
// route.ts 完成後，這四個 scenario 才會逐一綠燈。
import { POST, DELETE } from '../route';

// 用低 cost (4) 加快 bcrypt hash 速度，僅為測試用途
const PASSWORD_HASH_COST = 4;
const CORRECT_PASSWORD = 'correct-password';
const WRONG_PASSWORD = 'wrong-password';
// ADMIN_SESSION_SECRET 必須夠長以滿足 HMAC-SHA256 簽章需求
const TEST_SESSION_SECRET = 'test-secret-32bytes-padding-1234567';

let CORRECT_PASSWORD_HASH: string;

// 在所有測試前先計算一次 bcrypt hash，避免每個 it 重算造成 timeout
beforeAll(async () => {
  CORRECT_PASSWORD_HASH = await bcrypt.hash(CORRECT_PASSWORD, PASSWORD_HASH_COST);
});

afterEach(() => {
  // 每個測試結束清空 stubbed env，避免互相污染
  vi.unstubAllEnvs();
});

// 工具：建立 POST request，body 為 JSON
function buildPostRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/admin/session', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// 工具：建立 DELETE request
function buildDeleteRequest(): NextRequest {
  return new NextRequest('http://localhost/api/admin/session', {
    method: 'DELETE',
  });
}

describe('POST /api/admin/session', () => {
  // -----------------------------------------------------------------
  // Scenario 1：缺 LICENSE_ADMIN_PASSWORD env → 503 admin_not_configured
  // 對應 spec: "missing env var fails closed"
  // -----------------------------------------------------------------
  it('returns 503 admin_not_configured when LICENSE_ADMIN_PASSWORD is unset', async () => {
    // 故意不設 LICENSE_ADMIN_PASSWORD；其他 env 也清空避免污染
    vi.stubEnv('LICENSE_ADMIN_PASSWORD', '');
    vi.stubEnv('ADMIN_SESSION_SECRET', TEST_SESSION_SECRET);

    const req = buildPostRequest({ password: CORRECT_PASSWORD });
    const res = await POST(req);

    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body).toEqual({ error: 'admin_not_configured' });
  });

  // -----------------------------------------------------------------
  // Scenario 2：密碼錯 → 401 invalid_password，沒 Set-Cookie
  // 對應 spec: "incorrect password is rejected"
  // -----------------------------------------------------------------
  it('returns 401 invalid_password and no Set-Cookie when password is wrong', async () => {
    vi.stubEnv('LICENSE_ADMIN_PASSWORD', CORRECT_PASSWORD_HASH);
    vi.stubEnv('ADMIN_SESSION_SECRET', TEST_SESSION_SECRET);

    const req = buildPostRequest({ password: WRONG_PASSWORD });
    const res = await POST(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: 'invalid_password' });

    // 401 時不可下發 cookie
    expect(res.headers.get('set-cookie')).toBeNull();
  });

  // -----------------------------------------------------------------
  // Scenario 3：密碼對 → 200 { ok: true } + Set-Cookie 含 admin_session= / HttpOnly / Max-Age=43200
  // 對應 spec: "correct password is accepted"
  // -----------------------------------------------------------------
  it('returns 200 ok=true and sets admin_session cookie when password is correct', async () => {
    vi.stubEnv('LICENSE_ADMIN_PASSWORD', CORRECT_PASSWORD_HASH);
    vi.stubEnv('ADMIN_SESSION_SECRET', TEST_SESSION_SECRET);

    const req = buildPostRequest({ password: CORRECT_PASSWORD });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });

    // Set-Cookie 必須存在，且包含必要屬性
    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).not.toBeNull();
    expect(setCookie).toContain('admin_session=');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('Max-Age=43200');
  });
});

describe('DELETE /api/admin/session', () => {
  // -----------------------------------------------------------------
  // Scenario 4：DELETE → 200 ok=true，Set-Cookie 含 admin_session= 與 Max-Age=0
  // 對應 spec: "logout removes the cookie"
  // -----------------------------------------------------------------
  it('returns 200 ok=true and clears admin_session cookie', async () => {
    // DELETE 不需密碼驗證，但仍需 ADMIN_SESSION_SECRET 才能維持 module 一致性
    vi.stubEnv('ADMIN_SESSION_SECRET', TEST_SESSION_SECRET);

    const req = buildDeleteRequest();
    const res = await DELETE(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });

    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).not.toBeNull();
    expect(setCookie).toContain('admin_session=');
    expect(setCookie).toContain('Max-Age=0');
  });
});
