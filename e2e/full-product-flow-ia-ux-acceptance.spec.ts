import { expect, test, type Page } from "@playwright/test";

const CASE_ID = "44444444-4444-4444-8444-444444444444";

test.use({ baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000" });

test.beforeEach(async ({ page }) => {
  await seedCase(page);
});

test("customer-visible flow has unique pages and no duplicate same-scope controls", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/cases");

  const sidebar = page.getByRole("navigation", { name: "主要選單" });
  await expect(sidebar.getByRole("link", { name: "新增案件" })).toBeVisible();
  await expect(sidebar.getByRole("link", { name: "地政查詢" })).toHaveCount(0);

  await sidebar.getByRole("link", { name: "新增案件" }).click();
  await expect(page).toHaveURL(/\/cases\/new$/);
  await expect(page.getByRole("heading", { name: "新增案件" })).toBeVisible();

  await page.getByLabel("地址 *").fill("台南市永康區勝利街58巷4號1樓");
  await page.getByRole("button", { name: "先判斷地政資料" }).click();
  await expect(page.getByText("建立失敗：請先按「判斷地政資料」確認土地或建物資料，再建立案件。")).toBeVisible();

  await page.getByRole("button", { name: "判斷地政資料", exact: true }).click();
  await expect(page.getByText("判斷結果").locator("..")).toContainText("建物");
  await expect(page.getByText("判斷結果").locator("..")).not.toContainText("農地");
  await expect(page.getByText("判斷結果").locator("..")).not.toContainText("農舍");

  await sidebar.getByRole("link", { name: "案件總覽" }).click();
  await expect(page).toHaveURL(/\/cases$/);
  await expect(page.getByRole("main").getByRole("heading", { name: "案件總覽" })).toBeVisible();

  await sidebar.getByRole("link", { name: "說明書工作台" }).click();
  await expect(page).toHaveURL(/\/cases\?view=workbench$/);
  await expect(page.getByRole("main").getByRole("heading", { name: "說明書工作台" })).toBeVisible();
  await expect(page.getByRole("button", { name: "開啟勝利小屋工作台" })).toHaveCount(0);

  await sidebar.getByRole("link", { name: "補件清單" }).click();
  await expect(page).toHaveURL(/\/cases\?view=supplements$/);
  await expect(page.getByRole("main").getByRole("heading", { name: "補件清單" })).toBeVisible();

  await sidebar.getByRole("button", { name: "展開地政資料選單" }).click();
  await sidebar.getByRole("link", { name: "資料來源" }).click();
  await expect(page).toHaveURL(/\/settings\?section=registry-rules$/);
  await expect(page.getByRole("main").getByRole("heading", { name: "資料來源", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "設定分類" })).toHaveCount(0);
  await expect(page.getByText("授權管理")).toHaveCount(0);
  await expect(page.getByText("實價登錄 MCP Hub")).toHaveCount(0);

  await sidebar.getByRole("link", { name: "費用紀錄" }).click();
  await expect(page).toHaveURL(/\/settings\?section=billing$/);
  await expect(page.getByRole("main").getByRole("heading", { name: "費用紀錄", exact: true })).toBeVisible();
  await expect(page.getByText("授權管理")).toHaveCount(0);

  await sidebar.getByRole("button", { name: "展開產出文件選單" }).click();
  await sidebar.getByRole("link", { name: "PDF 預覽" }).click();
  await expect(page).toHaveURL(/\/cases\?view=pdf$/);
  await expect(page.getByRole("main").getByRole("heading", { name: "PDF 預覽" })).toBeVisible();

  await sidebar.getByRole("link", { name: "列印與匯出" }).click();
  await expect(page).toHaveURL(/\/cases\?view=export$/);
  await expect(page.getByRole("main").getByRole("heading", { name: "列印與匯出" })).toBeVisible();

  await sidebar.getByRole("button", { name: "展開系統設定選單" }).click();
  await expect(sidebar.getByRole("link", { name: "個人設定" })).toBeVisible();
  await expect(sidebar.getByRole("link", { name: "方案與升級" })).toBeVisible();
  await expect(sidebar.getByRole("link", { name: "功能開關" })).toHaveCount(0);
  await expect(sidebar.getByRole("link", { name: "授權與升級" })).toHaveCount(0);

  await sidebar.getByRole("link", { name: "個人設定" }).click();
  await expect(page).toHaveURL(/\/settings$/);
  await expect(page.getByRole("main").getByRole("heading", { name: "個人設定" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "帳號與授權管理" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "更新密碼" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "個人名稱與 Email" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "品牌色" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "目前操作紀錄" })).toBeVisible();

  await sidebar.getByRole("link", { name: "地政授權" }).click();
  await expect(page).toHaveURL(/\/settings\?section=registry-auth$/);
  await expect(page.getByRole("main").getByRole("heading", { name: "地政授權" })).toBeVisible();
  await expect(page.getByText("地政 API 設定")).toBeVisible();

  await sidebar.getByRole("link", { name: "方案與升級" }).click();
  await expect(page).toHaveURL(/\/settings\?section=plans$/);
  await expect(page.getByRole("main").getByRole("heading", { name: "方案與升級" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "基本款" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "進階款" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "高級款" })).toBeVisible();
  await expect(page.getByText("目前方案", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "前往升級" })).toHaveCount(2);
  await expect(page.getByText("授權管理")).toHaveCount(0);
  await expect(page.getByText("實價登錄 MCP Hub")).toHaveCount(0);
  await expect(page.getByText("實價登錄", { exact: true })).toBeVisible();
  await expect(page.getByText("Super Admin")).toHaveCount(0);
  await expect(page.getByLabel("Google 地圖已開啟")).toBeEnabled();

  await page.goto(`/cases/${CASE_ID}`);
  await expect(page.getByRole("heading", { name: "說明書工作台" })).toBeVisible();
  await expect(page.getByRole("button", { name: "重新查詢" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "產生補件清單" })).toHaveCount(0);
  await expect(page.getByText("地政重查待後端串接")).toBeVisible();
  await expect(page.getByText("補件產生待後端串接")).toBeVisible();
});

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
            case_no: "001",
            case_name: "勝利小屋",
            property_type: "residential",
            land_lot_no: "勝利段 58-4",
            land_lots: ["勝利段 58-4"],
            building_lot_no: "建號 58",
            address: "台南市永康區勝利街58巷4號1樓",
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
