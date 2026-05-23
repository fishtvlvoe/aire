import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const YUNONG_ADDRESS = "台南市東區裕農路288巷17號8樓之1";
const CASE_NO = "AIRE-YUNONG-20260523";
const DOWNLOAD_DIR = join(homedir(), "Downloads");
const DOWNLOAD_PATH = join(DOWNLOAD_DIR, `${CASE_NO}-說明書.pdf`);

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
    if (!window.localStorage.getItem("aire-mock-store")) {
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
    }
  });
});

test("visible Yunong pre-survey flow creates a case, records supplements, previews PDF, and exports it", async ({ page }) => {
  test.setTimeout(60_000);
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
  await page.getByLabel("案件名稱（選填）").fill("裕農路物調驗收");
  await page.getByLabel("案件編號（選填）").fill(CASE_NO);

  await page.getByRole("button", { name: "判斷地政資料", exact: true }).click();
  await expect(page.getByText("土地 1 筆 · 建物 4 筆")).toBeVisible();
  await expect(page.getByTestId("case-lot-inputs").getByPlaceholder("地號（如 123-4）").first()).toHaveValue("");

  await page.getByRole("button", { name: "建立案件", exact: true }).click();
  await expect(page).toHaveURL(/\/cases\/[0-9a-f-]+$/);
  await expect(page.getByRole("region", { name: "物件摘要" })).toContainText(YUNONG_ADDRESS);
  await expect(page.getByRole("region", { name: "欄位審核" })).toContainText("待確認");
  await expect(page.getByRole("region", { name: "欄位審核" })).toContainText("查詢未成功");
  await expect(page.getByRole("region", { name: "本次調閱費用" })).toContainText("0 元");
  await expect(page.getByText("MOI_API_")).toHaveCount(0);
  await expect(page.getByText("COP309")).toHaveCount(0);

  await page.getByRole("tab", { name: "補件/現場" }).click();
  await page.getByLabel("姓名比對結果補件值").fill("蔡國卿");
  await page.getByLabel("姓名比對結果補件來源").selectOption("屋主提供");
  await page.getByLabel("姓名比對結果補件狀態").selectOption("已補");
  await expect(page.getByLabel("姓名比對結果補件值")).toHaveValue("蔡國卿");
  await page.getByLabel("建物現況回答").fill("現場尚待屋主確認漏水與增建狀況。");
  await page.getByLabel("建物現況狀態").selectOption("加入補件");
  await page.getByLabel("地籍圖上傳").setInputFiles({
    name: "yunong-cadastral-placeholder.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\n% AIRE acceptance placeholder\n"),
  });
  await page.getByRole("button", { name: "加入補件清單" }).click();
  await expect(page.getByText("已加入補件清單")).toBeVisible();

  await page.getByRole("tab", { name: "資料來源" }).click();
  await expect(page.getByText("JSON 預覽")).toBeVisible();
  await page.getByText("JSON 預覽").click();
  await expect(page.getByText('"value": "蔡國卿"')).toBeVisible();

  await page.getByRole("tab", { name: "PDF 檢查" }).click();
  await expect(page.getByText("已上傳圖資：1 項")).toBeVisible();
  await page.getByRole("link", { name: "開啟 PDF 預覽" }).click();

  await expect(page).toHaveURL(/\/cases\/[0-9a-f-]+\/preview$/);
  await expect(page.getByRole("heading", { name: "PDF 預覽" })).toBeVisible();
  await expect(page.getByTitle("PDF 預覽")).toBeVisible({ timeout: 60_000 });

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "匯出 PDF" }).click();
  const download = await downloadPromise;
  await download.saveAs(DOWNLOAD_PATH);

  expect(download.suggestedFilename()).toBe(`${CASE_NO}-說明書.pdf`);
});
