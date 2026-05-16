import { mockInvoke } from "./mock-backend";

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI__" in window;
}

async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (isTauri()) {
    const { invoke: tauriInvoke } = await import("@tauri-apps/api/core");
    return tauriInvoke<T>(cmd, args);
  }
  return mockInvoke<T>(cmd, args);
}

export interface ParcelInfo {
  parcel_id: string;
  address: string;
  lot_number: string;
  building_number: string;
}

export interface ApiResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  source: "api" | "cache" | "manual";
}

export interface PullResult {
  results: Record<string, ApiResult>;
  total_cost: number;
}

export interface BalanceInfo {
  month_total_cost: number;
  month_query_count: number;
  low_balance_warning: boolean;
}

export interface ApiKeyInfo {
  client_id_masked: string;
  has_secret: boolean;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
}

export async function addressLookup(address: string): Promise<ParcelInfo[]> {
  return invoke<ParcelInfo[]>("land_registry_address_lookup", { address });
}

export async function pullData(parcelId: string, apiIds: string[]): Promise<PullResult> {
  return invoke<PullResult>("land_registry_pull_data", { parcelId, apiIds });
}

export async function setApiKey(clientId: string, clientSecret: string): Promise<void> {
  return invoke<void>("land_registry_set_api_key", { clientId, clientSecret });
}

export async function getApiKey(): Promise<ApiKeyInfo | null> {
  return invoke<ApiKeyInfo | null>("land_registry_get_api_key");
}

export async function testConnection(): Promise<ConnectionTestResult> {
  return invoke<ConnectionTestResult>("land_registry_test_connection");
}

export async function getBalance(): Promise<BalanceInfo> {
  return invoke<BalanceInfo>("land_registry_get_balance");
}

export async function recordConsent(caseId: string): Promise<void> {
  return invoke<void>("land_registry_record_consent", { caseId });
}

export function mapErrorToMessage(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes("ApiKeyNotConfigured")) return "請先在設定頁設定地政 API 金鑰";
  if (msg.includes("AuthenticationFailed")) return "API 認證失敗，請確認金鑰設定";
  if (msg.includes("ConsentRequired")) return "請先取得所有權人授權同意";
  if (msg.includes("InsufficientBalance")) return "餘額不足，請聯繫平台補值";
  return `查詢失敗：${msg}`;
}
