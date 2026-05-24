export type ServicePricePolicy =
  | "free"
  | "auth_free"
  | "price_by_row"
  | "price_by_location"
  | "price_by_duration"
  | "restricted"
  | "unknown";

export type ServiceImplementationPriority =
  | "required"
  | "fallback"
  | "free_enrichment"
  | "billing_only"
  | "restricted"
  | "defer";

export interface ServiceCatalogEntry {
  serviceCode: string;
  displayName: string;
  sourceDocument: string;
  accessEligibility: string;
  implementationPriority: ServiceImplementationPriority;
  pricePolicy: ServicePricePolicy;
  unitPrice: number | null;
  pricingEvidence: string;
  documentUrl?: string;
  requestCount?: number;
}

export interface ScrapedServiceRow {
  serviceName: string;
  priceDescribeUser?: string;
  priceDescribeGovernment?: string;
  documentUrl?: string;
  serviceDescription?: string | null;
  tags?: {
    badges?: string[];
    pricing?: string[];
  } | null;
  requestCount?: number;
  ableToPurchase?: boolean | null;
}

const SERVICE_SEED: ServiceCatalogEntry[] = [
  makeEntry("MOI_API_001", "MOI_API_001地籍土地標示部資料服務", "required", "price_by_row", 1, "docs/cop-scrape/05-服務說明文件/MOI_API_001地籍土地標示部資料服務.html", "單筆 1 元"),
  makeEntry("MOI_API_002", "MOI_API_002地籍土地所有權部資料服務", "required", "price_by_row", 1, "docs/cop-scrape/05-服務說明文件/MOI_API_002地籍土地所有權部資料服務.html", "單筆 1 元"),
  makeEntry("MOI_API_003", "MOI_API_003地籍土地他項權利部資料服務", "fallback", "price_by_row", 1, "docs/cop-scrape/05-服務說明文件/MOI_API_003地籍土地他項權利部資料服務.html", "單筆 1 元"),
  makeEntry("MOI_API_004", "MOI_API_004地籍建物標示部資料服務", "required", "price_by_row", 1, "docs/cop-scrape/05-服務說明文件/MOI_API_004地籍建物標示部資料服務.html", "單筆 1 元"),
  makeEntry("MOI_API_005", "MOI_API_005地籍建物所有權部資料服務", "required", "price_by_row", 1, "docs/cop-scrape/05-服務說明文件/MOI_API_005地籍建物所有權部資料服務.html", "單筆 1 元"),
  makeEntry("MOI_API_006", "MOI_API_006地籍建物他項權利部資料服務", "fallback", "price_by_row", 1, "docs/cop-scrape/05-服務說明文件/MOI_API_006地籍建物他項權利部資料服務.html", "單筆 1 元"),
  makeEntry("MOI_API_007", "MOI_API_007地號資料服務", "required", "price_by_location", 10, "docs/cop-scrape/05-服務說明文件/MOI_API_007地號資料服務.html", "依地段每段 10 元"),
  makeEntry("MOI_API_008", "MOI_API_008土地標示部異動索引服務", "fallback", "price_by_row", 3, "docs/cop-scrape/05-服務說明文件/MOI_API_008土地標示部異動索引服務.html", "依地號提供，單筆 3 元"),
  makeEntry("MOI_API_009", "MOI_API_009所有權人比對服務", "restricted", "restricted", null, "docs/cop-scrape/05-服務說明文件/MOI_API_009所有權人比對服務.html", "僅提供中央機關申請"),
  makeEntry("MOI_API_010", "MOI_API_010公有土地登記資料服務", "restricted", "restricted", null, "docs/cop-scrape/05-服務說明文件/MOI_API_010公有土地登記資料服務.html", "僅提供中央機關申請"),
  makeEntry("MOI_API_011", "MOI_API_011新舊地建號轉換服務", "free_enrichment", "free", 0, "docs/cop-scrape/05-服務說明文件/MOI_API_011新舊地建號轉換服務.html", "免費"),
  makeEntry("MOI_API_012", "MOI_API_012全國土地基本資料庫代碼資料服務", "free_enrichment", "free", 0, "docs/cop-scrape/05-服務說明文件/MOI_API_012全國土地基本資料庫代碼資料服務.html", "免費"),
  makeEntry("MOI_API_013", "MOI_API_013地段資料服務", "required", "auth_free", 0, "docs/cop-scrape/05-服務說明文件/MOI_API_013地段資料服務.html", "免費，需帳號驗證"),
  makeEntry("MOI_API_014", "MOI_API_014公告地價與公告土地現值資料服務", "required", "auth_free", 0, "docs/cop-scrape/05-服務說明文件/MOI_API_014公告地價與公告土地現值資料服務.html", "免費，需帳號驗證"),
  makeEntry("MOI_API_015", "MOI_API_015建號資料服務", "required", "price_by_row", 1, "docs/cop-scrape/05-服務說明文件/MOI_API_015建號資料服務.html", "每筆地號 1 元"),
  makeEntry("MOI_API_016", "MOI_API_016土地標示及權利範圍查詢服務", "required", "price_by_row", 2, "docs/cop-scrape/05-服務說明文件/MOI_API_016土地標示及權利範圍查詢服務.html", "單筆 2 元"),
  makeEntry("MOI_API_017", "MOI_API_017土地權利種類及登記事項查詢服務", "required", "price_by_row", 2, "docs/cop-scrape/05-服務說明文件/MOI_API_017土地權利種類及登記事項查詢服務.html", "單筆 2 元"),
  makeEntry("MOI_API_018", "MOI_API_018非都市土地使用管制註記查詢服務", "fallback", "price_by_row", 1, "docs/cop-scrape/05-服務說明文件/MOI_API_018非都市土地使用管制註記查詢服務.html", "單筆 1 元"),
  makeEntry("MOI_API_019", "MOI_API_019興建農舍註記資料服務", "fallback", "price_by_row", 1, "docs/cop-scrape/05-服務說明文件/MOI_API_019興建農舍註記資料服務.html", "單筆 1 元"),
  makeEntry("MOI_API_020", "MOI_API_020土壤或地下水污染場址註記查詢服務", "free_enrichment", "price_by_row", 1, "docs/cop-scrape/05-服務說明文件/MOI_API_020土壤或地下水污染場址註記查詢服務.html", "單筆 1 元"),
  makeEntry("MOI_API_021", "MOI_API_021地籍圖重測註記查詢服務", "free_enrichment", "price_by_row", 1, "docs/cop-scrape/05-服務說明文件/MOI_API_021地籍圖重測註記查詢服務.html", "單筆 1 元"),
  makeEntry("MOI_API_022", "MOI_API_022公告徵收註記查詢服務", "free_enrichment", "price_by_row", 1, "docs/cop-scrape/05-服務說明文件/MOI_API_022公告徵收註記查詢服務.html", "單筆 1 元"),
  makeEntry("MOI_API_023", "MOI_API_023土地位置概圖服務", "free_enrichment", "price_by_row", 1, "docs/cop-scrape/05-服務說明文件/MOI_API_023土地位置概圖服務.html", "單筆 1 元"),
  makeEntry("MOI_API_024", "MOI_API_024地籍圖詮釋資料", "free_enrichment", "free", 0, "docs/cop-scrape/05-服務說明文件/MOI_API_024地籍圖詮釋資料.html", "免費"),
  makeEntry("MOI_API_025", "MOI_API_025罕用字查詢", "free_enrichment", "free", 0, "docs/cop-scrape/05-服務說明文件/MOI_API_025罕用字查詢.html", "免費"),
  makeEntry("MOI_API_026", "MOI_API_026建物標示及權利範圍查詢服務", "required", "price_by_row", 2, "docs/cop-scrape/05-服務說明文件/MOI_API_026建物標示及權利範圍查詢服務.html", "單筆 2 元"),
  makeEntry("MOI_API_027", "MOI_API_027建物遭受放射性污染之虞註記查詢服務", "free_enrichment", "free", 0, "docs/cop-scrape/05-服務說明文件/MOI_API_027建物遭受放射性污染之虞註記查詢服務.html", "免費"),
  makeEntry("MOI_API_028", "MOI_API_028建物權利種類及其登記狀態查詢服務", "required", "price_by_row", 2, "docs/cop-scrape/05-服務說明文件/MOI_API_028建物權利種類及其登記狀態查詢服務.html", "單筆 2 元"),
  makeEntry("MOI_API_036", "MOI_API_036門牌查建號服務", "required", "auth_free", 0, "docs/cop-scrape/05-服務說明文件/MOI_API_036門牌查建號服務.html", "免費，需帳號驗證"),
  makeEntry("MOI_API_037", "MOI_API_037門牌模糊檢索建號服務", "restricted", "restricted", null, "docs/cop-scrape/05-服務說明文件/MOI_API_037門牌模糊檢索建號服務.html", "僅提供中央機關申請"),
  makeEntry("MOI_API_041", "MOI_API_041帳務查詢API", "billing_only", "auth_free", 0, "docs/cop-scrape/05-服務說明文件/MOI_API_041帳務查詢API.html", "免費，需帳號驗證"),
  makeEntry("MOI_API_043", "MOI_API_043新舊地段查詢服務", "free_enrichment", "auth_free", 0, "docs/cop-scrape/05-服務說明文件/MOI_API_043新舊地段查詢服務.html", "免費，需帳號驗證"),
  makeEntry("MOI_API_044", "MOI_API_044宗地中心點坐標資料服務", "restricted", "restricted", null, "docs/cop-scrape/05-服務說明文件/MOI_API_044宗地中心點坐標資料服務.html", "僅提供中央機關申請"),
  makeEntry("MOI_API_045", "MOI_API_045三維地籍建物標示部資料服務", "restricted", "restricted", null, "docs/cop-scrape/05-服務說明文件/MOI_API_045三維地籍建物標示部資料服務.html", "僅提供中央機關申請"),
  makeEntry("MOI_API_046", "MOI_API_046三維地籍建號定位點資料服務", "restricted", "restricted", null, "docs/cop-scrape/05-服務說明文件/MOI_API_046三維地籍建號定位點資料服務.html", "僅提供中央機關申請"),
];

