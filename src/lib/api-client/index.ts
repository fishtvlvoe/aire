/**
 * Cloud Data API client — 客戶端封裝呼叫雲端 server/ 的 API。
 *
 * 設計原則（hybrid-architecture D4 + D5）：
 *  - 雲端 API 不可用 → 回 `{ available: false, data: null }`，**不 throw**，
 *    讓呼叫端自行決定要 fallback 到本地計算還是給用戶提示
 *  - 5 秒 timeout（避免拖慢業務流程）
 *  - 環境變數 `DATA_API_URL` 未設定 → 直接 `available: false`，不發任何請求
 */

const DEFAULT_TIMEOUT_MS = 5000;

export interface ApiResult<T> {
  available: boolean;
  data: T | null;
  error?: string;
}

export interface FetchDataAPIOptions {
  /** HTTP method，預設 GET */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** request body（POST / PUT 用） */
  body?: BodyInit | Record<string, unknown> | null;
  /** Content-Type 自動處理：物件 → application/json，string → text/plain */
  headers?: Record<string, string>;
  /** 自訂 timeout（毫秒），預設 5000 */
  timeoutMs?: number;
}

/** 取得雲端 API base URL；未設定回 null（呼叫者應視為 unavailable） */
export function getDataApiBaseUrl(): string | null {
  const url = process.env.DATA_API_URL?.trim();
  return url ? url.replace(/\/+$/, '') : null;
}

/**
 * 對雲端 API 發 request。任何錯誤（網路、timeout、5xx）都回 `{ available: false }`，不 throw。
 */
export async function fetchDataAPI<T>(
  path: string,
  options: FetchDataAPIOptions = {}
): Promise<ApiResult<T>> {
  const baseUrl = getDataApiBaseUrl();
  if (!baseUrl) {
    return { available: false, data: null, error: 'DATA_API_URL not configured' };
  }

  const { method = 'GET', body = null, headers = {}, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  const fullUrl = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  const finalHeaders: Record<string, string> = { ...headers };
  let finalBody: BodyInit | null = null;
  if (body != null) {
    if (typeof body === 'string') {
      finalBody = body;
      if (!finalHeaders['Content-Type']) finalHeaders['Content-Type'] = 'text/plain';
    } else if (body instanceof FormData || body instanceof URLSearchParams || body instanceof Blob) {
      finalBody = body;
    } else {
      finalBody = JSON.stringify(body);
      if (!finalHeaders['Content-Type']) finalHeaders['Content-Type'] = 'application/json';
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(fullUrl, {
      method,
      headers: finalHeaders,
      body: finalBody,
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        available: false,
        data: null,
        error: `HTTP ${response.status} ${response.statusText}`,
      };
    }

    const data = (await response.json()) as T;
    return { available: true, data };
  } catch (err) {
    const message =
      err instanceof DOMException && err.name === 'AbortError'
        ? `timeout after ${timeoutMs}ms`
        : err instanceof Error
          ? err.message
          : 'unknown error';
    return { available: false, data: null, error: message };
  } finally {
    clearTimeout(timer);
  }
}
