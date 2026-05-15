import { expect, test } from "@playwright/test";

test.describe("Theme Selector", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "aire-mock-store",
        JSON.stringify({
          sessionUser: {
            email: "admin@test.aire",
            role: "admin",
          },
        }),
      );
    });
  });

  test("顯示兩張主題卡，點選 C 主題後持久化", async ({ page }) => {
    const appBaseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3000";
    await page.goto(`${appBaseUrl}/settings/branding`);

    await expect(
      page.getByRole("heading", { name: "品牌設定" }),
    ).toBeVisible();

    const cards = page.locator('[data-testid^="theme-item-"]');
    await expect(cards).toHaveCount(2);

    const themeA = page.getByTestId("theme-item-theme-a-minimal");
    const themeC = page.getByTestId("theme-item-theme-c-tech-elegant");

    await expect(themeA).toBeVisible();
    await expect(themeC).toBeVisible();

    await themeC.click();
    await expect(themeC).toHaveAttribute("aria-selected", "true");

    const persistedThemeId = await page.evaluate(() =>
      window.localStorage.getItem("aire:theme-id"),
    );
    expect(persistedThemeId).toBe("theme-c-tech-elegant");
  });
});
