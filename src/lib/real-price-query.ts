import {
	createAireGatewayHeaders,
	getAireGatewayBaseUrl,
	isBrowserLocalFirstEnabled,
} from "@/lib/browser-gateway";
import { writeLog } from "@/lib/log";
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
  distance_m?: number;
}

export interface RealPriceDebug {
  source?: string;
  city?: string;
  fileCode?: string;
  fileName?: string;
  district?: string;
  keyword?: string;
  comparableRoad?: string;
  lookbackYears?: number;
  counts?: {
    totalRows?: number;
    withinLookback?: number;
    sameDistrict?: number;
    scoredRows?: number;
    mergedRows?: number;
    returnedRecords?: number;
  };
}

const WEB_REAL_PRICE_TIMEOUT_MS = 65_000;

export class BrowserRealPriceUnavailableError extends Error {
  readonly code = "browser_real_price_unavailable";
  readonly detail: string | null;

  constructor(detail?: string | null) {
    super("SaaS 版實價登錄成交行情暫時無法取得");
    this.name = "BrowserRealPriceUnavailableError";
    this.detail = detail?.trim() ? detail.trim() : null;
  }
}

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
	if (isBrowserLocalFirstEnabled()) {
		const requestUrl = `${getAireGatewayBaseUrl()}/api/aire/real-price`;
		const requestId = createClientRequestId();
		const headers = {
			...createAireGatewayHeaders({ includeWorkspaceContext: false }),
			"x-aire-client-request-id": requestId,
		};
		let response: Response;
		try {
			response = await fetch(requestUrl, {
				method: "POST",
				headers,
				signal: AbortSignal.timeout(WEB_REAL_PRICE_TIMEOUT_MS),
				body: JSON.stringify({ district, keyword, limit, address }),
			});
		} catch (error) {
			const detail = [
				`browser_fetch_failed request_id=${requestId}`,
				`url=${requestUrl}`,
				`origin=${readWindowOrigin()}`,
				`online=${readNavigatorOnline()}`,
				`headers=${Object.keys(headers).join(",")}`,
				`error=${error instanceof Error ? error.message : String(error ?? "unknown_error")}`,
			].join(" | ");
			void writeLog("real_price_query", "error", { reason: detail });
			throw new BrowserRealPriceUnavailableError(detail);
		}
		const payload = (await response.json().catch(() => null)) as
			| { records?: RealPriceRecord[]; debug?: RealPriceDebug; message?: string; error?: string }
			| null;
		if (!response.ok) {
			const responseReqId =
				response.headers.get("x-aire-request-id") ||
				response.headers.get("x-aire-client-request-id") ||
				requestId;
			const detail = [
				payload?.message || payload?.error || `browser_real_price_http_${response.status}`,
				`request_id=${responseReqId}`,
				`status=${response.status}`,
				`route=${response.headers.get("x-aire-route-hit") || "unknown"}`,
			].join(" | ");
			void writeLog("real_price_query", "error", { reason: detail });
			throw new BrowserRealPriceUnavailableError(
				detail,
			);
		}
		void writeLog("real_price_query", "ok", {
			reason: [
        `request_id=${response.headers.get("x-aire-request-id") || requestId}`,
        payload?.debug?.source ? `source=${payload.debug.source}` : null,
        payload?.debug?.fileName ? `file=${payload.debug.fileName}` : null,
        payload?.debug?.district ? `district=${payload.debug.district}` : null,
        payload?.debug?.keyword ? `keyword=${payload.debug.keyword}` : null,
        payload?.debug?.counts ? `counts=${JSON.stringify(payload.debug.counts)}` : null,
      ].filter(Boolean).join(" | "),
		});
		return Array.isArray(payload?.records) ? payload.records : [];
	}

  if (await isTauriEnv()) {
    return safeInvoke<RealPriceRecord[]>("query_real_price", {
      district,
      keyword,
      limit,
      address,
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

function createClientRequestId(): string {
	if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
		return crypto.randomUUID();
	}
	return `aire-${Date.now()}`;
}

function readWindowOrigin(): string {
	return typeof window !== "undefined" ? window.location.origin : "unknown";
}

function readNavigatorOnline(): string {
	return typeof navigator !== "undefined" ? String(navigator.onLine) : "unknown";
}
