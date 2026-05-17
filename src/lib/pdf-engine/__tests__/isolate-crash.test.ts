import { describe, it } from "vitest";
import React from "react";
import { pdf } from "@react-pdf/renderer";
import { initReactPdfEngine } from "../react-pdf-init";
import { PdfDocument } from "../document";
import type { CaseDossierData } from "../document";
import { writeFileSync } from "fs";

describe("Full PDF generation", () => {
  it("full land with all fields", async () => {
    initReactPdfEngine();
    const data: CaseDossierData = {
      caseNo: "TEST-001", address: "台北市大安區忠孝東路四段100號", propertyType: "land",
      landLotNo: "大安段-0123", ownerName: "測試人", companyName: "建安不動產", generatedAt: "2026-05-17",
      landArea: 150.5, zoningType: "住宅區", announcedLandValue: 85000,
      legalClauses: ["依不動產經紀業管理條例第二十三條規定...", "本說明書內容如有不實，經紀業應負損害賠償責任。"],
      cover: { propertyName: "台北市大安區忠孝東路四段100號", caseNumber: "TEST-001", handlingAgent: "王小明", licensedAgentName: "李大華", licensedAgentCertNo: "經紀人字第 123456 號", brokerageCompanyName: "建安不動產經紀有限公司", brokerageLicenseNo: "經紀業字第 654321 號", companyAddress: "台北市信義區信義路五段7號", companyPhone: "02-2345-6789" },
      propertySheet: { askingPrice: 10000000, landSection: "大安段", landNumber: "0123", zoning: "住宅區", landArea: 150.5, ownershipRatio: "1/1", shareArea: 150.5, buildingCoverage: "60%", floorAreaRatio: "300%", owner: "測試人", acquisitionDate: "2020-03-15" },
      taxCalculation: { landValueIncrementTax: 520000, landValueIncrementTaxPreferential: 130000, deedTax: 0, stampTax: 10000, registrationFee: 10000, scrivenerFee: 12000, totalSellerCost: 530000, totalBuyerCost: 32000, warnings: [] },
      transactionHistory: [
        { address: "忠孝東路四段98號", areaPing: 45.5, totalPrice: 9500000, unitPrice: 208791, transactionDate: "2025-12" },
        { address: "忠孝東路四段102號", areaPing: 52.0, totalPrice: 11200000, unitPrice: 215384, transactionDate: "2025-11" },
        { address: "忠孝東路四段88號", areaPing: 38.2, totalPrice: 8200000, unitPrice: 214659, transactionDate: "2025-10" },
      ],
      nearbyAmenities: [
        { name: "大安國小", category: "學校", distanceM: 350, address: "大安區信義路三段" },
        { name: "台大醫院", category: "醫院", distanceM: 1200, address: "中正區中山南路" },
        { name: "大安森林公園", category: "公園", distanceM: 600, address: "大安區新生南路二段" },
        { name: "忠孝復興站", category: "捷運", distanceM: 200, address: "大安區忠孝東路" },
        { name: "頂好超市", category: "市場", distanceM: 150, address: "大安區忠孝東路四段" },
      ],
      surveyData: null, exteriorPhoto: null, locationMapImage: null,
    };
    try {
      const blob = await pdf(React.createElement(PdfDocument, { data, themeId: "classic" }) as any).toBlob();
      const buf = Buffer.from(await blob.arrayBuffer());
      writeFileSync("/tmp/aire-test-land.pdf", buf);
      console.log(`✅ Land PDF: /tmp/aire-test-land.pdf (${buf.length} bytes)`);
    } catch (e: any) { console.log(`❌ Land: ${e.cause?.message ?? e.message}`); }
  });

  it("full building with all fields", async () => {
    initReactPdfEngine();
    const data: CaseDossierData = {
      caseNo: "TEST-002", address: "台北市信義區松仁路100號12樓", propertyType: "building",
      landLotNo: "信義段-0456", ownerName: "陳美麗", companyName: "建安不動產", generatedAt: "2026-05-17",
      buildingArea: 132.5, buildingPurpose: "住家用", constructionDate: "2015-06-01",
      legalClauses: ["依不動產經紀業管理條例第二十三條規定..."],
      cover: { propertyName: "台北市信義區松仁路100號12樓", caseNumber: "TEST-002", handlingAgent: "張承辦", licensedAgentName: "李大華", licensedAgentCertNo: "經紀人字第 123456 號", brokerageCompanyName: "建安不動產經紀有限公司", brokerageLicenseNo: "經紀業字第 654321 號", companyAddress: "台北市信義區信義路五段7號", companyPhone: "02-2345-6789" },
      propertySheet: { askingPrice: 25000000, landSection: "信義段", landNumber: "0456", zoning: "商業區", landArea: 50.2, ownershipRatio: "1/15", shareArea: 3.35, buildingCoverage: "80%", floorAreaRatio: "800%", owner: "陳美麗", acquisitionDate: "2015-08-20", registeredArea: 132.5, mainBuildingArea: 95.2, auxiliaryArea: 12.3, commonArea: 18.5, parkingArea: 6.5, floor: "12F/15F", rooms: "3房2廳2衛", direction: "坐北朝南", managementFee: 3500, hasElevator: true, constructionCompany: "國泰建設", communityName: "信義之星" },
      buildingAreaBreakdown: { main: 95.2, auxiliary: 12.3, common: 18.5, parking: 6.5 },
      taxCalculation: { landValueIncrementTax: 800000, landValueIncrementTaxPreferential: 200000, deedTax: 1500000, stampTax: 25000, registrationFee: 25000, scrivenerFee: 12000, totalSellerCost: 825000, totalBuyerCost: 1562000, warnings: [] },
      transactionHistory: [
        { address: "松仁路98號11樓", areaPing: 40.1, totalPrice: 24000000, unitPrice: 598504, transactionDate: "2025-11" },
        { address: "松仁路102號8樓", areaPing: 38.5, totalPrice: 22800000, unitPrice: 592207, transactionDate: "2025-10" },
      ],
      nearbyAmenities: [
        { name: "信義國小", category: "學校", distanceM: 400, address: "信義區松仁路" },
        { name: "台北101站", category: "捷運", distanceM: 300, address: "信義區信義路五段" },
      ],
      surveyData: null, exteriorPhoto: null, locationMapImage: null,
    };
    try {
      const blob = await pdf(React.createElement(PdfDocument, { data, themeId: "classic" }) as any).toBlob();
      const buf = Buffer.from(await blob.arrayBuffer());
      writeFileSync("/tmp/aire-test-building.pdf", buf);
      console.log(`✅ Building PDF: /tmp/aire-test-building.pdf (${buf.length} bytes)`);
    } catch (e: any) { console.log(`❌ Building: ${e.cause?.message ?? e.message}`); }
  });
});
