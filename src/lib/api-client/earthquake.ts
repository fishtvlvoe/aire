import { fetchDataAPI, type ApiResult } from './index';

export interface EarthquakeRecord {
  date: string;
  magnitude: number;
  depth: number;
  distance_km: number;
}

export interface EarthquakeResponse {
  data: EarthquakeRecord[];
  total: number;
}

export interface QueryEarthquakeParams {
  lat: number;
  lng: number;
  /** 公里，預設 5 */
  radius?: number;
  /** ISO 日期，預設近 5 年 */
  since?: string;
}

/**
 * 查詢周邊地震紀錄。雲端 API 不可用時回 `{ available: false, data: null }`。
 */
export async function queryEarthquake(
  params: QueryEarthquakeParams
): Promise<ApiResult<EarthquakeResponse>> {
  const search = new URLSearchParams();
  search.set('lat', String(params.lat));
  search.set('lng', String(params.lng));
  if (params.radius != null) search.set('radius', String(params.radius));
  if (params.since) search.set('since', params.since);

  return fetchDataAPI<EarthquakeResponse>(`/api/data/earthquake?${search.toString()}`);
}
