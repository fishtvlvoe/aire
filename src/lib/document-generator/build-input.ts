import type { Listing } from '../db';
import type { DocumentGeneratorInput } from './types';
import type { ExtractedDataPayload } from '../ocr';

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
 */
function flattenExtractedData(raw: Record<string, unknown>): Record<string, unknown> {
  const maybePayload = raw as unknown as Partial<ExtractedDataPayload>;
  if (maybePayload.merged_fields && typeof maybePayload.merged_fields === 'object') {
    const flat: Record<string, unknown> = {};
    for (const [key, field] of Object.entries(maybePayload.merged_fields)) {
      if (field && typeof field === 'object' && 'value' in field) {
        flat[key] = (field as { value: unknown }).value;
      }
    }
    return flat;
  }
  return raw;
}

/**
 * 依優先順序從多個資料來源取值：supplementary_data > extracted_data > field_visit_data
 */
function getMergedValue(
  fieldName: string,
  sources: {
    supplementary_data: Record<string, unknown>;
    extracted_data: Record<string, unknown>;
    field_visit_data: Record<string, unknown>;
  },
): unknown {
  if (sources.supplementary_data[fieldName] !== undefined && sources.supplementary_data[fieldName] !== '') {
    return sources.supplementary_data[fieldName];
  }
  if (sources.extracted_data[fieldName] !== undefined && sources.extracted_data[fieldName] !== '') {
    return sources.extracted_data[fieldName];
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
 * 4. 組裝 market_research attachments
 * 5. 回傳完整 DocumentGeneratorInput
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
