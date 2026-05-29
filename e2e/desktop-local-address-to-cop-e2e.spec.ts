import { expect, test } from "@playwright/test";

async function signInLocal(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.evaluate(() => {
    window.localStorage.setItem(
      "aire-mock-store",
      JSON.stringify({
        sessionUser: { email: "admin@test.aire", role: "admin" },
        appSettings: {
          landApi: {
            clientId: "mock-client-id",
            secret: "mock-client-secret",
          },
          premium: {
            subscribed: false,
            plan: null,
            expiresAt: null,
          },
          premiumUnlocked: false,
        },
      }),
    );
  });
}

async function gotoLegacyStep2(page: import("@playwright/test").Page, caseId: string) {
  await page.goto(`/cases/_/legacy?caseId=${encodeURIComponent(caseId)}`, {
    waitUntil: "networkidle",
  });
  const formalButton = page.getByRole("button", { name: "正式查詢" });
  if ((await formalButton.count()) === 0) {
    await page.getByRole("button", { name: "下一步" }).click();
  }
  await expect(page.getByRole("button", { name: "正式查詢" })).toBeVisible();
}

test("local Web resolves R02 candidates, confirms registry key, uses COP cache, and opens PDF preview", async ({ page }) => {
  await signInLocal(page);

  await page.goto("/cases/new", { waitUntil: "networkidle" });
  await page.getByLabel("地址 *").fill("高雄市苓雅區苓雅路二段18巷8弄2號");
  await page.getByRole("button", { name: "查詢物件資料" }).click();
  await expect(page.getByText("需要人工補填資料")).toBeVisible({ timeout: 20000 });
  await expect(page.getByLabel("地段")).toHaveValue("");
  await expect(page.getByLabel("地號")).toHaveValue("");
  const manualRun = await page.evaluate(() => {
    const stored = JSON.parse(window.localStorage.getItem("aire-mock-store") || "{}");
    return (stored.registryQueryRuns ?? []).find(
      (run: { source_input?: string }) => run.source_input === "高雄市苓雅區苓雅路二段18巷8弄2號",
    );
  });
  expect(manualRun).toMatchObject({
    input_type: "address",
    total_cost_cents: 0,
    candidate_json: expect.objectContaining({
      status: "manual_required",
      candidates: [],
    }),
  });

  await page.goto("/cases/new", { waitUntil: "networkidle" });

  await page.getByLabel("地址 *").fill("台南市永康區勝利街58巷4號");
  await page.getByRole("button", { name: "查詢物件資料" }).click();

  await expect(page.getByText("已自動補齊，請確認資料")).toBeVisible({ timeout: 20000 });
  await expect(page.getByLabel("地段")).toHaveValue(/.+/);
  await expect(page.getByLabel("地號")).toHaveValue(/\d+/);
  await expect(page.getByLabel("建號")).toHaveValue(/\d+/);
  const confirmedRegistryMatch = {
    section_name: await page.getByLabel("地段").inputValue(),
    land_no: await page.getByLabel("地號").inputValue(),
    building_no: await page.getByLabel("建號").inputValue(),
  };
  expect(confirmedRegistryMatch.section_name).toBeTruthy();
  expect(confirmedRegistryMatch.land_no).toMatch(/^\d+$/);
  expect(confirmedRegistryMatch.building_no).toMatch(/^\d+$/);
  await expect(page.getByText("0001")).toHaveCount(0);

  await page.getByRole("button", { name: "建立案件" }).click();

  await expect(page).toHaveURL(/\/cases\//);
  const createdCaseId = await page.evaluate(() => {
    const stored = JSON.parse(window.localStorage.getItem("aire-mock-store") || "{}");
    const row = (stored.cases ?? []).find(
      (item: { address?: string }) => item.address === "台南市永康區勝利街58巷4號",
    );
    return row?.id ?? null;
  });
  expect(createdCaseId).toBeTruthy();
  await gotoLegacyStep2(page, createdCaseId ?? "");

  await page.getByRole("button", { name: "正式查詢" }).click();
  await page.getByLabel("客戶已書面授權查詢不動產資料").check();
  await page.getByRole("button", { name: "確認", exact: true }).click();
  await page.getByRole("button", { name: "確定，開始查詢" }).click();
  await expect(page.getByText("查詢完成")).toBeVisible();
  await expect(page.getByText("本次已建立正式查詢紀錄。")).toBeVisible();

  await gotoLegacyStep2(page, createdCaseId ?? "");
  await page.getByRole("button", { name: "正式查詢" }).click();
  await page.getByLabel("客戶已書面授權查詢不動產資料").check();
  await page.getByRole("button", { name: "確認", exact: true }).click();
  await page.getByRole("button", { name: "確定，開始查詢" }).click();
  await expect(page.getByText("查詢完成")).toBeVisible();

  const paidRunCountBeforePdf = await page.evaluate(() => {
    const stored = JSON.parse(window.localStorage.getItem("aire-mock-store") || "{}");
    return (stored.registryQueryRuns ?? []).filter(
      (run: { input_type?: string; total_cost_cents?: number }) =>
        run.input_type === "registry_key" && Number(run.total_cost_cents ?? 0) > 0,
    ).length;
  });

  await page.goto(`/cases/_?caseId=${encodeURIComponent(createdCaseId ?? "")}`, {
    waitUntil: "networkidle",
  });
  await page.getByRole("tab", { name: "PDF 檢查" }).click();
  await expect(page.getByText(/已上傳圖資：/)).toBeVisible();
  await page.getByRole("link", { name: "開啟 PDF 預覽" }).click();
  await expect(page).toHaveURL(/\/cases\/_\/preview\?caseId=/);

  const paidRunCountAfterPdf = await page.evaluate(() => {
    const stored = JSON.parse(window.localStorage.getItem("aire-mock-store") || "{}");
    return (stored.registryQueryRuns ?? []).filter(
      (run: { input_type?: string; total_cost_cents?: number }) =>
        run.input_type === "registry_key" && Number(run.total_cost_cents ?? 0) > 0,
    ).length;
  });
  expect(paidRunCountAfterPdf).toBe(paidRunCountBeforePdf);

  const stored = await page.evaluate(() => JSON.parse(window.localStorage.getItem("aire-mock-store") || "{}"));
  const created = stored.cases?.find((row: { address?: string }) => row.address === "台南市永康區勝利街58巷4號");
  expect(created).toMatchObject({
    land_lot_no: confirmedRegistryMatch.land_no,
    building_lot_no: confirmedRegistryMatch.building_no,
    land_registry_data: {
      confirmed_registry_match: {
        section_name: confirmedRegistryMatch.section_name,
        land_no: confirmedRegistryMatch.land_no,
        building_no: confirmedRegistryMatch.building_no,
        status: "confirmed",
      },
      formal_registry_run_id: expect.any(String),
    },
  });

  const discoveryRun = stored.registryQueryRuns?.find(
    (run: { source_input?: string }) => run.source_input === "台南市永康區勝利街58巷4號",
  );
  expect(discoveryRun).toMatchObject({
    input_type: "address",
    total_cost_cents: 0,
    error_code: null,
    candidate_json: {
      status: "candidate_found",
      candidates: [
        expect.objectContaining({
          section_name: confirmedRegistryMatch.section_name,
          lot_number: confirmedRegistryMatch.land_no,
          building_number: confirmedRegistryMatch.building_no,
          source: "easymap_r02",
          trusted_for_pdf: false,
        }),
      ],
    },
  });

  const formalRuns = (stored.registryQueryRuns ?? []).filter(
    (run: { input_type?: string; match_status?: string }) =>
      run.input_type === "registry_key" && run.match_status === "confirmed",
  );
  expect(formalRuns.length).toBeGreaterThanOrEqual(2);
  expect(formalRuns.every((run: { input_type?: string; match_status?: string }) =>
    run.input_type === "registry_key" && run.match_status === "confirmed",
  )).toBe(true);
});
