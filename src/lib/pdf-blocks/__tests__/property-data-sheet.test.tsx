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
      dossierTier: "reference",
      propertyType: "building",
      landLotNo: "裕農段候選地號",
      ownerName: "",
      companyName: "",
      generatedAt: "2026/05/23",
      preSurvey: {
        isPaid: false,
        lookupCost: 0,
        pricingNote: "免費前查：地址候選、附近實價登錄與參考欄位，不產生成本",
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
    expect(text).toContain("資料版本");
    expect(text).toContain("參考版（免費前查／補件資料）");
    expect(text).toContain("查詢性質");
    expect(text).toContain("免費前查：地址候選、附近實價登錄與參考欄位，不產生成本");
    expect(text).toContain("本次地政費用");
    expect(text).toContain("0 元");
    expect(text).toContain("查詢未成功");
    expect(text).toContain("授權不足，請補授權或改由屋主提供謄本");
  });

  it("marks manual supplement sources on property sheet values", () => {
    const data: CaseDossierData = {
      caseNo: "AIRE-YUNONG",
      address: "台南市東區裕農路288巷17號8樓之1",
      dossierTier: "reference",
      propertyType: "building",
      landLotNo: "裕農段候選地號",
      ownerName: "余啟彰",
      companyName: "",
      generatedAt: "2026/05/23",
      propertySheet: {
        landSection: "",
        landNumber: "",
        zoning: "",
        ownershipRatio: "",
        buildingCoverage: "",
        floorAreaRatio: "",
        owner: "余啟彰",
        acquisitionDate: "",
        rooms: "3房2廳2衛",
        direction: "坐東朝西",
        managementFee: 2500,
        buildingStatus: "現況自住",
      },
      propertySheetSources: {
        rooms: "人工輸入",
        direction: "屋主提供",
        managementFee: "屋主提供",
        buildingStatus: "現場確認",
      },
    };

    const text = collectText(PropertyDataSheetPage({ propertyType: "building", data }));

    expect(text).toContain("3房2廳2衛（來源：人工輸入）");
    expect(text).toContain("坐東朝西（來源：屋主提供）");
    expect(text).toContain("2,500（來源：屋主提供）");
    expect(text).toContain("現況自住（來源：現場確認）");
  });

  it("renders candidate comparison, inferred source, and mandatory pre-survey disclaimer", () => {
    const data: CaseDossierData = {
      caseNo: "AIRE-YUNONG",
      address: "台南市東區裕農路288巷17號8樓之1",
      propertyType: "building",
      landLotNo: "0001",
      ownerName: "余啟彰",
      companyName: "",
      generatedAt: "2026/05/23",
      propertySheet: {
        landSection: "富強段",
        landNumber: "00700000",
        zoning: "住宅區",
        landArea: 120.5,
        ownershipRatio: "91/10000",
        buildingCoverage: "60%",
        floorAreaRatio: "200%",
        owner: "余啟彰",
        acquisitionDate: "",
        registeredArea: 31.25,
        mainBuildingArea: 23.1,
        legalUse: "住家用",
        constructionDate: "083/10/18",
        buildingAge: "31年",
        floor: "8樓之1",
      },
      propertySheetSources: {
        registeredArea: "候選資料，待屋主/權狀確認",
        mainBuildingArea: "推測資料，非登記資料",
      },
      preSurvey: {
        isPaid: false,
        lookupCost: 0,
        pricingNote: "免費前查：地址候選、附近實價登錄與參考欄位，不產生成本",
        failureReasons: [],
        candidateDisclaimer: "地政資料，最終以正式謄本為主；本說明書不代表完整資訊。",
        candidateOptions: [
          {
            candidate_id: "building:DC-1556-00165000",
            parcel_type: "building",
            normalized_parcel_id: "DC-1556-00165000",
            query_status: "candidate_data_available",
            confirmation_state: "selected_candidate",
            summary_fields: {
              registeredAreaPing: 31.25,
              mainBuildingAreaPing: 23.1,
              legalUse: "住家用",
              constructionDate: "083/10/18",
              floor: "8樓之1",
            },
          },
          {
            candidate_id: "building:DC-1556-00167000",
            parcel_type: "building",
            normalized_parcel_id: "DC-1556-00167000",
            query_status: "failed",
            confirmation_state: "unconfirmed",
            error_code: "COP312",
            summary_fields: {},
          },
        ],
        inferredReference: {
          target_unit: "8樓之1",
          basis: "same_suffix_vertical_stack",
          confidence: "high",
          source_units: ["3樓之1", "5樓之1", "7樓之1"],
          estimated_fields: {
            registeredAreaPing: 31.25,
            mainBuildingAreaPing: 23.1,
          },
          warning: "推測資料，非登記資料",
        },
      },
    };

    const text = collectText(PropertyDataSheetPage({ propertyType: "building", data }));

    expect(text).toContain("31.25（來源：候選資料，待屋主/權狀確認）");
    expect(text).toContain("23.10（來源：推測資料，非登記資料）");
    expect(text).toContain("地政資料，最終以正式謄本為主；本說明書不代表完整資訊。");
    expect(text).toContain("候選資料比較");
    expect(text).toContain("DC-1556-00165000");
    expect(text).toContain("DC-1556-00167000");
    expect(text).toContain("COP312");
    expect(text).toContain("推測資料來源");
    expect(text).toContain("3樓之1、5樓之1、7樓之1");
  });
});
