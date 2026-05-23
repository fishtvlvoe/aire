import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, {
  alias: { "@/": `${resolve("src")}/` },
  fsCache: false,
  jsx: { runtime: "automatic" },
});
const { createPdfEngine } = await jiti.import("../src/lib/pdf-engine/engine.ts");

const outputPath = process.argv[2] ?? "/tmp/aire-yunong-candidate-presurvey.pdf";
const imageApiBase = process.env.AIRE_IMAGE_API_BASE ?? "http://localhost:3000";
const yunongCoordinate = { lat: 22.986314, lng: 120.22908 };

async function fetchImage(path, body) {
  try {
    const resp = await fetch(`${imageApiBase}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });
    const contentType = resp.headers.get("content-type") ?? "";
    if (!resp.ok || !contentType.startsWith("image/")) {
      console.warn(`[gen-yunong-candidate-pdf] ${path} unavailable: ${resp.status} ${contentType}`);
      return null;
    }
    return new Uint8Array(await resp.arrayBuffer());
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[gen-yunong-candidate-pdf] ${path} unavailable: ${message}`);
    return null;
  }
}

const [locationMapImage, aerialPhoto, exteriorPhoto] = await Promise.all([
  fetchImage("/api/location-map", { ...yunongCoordinate, zoom: 16 }),
  fetchImage("/api/aerial-photo", { ...yunongCoordinate, zoom: 18 }),
  fetchImage("/api/street-view", yunongCoordinate),
]);

const candidateOptions = [
  {
    candidate_id: "land:DC-1556-00700000",
    parcel_type: "land",
    section_code: "1556",
    section_name: "富強段",
    parcel_number: "00700000",
    normalized_parcel_id: "DC-1556-00700000",
    source: "public_reference",
    confidence_label: "same_address_candidate",
    official_status: "candidate_unconfirmed",
    query_status: "candidate_data_available",
    confirmation_state: "selected_candidate",
    summary_fields: {
      landAreaSqm: 120.5,
      zoning: "住宅區",
      buildingCoverage: "60%",
      floorAreaRatio: "200%",
    },
    warnings: ["待屋主或權狀確認"],
  },
  {
    candidate_id: "building:DC-1556-00165000",
    parcel_type: "building",
    section_code: "1556",
    section_name: "富強段",
    parcel_number: "00165000",
    normalized_parcel_id: "DC-1556-00165000",
    source: "public_reference",
    confidence_label: "same_address_candidate",
    official_status: "candidate_unconfirmed",
    query_status: "candidate_data_available",
    confirmation_state: "selected_candidate",
    summary_fields: {
      registeredAreaPing: 31.25,
      mainBuildingAreaPing: 23.1,
      legalUse: "住家用",
      constructionDate: "083/10/18",
      material: "鋼筋混凝土造",
      floor: "8樓之1",
      age: "31年",
    },
    warnings: ["待屋主或權狀確認是否為 8樓之1"],
  },
  {
    candidate_id: "building:DC-1556-00167000",
    parcel_type: "building",
    section_code: "1556",
    section_name: "富強段",
    parcel_number: "00167000",
    normalized_parcel_id: "DC-1556-00167000",
    source: "public_reference",
    confidence_label: "same_address_candidate",
    official_status: "candidate_unconfirmed",
    query_status: "candidate_data_available",
    confirmation_state: "unconfirmed",
    summary_fields: {
      registeredAreaPing: 30.9,
      mainBuildingAreaPing: 22.8,
      legalUse: "住家用",
      constructionDate: "083/10/18",
      floor: "5樓之1",
    },
    warnings: ["同棟同尾碼候選，待權狀確認"],
  },
  {
    candidate_id: "building:DC-1556-00229000",
    parcel_type: "building",
    section_code: "1556",
    section_name: "富強段",
    parcel_number: "00229000",
    normalized_parcel_id: "DC-1556-00229000",
    source: "public_reference",
    confidence_label: "same_address_candidate",
    official_status: "candidate_unconfirmed",
    query_status: "failed",
    confirmation_state: "unconfirmed",
    error_code: "COP312",
    error_message: "候選建物所有權資料取得服務資訊失敗",
    summary_fields: {},
    warnings: ["候選 probe 失敗，仍保留供比對"],
  },
  {
    candidate_id: "building:DC-1556-00230000",
    parcel_type: "building",
    section_code: "1556",
    section_name: "富強段",
    parcel_number: "00230000",
    normalized_parcel_id: "DC-1556-00230000",
    source: "public_reference",
    confidence_label: "same_address_candidate",
    official_status: "candidate_unconfirmed",
    query_status: "failed",
    confirmation_state: "unconfirmed",
    error_code: "COP305",
    error_message: "候選建物查無可用資料",
    summary_fields: {},
    warnings: ["候選查無資料，保留供人工排除"],
  },
];