export const MOI_SERVICE_CATALOG: ServiceCatalogEntry[] = SERVICE_SEED.slice();

export function listMoiServiceCatalog(): ServiceCatalogEntry[] {
  return MOI_SERVICE_CATALOG.slice();
}

export function getMoiServiceCatalogEntry(serviceCode: string): ServiceCatalogEntry | undefined {
  return MOI_SERVICE_CATALOG.find((entry) => entry.serviceCode === serviceCode);
}

export function buildMoiServiceCatalogFromScrape(
  rows: ScrapedServiceRow[],
): ServiceCatalogEntry[] {
  return rows.map((row) => {
    const serviceCode = extractServiceCode(row.serviceName);
    const pricePolicy = parsePricePolicy(row.priceDescribeUser, row.tags);
    return {
      serviceCode,
      displayName: row.serviceName,
      sourceDocument: `docs/cop-scrape/05-服務說明文件/${row.serviceName}.html`,
      accessEligibility: row.priceDescribeUser?.trim() ?? "unknown",
      implementationPriority: inferImplementationPriority(serviceCode, pricePolicy, row.priceDescribeUser),
      pricePolicy,
      unitPrice: inferUnitPrice(row.priceDescribeUser, row.tags, pricePolicy),
      pricingEvidence: row.priceDescribeUser?.trim() || "unknown",
      documentUrl: row.documentUrl,
      requestCount: row.requestCount,
    };
  });
}

