import React from "react";
import { describe, expect, it } from "vitest";

import { PropertyDataSheetPage } from "../property-data-sheet";
import type { CaseDossierData } from "@/lib/pdf-engine/document";

function collectText(node: unknown): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(collectText).join("");
  if (React.isValidElement(node)) {
    const element = node as React.ReactElement<Record<string, unknown>>;
    if (typeof element.type === "function") {
      const render = element.type as (props: Record<string, unknown>) => React.ReactNode;
      return collectText(render(element.props));
    }
    const props = element.props as { children?: React.ReactNode };
    return collectText(props.children);
  }
  return "";
}

describe("PropertyDataSheetPage", () => {
  it("renders pre-survey cost and lookup failure reasons for PDF inspection", () => {
    const data: CaseDossierData = {
      caseNo: "AIRE-YUNONG",
      address: "台南市東區裕農路288巷17號8樓之1",
      propertyType: "building",
      landLotNo: "裕農段候選地號",
      ownerName: "",
      companyName: "",
      generatedAt: "2026/05/23",
      preSurvey: {
        lookupCost: 0,
        failureReasons: [
          {
            apiId: "building_ownership",
            status: "failed",
            reason: "授權不足，請補授權或改由屋主提供謄本",
          },
        ],
      },
    };

    const text = collectText(PropertyDataSheetPage({ propertyType: "building", data }));

    expect(text).toContain("物調表資料狀態");
    expect(text).toContain("本次地政費用");
    expect(text).toContain("0 元");
    expect(text).toContain("查詢未成功");
    expect(text).toContain("授權不足，請補授權或改由屋主提供謄本");
  });
});
