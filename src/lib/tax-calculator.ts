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