export function parsePricePolicy(
  priceDescribeUser?: string,
  tags?: { badges?: string[]; pricing?: string[] } | null,
): ServicePricePolicy {
  const text = priceDescribeUser?.trim() ?? "";
  const badges = tags?.badges ?? [];
  if (/僅提供中央機關申請/.test(text) || badges.includes("GOV_APPLY")) return "restricted";
  if (/免費/.test(text) && /需帳號驗證|需應用系統驗證/.test(text)) return "auth_free";
  if (/每\s*\d+\s*分鐘/.test(text)) return "price_by_duration";
  if (/依地段|每地段|每段/.test(text) || badges.includes("PRICE_BY_LOCATION")) {
    return "price_by_location";
  }
  if (/單筆|每筆|回傳筆數計費/.test(text) || badges.includes("PRICE_BY_ROW")) {
    return "price_by_row";
  }
  if (/免費/.test(text)) return "free";
  return "unknown";
}

export function inferUnitPrice(
  priceDescribeUser?: string,
  tags?: { badges?: string[]; pricing?: string[] } | null,
  policy?: ServicePricePolicy,
): number | null {
  const text = priceDescribeUser?.trim() ?? "";
  if (policy === "free" || policy === "auth_free" || policy === "restricted") return policy === "restricted" ? null : 0;
  const digits = text.match(/(\d+(?:\.\d+)?)/g);
  if (digits && digits.length > 0) {
    const numeric = Number(digits[digits.length - 1]);
    if (Number.isFinite(numeric)) return numeric;
  }
  if (tags?.pricing?.length) {
    const fromTags = tags.pricing.join(" ").match(/(\d+(?:\.\d+)?)/);
    if (fromTags) return Number(fromTags[1]);
  }
  return null;
}

