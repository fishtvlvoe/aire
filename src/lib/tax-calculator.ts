// 稅費計算引擎 — 台灣土地/建物交易相關費用試算

export interface TaxInput {
  totalPrice: number;         // 成交總價（元）
  announcedLandValue: number; // 公告現值（元/平方公尺）
  landArea: number;           // 土地面積（平方公尺）
  shareRatio: number;         // 持分比例（0-1）
  holdingYears: number;       // 持有年數
  isFirstSale: boolean;       // 是否適用自用住宅優惠稅率
  propertyType: 'land' | 'building';
}

export interface TaxResult {
  landValueIncrementTax: number;           // 土地增值稅（一般累進）
  landValueIncrementTaxPreferential: number; // 土地增值稅（自用住宅優惠 10%）
  deedTax: number;                          // 契稅（僅建物）
  stampTax: number;                         // 印花稅
  registrationFee: number;                  // 登記規費
  scrivenerFee: number;                     // 代書費（固定）
  totalSellerCost: number;                  // 賣方成本小計
  totalBuyerCost: number;                   // 買方成本小計
  warnings: string[];
  estimateMode?: boolean;                   // 是否為估算模式
  estimateBasis?: string[];                 // 估算依據
  missingInputs?: string[];                 // 缺少的資料
}

export interface LandValueIncrementTaxEstimateInput {
  totalPrice?: number | null;
  announcedLandValue?: number | null;
  previousTransferValue?: number | null;
  landArea?: number | null;
  shareRatio?: number | null;
  holdingYears?: number | null;
  isFirstSale?: boolean;
  propertyType: "land" | "building";
}

// ─────────────────────────────────────────────────────────────────────────────
// 土地增值稅累進稅率計算
// ─────────────────────────────────────────────────────────────────────────────

