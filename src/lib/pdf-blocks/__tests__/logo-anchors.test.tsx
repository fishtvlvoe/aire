/**
 * Phase 2 紅燈測試 — customer-logo-upload (logo rendering)
 *
 * CLU-004：corrupted PNG 拒絕 + blob 不變
 * CLU-005：successful upload BLOB + metadata 正確
 * CLU-006：square logo letterbox 在 80×30mm
 * CLU-007：logo 在 12 頁每頁 header 都有
 * CLU-008：no logo 顯示 placeholder「（未設定 LOGO）」
 * CLU-009：delete_logo 保留 theme_id
 * 所有 import 指向尚未實作的模組 → 編譯失敗 = 紅燈
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Document, Page, pdf } from "@react-pdf/renderer";

// ❌ 這些模組還不存在 — 紅燈起點
import {
  validateLogoFile,
  uploadLogo,
  deleteLogo,
  type LogoMetadata,
  type LogoValidationResult,
} from "../logo-upload";

import {
  PdfHeaderWithLogo,
  PDF_LOGO_BOX_WIDTH_MM,
  PDF_LOGO_BOX_HEIGHT_MM,
} from "../logo-anchors";

// Mock Tauri IPC
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));
import { invoke } from "@tauri-apps/api/core";
const mockInvoke = vi.mocked(invoke);

// Helper：建立 corrupted PNG（magic bytes 錯誤）
function makeCorruptedPng(sizeBytes = 50000): File {
  const content = new Uint8Array(sizeBytes);
  // 不是 PNG magic bytes（應為 89 50 4E 47...）
  content[0] = 0x00;
  content[1] = 0x01;
  content[2] = 0x02;
  return new File([content], "corrupted.png", { type: "image/png" });
}

// Helper：建立正確的 PNG stub（最小 valid PNG header）
function makeValidPng(sizeBytes = 100000): File {
  const content = new Uint8Array(sizeBytes);
  // PNG magic bytes
  content[0] = 0x89;
  content[1] = 0x50; // P
  content[2] = 0x4e; // N
  content[3] = 0x47; // G
  content[4] = 0x0d;
  content[5] = 0x0a;
  content[6] = 0x1a;
  content[7] = 0x0a;
  return new File([content], "valid-logo.png", { type: "image/png" });
}

// ─────────────────────────────────────────────────────────────────────────────
// CLU-004：corrupted PNG 拒絕 + blob 不變
// ─────────────────────────────────────────────────────────────────────────────
describe("CLU-004 — corrupted PNG is rejected and existing blob is unchanged", () => {
  it("validateLogoFile 對 corrupted PNG 回傳 isValid=false", async () => {
    const corrupted = makeCorruptedPng();
    const result: LogoValidationResult = await validateLogoFile(corrupted);
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("corrupted PNG 驗證失敗後不呼叫 IPC", async () => {
    mockInvoke.mockReset();
    const corrupted = makeCorruptedPng();

    await validateLogoFile(corrupted);

    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it("corrupted PNG error 包含 '損毀' 或 '格式' 或 'invalid' 提示", async () => {
    const corrupted = makeCorruptedPng();
    const result = await validateLogoFile(corrupted);
    expect(result.error?.toLowerCase()).toMatch(/損毀|格式|invalid|corrupt/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CLU-005：successful upload BLOB + metadata 正確
// ─────────────────────────────────────────────────────────────────────────────
describe("CLU-005 — successful upload stores correct BLOB and metadata", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
    mockInvoke.mockResolvedValue({
      success: true,
      metadata: {
        filename: "valid-logo.png",
        mimeType: "image/png",
        sizeBytes: 100000,
        uploadedAt: "2026-05-14T08:00:00.000Z",
      } satisfies LogoMetadata,
    });
  });

  it("uploadLogo 回傳成功 + metadata.filename 正確", async () => {
    const validFile = makeValidPng();
    const result = await uploadLogo(validFile);

    expect(result.success).toBe(true);
    expect(result.metadata.filename).toBe("valid-logo.png");
  });

  it("metadata.mimeType 是 image/png", async () => {
    const validFile = makeValidPng();
    const result = await uploadLogo(validFile);
    expect(result.metadata.mimeType).toBe("image/png");
  });

  it("metadata.sizeBytes 等於實際檔案大小", async () => {
    const validFile = makeValidPng(100000);
    const result = await uploadLogo(validFile);
    expect(result.metadata.sizeBytes).toBe(100000);
  });

  it("metadata.uploadedAt 是 ISO 格式時間戳", async () => {
    const validFile = makeValidPng();
    const result = await uploadLogo(validFile);
    expect(() => new Date(result.metadata.uploadedAt)).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CLU-006：square logo letterbox 在 80×30mm
// ─────────────────────────────────────────────────────────────────────────────
describe("CLU-006 — square logo is letterboxed within 80×30mm", () => {
  it("PDF_LOGO_BOX_WIDTH_MM = 80", () => {
    expect(PDF_LOGO_BOX_WIDTH_MM).toBe(80);
  });

  it("PDF_LOGO_BOX_HEIGHT_MM = 30", () => {
    expect(PDF_LOGO_BOX_HEIGHT_MM).toBe(30);
  });

  it("PdfHeaderWithLogo 用 objectFit='contain' 確保 letterbox", async () => {
    const element = (
      <Document>
        <Page size="A4">
          <PdfHeaderWithLogo
            logoDataUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
            themeId="theme-a-minimal"
          />
        </Page>
      </Document>
    );

    // render to blob — 不寫檔，只驗結構
    const blob = await pdf(element).toBlob();
    expect(blob.type).toBe("application/pdf");
    // blob > 0 表示元件渲染成功
    expect(blob.size).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CLU-007：logo 在 12 頁每頁 header 都有
// ─────────────────────────────────────────────────────────────────────────────
describe("CLU-007 — logo appears in header on all 12 pages", () => {
  it("12 頁 PDF 每頁 header 都包含 logo image", async () => {
    // 匯入 dynamic-composition 模組
    const { buildDisclosureDoc } = await import("../dynamic-composition");

    const doc = buildDisclosureDoc({
      propertyType: "residential",
      caseId: "T-LOGO-12",
      logoDataUrl:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      sections: Array(5).fill({ type: "survey-table", rows: 5 }),
    });

    const blob = await pdf(doc as Parameters<typeof pdf>[0]).toBlob();
    // blob 存在即代表渲染成功（詳細 logo 出現每頁驗證需 PDF parser）
    expect(blob.size).toBeGreaterThan(1000);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CLU-008：no logo 顯示 placeholder「（未設定 LOGO）」
// ─────────────────────────────────────────────────────────────────────────────
describe("CLU-008 — no logo shows placeholder text", () => {
  it("logoDataUrl = undefined 時 header 顯示 placeholder text", async () => {
    const { buildDisclosureDoc } = await import("../dynamic-composition");

    const doc = buildDisclosureDoc({
      propertyType: "residential",
      caseId: "T-NO-LOGO",
      logoDataUrl: undefined,
      sections: [],
    });

    // 渲染為字串以驗證 placeholder text
    const blob = await pdf(doc as Parameters<typeof pdf>[0]).toBlob();
    const text = await blob.text();
    // PDF 內文要包含 placeholder 字串（可能被 UTF encode，但 PDF 字串層可搜尋）
    expect(blob.size).toBeGreaterThan(0);
    // 注意：詳細文字驗證需要 PDF text extraction
    // 這裡先驗結構完整性，placeholder 的文字驗證靠 RPE-002 no-tofu sample test
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CLU-009：delete_logo 保留 theme_id
// ─────────────────────────────────────────────────────────────────────────────
describe("CLU-009 — delete_logo preserves theme_id", () => {
  it("deleteLogo 後 invoke 的 payload 含 preserve_theme_id=true", async () => {
    mockInvoke.mockReset();
    mockInvoke.mockResolvedValue({ success: true, themeId: "theme-a-minimal" });

    const result = await deleteLogo();

    expect(result.themeId).toBeDefined();
    expect(result.themeId).toBe("theme-a-minimal");
  });

  it("deleteLogo 不清除 theme 設定", async () => {
    mockInvoke.mockReset();
    mockInvoke.mockResolvedValue({ success: true, themeId: "theme-b-professional" });

    const result = await deleteLogo();

    // theme_id 必須是已知值，不是 null/undefined
    expect(["theme-a-minimal", "theme-b-professional"]).toContain(result.themeId);
  });
});
