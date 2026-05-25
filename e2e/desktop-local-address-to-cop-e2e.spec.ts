import { expect, test } from "@playwright/test";

async function signInLocal(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.evaluate(() => {
    window.localStorage.setItem(
      "aire-mock-store",
      JSON.stringify({ sessionUser: { email: "admin@test.aire", role: "admin" } }),
    );
  });
}

test("local Web saves manual registry confirmation after address discovery cannot auto-resolve", async ({ page }) => {
  await signInLocal(page);
  await page.goto("/cases/new", { waitUntil: "networkidle" });

  await page.getByLabel("地址 *").fill("台南市永康區勝利街58巷4號");
  await page.getByRole("button", { name: "判斷地政資料" }).click();

  await expect(page.getByText("需要人工補填資料")).toBeVisible();
  await expect(page.getByLabel("地段")).toHaveValue("");
  await expect(page.getByLabel("地號")).toHaveValue("");
  await expect(page.getByLabel("建號")).toHaveValue("");
  await expect(page.getByText("0001")).toHaveCount(0);

  await page.getByLabel("地段").fill("勝利段");
  await page.getByLabel("地號").fill("1043-0002");
  await page.getByLabel("建號").fill("00000000");
  await page.getByRole("button", { name: "建立案件" }).click();

  await expect(page).toHaveURL(/\/cases\//);

  const stored = await page.evaluate(() => JSON.parse(window.localStorage.getItem("aire-mock-store") || "{}"));
  const created = stored.cases?.find((row: { address?: string }) => row.address === "台南市永康區勝利街58巷4號");
  expect(created).toMatchObject({
    land_lot_no: "1043-0002",
    building_lot_no: "00000000",
    land_registry_data: {
      confirmed_registry_match: {
        section_name: "勝利段",
        land_no: "1043-0002",
        building_no: "00000000",
        status: "confirmed",
      },
    },
  });

  const discoveryRun = stored.registryQueryRuns?.find(
    (run: { source_input?: string }) => run.source_input === "台南市永康區勝利街58巷4號",
  );
  expect(discoveryRun).toMatchObject({
    input_type: "address",
    total_cost_cents: 0,
    error_code: "address_discovery_unavailable",
    candidate_json: {
      status: "manual_required",
      candidates: [],
    },
  });
});
