import React from "react";
import { Page } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";

import {
  HOUSE_OWNERSHIP_NOTES_TEMPLATE,
  HOUSE_TAX_NOTES_TEMPLATE,
  createHouseConditionSurveyDraft,
  createHouseLivingFunctionDraft,
} from "../house-mvp";
import {
  HouseMvpPdfDocument,
  renderHouseMvpDisclosurePdf,
  type HouseMvpPdfPayload,
} from "../house-mvp-pdf";
import { getRegisteredFontFamilies } from "@/lib/pdf-engine/react-pdf-init";

const payload: HouseMvpPdfPayload = {
  caseNo: "AIRE-001",
  caseName: "測試不動產說明書",
  companyName: "Opcos 測試公司",
  generatedAt: "2026/05/20",
  pages: [
    { page: "condition_survey_highrise", payload: createHouseConditionSurveyDraft() },
    { page: "living_function", payload: createHouseLivingFunctionDraft() },
    { page: "ownership_notes", payload: HOUSE_OWNERSHIP_NOTES_TEMPLATE },
    { page: "tax_notes", payload: HOUSE_TAX_NOTES_TEMPLATE },
  ],
};

function collectText(node: unknown): string {
  if (node === null || node === undefined || typeof node === "boolean") {
    return "";
  }

  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(collectText).join("");
  }

  if (React.isValidElement(node)) {
    if (typeof node.type === "function") {
      return collectText((node.type as (props: unknown) => unknown)(node.props));
    }

    return collectText((node.props as { children?: unknown }).children);
  }

  return "";
}

function countPages(node: unknown): number {
  if (!React.isValidElement(node)) {
    return Array.isArray(node) ? node.reduce((sum, child) => sum + countPages(child), 0) : 0;
  }

  if (typeof node.type === "function") {
    return countPages((node.type as (props: unknown) => unknown)(node.props));
  }

  const own = node.type === (Page as unknown) ? 1 : 0;
  return own + countPages((node.props as { children?: unknown }).children);
}

describe("house MVP PDF renderer", () => {
  it("builds one PDF page per normalized Page Contract payload without volatile page numbering", () => {
    const doc = <HouseMvpPdfDocument data={payload} />;
    const text = collectText(doc);

    expect(countPages(doc)).toBe(4);
    expect(text).toContain("肆、現況調查表");
    expect(text).toContain("生活機能");
    expect(text).toContain("三、【產權相關注意事項】");
    expect(text).toContain("增值稅附註");
    expect(text).not.toContain("待補");
    expect(text).not.toContain("未填");
    expect(text).not.toContain("第 1 頁");
  });

  it("renders a real PDF blob with NotoSansTC registered for Traditional Chinese text", async () => {
    const blob = await renderHouseMvpDisclosurePdf(payload);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const header = String.fromCharCode(...bytes.slice(0, 5));

    expect(header).toBe("%PDF-");
    expect(blob.type).toBe("application/pdf");
    expect(blob.size).toBeGreaterThan(1000);
    expect(getRegisteredFontFamilies()).toContain("NotoSansTC");
  });
});
