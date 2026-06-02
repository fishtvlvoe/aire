import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const YUNONG_ADDRESS = "台南市東區裕農路288巷17號8樓之1";
const CASE_NO = "AIRE-YUNONG-CANDIDATE-20260523";
const DOWNLOAD_DIR = join(homedir(), "Downloads");

test.use({ baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000" });

test.beforeEach(async ({ page }) => {
  await page.request.post("/api/branding-text", {
    data: {
      settings: {
        agent_name: "",
        realtor_name: "",
        agent_cert_no: "",
        company_name: "",
        company_license_no: "",
        company_address: "",
        company_phone: "",
      },
    },
  });
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "aire-mock-store",
      JSON.stringify({
        sessionUser: { email: "admin@test.aire", role: "admin" },
        featureFlags: [
          { id: "land-registry-api", name: "地政 API", enabled: true },
          { id: "premium_real_price_enabled", name: "實價登錄", enabled: false },
        ],
        cases: [],
      }),
    );
  });
});

test("Yunong pre-survey keeps candidate data visible after case creation", async ({ page }) => {
  test.setTimeout(120_000);
  mkdirSync(DOWNLOAD_DIR, { recursive: true });

  await page.goto("/settings/branding");
  await page.getByLabel("承辦人").fill("王承辦");
  await page.getByLabel("經紀人", { exact: true }).fill("陳經紀");
  await page.getByLabel("經紀人證號").fill("南市經紀人字第 000001 號");
  await page.getByLabel("不動產經紀業").fill("裕農安居不動產經紀有限公司");
  await page.getByLabel("經紀業證號").fill("南市經紀業字第 000001 號");
  await page.getByLabel("公司地址").fill("台南市東區裕農路1號");
  await page.getByLabel("公司電話").fill("06-123-4567");
  await page.getByRole("button", { name: "儲存品牌資訊" }).click();
  await expect(page.getByText("品牌資訊已儲存")).toBeVisible();

  await page.goto("/cases/new");
  await page.getByLabel("地址 *").fill(YUNONG_ADDRESS);
  await page.getByLabel("所有權人（選填）").fill("余啟彰");
  await page.getByLabel("案件名稱（選填）").fill("裕農路候選物調驗收");
  await page.getByLabel("案件編號（選填）").fill(CASE_NO);
  await page.getByRole("button", { name: "查詢物件資料", exact: true }).click();

  const result = await expectDiscoveryResult(page);
  await expect(result.getByText("資料組成").locator("..")).toContainText(/土地 \d+ 筆 · 建物 \d+ 筆/);
  await expect(page.getByLabel("物件類型")).toBeVisible();
  await page.getByRole("button", { name: "建立案件", exact: true }).click();

  await expect(page).toHaveURL(/\/cases\/[0-9a-f-]+$/);
  await page.getByRole("tab", { name: "物件資料總覽" }).click();

  const sourceRegion = page.getByRole("region", { name: "欄位資料來源" });
  await expect(sourceRegion).toBeVisible();
  await expect(sourceRegion).toContainText("候選資料");
  await expect(sourceRegion).toContainText("8樓之1");
  await sourceRegion.getByText("管理明細", { exact: true }).click();
  await expect(sourceRegion).toContainText(/candidate|候選資料/);

  await expect(page.getByRole("tab", { name: "PDF 檢查" })).toBeVisible();
});

async function expectDiscoveryResult(page: import("@playwright/test").Page) {
  await expect(page.getByRole("button", { name: "建立案件", exact: true })).toBeEnabled({ timeout: 60_000 });
  const result = page.locator("section", { hasText: "物件資料補齊" }).filter({ hasText: "資料組成" }).first();
  await expect(result).toBeVisible();
  return result;
}
