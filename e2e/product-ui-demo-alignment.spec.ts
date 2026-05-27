import { expect, test, type Page } from "@playwright/test";
import { resolve } from "node:path";

const CASE_ID = "11111111-1111-4111-8111-111111111111";
const viewports = [
  { width: 1440, height: 1000 },
  { width: 1024, height: 900 },
  { width: 768, height: 900 },
];

test.use({ baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000" });

test.beforeEach(async ({ page }) => {
  await seedCase(page);
});

for (const viewport of viewports) {
  test(`demo reference and product UI stay aligned at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);

    await page.goto(fileUrl("UI-UX-DEMO-REFERENCE/registry-autofill-workbench.html"));
    await expect(page.locator("h1")).toContainText("說明書工作台");
    await expect(page.locator(".panel-title", { hasText: "案件與章節" }).first()).toBeVisible();
    await expect(page.locator(".panel-title", { hasText: "欄位審核" }).first()).toBeVisible();
    await page.screenshot({
      path: `e2e/results/demo-alignment/demo-workbench-${viewport.width}.png`,
      fullPage: true,
    });

    await page.goto(fileUrl("UI-UX-DEMO-REFERENCE/registry-autofill-settings.html"));
    await expect(page.locator(".panel-title", { hasText: "授權與升級" }).first()).toBeVisible();
    await expect(page.locator("body")).toContainText("費用與帳務");
    await expect(page.locator("body")).toContainText("PDF 圖資欄位");
    await page.screenshot({
      path: `e2e/results/demo-alignment/demo-settings-${viewport.width}.png`,
      fullPage: true,
    });

    await page.goto(`/cases/_?caseId=${CASE_ID}`);
    const primaryNavigation = page.getByRole("navigation", { name: "主要選單" });
    if (await primaryNavigation.count()) {
      await expect(primaryNavigation).toBeVisible();
    }
    await expect(page.getByRole("region", { name: "物件摘要" })).toBeVisible();
    await expect(page.getByRole("region", { name: "欄位審核" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "補件/現場" })).toBeVisible();
    await expect(page.getByRole("region", { name: "本次調閱費用" })).toBeVisible();
    await expect(page.getByText("MOI_API_")).toHaveCount(0);
    await expect(page.getByText("COP309")).toHaveCount(0);
    await expectCustomerFacingTextClean(page);
    await expectNoHorizontalOverflow(page);
    await page.screenshot({
      path: `e2e/results/demo-alignment/product-workbench-${viewport.width}.png`,
      fullPage: true,
    });

    await page.goto("/settings");
    const settingsMain = page.getByRole("main");
    await expect(settingsMain.getByRole("heading", { name: "個人設定" })).toBeVisible();
    await expect(settingsMain.getByRole("heading", { name: "設定分類" })).toHaveCount(0);
    await expect(settingsMain.getByRole("heading", { name: "個人名稱與 Email" })).toBeVisible();
    await expect(settingsMain.getByRole("heading", { name: "品牌色與 Logo" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.screenshot({
      path: `e2e/results/demo-alignment/product-settings-${viewport.width}.png`,
      fullPage: true,
    });

    await page.goto("/settings?section=registry-rules");
    await expect(page.getByRole("main").getByRole("heading", { name: "資料來源", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "品牌設定" })).toHaveCount(0);
    await expect(page.getByText("授權管理")).toHaveCount(0);
    await expect(page.getByText("地政 API 設定")).toHaveCount(0);
    await expect(page.getByLabel("地籍圖上傳")).toBeVisible();
    await expect(page.getByLabel("空拍圖上傳")).toBeVisible();
    await expect(page.getByLabel("格局圖上傳")).toBeVisible();
    await expect(page.getByLabel("地標圖上傳")).toBeVisible();

    await page.goto("/settings?section=billing");
    await expect(page.getByRole("main").getByRole("heading", { name: "費用紀錄", exact: true })).toBeVisible();
    await expect(page.getByText("本月使用量")).toBeVisible();
    await expect(page.getByRole("heading", { name: "地政查詢明細" })).toBeVisible();
    await expect(page.getByText("地政費用合計 27 元")).toBeVisible();
    await expect(page.getByText("授權管理")).toHaveCount(0);
    await expectCustomerFacingTextClean(page);

    await page.goto("/settings?section=plans");
    await expect(page.getByRole("main").getByRole("heading", { name: "方案與升級" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "基本款" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "進階款" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "高級款" })).toBeVisible();
    await expect(page.getByText("實價登錄 MCP Hub")).toHaveCount(0);
    await expect(page.getByText("實價登錄", { exact: true })).toHaveCount(2);
    await expect(page.getByText("目前正在開發中。")).toBeVisible();
    await expect(page.getByText("測試版已開啟")).toHaveCount(0);
    await expect(page.getByText(/正式版歸在/)).toHaveCount(0);
    await expect(page.getByRole("switch", { name: "Google 地圖未啟用" })).toBeEnabled();
    await expect(page.getByRole("switch", { name: "實價登錄未啟用" })).toBeEnabled();
  });
}

test("new case flow is address-first and only falls back to manual type selection when needed", async ({ page }) => {
  await page.goto("/cases/new");
  await expect(page.getByLabel("地址 *")).toBeVisible();
  await expect(page.getByLabel("物件類型")).toHaveCount(0);

  await page.getByLabel("地址 *").fill("宜蘭縣五結鄉協和村親河路二段 1 號");
  await page.getByRole("button", { name: "判斷地政資料", exact: true }).click();
  await expect(page.getByText("已找到 1 筆土地、1 筆建物")).toBeVisible();
  await expectCustomerFacingTextClean(page);
  await expect(page.getByLabel("物件類型")).toHaveCount(0);

  await page.getByLabel("地址 *").fill("宜蘭縣五結鄉協和村親河路二段 候選多筆");
  await page.getByRole("button", { name: "判斷地政資料", exact: true }).click();
  await expect(page.getByLabel("物件類型")).toBeVisible();
});

test("cases overview uses sidebar scope navigation without duplicating page tabs", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/cases");

  const sidebar = page.getByRole("navigation", { name: "主要選單" });
  await expect(page.getByRole("main").getByRole("heading", { name: "案件總覽" })).toBeVisible();
  await expect(sidebar.getByRole("link", { name: "新增案件" })).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: "新增案件" })).toBeVisible();
  await expect(page.getByRole("button", { name: "開啟宜蘭五結農舍工作台" })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "案件分類" })).toHaveCount(0);
  await expect(page.getByRole("table")).toHaveCount(0);

  await expect(sidebar.getByRole("link", { name: "物件審核" })).toBeVisible();
  await expect(sidebar.getByRole("link", { name: "新增案件" })).toBeVisible();
  await expect(sidebar.getByRole("link", { name: "地政查詢" })).toHaveCount(0);
  await expect(sidebar.getByRole("link", { name: "費用紀錄" })).toHaveCount(0);
  await sidebar.getByRole("button", { name: "展開地政資料選單" }).click();
  await expect(sidebar.getByRole("link", { name: "費用紀錄" })).toBeVisible();

  await sidebar.getByRole("link", { name: "物件審核" }).click();
  await expect(page).toHaveURL(/\/cases\?view=workbench$/);
  await expect(page.getByRole("main").getByRole("heading", { name: "物件審核" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "請先選擇案件" })).toBeVisible();
  await expect(page.getByText("全部案件")).toHaveCount(0);

  await sidebar.getByRole("link", { name: "補件清單" }).click();
  await expect(page).toHaveURL(/\/cases\?view=supplements$/);
  await expect(page.getByRole("main").getByRole("heading", { name: "補件清單" })).toBeVisible();
  await expect(page.getByText("只顯示目前需要補資料的案件")).toBeVisible();
  await expect(page.getByText("全部案件")).toHaveCount(0);

  await expect(sidebar.getByRole("button", { name: "展開產出文件選單" })).toHaveCount(0);
  await expect(sidebar.getByRole("link", { name: "PDF 預覽" })).toHaveCount(0);
  await expect(sidebar.getByRole("link", { name: "列印與匯出" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "預覽 PDF" })).toBeVisible();
  await expect(page.getByRole("button", { name: "匯出 PDF" })).toBeVisible();

  await page.getByRole("button", { name: "預覽 PDF" }).click();
  await expect(page).toHaveURL(new RegExp(`/cases/_/preview\\?caseId=${CASE_ID}$`));

  await expectNoHorizontalOverflow(page);
  await page.screenshot({
    path: "e2e/results/demo-alignment/product-cases-overview-1440.png",
    fullPage: true,
  });
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
            case_no: "AIRE-2026-001",
            case_name: "宜蘭五結農舍",
            property_type: "residential",
            land_lot_no: "五結段 123-1",
            land_lots: ["五結段 123-1", "五結段 123-2"],
            building_lot_no: "建號 88-1",
            address: "宜蘭縣五結鄉協和村親河路二段 1 號",
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

function fileUrl(path: string) {
  return `file://${resolve(process.cwd(), path)}`;
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
