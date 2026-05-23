import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const YUNONG_ADDRESS = "台南市東區裕農路288巷17號8樓之1";
const CASE_NO = "AIRE-YUNONG-CANDIDATE-20260523";
const DOWNLOAD_DIR = join(homedir(), "Downloads");
const DOWNLOAD_PATH = join(DOWNLOAD_DIR, `${CASE_NO}-說明書.pdf`);

test.use({ baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000" });

test.beforeEach(async ({ page }) => {
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

test("Yunong pre-survey keeps all candidates, selects one, and exports PDF values/images", async ({ page }) => {
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
  await page.getByRole("button", { name: "判斷地政資料", exact: true }).click();

  await expect(page.getByText("土地 1 筆 · 建物 4 筆")).toBeVisible();
  await expect(page.getByLabel("物件類型")).toBeVisible();
  await page.getByRole("button", { name: "建立案件", exact: true }).click();

  await expect(page).toHaveURL(/\/cases\/[0-9a-f-]+$/);
  await page.getByRole("tab", { name: "資料來源" }).click();

  const candidateRegion = page.getByRole("region", { name: "候選土地建物清單" });
  await expect(candidateRegion).toBeVisible();
  for (const id of [
    "DC-1556-00700000",
    "DC-1556-00165000",
    "DC-1556-00167000",
    "DC-1556-00229000",
    "DC-1556-00230000",
  ]) {
    await expect(candidateRegion.getByText(id, { exact: true }).first()).toBeVisible();
  }
  await expect(candidateRegion.getByText(/31\.25坪/).first()).toBeVisible();
  await expect(candidateRegion.getByText(/COP312/).first()).toBeVisible();
  await expect(candidateRegion.getByText(/COP305/).first()).toBeVisible();

  await candidateRegion.getByRole("button", { name: "暫用 DC-1556-00165000" }).click();
  await page.getByText("JSON 預覽").click();
  await expect(page.getByText(/selected_candidate/)).toBeVisible();

  await page.getByRole("link", { name: "預覽 PDF" }).click();
  await expect(page).toHaveURL(/\/cases\/[0-9a-f-]+\/preview$/);
  await expect(page.getByRole("heading", { name: "PDF 預覽" })).toBeVisible();
  await expect(page.getByTitle("PDF 預覽")).toBeVisible({ timeout: 60_000 });

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "匯出 PDF" }).click();
  const download = await downloadPromise;
  await download.saveAs(DOWNLOAD_PATH);
  expect(download.suggestedFilename()).toBe(`${CASE_NO}-說明書.pdf`);

  const pdfText = execFileSync("pdftotext", [DOWNLOAD_PATH, "-"], { encoding: "utf8" });
  expect(pdfText).toContain("地政資料，最終以正式謄本為主；本說明書不代表完整資訊。");
  expect(pdfText).toMatch(/31\.25|31\.250/);
  expect(pdfText).toMatch(/23\.10|23\.1/);
  expect(pdfText).toContain("住家用");
  expect(pdfText).toContain("083/10/18");
  expect(pdfText).toContain("8樓之1");
  expect(pdfText).toContain("DC-1556-00165000");
  expect(pdfText).toContain("推測資料");

  const imageList = execFileSync("pdfimages", ["-list", DOWNLOAD_PATH], { encoding: "utf8" });
  const imageRows = imageList.split("\n").filter((line) => /\bimage\b/.test(line));
  expect(imageRows.length).toBeGreaterThanOrEqual(2);
  const mapImageRows = imageRows.filter((line) => /\b600\s+400\b/.test(line));
  expect(mapImageRows.length).toBeGreaterThanOrEqual(2);
  const logoRows = imageRows.filter((line) => /\b1024\s+1024\b/.test(line));
  expect(imageRows.length - logoRows.length).toBeGreaterThanOrEqual(2);
});
