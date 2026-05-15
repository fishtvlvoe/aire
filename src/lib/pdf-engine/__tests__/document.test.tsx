/**
 * RED-LIGHT tests for document.tsx 新介面
 *
 * 這些測試會失敗，因為：
 * 1. `CaseDossierData` 尚未從 "../document" 匯出
 * 2. `PdfDocument` 的 props 介面不符合（目前是 caseData/theme/logo，不是 data/themeId）
 *
 * 對應 specs:
 * - System SHALL define a CaseDossierData interface for dossier rendering
 * - System SHALL render a 7-page 土地版 PDF for property_type = 'land'
 * - System SHALL render 建物版 placeholder for property_type = 'building'
 * - PdfDocument SHALL accept a themeId prop and apply corresponding tokens
 * - PdfDocument SHALL be exported from document.tsx
 */

import { beforeAll, describe, expect, it } from "vitest";
import React from "react";

// 🔴 RED: CaseDossierData 目前不存在於 "../document"
import { PdfDocument, type CaseDossierData } from "../document";
import { initReactPdfEngine } from "../react-pdf-init";
import { pdf } from "@react-pdf/renderer";

// ---------------------------------------------------------------------------
// 測試資料
// ---------------------------------------------------------------------------

const landData: CaseDossierData = {
  caseNo: "AIRE-2026-TEST",
  address: "新北市板橋區文化路一段188號",
  propertyType: "land",
  landLotNo: "磁二小段88-1",
  ownerName: "林大仁",
  companyName: "建安不動產",
  generatedAt: "2026/05/15",
};

const buildingData: CaseDossierData = {
  caseNo: "AIRE-2026-BLDG",
  address: "新北市板橋區文化路一段188號",
  propertyType: "building",
  landLotNo: "",
  ownerName: "林大仁",
  companyName: "建安不動產",
  generatedAt: "2026/05/15",
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeAll(() => {
  initReactPdfEngine();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CaseDossierData interface", () => {
  it(
    "System SHALL define a CaseDossierData interface for dossier rendering",
    () => {
      // 🔴 RED: TypeScript 編譯期會在 import 行就失敗（CaseDossierData 不存在）
      // 執行期驗證物件結構正確
      const data: CaseDossierData = { ...landData };
      expect(data.caseNo).toBeTruthy();
    },
  );
});

describe("PdfDocument — 土地版", () => {
  it(
    "System SHALL render a 7-page 土地版 PDF for property_type = 'land'",
    async () => {
      // 🔴 RED: PdfDocument 目前接受 { caseData, theme, logo }，不接受 { data, themeId }
      const element = React.createElement(PdfDocument, {
        data: landData,
        themeId: "theme-a-minimal",
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blob = await pdf(element as any).toBlob();
      expect(blob.size).toBeGreaterThan(1000);
    },
  );
});

describe("PdfDocument — 建物版", () => {
  it(
    "System SHALL render 建物版 as a full 7-page document for property_type = 'building'",
    async () => {
      const element = React.createElement(PdfDocument, {
        data: buildingData,
        themeId: "theme-a-minimal",
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blob = await pdf(element as any).toBlob();
      expect(blob.size).toBeGreaterThan(1000);
    },
  );
});

describe("PdfDocument — themeId prop", () => {
  it(
    "PdfDocument SHALL accept a themeId prop and apply corresponding tokens",
    async () => {
      // 🔴 RED: 目前 PdfDocument 接受 theme: PdfTheme 物件，不接受 themeId: string
      const element = React.createElement(PdfDocument, {
        data: landData,
        themeId: "theme-b-professional",
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blob = await pdf(element as any).toBlob();
      expect(blob.size).toBeGreaterThan(0);
    },
  );
});

describe("PdfDocument — named export", () => {
  it(
    "PdfDocument SHALL be exported from document.tsx",
    () => {
      // 這條測試本身在目前狀態下仍會通過（PdfDocument 已匯出），
      // 但只要上方 import 行因 CaseDossierData 型別缺失而失敗，
      // 整個測試檔就無法載入，所有測試都會紅燈。
      expect(typeof PdfDocument).toBe("function");
    },
  );
});
