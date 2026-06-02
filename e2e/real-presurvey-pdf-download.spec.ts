import { expect, type Page, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const DOWNLOAD_DIR = join(homedir(), "Downloads");
const E2E_RUN_ID = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const TEST_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

type RealFixture = {
  address: string;
  caseName: string;
  caseNo: string;
  owner: string;
  expectedSummary: RegExp;
  expectedPdfText: string[];
  floor?: string;
  managementFee?: string;
  fallbackLotNo?: string;
};

const FIXTURES: RealFixture[] = [
  {
    address: "台南市東區裕農路288巷17號8樓之1",
    caseName: "裕農路大樓真實前查驗收",
    caseNo: "AIRE-REAL-YUNONG-20260531",
    owner: "蔡國卿",
    expectedSummary: /土地\s*1\s*筆.*建物\s*1\s*筆|已找到\s*1\s*筆土地、1\s*筆建物/,
    expectedPdfText: ["裕農路大樓真實前查驗收", "台南市東區裕農路288巷17號8樓之1", "8樓之1"],
    floor: "8樓之1",
    managementFee: "3000",
    fallbackLotNo: "00700000",
  },
  {
    address: "台南市南化區南化段850-1地號",
    caseName: "南化段土地真實前查驗收",
    caseNo: "AIRE-REAL-NANHUA-LAND-20260531",
    owner: "土地所有權人待確認",
    expectedSummary: /土地\s*1\s*筆|已找到\s*1\s*筆土地/,
    expectedPdfText: ["南化段土地真實前查驗收", "台南市南化區南化段850-1地號", "南化段"],
    fallbackLotNo: "08500001",
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
    const resetKey = "aire-real-presurvey-pdf-download-run-id";
    if (window.localStorage.getItem(resetKey) !== runId) {
      window.localStorage.removeItem("aire-mock-store");
      window.localStorage.setItem(resetKey, runId);
    }
    const existingRaw = window.localStorage.getItem("aire-mock-store");
    const existing = existingRaw ? JSON.parse(existingRaw) as Record<string, unknown> : {};
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

test("real pre-survey creates building and land drafts, then downloads both PDFs", async ({ page }) => {
  test.setTimeout(180_000);
  mkdirSync(DOWNLOAD_DIR, { recursive: true });

  await saveBranding(page);

  for (const fixture of FIXTURES) {
    await createCaseFromRealDiscovery(page, fixture);
    await expect(page.getByRole("region", { name: "本次調閱費用" })).toContainText("0 元");
    await expect(page.getByText("MOI_API_")).toHaveCount(0);
    await expect(page.getByText("COP309")).toHaveCount(0);

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
    name: "aire-real-e2e-logo.png",
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
  await expect(page.getByText(fixture.expectedSummary).first()).toBeVisible({ timeout: 70_000 });
  await expect(page.getByTestId("case-lot-inputs")).toBeVisible();
  const lotInput = page.getByTestId("case-lot-inputs").getByPlaceholder("地號（如 123-4）").first();
  if (!(await lotInput.inputValue()) && fixture.fallbackLotNo) {
    await lotInput.fill(fixture.fallbackLotNo);
  }
  await expect(lotInput).toHaveValue(/\d{8}/);

  await page.getByRole("button", { name: "建立案件", exact: true }).click();
  await expect(page).toHaveURL(/\/cases\/(?:[0-9a-f-]+|_\?caseId=[0-9a-f-]+)$/);
  await expect(page.getByRole("region", { name: "物件摘要" })).toContainText(fixture.address);
  await expect(page.getByRole("region", { name: "欄位審核" })).toBeVisible();
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
  await expect(page.getByTitle("PDF 預覽")).toBeVisible({ timeout: 60_000 });

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "匯出 PDF" }).click();
  const download = await downloadPromise;
  const downloadPath = join(DOWNLOAD_DIR, `${fixture.caseNo}-說明書.pdf`);
  await download.saveAs(downloadPath);

  expect(download.suggestedFilename()).toBe(`${fixture.caseNo}-說明書.pdf`);
  expect(existsSync(downloadPath)).toBe(true);
  expect(readFileSync(downloadPath).subarray(0, 4).toString()).toBe("%PDF");

  const pdfText = execFileSync("pdftotext", [downloadPath, "-"], { encoding: "utf8" });
  for (const text of fixture.expectedPdfText) {
    expect(pdfText).toContain(text);
  }
  expect(pdfText).toContain("真實前查測試不動產經紀有限公司");
  expect(pdfText).toContain("待補");
  expect(pdfText).not.toContain("（未設定 LOGO）");
  expect(pdfText).not.toContain("物調表資料狀態");
  expect(pdfText).not.toContain("候選資料比較");
  expect(pdfText).not.toContain("candidate_data_available");
  expect(pdfText).not.toContain("unconfirmed");
  expect(pdfText).not.toContain("來源：PDF 前置審核");
  expect(pdfText).not.toContain("地政資料，最終以正式謄本為主");
  expect(pdfText).not.toContain("COP309");
  expect(pdfText).not.toContain("MOI_API_");
}