function calcLandValueIncrementTax(appreciation: number, originalValue: number): number {
  if (appreciation <= 0) return 0;

  // 三級累進：漲幅 ≤ 原價 → 20%；≤ 2倍原價 → 超出部分 30%；> 2倍 → 超出部分 40%
  const tier1 = originalValue;         // 第一級上限
  const tier2 = originalValue * 2;     // 第二級上限

  if (appreciation <= tier1) {
    return Math.round(appreciation * 0.2);
  } else if (appreciation <= tier2) {
    return Math.round(tier1 * 0.2 + (appreciation - tier1) * 0.3);
  } else {
    return Math.round(tier1 * 0.2 + tier1 * 0.3 + (appreciation - tier2) * 0.4);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 說明書第7頁用純函式（design.md C1 contract）
// ─────────────────────────────────────────────────────────────────────────────

export function stampTax(contractPrice: number, officialValue: number, shareRatio: number): number {
  const base = contractPrice + officialValue * shareRatio;
  if (base <= 0) return 0;
  return Math.round(base * 0.001);
}

export function deedTax(contractPrice: number): number {
  if (contractPrice <= 0) return 0;
  return Math.round(contractPrice * 0.06);
}

export function buildingTax(buildingCurrentValue: number, usage: "residential" | "commercial"): number {
  if (buildingCurrentValue <= 0) return 0;
  const rate = usage === "commercial" ? 0.03 : 0.012;
  return Math.round(buildingCurrentValue * rate);
}

export function landPriceTax(landCurrentValue: number, daysDiff: number): number {
  if (landCurrentValue <= 0 || daysDiff <= 0) return 0;
  return Math.round(landCurrentValue * (daysDiff / 365) * 0.002);
}

// ─────────────────────────────────────────────────────────────────────────────
// 主計算函式
// ─────────────────────────────────────────────────────────────────────────────

export function calculateTaxFees(input: TaxInput): TaxResult {
  const warnings: string[] = [];

  // 無效輸入 — 全部回 0
  if (input.totalPrice <= 0 || input.announcedLandValue <= 0) {
    if (input.totalPrice <= 0) warnings.push("成交總價未填寫，稅費試算無法計算");
    if (input.announcedLandValue <= 0) warnings.push("公告現值未填寫，土地增值稅無法計算");
    return {
      landValueIncrementTax: 0,
      landValueIncrementTaxPreferential: 0,
      deedTax: 0,
      stampTax: 0,
      registrationFee: 0,
      scrivenerFee: 0,
      totalSellerCost: 0,
      totalBuyerCost: 0,
      warnings,
    };
  }

  // 安全限制持分比例
  const shareRatio = Math.min(Math.max(input.shareRatio, 0), 1);

  // 原始地價（公告現值 × 面積 × 持分）
  const originalLandValue = input.announcedLandValue * input.landArea * shareRatio;

  // 土地佔比（簡化：土地交易 100%，建物交易 40% 估算地價）
  const landRatio = input.propertyType === 'land' ? 1.0 : 0.4;
  const landPriceInDeal = input.totalPrice * landRatio;

  // 漲價總額
  const appreciation = Math.max(0, landPriceInDeal - originalLandValue);

  // 土地增值稅（一般）
  const landValueIncrementTax = calcLandValueIncrementTax(appreciation, originalLandValue);

  // 土地增值稅（優惠：自用住宅 10%）
  const landValueIncrementTaxPreferential = Math.round(appreciation * 0.1);

  // 契稅：總價 × 6%（僅建物）
  const deedTax = input.propertyType === 'building' ? Math.round(input.totalPrice * 0.06) : 0;

  // 印花稅：總價 × 0.1%
  const stampTax = Math.round(input.totalPrice * 0.001);

  // 登記規費：總價 × 0.1%（土地登記規費）
  const registrationFee = Math.round(input.totalPrice * 0.001);

  // 代書費：固定 12,000 元
  const scrivenerFee = 12000;

  // 賣方成本 = 土地增值稅（一般）+ 印花稅
  const totalSellerCost = landValueIncrementTax + stampTax;

  // 買方成本 = 契稅 + 印花稅 + 登記規費 + 代書費
  const totalBuyerCost = deedTax + stampTax + registrationFee + scrivenerFee;

  // 警告：持分異常
  if (shareRatio !== input.shareRatio && input.shareRatio > 0) {
    warnings.push("持分比例超出 0~1 範圍，已自動修正");
  }

  // 警告：漲價總額為 0（可能低報）
  if (appreciation === 0 && input.totalPrice > 0) {
    warnings.push("漲價總額為零，土地增值稅試算為 0（請確認公告現值與成交價是否合理）");
  }

  return {
    landValueIncrementTax,
    landValueIncrementTaxPreferential,
    deedTax,
    stampTax,
    registrationFee,
    scrivenerFee,
    totalSellerCost,
    totalBuyerCost,
    warnings,
  };
}

export function estimateLandValueIncrementTax(
  input: LandValueIncrementTaxEstimateInput,
): TaxResult {
  const missingInputs: string[] = [];
  if (!input.announcedLandValue || input.announcedLandValue <= 0) missingInputs.push("公告現值");
  if (!input.previousTransferValue || input.previousTransferValue <= 0) missingInputs.push("前次移轉現值");
  if (!input.totalPrice || input.totalPrice <= 0) missingInputs.push("成交價");
  if (!input.shareRatio || input.shareRatio <= 0) missingInputs.push("持分");
  if (!input.landArea || input.landArea <= 0) missingInputs.push("土地面積");

  const estimateBasis = [
    input.propertyType === "land" ? "土地交易以成交價全額估算土地價值" : "建物交易先以成交價 40% 估算土地價值",
    "實際土地增值稅仍以主管機關核定為準",
  ];

  if (missingInputs.length > 0) {
    return {
      landValueIncrementTax: 0,
      landValueIncrementTaxPreferential: 0,
      deedTax: 0,
      stampTax: 0,
      registrationFee: 0,
      scrivenerFee: 0,
      totalSellerCost: 0,
      totalBuyerCost: 0,
      estimateMode: true,
      estimateBasis,
      missingInputs,
      warnings: [
        `土地增值稅為估算模式；缺少${missingInputs.join("、")}，不可視為正式稅額。`,
      ],
    };
  }

  const shareRatio = Math.min(Math.max(input.shareRatio!, 0), 1);
  const currentLandValue = input.announcedLandValue! * input.landArea! * shareRatio;
  const previousLandValue = input.previousTransferValue! * input.landArea! * shareRatio;
  const dealLandValue = input.propertyType === "land" ? input.totalPrice! : input.totalPrice! * 0.4;
  const estimateBaseValue = Math.max(currentLandValue, dealLandValue);
  const appreciation = Math.max(0, estimateBaseValue - previousLandValue);
  const landValueIncrementTax = calcLandValueIncrementTax(appreciation, previousLandValue);
  const landValueIncrementTaxPreferential = Math.round(appreciation * 0.1);
  const stamp = Math.round(input.totalPrice! * 0.001);
  const registration = Math.round(input.totalPrice! * 0.001);
  const deed = input.propertyType === "building" ? Math.round(input.totalPrice! * 0.06) : 0;
  const scrivener = 12000;

  return {
    landValueIncrementTax,
    landValueIncrementTaxPreferential,
    deedTax: deed,
    stampTax: stamp,
    registrationFee: registration,
    scrivenerFee: scrivener,
    totalSellerCost: landValueIncrementTax + stamp,
    totalBuyerCost: deed + stamp + registration + scrivener,
    warnings: ["土地增值稅為估算模式，正式稅額仍以主管機關核定為準。"],
    estimateMode: true,
    estimateBasis,
    missingInputs: [],
  };
}