export function inferImplementationPriority(
  serviceCode: string,
  pricePolicy: ServicePricePolicy,
  priceDescribeUser?: string,
): ServiceImplementationPriority {
  if (pricePolicy === "restricted") return "restricted";
  if (serviceCode === "MOI_API_041") return "billing_only";
  if (pricePolicy === "free") return "free_enrichment";
  if (serviceCode === "MOI_API_008" || serviceCode === "MOI_API_018" || serviceCode === "MOI_API_019") {
    return "fallback";
  }
  if (/門牌查建號|地號資料|建號資料|土地標示|建物標示|所有權/.test(priceDescribeUser ?? "")) {
    return "required";
  }
  return "defer";
}

export interface CoverageDecision {
  status:
    | "integrated"
    | "fallback"
    | "free_enrichment"
    | "restricted"
    | "deferred"
    | "missing"
    | "unknown_pricing";
  serviceCodes: string[];
  pricePolicies: ServicePricePolicy[];
  reason: string;
}

export function getCoverageDecision(serviceCodes: string[]): CoverageDecision {
  const catalogEntries = serviceCodes
    .map((serviceCode) => getMoiServiceCatalogEntry(serviceCode))
    .filter((entry): entry is ServiceCatalogEntry => Boolean(entry));

  if (serviceCodes.length > 0 && catalogEntries.length !== serviceCodes.length) {
    const knownCodes = new Set(catalogEntries.map((entry) => entry.serviceCode));
    const missingCodes = serviceCodes.filter((serviceCode) => !knownCodes.has(serviceCode));
    return {
      status: "missing",
      serviceCodes,
      pricePolicies: [],
      reason: `service code not found in local catalog: ${missingCodes.join(", ")}`,
    };
  }

  if (catalogEntries.length === 0) {
    return {
      status: "deferred",
      serviceCodes,
      pricePolicies: [],
      reason: "no service dependency",
    };
  }

  if (catalogEntries.some((entry) => entry.pricePolicy === "unknown")) {
    return {
      status: "unknown_pricing",
      serviceCodes,
      pricePolicies: catalogEntries.map((entry) => entry.pricePolicy),
      reason: "pricing is unresolved for at least one service code",
    };
  }

  if (catalogEntries.some((entry) => entry.implementationPriority === "restricted")) {
    return {
      status: "restricted",
      serviceCodes,
      pricePolicies: catalogEntries.map((entry) => entry.pricePolicy),
      reason: "at least one dependency is restricted",
    };
  }

  if (catalogEntries.some((entry) => entry.implementationPriority === "fallback")) {
    return {
      status: "fallback",
      serviceCodes,
      pricePolicies: catalogEntries.map((entry) => entry.pricePolicy),
      reason: "coverage is available only through fallback dependencies",
    };
  }

  if (catalogEntries.every((entry) => entry.implementationPriority === "free_enrichment")) {
    return {
      status: "free_enrichment",
      serviceCodes,
      pricePolicies: catalogEntries.map((entry) => entry.pricePolicy),
      reason: "coverage is supported by free enrichment services",
    };
  }

  return {
    status: "integrated",
    serviceCodes,
    pricePolicies: catalogEntries.map((entry) => entry.pricePolicy),
    reason: "required dependency exists in local catalog",
  };
}

function makeEntry(
  serviceCode: string,
  displayName: string,
  implementationPriority: ServiceImplementationPriority,
  pricePolicy: ServicePricePolicy,
  unitPrice: number | null,
  sourceDocument: string,
  pricingEvidence: string,
): ServiceCatalogEntry {
  return {
    serviceCode,
    displayName,
    sourceDocument,
    accessEligibility:
      implementationPriority === "restricted"
        ? "government_only"
        : implementationPriority === "billing_only"
          ? "admin_only"
          : implementationPriority === "required"
            ? "normal_user"
            : "normal_user",
    implementationPriority,
    pricePolicy,
    unitPrice,
    pricingEvidence,
  };
}

function extractServiceCode(serviceName: string): string {
  const match = serviceName.match(/^(MOI_[A-Z0-9_]+)/);
  return match?.[1] ?? serviceName;
}
