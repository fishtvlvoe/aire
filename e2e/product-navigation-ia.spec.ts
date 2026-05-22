import { expect, test, type Page } from "@playwright/test";

const CASE_ID = "33333333-3333-4333-8333-333333333333";

test.use({ baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000" });

test.beforeEach(async ({ page }) => {
  await seedCase(page);
});

test("primary and secondary navigation change the visible case-management scope", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/cases");

  const main = page.getByRole("main");
  const sidebar = page.getByRole("navigation", { name: "主要選單" });

  await expect(sidebar.getByRole("link", { name: "案件總覽" })).toBeVisible();
  await expect(sidebar.getByRole("link", { name: "說明書工作台" })).toBeVisible();
  await expect(sidebar.getByRole("link", { name: "補件清單" })).toBeVisible();
  await expect(main.getByRole("heading", { name: "案件總覽" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "案件分類" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /開啟.*工作台/ })).toHaveCount(0);
  await expect(page.getByText("現場必問工作台")).toHaveCount(0);

  await sidebar.getByRole("link", { name: "說明書工作台" }).click();
  await expect(page).toHaveURL(/\/cases\?view=workbench$/);
  await expect(main.getByRole("heading", { name: "說明書工作台" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "請先選擇案件" })).toBeVisible();
  await expect(page.getByText("全部案件")).toHaveCount(0);

  await sidebar.getByRole("link", { name: "補件清單" }).click();
  await expect(page).toHaveURL(/\/cases\?view=supplements$/);
  await expect(main.getByRole("heading", { name: "補件清單" })).toBeVisible();
  await expect(page.getByText("只顯示目前需要補資料的案件")).toBeVisible();
  await expect(page.getByText("全部案件")).toHaveCount(0);
});

test("case row enters the selected case and exposes case-level workbench tools", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/cases");

  await page.locator('article[role="link"]').filter({ hasText: "和平東路案" }).click();
  await expect(page).toHaveURL(new RegExp(`/cases/${CASE_ID}$`));
  await expect(page.getByRole("heading", { name: "說明書工作台" })).toBeVisible();
  await expect(page.getByRole("region", { name: "案件與章節" })).toBeVisible();
  await expect(page.getByRole("button", { name: "現場必問" }).first()).toBeVisible();
});

for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 768, height: 900 },
]) {
  test(`navigation layout has no duplicated same-name page tabs at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/cases");

    await expect(page.getByRole("main").getByRole("heading", { name: "案件總覽" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "案件分類" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "案件總覽" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "說明書工作台" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "補件清單" })).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
    await page.screenshot({
      path: `e2e/results/navigation-ia/cases-overview-${viewport.width}.png`,
      fullPage: true,
    });
  });
}

async function seedCase(page: Page) {
  await page.addInitScript((caseId) => {
    window.localStorage.setItem(
      "aire-mock-store",
      JSON.stringify({
        sessionUser: { email: "admin@test.aire", role: "admin" },
        featureFlags: [
          { id: "land-registry-api", name: "地政 API", enabled: true },
          { id: "premium_real_price_enabled", name: "實價登錄", enabled: false },
        ],
        cases: [
          {
            id: caseId,
            case_no: "AIRE-2026-IA",
            case_name: "和平東路案",
            property_type: "residential",
            land_lot_no: "大安段 100-1",
            land_lots: ["大安段 100-1"],
            building_lot_no: "建號 100",
            address: "台北市大安區和平東路一段 100 號",
            owner_name: null,
            land_registry_data: null,
            current_step: 1,
            status: "draft",
            asking_price: null,
            created_at: 1763200000,
            updated_at: 1763200000,
          },
        ],
      }),
    );
  }, CASE_ID);
}

async function expectNoHorizontalOverflow(page: Page) {
  const hasNoOverflow = await page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth <= root.clientWidth + 1;
  });
  expect(hasNoOverflow).toBe(true);
}
