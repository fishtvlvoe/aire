import { expect, test } from "@playwright/test";

const CASE_ID = "11111111-1111-4111-8111-111111111111";

test.use({ baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000" });

test.beforeEach(async ({ page }) => {
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
            case_name: "和平東路案",
            property_type: "residential",
            land_lot_no: "大安段一小段 123-4",
            land_lots: ["大安段一小段 123-4"],
            building_lot_no: "建號 556-1",
            address: "",
            owner_name: "陳小美",
            land_registry_data: {
              land_registry: {
                data: {
                  lot_number: "大安段一小段 123-4",
                  area: 1223.45,
                  zoning: "住宅區",
                },
              },
              building_registry: {
                data: {
                  building_number: "建號 556-1",
                  purpose: "住家用",
                  material: "鋼筋混凝土造",
                  building_floor: "013層",
                  construction_date: "083/10/18",
                  area: 84.13,
                  main_building_area: 84.13,
                  auxiliary_area: 11.09,
                  common_area: 31.24,
                },
              },
              building_ownership: {
                data: {
                  owner_name: "陳小美",
                  numerator: 1,
                  denominator: 1,
                },
              },
            },
            current_step: 2,
            status: "draft",
            asking_price: null,
            created_at: 1763200000,
            updated_at: 1763200000,
          },
        ],
      }),
    );
  }, CASE_ID);
});

test("registry preview, disclosure workbench, and export preview stay readable", async ({ page }) => {
  await page.goto(`/cases/${CASE_ID}`);

  await expect(page.getByText("謄本資料預覽")).toBeVisible();
  await expect(page.getByText("建物標示部", { exact: true })).toBeVisible();
  await expect(page.getByText("住家用")).toBeVisible();
  await expect(page.getByText("鋼筋混凝土造")).toBeVisible();
  await expect(page.getByText("31 年")).toBeVisible();

  const stepLabels = await page.locator('[aria-current="step"]').locator("xpath=..").innerText();
  expect(stepLabels).not.toMatch(/\b1\b|\b2\b|\b3\b|\b5\b/);

  await page.getByRole("button", { name: "下一步" }).click();
  await expect(page.getByTestId("house-mvp-workbench")).toBeVisible();
  await expect(page.getByRole("button", { name: "位置圖與生活機能" })).toBeVisible();

  await page.getByRole("button", { name: "位置圖與生活機能" }).click();
  await expect(page.getByText("位置圖上傳")).toBeVisible();
  await expect(page.getByText("周邊圖上傳")).toBeVisible();
  await expect(page.getByTestId("house-mvp-preview").getByText("位置圖與生活機能")).toBeVisible();
  await expect(page.getByText("格局圖上傳")).toHaveCount(0);

  const noHorizontalOverflow = await page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth <= root.clientWidth + 1;
  });
  expect(noHorizontalOverflow).toBe(true);

  await page.getByRole("button", { name: "下一步" }).click();
  await expect(page.getByTestId("dossier-preview-frame")).toBeVisible();
  await expect(page.getByText("不動產說明書預覽")).toBeVisible();
});
