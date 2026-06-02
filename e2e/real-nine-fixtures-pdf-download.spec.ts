import { expect, type Page, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const DOWNLOAD_DIR = join(homedir(), "Downloads");
const RUN_TAG = "20260601";
const E2E_RUN_ID = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const TEST_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

type RealFixture = {
  id: string;
  address: string;
  caseName: string;
  caseNo: string;
  owner: string;
  expectedPdfText: string[];
  floor?: string;
  managementFee?: string;
};

const FIXTURES: RealFixture[] = [
  {
    id: "highrise-yunong",
    address: "台南市東區裕農路288巷17號8樓之1",
    caseName: "裕農路大樓真實九筆驗收",
    caseNo: `AIRE-REAL9-YUNONG-${RUN_TAG}`,
    owner: "蔡國卿",
    expectedPdfText: ["台南市東區裕農路288巷17號8樓之1", "8樓之1"],
    floor: "8樓之1",
    managementFee: "3000",
  },
  {
    id: "villa-shengli",
    address: "台南市永康區勝利街2巷92弄13號",
    caseName: "勝利街別墅真實九筆驗收",
    caseNo: `AIRE-REAL9-SHENGLI-VILLA-${RUN_TAG}`,
    owner: "所有權人待確認",
    expectedPdfText: ["台南市永康區勝利街2巷92弄13號"],
  },
  {
    id: "huaxia-dongzhi",
    address: "臺南市東區東智街88號5樓",
    caseName: "東智街華廈真實九筆驗收",
    caseNo: `AIRE-REAL9-DONGZHI-${RUN_TAG}`,
    owner: "所有權人待確認",
    expectedPdfText: ["臺南市東區東智街88號5樓"],
    floor: "5樓",
  },
  {
    id: "townhouse-shengli58",
    address: "台南市永康區勝利街58巷4號",
    caseName: "勝利街透天真實九筆驗收",
    caseNo: `AIRE-REAL9-SHENGLI58-${RUN_TAG}`,
    owner: "所有權人待確認",
    expectedPdfText: ["台南市永康區勝利街58巷4號"],
  },
  {
    id: "farmland-nanhua",
    address: "台南市南化區南化段850-1地號",
    caseName: "南化段農地真實九筆驗收",
    caseNo: `AIRE-REAL9-NANHUA-${RUN_TAG}`,
    owner: "土地所有權人待確認",
    expectedPdfText: ["台南市南化區南化段850-1地號", "南化段"],
  },
  {
    id: "land-gangziqian-1090",
    address: "台南市新市區港子前段1090地號",
    caseName: "港子前段1090真實九筆驗收",
    caseNo: `AIRE-REAL9-GANGZI1090-${RUN_TAG}`,
    owner: "土地所有權人待確認",
    expectedPdfText: ["台南市新市區港子前段1090地號"],
  },
  {
    id: "land-gangziqian-1090-26",
    address: "台南市新市區港子前段1090-26地號",
    caseName: "港子前段1090-26真實九筆驗收",
    caseNo: `AIRE-REAL9-GANGZI1090-26-${RUN_TAG}`,
    owner: "土地所有權人待確認",
    expectedPdfText: ["台南市新市區港子前段1090-26地號"],
  },
  {
    id: "apartment-zhonghua-east",
    address: "台南市東區中華東路三段24巷8號5樓",
    caseName: "中華東路公寓真實九筆驗收",
    caseNo: `AIRE-REAL9-ZHONGHUA-CH-${RUN_TAG}`,
    owner: "所有權人待確認",
    expectedPdfText: ["台南市東區中華東路三段24巷8號5樓"],
    floor: "5樓",
  },
  {
    id: "apartment-zhonghua-east-3",
    address: "台南市東區中華東路3段24巷8號5樓",
    caseName: "中華東路3段公寓真實九筆驗收",
    caseNo: `AIRE-REAL9-ZHONGHUA-3-${RUN_TAG}`,
    owner: "所有權人待確認",
    expectedPdfText: ["台南市東區中華東路3段24巷8號5樓"],
    floor: "5樓",
  },
];

test.use({ baseURL: process.env.E2E_BASE_URL ?? "http://localhost:1420" });

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
  await page.addInitScript((runId) => {
    const resetKey = "aire-real-nine-fixtures-run-id";
    if (window.localStorage.getItem(resetKey) !== runId) {
      window.localStorage.removeItem("aire-mock-store");
      window.localStorage.setItem(resetKey, runId);
    }
    const existingRaw = window.localStorage.getItem("aire-mock-store");
    const existing = existingRaw ? (JSON.parse(existingRaw) as Record<string, unknown>) : {};
    window.localStorage.setItem(
      "aire-mock-store",
      JSON.stringify({
        ...existing,
        sessionUser: { email: "admin@test.aire", role: "admin" },
        featureFlags: [
          { id: "land-registry-api", name: "地政 API", enabled: true },
          { id: "premium_real_price_enabled", name: "實價登錄", enabled: false },
        ],
        cases: Array.isArray(existing.cases) ? existing.cases : [],
      }),
    );
  }, E2E_RUN_ID);
});

