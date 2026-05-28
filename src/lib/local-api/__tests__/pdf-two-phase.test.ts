/**
 * PDF 兩階段：Node 端接收前端渲染 bytes → 原子寫檔
 *
 * 場景（依 Design Decision 9）：
 *   - 草稿 PDF：前端已渲染 → base64 傳入 → Node 原子寫到 pdf/draft/
 *   - 說明書 PDF：前端已渲染（含補件+簽名頁）→ base64 傳入 → Node 原子寫到 pdf/official/
 *
 * 測試驗證：
 *   1. writeDraftPdf / writeOfficialPdf 不拋錯
 *   2. outputPath 存在且以 .pdf 結尾，位於 draft/ 或 official/ 子目錄
 *   3. 實際寫入內容與傳入 bytes 相符（不是空檔）
 *   4. 說明書比草稿大（bytes 更多）
 *   5. 兩份路徑不同（區分草稿與說明書）
 *
 * 注意：Node 端不做任何渲染，只做 base64 解碼 + 原子寫檔。
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { DraftPdfRequest, OfficialPdfRequest } from "@/lib/local-api/contract";
import { writeDraftPdf, writeOfficialPdf } from "@/lib/local-api/pdf-write-service";

// ──────────────────────────────────────────────────────────────────────────────
// 測試用假 PDF bytes（模擬前端 @react-pdf/renderer 渲染輸出）
// ──────────────────────────────────────────────────────────────────────────────

/**
 * 最小合法 PDF 結構（PDF 1.4 header + 空 xref + trailer）。
 * 用於模擬前端渲染輸出，確保 Node 端寫入的是真實 bytes 而非空檔。
 */
const MOCK_DRAFT_PDF_BYTES = Buffer.from(
  "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\nxref\n0 2\n0000000000 65535 f \n0000000009 00000 n \ntrailer\n<< /Size 2 /Root 1 0 R >>\nstartxref\n9\n%%EOF\n草稿書測試內容",
  "utf-8",
);

/**
 * 說明書 bytes = 草稿 + 補件與簽名頁（模擬比草稿大）。
 */
const MOCK_OFFICIAL_PDF_BYTES = Buffer.from(
  "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\nxref\n0 2\n0000000000 65535 f \n0000000009 00000 n \ntrailer\n<< /Size 2 /Root 1 0 R >>\nstartxref\n9\n%%EOF\n說明書測試內容（草稿+補件+簽名頁，bytes 較草稿大）",
  "utf-8",
);

const MOCK_DRAFT_BASE64 = MOCK_DRAFT_PDF_BYTES.toString("base64");
const MOCK_OFFICIAL_BASE64 = MOCK_OFFICIAL_PDF_BYTES.toString("base64");

// ──────────────────────────────────────────────────────────────────────────────
// 測試用模擬 API 資料快照
// ──────────────────────────────────────────────────────────────────────────────

const MOCK_REGISTRY_SNAPSHOT = {
  land_registry: {
    success: true,
    data: {
      section_name: "東光段",
      land_no: "0101",
      land_area_sqm: "150.5",
      announced_land_value: "2000000",
    },
    source: "api" as const,
  },
};

/** 草稿 PDF 請求（含前端渲染 bytes） */
const DRAFT_REQUEST: DraftPdfRequest = {
  caseId: "test-case-two-phase-001",
  pdfBase64: MOCK_DRAFT_BASE64,
  registrySnapshot: MOCK_REGISTRY_SNAPSHOT,
  propertyType: "residential",
  branding: {
    companyName: "測試不動產仲介有限公司",
    agentName: "測試業務員",
    companyPhone: "06-1234567",
  },
};

/** 說明書 PDF 請求（草稿基礎 + 補件 + 簽名頁，bytes 較大） */
const OFFICIAL_REQUEST: OfficialPdfRequest = {
  ...DRAFT_REQUEST,
  pdfBase64: MOCK_OFFICIAL_BASE64,
  supplements: [
    {
      fieldName: "floor_plan",
      value: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      kind: "image",
    },
    {
      fieldName: "renovation_note",
      value: "2022年重新裝潢，全室換新地板與衛浴",
      kind: "text",
    },
  ],
  signaturePage: {
    customerName: "測試客戶王大明",
    signedAt: "2026-05-28T10:00:00+08:00",
    signatureImageBase64: undefined,
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// 測試環境設定：使用 /tmp 目錄，測完清除
// ──────────────────────────────────────────────────────────────────────────────

let tmpDir: string;

beforeEach(() => {
  // 覆蓋 AIRE_DATA_DIR 指向 /tmp，避免污染真實資料目錄
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "aire-pdf-test-"));
  process.env.AIRE_DATA_DIR = tmpDir;
});

