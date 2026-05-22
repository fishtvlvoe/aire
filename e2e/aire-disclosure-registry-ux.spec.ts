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

test("registry-aligned workbench stays readable", async ({ page }) => {
  await page.goto(`/cases/${CASE_ID}`);

  await expect(page.getByTestId("demo-aligned-workbench")).toBeVisible();
  await expect(page.getByRole("region", { name: "物件摘要" })).toBeVisible();
  await expect(page.getByRole("region", { name: "欄位審核" })).toBeVisible();
  await expect(page.getByText("建物權利範圍")).toBeVisible();
  await expect(page.getByRole("region", { name: "本次調閱費用" })).toBeVisible();
  await page.getByRole("tab", { name: "資料來源" }).click();
  await expect(page.getByText("地政匯入資料")).toBeVisible();
  await expect(page.getByRole("link", { name: "下載 JSON" })).toBeVisible();
  await expect(page.getByText("MOI_API_")).toHaveCount(0);
  await expect(page.getByText("COP309")).toHaveCount(0);

  const noHorizontalOverflow = await page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth <= root.clientWidth + 1;
  });
  expect(noHorizontalOverflow).toBe(true);
});
