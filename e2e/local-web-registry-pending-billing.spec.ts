import { expect, test } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

test.use({ baseURL: process.env.E2E_BASE_URL ?? "http://localhost:1420" });

const ARTIFACT_DIR = "artifacts/smoke";
const MATRIX_PATH = join(ARTIFACT_DIR, "desktop-local-address-to-cop-e2e-live-discovery-matrix.json");
const LOCAL_DEV_TOKEN = "aire-dev-local-token";

function seedLocalStore() {
  if (window.localStorage.getItem("aire-mock-store")) return;
  window.localStorage.setItem(
    "aire-mock-store",
    JSON.stringify({
      sessionUser: { email: "admin@test.aire", role: "admin" },
      appSettings: {
        landApi: { clientId: "mock-client-id", secret: "mock-client-secret" },
        premium: { subscribed: false, plan: null, expiresAt: null },
        premiumUnlocked: false,
      },
      featureFlags: [
        { id: "land-registry-api", name: "地政資料匯入", enabled: true },
        { id: "premium_real_price_enabled", name: "實價登錄", enabled: false },
      ],
      cases: [],
      registryQueryRuns: [],
    }),
  );
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(seedLocalStore);
});

test("registry_pending case keeps sales flow moving and blocks paid formal data", async ({ page }) => {
  await page.goto("/cases/new");
  await page.getByLabel("地址 *").fill("無法自動補齊地址");
  await page.getByLabel("所有權人（選填）").fill("待補屋主");
  await page.getByLabel("案件名稱（選填）").fill("pending 驗收");
  await page.getByLabel("案件編號（選填）").fill("PENDING-E2E-001");

  await page.getByRole("button", { name: "查詢物件資料" }).click();
  await expect(page.getByText("需要人工補填資料")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByLabel("地段")).toHaveValue("");
  await expect(page.getByLabel("地號")).toHaveValue("");
  await expect(page.getByLabel("建號")).toHaveValue("");

  await page.getByRole("button", { name: "建立案件" }).click();
  await expect(page).toHaveURL(/\/cases\//);
  await expect(page.getByRole("region", { name: "物件摘要" })).toContainText("無法自動補齊地址");
  await page.getByRole("tab", { name: "正式資料匯入" }).click();
  await expect(page.getByRole("region", { name: "正式資料匯入" })).toContainText("確認本案物件後");
  await expect(page.getByRole("button", { name: "正式資料匯入（付費）" })).toHaveCount(0);

  const stored = await page.evaluate(() => JSON.parse(window.localStorage.getItem("aire-mock-store") || "{}"));
  const created = stored.cases?.find((row: { case_no?: string }) => row.case_no === "PENDING-E2E-001");
  expect(created?.land_registry_data).toMatchObject({
    registry_status: "registry_pending",
    missing_registry_fields: ["地段", "地號"],
  });
  const paidRuns = (stored.registryQueryRuns ?? []).filter(
    (run: { total_cost_cents?: number }) => Number(run.total_cost_cents ?? 0) > 0,
  );
  expect(paidRuns).toHaveLength(0);
});

test("paid resolver is opt-in, creates candidate evidence, and billing drilldown shows saved run", async ({ page }) => {
  await page.goto("/cases/new");
  await page.getByLabel("地址 *").fill("高雄市苓雅區苓雅路二段18巷8弄2號");
  await page.getByRole("button", { name: "查詢物件資料" }).click();
  await expect(page.getByText("需要人工補填資料")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("仍找不到建號候選")).toBeVisible();

  let stored = await page.evaluate(() => JSON.parse(window.localStorage.getItem("aire-mock-store") || "{}"));
  expect((stored.registryQueryRuns ?? []).filter((run: { total_cost_cents?: number }) => Number(run.total_cost_cents ?? 0) > 0)).toHaveLength(0);

  await page.getByRole("button", { name: "我同意付費查詢建號" }).click();
  await expect(page.getByText("請選擇正確資料")).toBeVisible();
  await expect(page.getByRole("radiogroup", { name: "候選物件資料" })).toBeVisible();

  stored = await page.evaluate(() => JSON.parse(window.localStorage.getItem("aire-mock-store") || "{}"));
  const resolverRuns = (stored.registryQueryRuns ?? []).filter(
    (run: { candidate_json?: { run_type?: string }; total_cost_cents?: number }) =>
      run.candidate_json?.run_type === "paid_address_resolver" && Number(run.total_cost_cents ?? 0) > 0,
  );
  expect(resolverRuns).toHaveLength(1);
  expect(resolverRuns[0]).toMatchObject({
    match_status: "candidate",
    total_cost_cents: 3000,
    api_calls: [expect.objectContaining({ cost_cents: 3000 })],
  });

  await page.goto("/settings?section=billing");
  await expect(page.getByRole("heading", { name: "費用紀錄" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "地政查詢明細" })).toBeVisible();
  await expect(page.getByText("門牌建號查詢")).toBeVisible();
  await expect(page.getByText("30 元").first()).toBeVisible();
  await page.getByRole("button", { name: "查看" }).first().click();
  await expect(page.getByRole("region", { name: "費用明細" })).toContainText("查詢紀錄");
  await expect(page.getByRole("region", { name: "費用明細" })).toContainText("新查詢");
  await expect(page.getByRole("region", { name: "費用明細" })).toContainText("30 元");
});

test("Victory pending case can be manually completed, formally imported, cached, and previewed as PDF", async ({ page }) => {
  await page.route("**/api/local/address-discovery", async (route) => {
    const request = route.request();
    const payload = request.postDataJSON() as { address?: string } | null;
    if (payload?.address === "台南市永康區勝利街58巷4號") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "manual_required",
          source: "local_discovery",
          normalizedAddress: payload.address,
          candidates: [],
          errors: [
            {
              source: "easymap_r02",
              code: "easymap_r02_unavailable",
              message: "live discovery unavailable; manual registry completion required",
            },
          ],
          trustedForPdf: false,
          totalCostCents: 0,
          total_cost_cents: 0,
          cacheHit: false,
          sourceRunId: null,
          inputKind: "doorplate",
          intendedObjectType: "building",
          requiresCandidateSelection: false,
          candidateSelection: { state: "not_required", selectedRegistryKey: null },
        }),
      });
      return;
    }
    await route.continue();
  });

  await page.goto("/cases/new");
  await page.getByLabel("地址 *").fill("台南市永康區勝利街58巷4號");
  await page.getByLabel("所有權人（選填）").fill("余啟彰");
  await page.getByLabel("案件名稱（選填）").fill("勝利街完整驗收");
  await page.getByLabel("案件編號（選填）").fill("VICTORY-E2E-001");
  await page.getByRole("button", { name: "查詢物件資料" }).click();
  await expect(page.getByText("需要人工補填資料")).toBeVisible({ timeout: 20_000 });

  await page.getByLabel("地段").fill("兵南段");
  await page.getByLabel("地號").fill("04140000");
  await page.getByLabel("建號").fill("00084000");
  await page.getByRole("button", { name: "建立案件" }).click();
  await expect(page).toHaveURL(/\/cases\//);

  const caseId = await page.evaluate(() => {
    const stored = JSON.parse(window.localStorage.getItem("aire-mock-store") || "{}");
    return stored.cases?.find((row: { case_no?: string }) => row.case_no === "VICTORY-E2E-001")?.id ?? null;
  });
  expect(caseId).toBeTruthy();

  await page.getByRole("tab", { name: "正式資料匯入" }).click();
  await page.getByRole("button", { name: "正式資料匯入（付費）" }).click();
  await page.getByLabel("客戶已書面授權查詢不動產資料").check();
  await page.getByRole("button", { name: "確認", exact: true }).click();
  await page.getByRole("button", { name: "確定，開始查詢" }).click();
  await expect(page.getByText("查詢完成")).toBeVisible();
  await expect(page.getByText("已寫入案件，可用於預覽與 PDF")).toBeVisible();
  await expect(page.getByText(/實際扣款：NT\$/)).toBeVisible();

  let stored = await page.evaluate(() => JSON.parse(window.localStorage.getItem("aire-mock-store") || "{}"));
  let createdCase = stored.cases?.find((row: { id?: string }) => row.id === caseId);
  expect(createdCase?.land_registry_data).toBeTruthy();
  expect(Object.keys(createdCase?.land_registry_data?.entries ?? {})).not.toHaveLength(0);

  await page.goto(`/cases/${caseId}?tab=formal-import`);
  await page.getByRole("button", { name: "正式資料匯入（付費）" }).click();
  await page.getByLabel("客戶已書面授權查詢不動產資料").check();
  await page.getByRole("button", { name: "確認", exact: true }).click();
  await page.getByRole("button", { name: "確定，開始查詢" }).click();
  await expect(page.getByText("查詢完成")).toBeVisible();

  stored = await page.evaluate(() => JSON.parse(window.localStorage.getItem("aire-mock-store") || "{}"));
  createdCase = stored.cases?.find((row: { id?: string }) => row.id === caseId);
  expect(createdCase?.land_registry_data?.entries).toBeTruthy();

  const paidRunCountBeforePdf = (stored.registryQueryRuns ?? []).filter(
    (run: { total_cost_cents?: number }) => Number(run.total_cost_cents ?? 0) > 0,
  ).length;
  await page.getByRole("tab", { name: "PDF 檢查" }).click();
  await page.getByRole("link", { name: "完成並預覽 PDF" }).click();
  await expect(page).toHaveURL(/\/preview/);
  await expect(page.getByRole("heading", { name: "PDF 預覽" })).toBeVisible();

  stored = await page.evaluate(() => JSON.parse(window.localStorage.getItem("aire-mock-store") || "{}"));
  const paidRunCountAfterPdf = (stored.registryQueryRuns ?? []).filter(
    (run: { input_type?: string; total_cost_cents?: number }) =>
      run.input_type === "registry_key" && Number(run.total_cost_cents ?? 0) > 0,
  ).length;
  expect(paidRunCountAfterPdf).toBe(paidRunCountBeforePdf);
});

