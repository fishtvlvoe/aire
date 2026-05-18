/**
 * Phase 2 紅燈測試 — dynamic-page-composition
 *
 * DPC-001 ~ DPC-009：頁面數量、ConditionalSection、圖片分頁、表格換行、typed error
 * 所有 import 指向尚未實作的模組 → 編譯失敗 = 紅燈
 */

import { describe, it, expect } from "vitest";
import { pdf } from "@react-pdf/renderer";

// ❌ 這個模組還不存在 — 紅燈起點
import {
  buildDisclosureDoc,
  countPages,
  type DisclosureDocOptions,
  type PageCountResult,
} from "../dynamic-composition";

// PDF page count helper（用 @react-pdf render blob 後用 regex 粗估）
async function renderAndCountPages(options: DisclosureDocOptions): Promise<number> {
  const doc = buildDisclosureDoc(options);
  const blob = await pdf(doc as Parameters<typeof pdf>[0]).toBlob();
  const text = await blob.text();
  // PDF 內 /Type /Page 出現次數 ≈ 頁數（不含 /Type /Pages 的 root）
  const matches = text.match(/\/Type\s*\/Page[^s]/g);
  return matches ? matches.length : 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// DPC-001：minimum residential = 5 pages
// ─────────────────────────────────────────────────────────────────────────────
describe("DPC-001 — minimum residential disclosure has at least 5 pages", () => {
  it("空 sections 的成屋說明書至少 5 頁", async () => {
    const pageCount = await renderAndCountPages({
      propertyType: "residential",
      caseId: "T-MIN",
      sections: [],
    });
    expect(pageCount).toBeGreaterThanOrEqual(5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DPC-002：maximum land = 19 pages
// ─────────────────────────────────────────────────────────────────────────────
describe("DPC-002 — maximum land disclosure does not exceed 19 pages", () => {
  it("完整 sections 的土地說明書不超過 19 頁", async () => {
    const pageCount = await renderAndCountPages({
      propertyType: "land",
      caseId: "T-MAX",
      sections: Array(20).fill({ type: "survey-table", rows: 3 }),
    });
    expect(pageCount).toBeLessThanOrEqual(19);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DPC-003：ConditionalSection condition=false → 0 pages
// ─────────────────────────────────────────────────────────────────────────────
describe("DPC-003 — ConditionalSection with condition=false contributes 0 pages", () => {
  it("condition=false 的 conditional section 不增加頁數", async () => {
    const baseCount = await renderAndCountPages({
      propertyType: "residential",
      caseId: "T-COND-BASE",
      sections: [],
    });

    const withFalseCondition = await renderAndCountPages({
      propertyType: "residential",
      caseId: "T-COND-FALSE",
      sections: [
        {
          type: "conditional",
          condition: false,
          content: { type: "survey-table", rows: 10 },
        },
      ],
    });

    expect(withFalseCondition).toBe(baseCount);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DPC-004：5 photos = 2 pages（含 3 empty cells）
// ─────────────────────────────────────────────────────────────────────────────
describe("DPC-004 — 5 photos render as exactly 2 pages with 3 empty cells", () => {
  it("5 張照片產生 2 頁照片頁", async () => {
    const result: PageCountResult = countPages({
      propertyType: "residential",
      caseId: "T-PHOTOS",
      sections: [
        {
          type: "photo-grid",
          photos: Array(5).fill("data:image/png;base64,fake"),
        },
      ],
    });

    expect(result.photoPages).toBe(2);
    expect(result.emptyCells).toBe(3); // 2 pages × 4 cells = 8 - 5 = 3 empty
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DPC-005：residential case 用 residential survey template
// ─────────────────────────────────────────────────────────────────────────────
describe("DPC-005 — residential case uses residential survey template", () => {
  it("residential 的 countPages 回傳 surveyTemplate = residential", () => {
    const result = countPages({
      propertyType: "residential",
      caseId: "T-RES",
      sections: [],
    });
    expect(result.surveyTemplate).toBe("residential");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DPC-006：land case 用 land survey template
// ─────────────────────────────────────────────────────────────────────────────
describe("DPC-006 — land case uses land survey template", () => {
  it("land 的 countPages 回傳 surveyTemplate = land", () => {
    const result = countPages({
      propertyType: "land",
      caseId: "T-LAND",
      sections: [],
    });
    expect(result.surveyTemplate).toBe("land");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DPC-007：page footer 頁碼正確
// ─────────────────────────────────────────────────────────────────────────────
describe("DPC-007 — page footer shows correct page numbers", () => {
  it("PDF blob 的文字包含 '第 1 頁' 或 '1 / N' 格式", async () => {
    const doc = buildDisclosureDoc({
      propertyType: "residential",
      caseId: "T-FOOTER",
      sections: [],
    });

    const blob = await pdf(doc as Parameters<typeof pdf>[0]).toBlob();
    const text = await blob.text();

    // 頁碼格式驗證（PDF 文字層）
    const hasPageNumber =
      text.includes("第 1 頁") ||
      text.match(/1\s*\/\s*\d+/) !== null ||
      text.match(/Page\s*1/) !== null;

    expect(hasPageNumber).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DPC-008：long survey table wrap + repeat header
// ─────────────────────────────────────────────────────────────────────────────
describe("DPC-008 — long survey table wraps across pages with repeated header", () => {
  it("100 行的 survey table 結果頁數超過 1", async () => {
    const pageCount = await renderAndCountPages({
      propertyType: "residential",
      caseId: "T-LONG-TABLE",
      sections: [
        {
          type: "survey-table",
          rows: 100,
        },
      ],
    });

    expect(pageCount).toBeGreaterThan(1);
  });

  it("countPages 的 tableHeaderRepeated = true（跨頁時 header 重複）", () => {
    const result = countPages({
      propertyType: "residential",
      caseId: "T-TABLE-WRAP",
      sections: [
        {
          type: "survey-table",
          rows: 100,
        },
      ],
    });

    expect(result.tableHeaderRepeated).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DPC-009：missing caseId throws typed error
// ─────────────────────────────────────────────────────────────────────────────
describe("DPC-009 — missing caseId throws typed error", () => {
  it("caseId 為空字串時 buildDisclosureDoc 丟 error", () => {
    expect(() => {
      buildDisclosureDoc({
        propertyType: "residential",
        caseId: "",
        sections: [],
      });
    }).toThrow();
  });

  it("丟出的 error 包含 caseId 相關提示", () => {
    let caughtError: Error | undefined;
    try {
      buildDisclosureDoc({
        propertyType: "residential",
        caseId: "",
        sections: [],
      });
    } catch (err) {
      caughtError = err as Error;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError!.message.toLowerCase()).toMatch(/caseid|case_id|案件/i);
  });

  it("countPages 對空 caseId 也丟 error", () => {
    expect(() => {
      countPages({
        propertyType: "residential",
        caseId: "",
        sections: [],
      });
    }).toThrow();
  });
});
