import { expect, test, type Page } from "@playwright/test";

const CASE_ID = "22222222-2222-4222-8222-222222222222";

test.use({ baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000" });

test.beforeEach(async ({ page }) => {
  await seedProductData(page);
});

test("admin test account can login and use the aligned frontstage and backoffice flows", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await login(page, "admin@test.aire", "password");
  await preserveSessionForFutureNavigations(page, "admin");

  await expect(page).toHaveURL(/\/cases\/new$/);
  await page.goto("/cases");
  await expect(page.getByRole("main").getByRole("heading", { name: "案件總覽" })).toBeVisible();
  await expect(page.getByText("宜蘭五結農舍")).toBeVisible();
  await expect(page.getByRole("button", { name: "開啟宜蘭五結農舍工作台" })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "主要選單" })).toBeVisible();

  await page.getByText("宜蘭五結農舍").click();
  await expect(page).toHaveURL(new RegExp(`/cases/_\\?caseId=${CASE_ID}$`));
  await expect(page.getByTestId("demo-aligned-workbench")).toBeVisible();
  await expect(page.getByRole("region", { name: "物件摘要" })).toBeVisible();
  await expect(page.getByRole("region", { name: "欄位審核" })).toBeVisible();
  await page.getByRole("tab", { name: "補件/現場" }).click();
  await expect(page.getByRole("region", { name: "補件與現場確認" })).toBeVisible();
  await expect(page.getByText("MOI_API_")).toHaveCount(0);
  await expect(page.getByText("COP309")).toHaveCount(0);
  await expectCustomerFacingTextClean(page);
  await expectNoHorizontalOverflow(page);

  await page.goto("/settings?section=billing");
  await expect(page.getByRole("heading", { name: "費用紀錄" })).toBeVisible();
  await expect(page.getByText("費用歸屬")).toBeVisible();
  await expect(page.getByRole("heading", { name: "地政查詢明細" })).toBeVisible();
  await expect(page.getByText("授權管理")).toHaveCount(0);
  await expect(page.getByText("地政 API 設定")).toHaveCount(0);
  await expect(page.getByText("實價登錄 MCP Hub")).toHaveCount(0);
  await expectCustomerFacingTextClean(page);

  await page.goto("/settings?section=plans");
  await expect(page.getByRole("heading", { name: "方案與升級" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "基本款" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "預留功能" })).toBeVisible();
  await expect(page.getByText("測試版已開啟")).toHaveCount(0);
  await expect(page.getByText(/正式版歸在/)).toHaveCount(0);
  await expect(page.getByRole("switch", { name: "Google 地圖未啟用" })).toBeEnabled();
  await expect(page.getByRole("switch", { name: "實價登錄未啟用" })).toBeEnabled();

  await page.goto("/cases/new");
  await expect(page.getByLabel("地址 *")).toBeVisible();
  await expect(page.getByLabel("物件類型")).toHaveCount(0);
  await page.getByLabel("地址 *").fill("宜蘭縣五結鄉協和村親河路二段 1 號");
  await page.getByRole("button", { name: "查詢物件資料", exact: true }).click();
  await expect(page.getByText("已找到 1 筆土地、1 筆建物")).toBeVisible();
  await expectCustomerFacingTextClean(page);

  await page.getByRole("button", { name: "登出" }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test("non-admin test account can login without receiving admin-only upgrade state", async ({ page }) => {
  await login(page, "user@test.aire", "password");

  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "個人設定" })).toBeVisible();
  await expect(page.getByText("已啟用（管理員）")).toHaveCount(0);
  await page.goto("/settings?section=plans");
  await expect(page.getByRole("button", { name: "前往升級" })).toHaveCount(2);
  const switches = page.getByRole("switch");
  await expect(switches).toHaveCount(6);
  for (let index = 0; index < 6; index += 1) {
    await expect(switches.nth(index)).toBeDisabled();
    await expect(switches.nth(index)).toHaveAttribute("aria-checked", "false");
  }
});

test("login errors stay user-readable for invalid and expired test accounts", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("Email").fill("wrong@example.com");
  await page.getByPlaceholder("密碼").fill("wrong");
  await page.getByRole("button", { name: "登入" }).click();
  await expect(page.getByText("帳號或密碼錯誤")).toBeVisible();

  await page.getByPlaceholder("Email").fill("expired@test.aire");
  await page.getByPlaceholder("密碼").fill("password");
  await page.getByRole("button", { name: "登入" }).click();
  await expect(page.getByText("帳號已過期")).toBeVisible();
});

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("密碼").fill(password);
  await page.getByRole("button", { name: "登入" }).click();
}

async function preserveSessionForFutureNavigations(page: Page, role: "admin" | "user") {
  await page.addInitScript((nextRole) => {
    const raw = window.localStorage.getItem("aire-mock-store");
    const state = raw ? JSON.parse(raw) : {};
    state.sessionUser = { email: `${nextRole}@test.aire`, role: nextRole };
    window.localStorage.setItem("aire-mock-store", JSON.stringify(state));
  }, role);
}

async function seedProductData(page: Page) {
  await page.addInitScript((caseId) => {
    window.localStorage.setItem(
      "aire-mock-store",
      JSON.stringify({
        sessionUser: null,
        featureFlags: [
          { id: "land-registry-api", name: "地政 API", enabled: true },
          { id: "premium_real_price_enabled", name: "實價登錄", enabled: false },
        ],
        appSettings: {
          landApi: { clientId: "", secret: "" },
          premium: { subscribed: false, plan: null, expiresAt: null },
          premiumUnlocked: false,
        },
        cases: [
          {
            id: caseId,
            case_no: "AIRE-2026-LOGIN",
            case_name: "宜蘭五結農舍",
            property_type: "residential",
            land_lot_no: "五結段 123-1",
            land_lots: ["五結段 123-1", "五結段 123-2"],
            building_lot_no: "建號 88-1",
            address: "宜蘭縣五結鄉協和村親河路二段 1 號",
            owner_name: "陳小美",
            land_registry_data: {
              building_registry: { data: { construction_date: "083/10/18" } },
              building_ownership: { data: { numerator: 1, denominator: 1 } },
            },
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

async function expectCustomerFacingTextClean(page: Page) {
  const text = await page.locator("main").last().textContent();
  expect(text ?? "").not.toMatch(/\b(R02|COP|API|Helper|adapter|parser|payload|JSON)\b|便民系統/);
}