test("live discovery matrix preserves zero-cost evidence before formal import", async ({ request }) => {
  mkdirSync(ARTIFACT_DIR, { recursive: true });
  const scenarios = [
    { id: "tainan-doorplate", address: "台南市東區東和路47號3樓", preferredStatus: "candidate_found" },
    { id: "kaohsiung-correct-doorplate", address: "高雄市苓雅區苓雅二路189巷2號", preferredStatus: "candidate_found" },
    { id: "kaohsiung-typo-doorplate", address: "高雄市苓雅區苓雅路二段18巷8弄2號", preferredStatus: "manual_required" },
    { id: "land-descriptor", address: "台南市東區富強段70地號", preferredStatus: "candidate_found" },
    { id: "not-found", address: "無法自動補齊地址", preferredStatus: "manual_required" },
    { id: "multi-building-candidates", address: "台南市東區東和路47號", preferredStatus: "candidate_found" },
  ];

  const matrix = [];
  for (const scenario of scenarios) {
    let body: Record<string, any> | null = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await request.post("/api/local/address-discovery", {
        data: { address: scenario.address, allowMockFallback: true },
        headers: { "X-Local-Token": LOCAL_DEV_TOKEN },
        timeout: 20_000,
      });
      expect(response.ok()).toBe(true);
      body = await response.json();
      if (body?.status === scenario.preferredStatus || scenario.preferredStatus === "manual_required") break;
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
    expect(body).toBeTruthy();
    const finalBody = body!;
    const candidateCount = Array.isArray(finalBody.candidates) ? finalBody.candidates.length : 0;
    matrix.push({
      ...scenario,
      status: finalBody.status,
      inputKind: finalBody.inputKind,
      intendedObjectType: finalBody.intendedObjectType,
      candidateCount,
      requiresCandidateSelection: Boolean(finalBody.requiresCandidateSelection),
      totalCostCents: finalBody.totalCostCents ?? finalBody.total_cost_cents ?? null,
      firstCandidate: finalBody.candidates?.[0] ?? null,
      errors: finalBody.errors ?? [],
    });

    expect(["candidate_found", "manual_required"], scenario.id).toContain(finalBody.status);
    expect(finalBody.totalCostCents ?? finalBody.total_cost_cents ?? 0).toBe(0);
    if (scenario.id === "multi-building-candidates" && finalBody.status === "candidate_found" && candidateCount > 1) {
      expect(finalBody.requiresCandidateSelection).toBe(true);
    }
  }

  writeFileSync(MATRIX_PATH, JSON.stringify({ generatedAt: new Date().toISOString(), matrix }, null, 2));
  expect(matrix.every((row) => row.totalCostCents === 0)).toBe(true);
});
