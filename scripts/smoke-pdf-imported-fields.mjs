import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const { createPdfEngine } = await import("../src/lib/pdf-engine/engine.ts");

const outDir = "/Users/fishtv/Development/products/AIRE/artifacts/smoke";
const pdfPath = `${outDir}/desktop-local-address-to-cop-e2e-imported-fields.pdf`;
mkdirSync(outDir, { recursive: true });

const engine = await createPdfEngine();
const blob = await engine.renderDossier({
  themeId: "theme-a-minimal",
  data: {
    caseNo: "AIRE-DONGHE-PDF-SMOKE",
    address: "台南市東區東和路47號3樓",
    propertyType: "building",
    ownerName: "蔡國卿",
    companyName: "AIRE",
    generatedAt: "2026-05-27",
    buildingArea: 128.2,
    buildingPurpose: "住商用",
    constructionDate: "民國071年08月04日",
    legalClauses: [
      "依不動產經紀業管理條例第二十三條規定，不動產經紀人員應依本說明書說明標的物狀況。",
      "本說明書所載資料以簽約當日前最新調查資料為準。",
      "交易雙方應確認產權、稅費、現況與重要事項。",
      "缺漏資料應於簽約前補正或於契約明確約定。",
    ],
    cover: {
      propertyName: "東和路47",
      caseNumber: "AIRE-DONGHE-PDF-SMOKE",
      handlingAgent: "測試承辦",
      licensedAgentName: "測試經紀人",
      licensedAgentCertNo: "經紀人字第 000000 號",
      brokerageCompanyName: "AIRE",
      brokerageLicenseNo: "經紀業字第 000000 號",
      companyAddress: "台南市東區東和路47號",
      companyPhone: "06-000-0000",
    },
    propertySheet: {
      owner: "蔡國卿",
      registeredArea: 38.78,
      mainBuildingArea: 27.65,
      auxiliaryArea: 2.51,
      commonArea: 8.62,
      parkingArea: 0,
      legalUse: "住商用",
      material: "鋼筋混凝土造",
      constructionDate: "民國071年08月04日",
      buildingAge: "43年",
      floor: "三層 / 總樓層 003",
      buildingStatus: "正常使用",
      rooms: "3房2廳2衛",
      direction: "坐北朝南",
      managementFee: "無管理費",
    },
    propertySheetSources: {
      registeredArea: "正式資料匯入",
      mainBuildingArea: "正式資料匯入",
      auxiliaryArea: "正式資料匯入",
      commonArea: "正式資料匯入",
      parkingArea: "正式資料匯入",
      legalUse: "正式資料匯入",
      constructionDate: "正式資料匯入",
      buildingStatus: "現場確認",
      rooms: "屋主提供",
    },
    transactionHistory: [
      {
        address: "台南市東區東和路45號",
        areaPing: 31.2,
        totalPrice: 10000000,
        unitPrice: 320513,
        transactionDate: "2025-12",
      },
    ],
    nearbyAmenities: [
      { category: "學校", name: "勝利國小", distanceM: 350, address: "台南市東區" },
      { category: "公園", name: "東和公園", distanceM: 180, address: "台南市東區" },
      { category: "市場", name: "東安市場", distanceM: 500, address: "台南市東區" },
    ],
    taxCalculation: {
      landValueIncrementTax: 0,
      landValueIncrementTaxPreferential: 0,
      deedTax: 0,
      stampTax: 10000,
      registrationFee: 10000,
      scrivenerFee: 12000,
      totalSellerCost: 22000,
      totalBuyerCost: 10000,
      warnings: ["土地增值稅為估算模式；缺公告現值、前次移轉現值或持分時不可視為正式稅額。"],
    },
    locationMapImage: null,
    aerialPhoto: null,
    exteriorPhoto: null,
    floorPlanPhoto: null,
    surveyData: {
      buildingStatus: "正常使用",
      rooms: "3房2廳2衛",
    },
  },
});

writeFileSync(pdfPath, Buffer.from(await blob.arrayBuffer()));

const text = execFileSync("pdftotext", ["-layout", pdfPath, "-"], { encoding: "utf8" });
const required = [
  "登記坪數",
  "38.78",
  "主建坪數",
  "27.65",
  "附屬建物",
  "2.51",
  "公共設施",
  "8.62",
  "車位坪數",
  "0.00",
  "法定用途",
  "住商用",
  "建築完成日",
  "民國071年08月04日",
  "屋齡",
  "43年",
  "正常使用",
  "3房2廳2衛",
  "附近地段實價登錄成交行情",
  "勝利國小",
  "土地增值稅",
  "建物外觀",
];

const missing = required.filter((token) => !text.includes(token));
if (missing.length > 0) {
  throw new Error(`PDF smoke missing tokens: ${missing.join(", ")}\nPDF: ${pdfPath}`);
}

console.log(JSON.stringify({ pdfPath, checked: required.length }, null, 2));
