import { localApiFetch } from "@/lib/local-api/client";
import { isTauriEnv, safeInvoke } from "@/lib/safe-invoke";

export interface RealPriceRecord {
  address: string;
  total_price?: number;
  area?: number;
  unit_price?: number;
  date?: string;
  transaction_date?: string;
  type?: string;
}

const WEB_REAL_PRICE_TIMEOUT_MS = 12_000;

export function extractRealPriceDistrict(address: string): string {
  const match = address.match(/^(?:.*?[縣市])?(.{1,4}[鄉鎮市區])/);
  return match?.[1]?.trim() ?? "";
}

export function extractRealPriceKeyword(address: string, district?: string): string {
  const trimmed = address.trim();
  const districtToken = district?.trim() || extractRealPriceDistrict(trimmed);
  const withoutDistrict = districtToken ? trimmed.replace(districtToken, "") : trimmed;
  const withoutCity = withoutDistrict.replace(/^[^縣市]*[縣市]/, "");

  const roadMatch = withoutCity.match(/([\u4e00-\u9fffA-Za-z]+?(?:路|街|大道)(?:[一二三四五六七八九十百甲乙丙丁0-9]+段)?)/u);
  if (roadMatch?.[1]) {
    return roadMatch[1].replace(/^.*[里村鄰]/u, "").trim();
  }

  const leadingText = withoutCity.match(/^[^0-9０-９]+/);
  return (leadingText?.[0] ?? withoutCity).replace(/^.*[里村鄰]/u, "").trim();
}

export async function queryRealPrice(
  district: string,
  keyword: string,
  limit = 20,
  address?: string,
): Promise<RealPriceRecord[]> {
  if (await isTauriEnv()) {
    return safeInvoke<RealPriceRecord[]>("query_real_price", {
      district,
      keyword,
      limit,
    });
  }

  const response = await localApiFetch("/api/local/real-price", {
    method: "POST",
    signal: AbortSignal.timeout(WEB_REAL_PRICE_TIMEOUT_MS),
    body: JSON.stringify({ district, keyword, limit, address }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string; error?: string } | null;
    throw new Error(payload?.message || payload?.error || `query_real_price 失敗：HTTP ${response.status}`);
  }

  const payload = await response.json() as { records?: RealPriceRecord[] };
  return Array.isArray(payload.records) ? payload.records : [];
}
