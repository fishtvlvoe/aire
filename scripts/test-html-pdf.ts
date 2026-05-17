import * as fs from "fs";
import { renderDisclosureHtml } from "../src/lib/pdf-engine/html-renderer";
import { exportPdfFromHtml } from "../src/lib/pdf-engine/html-export";

const landData = {
  propertyType: "land",
  caseNo: "TEST-LAND-001",
  address: "台北市信義區松仁路100號",
  ownerName: "王大明",
  companyName: "建安不動產經紀有限公司",
  transactionTotalPrice: "1,000萬",
  paymentMethod: "銀行貸款",
  taxBurdenAgreement: "依慣例各自負擔",
  penaltyClause: "違約金為總價之15%",
  surroundingTransactionPrice: "70-75萬/坪",
  cover: {
    propertyName: "台北市信義區松仁路100號",
    caseNumber: "TEST-LAND-001",
    handlingAgent: "張承辦",
    licensedAgentName: "李大華",
    licensedAgentCertNo: "經紀人字第 123456 號",
    brokerageCompanyName: "建安不動產經紀有限公司",
    brokerageLicenseNo: "經紀業字第 654321 號",
    companyAddress: "台北市信義區信義路五段7號",
    companyPhone: "02-2345-6789",
  },
  landMark: {
    section: "台北市信義區松仁段三小段",
    lotNo: "0100-0000",
    landCategory: "—",
    area: "150.00",
    zoning: "第三種住宅區",
  },
  landArea: "150.00",
  urbanPlanZone: "第三種住宅區",
  floorAreaRatio: "225%",
  buildingCoverageRatio: "45%",
  ownershipShare: "全部 1/1",
  transactionHistory: [
    { address: "信義區松仁路98號", areaPing: "45.20", totalPrice: "3,200", unitPrice: "70.80", transactionDate: "114/03" },
    { address: "信義區松仁路120號", areaPing: "38.50", totalPrice: "2,850", unitPrice: "74.03", transactionDate: "114/01" },
    { address: "信義區松德路56號", areaPing: "52.00", totalPrice: "3,900", unitPrice: "75.00", transactionDate: "113/11" },
    { address: "信義區松仁路85號", areaPing: "41.30", totalPrice: "3,050", unitPrice: "73.85", transactionDate: "113/09" },
    { address: "信義區松德路30號", areaPing: "55.80", totalPrice: "4,100", unitPrice: "73.48", transactionDate: "113/07" },
  ],
  nearbyAmenities: [
    { category: "公園", name: "松德公園", distanceM: 150, address: "松德路100號" },
    { category: "學校", name: "信義國小", distanceM: 200, address: "松仁路150號" },
    { category: "學校", name: "興雅國中", distanceM: 450, address: "松德路168號" },
    { category: "捷運", name: "象山站", distanceM: 600, address: "信義路五段" },
    { category: "市場", name: "松山市場", distanceM: 800, address: "松山路300號" },
    { category: "醫院", name: "台北醫學大學附設醫院", distanceM: 1200, address: "吳興街252號" },
  ],
  taxCalculation: {
    landValueIncrementTax: 160000,
    landValueIncrementTaxPreferential: 80000,
    deedTax: 0,
    stampTax: 10000,
    registrationFee: 10000,
    scrivenerFee: 12000,
    totalSellerCost: 182000,
    totalBuyerCost: 32000,
    warnings: [],
  },
  locationMapImage: new Uint8Array([137, 80, 78, 71]),
  exteriorPhoto: new Uint8Array([137, 80, 78, 71]),
  surveyData: {},
} as any;

const buildingData = {
  propertyType: "building",
  caseNo: "TEST-BLDG-001",
  address: "新北市板橋區文化路一段200號3樓",
  ownerName: "陳小明",
  companyName: "建安不動產經紀有限公司",
  transactionTotalPrice: "1,500萬",
  paymentMethod: "銀行貸款80%",
  cover: {
    propertyName: "新北市板橋區文化路一段200號3樓",
    caseNumber: "TEST-BLDG-001",
    handlingAgent: "陳助理",
    licensedAgentName: "林經紀",
    licensedAgentCertNo: "經紀人字第 789012 號",
    brokerageCompanyName: "建安不動產經紀有限公司",
    brokerageLicenseNo: "經紀業字第 654321 號",
    companyAddress: "台北市信義區信義路五段7號",
    companyPhone: "02-2345-6789",
  },
  transactionHistory: [
    { address: "板橋區文化路一段180號", areaPing: "32.50", totalPrice: "1,450", unitPrice: "44.62", transactionDate: "114/02" },
    { address: "板橋區文化路一段220號", areaPing: "28.70", totalPrice: "1,320", unitPrice: "46.00", transactionDate: "113/12" },
  ],
  nearbyAmenities: [
    { category: "學校", name: "板橋國小", distanceM: 300, address: "文化路200號" },
    { category: "捷運", name: "板橋站", distanceM: 500, address: "站前路5號" },
  ],
  taxCalculation: {
    landValueIncrementTax: 200000,
    landValueIncrementTaxPreferential: 100000,
    deedTax: 72000,
    stampTax: 15000,
    registrationFee: 15000,
    scrivenerFee: 12000,
    totalSellerCost: 227000,
    totalBuyerCost: 114000,
    warnings: [],
  },
  surveyData: {},
} as any;

async function run() {
  const cases = [
    { data: landData, outputPath: "/tmp/aire-html-land.pdf", label: "土地版" },
    { data: buildingData, outputPath: "/tmp/aire-html-building.pdf", label: "建物版" },
  ];

  for (const { data, outputPath, label } of cases) {
    const html = renderDisclosureHtml(data, {
      themeId: "theme-a-minimal",
      generatedAt: "2026-05-17",
    });

    const pageCount = (html.match(/class="page"/g) || []).length;
    console.log(`[${label}] ${pageCount} pages generated`);

    const keywords = ["不動產說明書", "法規告知", "簽章", "現況"];
    for (const kw of keywords) {
      if (!html.includes(kw)) {
        console.error(`[${label}] ⚠ 缺少關鍵字: ${kw}`);
      }
    }

    await exportPdfFromHtml(html, outputPath);

    const { size } = fs.statSync(outputPath);
    console.log(`[${label}] ${outputPath} — ${(size / 1024).toFixed(0)} KB`);
  }

  console.log("All done! ✓");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
