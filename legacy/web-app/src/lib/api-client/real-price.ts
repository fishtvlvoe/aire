import { fetchDataAPI, type ApiResult } from './index';

export interface RealPriceRecord {
  address: string;
  price: number;
  area: number;
  date: string;
  district?: string;
  type?: string;
}

export interface RealPriceResponse {
  data: RealPriceRecord[];
  total: number;
}

export interface QueryRealPriceParams {
  city: string;
  district?: string;
  year?: number;
  type?: string;
  limit?: number;
  offset?: number;
}

/**
 * 查詢實價登錄。雲端 API 不可用時回 `{ available: false, data: null }`。
 */
export async function queryRealPrice(
  params: QueryRealPriceParams
): Promise<ApiResult<RealPriceResponse>> {
  const search = new URLSearchParams();
  search.set('city', params.city);
  if (params.district) search.set('district', params.district);
  if (params.year != null) search.set('year', String(params.year));
  if (params.type) search.set('type', params.type);
  if (params.limit != null) search.set('limit', String(params.limit));
  if (params.offset != null) search.set('offset', String(params.offset));

  return fetchDataAPI<RealPriceResponse>(`/api/data/real-price?${search.toString()}`);
}