afterEach(() => {
  // 還原環境變數，清除暫目錄
  delete process.env.AIRE_DATA_DIR;
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ──────────────────────────────────────────────────────────────────────────────
// 測試案例
// ──────────────────────────────────────────────────────────────────────────────

describe("PDF 兩階段：Node 原子寫檔（Decision 9）", () => {
  it("草稿 PDF：writeDraftPdf 原子寫檔到 pdf/draft/，回傳有效 PdfWriteResponse", async () => {
    const result = await writeDraftPdf(DRAFT_REQUEST);

    // 回傳結構完整
    expect(result.outputPath, "outputPath 應有值").toBeTruthy();
    expect(result.outputPath, "outputPath 應以 .pdf 結尾").toMatch(/\.pdf$/i);
    expect(result.sizeBytes, "sizeBytes 應大於 0").toBeGreaterThan(0);
    expect(result.writtenAt, "writtenAt 應為 ISO 字串").toBeTruthy();

    // 路徑在 draft/ 子目錄
    expect(result.outputPath, "路徑應含 draft 子目錄").toContain(path.sep + "draft" + path.sep);

    // 路徑在測試資料目錄（或 /tmp）
    expect(result.outputPath, "路徑應在測試資料目錄").toContain(tmpDir);

    // 檔案確實存在
    expect(fs.existsSync(result.outputPath), "輸出 PDF 檔案應確實存在").toBe(true);

    // 內容與傳入 bytes 相符（非空檔、非亂數）
    const written = fs.readFileSync(result.outputPath);
    expect(written, "寫入內容應與傳入 bytes 完全相符").toEqual(MOCK_DRAFT_PDF_BYTES);
  });

  it("說明書 PDF：writeOfficialPdf 寫到 pdf/official/，路徑不同且 bytes 較草稿大", async () => {
    const [draftResult, officialResult] = await Promise.all([
      writeDraftPdf(DRAFT_REQUEST),
      writeOfficialPdf(OFFICIAL_REQUEST),
    ]);

    // 兩個 PDF 都成功寫檔
    expect(draftResult.outputPath, "草稿 outputPath 應有值").toBeTruthy();
    expect(officialResult.outputPath, "說明書 outputPath 應有值").toBeTruthy();

    // 路徑分別在 draft/ 和 official/ 子目錄
    expect(draftResult.outputPath, "草稿路徑應含 draft").toContain(path.sep + "draft" + path.sep);
    expect(officialResult.outputPath, "說明書路徑應含 official").toContain(path.sep + "official" + path.sep);

    // 說明書比草稿大（前端已在渲染時加入補件與簽名頁）
    expect(
      officialResult.sizeBytes,
      "說明書 bytes 應大於草稿（含補件與簽名頁）",
    ).toBeGreaterThan(draftResult.sizeBytes);

    // 輸出路徑不同（區分草稿與說明書）
    expect(officialResult.outputPath, "草稿與說明書路徑應不同").not.toBe(draftResult.outputPath);

    // 說明書內容與傳入 bytes 相符
    const written = fs.readFileSync(officialResult.outputPath);
    expect(written, "說明書寫入內容應與傳入 bytes 完全相符").toEqual(MOCK_OFFICIAL_PDF_BYTES);
  });

  it("pdfBase64 為空時，writeDraftPdf 應拋錯而非寫空檔", async () => {
    const badReq: DraftPdfRequest = { ...DRAFT_REQUEST, pdfBase64: "" };
    await expect(writeDraftPdf(badReq)).rejects.toThrow("pdfBase64 不得為空");
  });

  it("支援 data URI 前綴格式（data:application/pdf;base64,...）", async () => {
    const withPrefix: DraftPdfRequest = {
      ...DRAFT_REQUEST,
      pdfBase64: `data:application/pdf;base64,${MOCK_DRAFT_BASE64}`,
    };
    const result = await writeDraftPdf(withPrefix);
    expect(fs.existsSync(result.outputPath)).toBe(true);
    const written = fs.readFileSync(result.outputPath);
    expect(written).toEqual(MOCK_DRAFT_PDF_BYTES);
  });
});
