import { expect, test } from '@playwright/test';

const OUT = '/tmp';

test('忘記密碼流程截圖驗證', async ({ page }) => {
  await page.route('**/api/auth/forgot-password', async (route) => {
    const body = route.request().postDataJSON() as { email?: string };
    expect(body.email).toBe('agent@realty.com');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: '如果帳號存在，重設連結已發送至您的信箱' }),
    });
  });

  await page.goto('/login', { waitUntil: 'networkidle' });
  await expect(page.getByRole('link', { name: '忘記密碼' })).toBeVisible();
  await page.screenshot({ path: `${OUT}/forgot-1-login.png`, fullPage: true });

  await page.getByRole('link', { name: '忘記密碼' }).click();
  await page.waitForURL('**/forgot-password');
  await expect(page.getByRole('heading', { name: '忘記密碼' })).toBeVisible();
  await page.screenshot({ path: `${OUT}/forgot-2-forgot-page.png`, fullPage: true });

  await page.getByPlaceholder('請輸入 Email').fill('agent@realty.com');
  await page.getByRole('button', { name: '送出重設連結' }).click();
  await expect(page.getByText('如果帳號存在，重設連結已發送至您的信箱')).toBeVisible();
  await page.screenshot({ path: `${OUT}/forgot-3-forgot-success.png`, fullPage: true });

  await page.goto('/reset-password?token=test-token', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: '重設密碼' })).toBeVisible();
  await page.screenshot({ path: `${OUT}/forgot-4-reset-page.png`, fullPage: true });

  await page.getByPlaceholder('請輸入新密碼').fill('new-pass-123');
  await page.getByPlaceholder('請再次輸入新密碼').fill('new-pass-124');
  await page.getByRole('button', { name: '重設密碼' }).click();
  await expect(page.getByText('兩次密碼不一致')).toBeVisible();
  await page.screenshot({ path: `${OUT}/forgot-5-reset-mismatch.png`, fullPage: true });

  await page.route('**/api/auth/reset-password', async (route) => {
    const body = route.request().postDataJSON() as { token?: string; password?: string };
    expect(body.token).toBe('test-token');
    expect(body.password).toBe('new-pass-123');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: '密碼已重設，請重新登入' }),
    });
  });

  await page.getByPlaceholder('請輸入新密碼').fill('new-pass-123');
  await page.getByPlaceholder('請再次輸入新密碼').fill('new-pass-123');
  await page.getByRole('button', { name: '重設密碼' }).click();
  await expect(page.getByText('密碼已重設，3 秒後將導向登入頁')).toBeVisible();
  await page.screenshot({ path: `${OUT}/forgot-6-reset-success.png`, fullPage: true });

  await page.waitForURL('**/login', { timeout: 5000 });
  await page.screenshot({ path: `${OUT}/forgot-7-back-to-login.png`, fullPage: true });
});