test("real nine fixtures can complete pre-survey and download PDFs", async ({ page }) => {
  test.setTimeout(900_000);
  mkdirSync(DOWNLOAD_DIR, { recursive: true });

  await saveBranding(page);
  for (const fixture of FIXTURES) {
    await createCaseFromRealDiscovery(page, fixture);
    await expect(page.getByRole("region", { name: "本次調閱費用" })).toContainText("0 元");
    await preparePdfReview(page, fixture);
    await downloadAndAssertPdf(page, fixture);
  }
});

async function saveBranding(page: Page) {
  await page.goto("/settings/branding");
  await page.getByLabel("承辦人").fill("王承辦");
  await page.getByLabel("經紀人", { exact: true }).fill("陳經紀");
  await page.getByLabel("經紀人證號").fill("南市經紀人字第 000001 號");
  await page.getByLabel("不動產經紀業").fill("真實前查測試不動產經紀有限公司");
  await page.getByLabel("經紀業證號").fill("南市經紀業字第 000001 號");
  await page.getByLabel("公司地址").fill("台南市東區裕農路1號");
  await page.getByLabel("公司電話").fill("06-123-4567");
  await page.getByTestId("logo-file-input").setInputFiles({
    name: "aire-real-e2e-logo-nine.png",
    mimeType: "image/png",
    buffer: TEST_PNG,
  });
  await expect(page.getByText("已保存 Logo")).toBeVisible();
  await page.getByRole("button", { name: "儲存品牌資訊" }).click();
  await expect(page.getByText("品牌資訊已儲存")).toBeVisible();
}

async function createCaseFromRealDiscovery(page: Page, fixture: RealFixture) {
  await page.goto("/cases/new");
  await page.getByLabel("地址 *").fill(fixture.address);
  await page.getByLabel("所有權人（選填）").fill(fixture.owner);
  await page.getByLabel("案件名稱（選填）").fill(fixture.caseName);
  await page.getByLabel("案件編號（選填）").fill(fixture.caseNo);

  await page.getByRole("button", { name: "查詢物件資料", exact: true }).click();
  const candidateGroup = page.getByRole("radiogroup", { name: "候選物件資料" });
  if (await candidateGroup.isVisible().catch(() => false)) {
    const firstOption = candidateGroup.getByRole("radio").first();
    await firstOption.check();
  }
  await expect(page.getByTestId("case-lot-inputs")).toBeVisible();

  await page.getByRole("button", { name: "建立案件", exact: true }).click();
  await expect(page).toHaveURL(/\/cases\/(?:[0-9a-f-]+|_\?caseId=[0-9a-f-]+)$/);
  await expect(page.getByRole("region", { name: "物件摘要" })).toContainText(fixture.address);
}

async function preparePdfReview(page: Page, fixture: RealFixture) {
  await page.getByRole("tab", { name: "補件與現場" }).click();
  await page.getByLabel("地籍圖上傳").setInputFiles({
    name: `${fixture.caseNo}-cadastral-placeholder.pdf`,
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\n% AIRE real pre-survey e2e placeholder\n"),
  });
  await page.getByRole("button", { name: "加入補件清單" }).click();
  await expect(page.getByText("已加入補件清單")).toBeVisible();

  await page.getByRole("tab", { name: "PDF 檢查" }).click();
  const pdfCheck = page.getByRole("region", { name: "PDF 檢查內容" });
  await expect(pdfCheck).toBeVisible();
  if (fixture.floor) {
    await pdfCheck.getByLabel("樓層").fill(fixture.floor);
  }
  if (fixture.managementFee) {
    await pdfCheck.getByLabel("管理費（元/月）").fill(fixture.managementFee);
  }
  await pdfCheck.getByRole("button", { name: "儲存 PDF 審核內容" }).click();
  await expect(pdfCheck).toContainText("已保存 PDF 前置審核內容");
}

async function downloadAndAssertPdf(page: Page, fixture: RealFixture) {
  await page.getByRole("link", { name: "完成並預覽 PDF" }).click();
  await expect(page).toHaveURL(/\/cases\/(?:[0-9a-f-]+\/preview|_\/preview\?caseId=[0-9a-f-]+)$/);
  await expect(page.getByRole("heading", { name: "PDF 預覽" })).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "匯出 PDF" }).click();
  const download = await downloadPromise;
  const downloadPath = join(DOWNLOAD_DIR, `${fixture.caseNo}-說明書.pdf`);
  await download.saveAs(downloadPath);

  expect(existsSync(downloadPath)).toBe(true);
  expect(readFileSync(downloadPath).subarray(0, 4).toString()).toBe("%PDF");

  const pdfText = execFileSync("pdftotext", [downloadPath, "-"], { encoding: "utf8" });
  for (const text of fixture.expectedPdfText) {
    expect(pdfText).toContain(text);
  }
  expect(pdfText).toContain("真實前查測試不動產經紀有限公司");
  expect(pdfText).not.toContain("candidate_data_available");
  expect(pdfText).not.toContain("COP309");
  expect(pdfText).not.toContain("MOI_API_");
}
