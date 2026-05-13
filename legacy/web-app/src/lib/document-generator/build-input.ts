import type { Listing } from '../db';
import type { DocumentGeneratorInput } from './types';
import type { ExtractedDataPayload } from '../ocr';
import { calculateTaxFees, calculateLandValueIncrement } from './tax-calculator';

const DEFAULT_OCR_THRESHOLD = 0.80;
const envThreshold = parseFloat(process.env.OCR_CONFIDENCE_THRESHOLD ?? '');
const OCR_THRESHOLD =
  !isNaN(envThreshold) && isFinite(envThreshold) && envThreshold >= 0 && envThreshold <= 1
    ? envThreshold
    : DEFAULT_OCR_THRESHOLD;

/**
 * 安全解析 JSON 字串，失敗時回傳 {}
 */
function safeParseObject(json: string | null): Record<string, unknown> {
  if (!json) return {};
  try {
    const parsed = JSON.parse(json) as unknown;
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

/**
 * 將 ExtractedDataPayload 轉換為扁平的 Record<string, unknown>，供生成器使用。
 * - 若輸入是 ExtractedDataPayload 格式（含 merged_fields），從 merged_fields 提取 value
 * - 若輸入已是扁平物件，直接回傳
 * - 若欄位有 confidence 屬性且低於門檻，過濾掉（避免亂碼滲入）
 */
function flattenExtractedData(raw: Record<string, unknown>): Record<string, unknown> {
  const maybePayload = raw as unknown as Partial<ExtractedDataPayload>;
  if (maybePayload.merged_fields && typeof maybePayload.merged_fields === 'object') {
    const flat: Record<string, unknown> = {};
    for (const [key, field] of Object.entries(maybePayload.merged_fields)) {
      if (field && typeof field === 'object' && 'value' in field) {
        const fieldObj = field as { value: unknown; confidence?: number };
        if (typeof fieldObj.confidence === 'number' && fieldObj.confidence < OCR_THRESHOLD) {
          continue;
        }
        flat[key] = fieldObj.value;
      }
    }
    return flat;
  }
  return raw;
}

/**
 * 依優先順序從多個資料來源取值：supplementary_data > extracted_data > field_visit_data
 * 排除 undefined、null、空字串
 */
function getMergedValue(
  fieldName: string,
  sources: {
    supplementary_data: Record<string, unknown>;
    extracted_data: Record<string, unknown>;
    field_visit_data: Record<string, unknown>;
  },
): unknown {
  const sup = sources.supplementary_data[fieldName];
  if (sup !== undefined && sup !== null && sup !== '') {
    return sup;
  }
  const ext = sources.extracted_data[fieldName];
  if (ext !== undefined && ext !== null && ext !== '') {
    return ext;
  }
  return sources.field_visit_data[fieldName];
}

/**
 * 計算 system_computed 衍生值
 * - area_ping: building_area（平方公尺）× 0.3025
 * - building_age: 當前年 - (year_built 民國年 + 1911)
 */
function computeSystemComputed(
  sources: {
    supplementary_data: Record<string, unknown>;
    extracted_data: Record<string, unknown>;
    field_visit_data: Record<string, unknown>;
  },
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const currentYear = new Date().getFullYear();

  // area_ping
  const buildingAreaRaw = getMergedValue('building_area', sources);
  const buildingArea = typeof buildingAreaRaw === 'string' ? parseFloat(buildingAreaRaw) : typeof buildingAreaRaw === 'number' ? buildingAreaRaw : NaN;
  if (!isNaN(buildingArea) && buildingArea >= 0) {
    result.area_ping = Number((buildingArea * 0.3025).toFixed(2));
  }

  // building_age
  const yearBuiltRaw = getMergedValue('year_built', sources);
  const yearBuilt = typeof yearBuiltRaw === 'string' ? parseFloat(yearBuiltRaw) : typeof yearBuiltRaw === 'number' ? yearBuiltRaw : NaN;
  if (!isNaN(yearBuilt) && yearBuilt > 0) {
    const westernYear = yearBuilt > 1000 ? yearBuilt : yearBuilt + 1911;
    const age = currentYear - westernYear;
    if (age >= 0) {
      result.building_age = age;
    }
  }

  // report_date
  result.report_date = new Date().toISOString().split('T')[0];

  return result;
}

/**
 * 從 attachments JSON 中提取 market_research 類型的附件路徑
 */
function extractMarketResearchAttachments(attachmentsJson: string | null): string[] {
  if (!attachmentsJson) return [];
  try {
    const parsed = JSON.parse(attachmentsJson) as unknown;
    if (!Array.isArray(parsed)) return [];
    return (parsed as Array<{ type?: string; path?: string }>)
      .filter((a) => a?.type === 'market_research' && typeof a.path === 'string')
      .map((a) => a.path as string);
  } catch {
    return [];
  }
}

/**
 * 從 Listing 組裝完整的 DocumentGeneratorInput。
 *
 * 功能：
 * 1. 解析 extracted_data（含 ExtractedDataPayload → 扁平轉換）
 * 2. 解析 pre_commission_data
 * 3. 計算 system_computed（area_ping、building_age、report_date）
 * 4. 計算稅費（deed_tax、stamp_tax、registration_fee、escrow_fee）
 * 5. 組裝 market_research attachments
 * 6. 回傳完整 DocumentGeneratorInput
 */
export function buildDocumentInput(listing: Listing): DocumentGeneratorInput {
  const field_visit_data = safeParseObject(listing.field_visit_data);
  const supplementary_data = safeParseObject(listing.supplementary_data);
  const pre_commission_data = safeParseObject(listing.pre_commission_data);
  const extractedDataRaw = safeParseObject(listing.extracted_data);
  const extracted_data = flattenExtractedData(extractedDataRaw);

  const system_computed = computeSystemComputed({
    supplementary_data,
    extracted_data,
    field_visit_data,
  });

  // 解析售價：supplementary_data.sale_price_text 儲存為「萬元」字串（如 "2000"），× 10000 還原為元
  const salePriceText = supplementary_data.sale_price_text;
  const salePriceWan = typeof salePriceText === 'string'
    ? parseFloat(salePriceText)
    : typeof salePriceText === 'number'
      ? salePriceText
      : NaN;
  const sale_price = !isNaN(salePriceWan) && isFinite(salePriceWan) && salePriceWan > 0 ? salePriceWan * 10000 : undefined;

  // 解析房屋現值：優先取 supplementary_data，次取 extracted_data
  const houseAssessedRaw = supplementary_data.house_assessed_value !== undefined && supplementary_data.house_assessed_value !== ''
    ? supplementary_data.house_assessed_value
    : extracted_data.house_assessed_value;
  const houseAssessedNum = typeof houseAssessedRaw === 'string'
    ? parseFloat(houseAssessedRaw)
    : typeof houseAssessedRaw === 'number'
      ? houseAssessedRaw
      : NaN;
  const house_assessed_value = !isNaN(houseAssessedNum) && isFinite(houseAssessedNum) && houseAssessedNum > 0 ? houseAssessedNum : undefined;

  // 呼叫稅費計算，將結果附加至 system_computed
  const taxResult = calculateTaxFees({ sale_price, house_assessed_value });
  if (taxResult.deed_tax !== null) system_computed.computed_deed_tax = taxResult.deed_tax;
  if (taxResult.stamp_tax_buyer !== null) system_computed.computed_stamp_tax_buyer = taxResult.stamp_tax_buyer;
  if (taxResult.stamp_tax_seller !== null) system_computed.computed_stamp_tax_seller = taxResult.stamp_tax_seller;
  if (taxResult.registration_fee !== null) system_computed.computed_registration_fee = taxResult.registration_fee;
  if (taxResult.escrow_fee_each !== null) system_computed.computed_escrow_fee_each = taxResult.escrow_fee_each;

  // 土地增值稅試算（取 extracted_data 或 supplementary_data 的前次移轉現值）
  const prevTransferRaw = extracted_data.previous_transfer_value ?? supplementary_data.previous_transfer_value;
  const prevTransferNum = typeof prevTransferRaw === 'number' ? prevTransferRaw
    : typeof prevTransferRaw === 'string' ? parseFloat(prevTransferRaw)
    : NaN;
  const landIncrement = calculateLandValueIncrement({
    previous_transfer_value: isFinite(prevTransferNum) ? prevTransferNum : undefined,
  });
  if (landIncrement !== null) {
    system_computed.computed_land_increment_general_approx = landIncrement.general;
    system_computed.computed_land_increment_self_use_approx = landIncrement.selfUse;
  }

  // system_computed tax keys (conditionally present):
  // computed_deed_tax: number
  // computed_stamp_tax_buyer: number
  // computed_stamp_tax_seller: number
  // computed_registration_fee: number
  // computed_escrow_fee_each: number

  const marketResearchAttachments = extractMarketResearchAttachments(listing.attachments);

  return {
    property_type: listing.property_type,
    field_visit_data,
    supplementary_data,
    extracted_data,
    system_computed,
    pre_commission_data,
    market_research: {
      summary: listing.market_summary ?? null,
      attachments: marketResearchAttachments,
    },
  };
}
