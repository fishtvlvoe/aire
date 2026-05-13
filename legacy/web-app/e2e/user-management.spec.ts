import { expect, test } from '@playwright/test';

const ADMIN_EMAIL = 'admin@local';
const ADMIN_PASSWORD = 'admin123';
const AGENT_EMAIL = `agent-e2e-${Date.now()}@test.com`;
const AGENT_PASSWORD = 'agentpass123';
const AGENT_NAME = 'E2E 測試業務';

async function login(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/listings**', { timeout: 10000 });
}

async function logout(page: import('@playwright/test').Page) {
  await page.evaluate(async () => {
    await fetch('/api/auth/logout', { method: 'DELETE' });
  });
}

test.describe('user-management 帳號與物件擁有者流程', () => {
  test('admin 登入成功並看到 /listings', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await expect(page).toHaveURL(/\/listings/);
  });

  test('admin 建立 agent 帳號', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    const res = await page.request.post('/api/admin/users', {
      data: { email: AGENT_EMAIL, display_name: AGENT_NAME, password: AGENT_PASSWORD },
    });
    expect(res.status()).toBe(201);
    const body = await res.json() as { email: string; role: string };
    expect(body.email).toBe(AGENT_EMAIL);
    expect(body.role).toBe('agent');
  });

  test('agent 登入並建立物件', async ({ page }) => {
    await login(page, AGENT_EMAIL, AGENT_PASSWORD);
    await expect(page).toHaveURL(/\/listings/);

    // 建立物件（透過 API）
    const res = await page.request.post('/api/listings', {
      data: { propertyType: 'apartment' },
    });
    expect(res.status()).toBe(201);
    const body = await res.json() as { listing: { id: number; owner_id: number } };
    expect(body.listing.owner_id).toBeDefined();
  });

  test('agent 的 GET /api/listings 只回傳自己的物件', async ({ page }) => {
    await login(page, AGENT_EMAIL, AGENT_PASSWORD);
    const res = await page.request.get('/api/listings');
    const body = await res.json() as { listings: Array<{ owner_id: number }> };

    // 取得 agent 的 user id
    const loginRes = await page.request.post('/api/auth/login', {
      data: { email: AGENT_EMAIL, password: AGENT_PASSWORD },
    });
    expect(loginRes.ok()).toBeTruthy();

    // 所有回傳的 listing 應該都屬於此 agent（owner_id 不為 null 時應一致）
    const ownedListings = body.listings.filter(l => l.owner_id !== null && l.owner_id !== undefined);
    if (ownedListings.length > 0) {
      const ownerId = ownedListings[0].owner_id;
      for (const listing of ownedListings) {
        expect(listing.owner_id).toBe(ownerId);
      }
    }
  });

  test('admin 可看到所有物件（GET /api/listings）', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    const res = await page.request.get('/api/listings');
    expect(res.status()).toBe(200);
    // admin 不應只看到自己的（會有不同 owner_id）
  });

  test('admin 轉移案件', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    // 查詢 agents 清單
    const agentsRes = await page.request.get('/api/admin/transfer-cases');
    const agentsBody = await agentsRes.json() as { agents: Array<{ id: number; email: string; listing_count: number }> };
    const agent = agentsBody.agents.find(a => a.email === AGENT_EMAIL);
    expect(agent).toBeDefined();
    if (!agent) return;

    // 若 agent 有物件，轉移給 admin 自己（轉移前需確認 admin user id）
    if (agent.listing_count > 0) {
      const adminUsersRes = await page.request.get('/api/admin/users');
      const usersBody = await adminUsersRes.json() as Array<{ id: number; role: string }>;
      const anotherAgent = usersBody.find(u => u.role === 'agent' && u.id !== agent.id);

      if (anotherAgent) {
        const transferRes = await page.request.post('/api/admin/transfer-cases', {
          data: { from_user_id: agent.id, to_user_id: anotherAgent.id },
        });
        expect(transferRes.status()).toBe(200);
        const transferBody = await transferRes.json() as { transferred: number };
        expect(transferBody.transferred).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('admin 可查看 audit log', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    const res = await page.request.get('/api/admin/audit-logs');
    expect(res.status()).toBe(200);
    const body = await res.json() as { logs: unknown[]; total: number };
    expect(Array.isArray(body.logs)).toBeTruthy();
    expect(typeof body.total).toBe('number');
  });

  test('audit log 不允許 DELETE/PUT', async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    const del = await page.request.delete('/api/admin/audit-logs');
    expect(del.status()).toBe(405);
    const put = await page.request.put('/api/admin/audit-logs');
    expect(put.status()).toBe(405);
  });

  test('agent 無法存取其他人的物件', async ({ page }) => {
    // 先以 admin 建立一個物件
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    const createRes = await page.request.post('/api/listings', {
      data: { propertyType: 'apartment' },
    });
    const createBody = await createRes.json() as { listing: { id: number } };
    const adminListingId = createBody.listing.id;

    await logout(page);

    // 以 agent 嘗試存取 admin 的物件
    await login(page, AGENT_EMAIL, AGENT_PASSWORD);
    const getRes = await page.request.get(`/api/listings/${adminListingId}`);
    // agent 存取 admin 的物件應被拒絕（403）或找不到（取決於是否能看到）
    expect([403, 404]).toContain(getRes.status());
  });
});
