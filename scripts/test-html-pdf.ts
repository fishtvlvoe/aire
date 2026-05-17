import * as fs from "fs";
import { renderDisclosureHtml } from "../src/lib/pdf-engine/html-renderer";
import { exportPdfFromHtml } from "../src/lib/pdf-engine/html-export";

const landData = {
  propertyType: "land",
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
    section: "台北市信義區松仁段三小段 0100-0000 地號",
    area: "150.00",
    zoning: "第三種住宅區",
    landCategory: "—",
    announcedValue: "280,000",
    announcedPrice: "56,000",
  },
  rights: {
    owner: "王大明",
    scope: "全部 1/1",
    encumbrance: "無",
    restriction: "無",
    otherRights: "無",
  },
} as any;

const buildingData = {
  propertyType: "building",
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

    await exportPdfFromHtml(html, outputPath);

    const { size } = fs.statSync(outputPath);
    console.log(`[${label}] ${outputPath} — ${size} bytes`);
  }

  console.log("All done! ✓");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
