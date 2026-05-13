/**
 * pdf-renderer 缺檔 graceful failure 測試（Group 8.3）
 *
 * 用 mock loader 模擬：
 * - 底板 PDF 不存在 → TemplateNotFoundError
 * - 字型 不存在 → FontNotFoundError
 */

import { describe, it, expect } from "vitest";
import {
  renderDisclosurePdf,
  TemplateNotFoundError,
  FontNotFoundError,
  generatePdfFileName,
  type RenderInput,
  type BinaryAssetLoader,
} from "./pdf-renderer";

const baseInput: RenderInput = {
  propertyType: "residential",
  caseInfo: {
    case_no: "T-001",
    land_lot_no: "L-1",
    address: "台北市測試區某路 1 號",
    generated_at: "2026-05-14T08:00:00.000Z",
  },
  company: { name: "測試公司" },
  payload: {},
};

class FakeFetchError extends Error {
  constructor(
    public path: string,
    public status: number,
  ) {
    super(`fake fetch ${status}`);
  }
}

describe("renderDisclosurePdf - 缺檔 graceful failure", () => {
  it("底板 PDF 缺檔丟 TemplateNotFoundError", async () => {
    const loader: BinaryAssetLoader = async (p) => {
      // 模擬所有資源都 404（含底板）
      throw new FakeFetchError(p, 404);
    };
    await expect(
      renderDisclosurePdf(baseInput, { loader }),
    ).rejects.toBeInstanceOf(TemplateNotFoundError);
  });

  it("字型缺檔（底板正常）丟 FontNotFoundError", async () => {
    // 載底板用一份最小可用的空 PDF（pdf-lib 可解析）— 用 PDFDocument.create
    const { PDFDocument } = await import("pdf-lib");
    const emptyDoc = await PDFDocument.create();
    emptyDoc.addPage([595, 842]);
    const emptyBytes = await emptyDoc.save();

    const loader: BinaryAssetLoader = async (p) => {
      if (p.endsWith(".pdf")) return emptyBytes.buffer.slice(0) as ArrayBuffer;
      // 字型 fetch 失敗
      throw new FakeFetchError(p, 404);
    };
    await expect(
      renderDisclosurePdf(baseInput, { loader }),
    ).rejects.toBeInstanceOf(FontNotFoundError);
  });
});

describe("generatePdfFileName", () => {
  it("用 case_no + propertyType + 台北日期", () => {
    const name = generatePdfFileName(baseInput);
    // generated_at = 2026-05-14T08:00:00Z = 台北時間 2026-05-14 16:00
    expect(name).toBe("T-001_residential_20260514.pdf");
  });

  it("缺 case_no 回退到 AIRE 前綴", () => {
    const name = generatePdfFileName({
      ...baseInput,
      caseInfo: { ...baseInput.caseInfo, case_no: undefined },
    });
    expect(name).toMatch(/^AIRE_residential_\d{8}\.pdf$/);
  });
});