const data = {
  caseNo: "AIRE-YUNONG-20260523",
  address: "台南市東區裕農路288巷17號8樓之1",
  propertyType: "building",
  landLotNo: "DC-1556-00700000",
  ownerName: "余啟彰",
  companyName: "裕農安居不動產經紀有限公司",
  generatedAt: "2026-05-23",
  buildingArea: 103.31,
  buildingPurpose: "住家用",
  constructionDate: "083/10/18",
  cover: {
    propertyName: "裕農路物調驗收",
    caseNumber: "AIRE-YUNONG-20260523",
    handlingAgent: "王承辦",
    licensedAgentName: "陳經紀",
    licensedAgentCertNo: "南市經紀人字第 000001 號",
    brokerageCompanyName: "裕農安居不動產經紀有限公司",
    brokerageLicenseNo: "南市經紀業字第 000001 號",
    companyAddress: "台南市東區裕農路1號",
    companyPhone: "06-123-4567",
  },
  propertySheet: {
    askingPrice: 0,
    landSection: "富強段",
    landNumber: "00700000",
    zoning: "住宅區",
    landArea: 120.5,
    ownershipRatio: "91/10000",
    shareArea: 1.1,
    buildingCoverage: "60%",
    floorAreaRatio: "200%",
    owner: "余啟彰",
    acquisitionDate: "",
    registeredArea: 31.25,
    mainBuildingArea: 23.1,
    auxiliaryArea: 2.1,
    commonArea: 6.05,
    parkingArea: 0,
    legalUse: "住家用",
    material: "鋼筋混凝土造",
    constructionDate: "083/10/18",
    buildingAge: "31年",
    floor: "8樓之1",
    ownershipScope: "全部 1/1",
    buildingStatus: "待屋主或現場確認",
    rooms: "待補格局",
    direction: "待補座向",
    managementFee: 0,
  },
  propertySheetSources: {
    landSection: "候選資料，待屋主/權狀確認",
    landNumber: "候選資料，待屋主/權狀確認",
    zoning: "候選資料，待屋主/權狀確認",
    landArea: "候選資料，待屋主/權狀確認",
    registeredArea: "候選資料，待屋主/權狀確認",
    mainBuildingArea: "候選資料，待屋主/權狀確認",
    legalUse: "候選資料，待屋主/權狀確認",
    constructionDate: "候選資料，待屋主/權狀確認",
    buildingAge: "候選資料，待屋主/權狀確認",
    floor: "候選資料，待屋主/權狀確認",
  },
  preSurvey: {
    lookupCost: 0,
    failureReasons: [
      {
        apiId: "address_lookup",
        status: "failed",
        reason: "COP317 門牌建號查詢未取得單一候選，已改用候選資料流程",
      },
    ],
    candidateDisclaimer: "地政資料，最終以正式謄本為主；本說明書不代表完整資訊。",
    candidateOptions,
    inferredReference: {
      target_unit: "8樓之1",
      basis: "same_suffix_vertical_stack",
      confidence: "high",
      source_units: ["3樓之1", "5樓之1", "7樓之1"],
      estimated_fields: {
        registeredAreaPing: 31.25,
        mainBuildingAreaPing: 23.1,
      },
      warning: "推測資料，非登記資料；地政資料，最終以正式謄本為主；本說明書不代表完整資訊。",
    },
  },
  buildingAreaBreakdown: {
    main: 23.1,
    auxiliary: 2.1,
    common: 6.05,
    parking: 0,
  },
  taxCalculation: null,
  transactionHistory: [
    {
      address: "台南市東區裕農路123號",
      areaPing: 31.25,
      totalPrice: 12800000,
      unitPrice: 393846,
      transactionDate: "2024-01-15",
    },
    {
      address: "台南市東區裕農路456號5樓",
      areaPing: 24.8,
      totalPrice: 9500000,
      unitPrice: 383065,
      transactionDate: "2023-11-20",
    },
    {
      address: "台南市東區裕農路789號3樓之2",
      areaPing: 42.1,
      totalPrice: 15200000,
      unitPrice: 361045,
      transactionDate: "2024-03-08",
    },
  ],
  nearbyAmenities: [],
  surveyData: null,
  locationMapImage,
  aerialPhoto,
  exteriorPhoto,
};

const engine = await createPdfEngine();
const blob = await engine.renderDossier({ data, themeId: "classic" });
const buffer = Buffer.from(await blob.arrayBuffer());
writeFileSync(outputPath, buffer);
console.log(`${outputPath} ${buffer.length}`);
