import { expect, test } from "@playwright/test";

const STORAGE_KEY = "aire-mock-store";

test.describe("desktop auth credential fulfillment smoke", () => {
  test("bootstrap login persists device session and logout clears it", async ({ page }) => {
    await page.goto("/login");

    await page.getByPlaceholder("Email").fill("admin@test.aire");
    await page.getByPlaceholder("一次性桌面登入碼（可選）").fill("OTC-ADMIN-2026");
    await page.getByRole("button", { name: "使用一次性登入碼" }).click();

    await expect(page).toHaveURL(/\/cases\/new$/);

    const activeSession = await page.evaluate((storageKey) => {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { deviceSession?: { status?: string } };
      return parsed.deviceSession?.status ?? null;
    }, STORAGE_KEY);
    expect(activeSession).toBe("active");

    await page.reload();
    await expect(page).toHaveURL(/\/cases\/new$/);

    await page.goto("/settings?section=plans");
    await expect(page.getByText("本機 AIRE 桌面 App（已登入）")).toBeVisible();

    await page.getByRole("button", { name: "登出" }).click();
    await expect(page).toHaveURL(/\/login$/);

    const missingSession = await page.evaluate((storageKey) => {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { deviceSession?: { status?: string } };
      return parsed.deviceSession?.status ?? null;
    }, STORAGE_KEY);
    expect(missingSession).toBe("missing");
  });
});
