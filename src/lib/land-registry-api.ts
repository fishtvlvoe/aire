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
  source?: "cop_moi" | "nlsc_cad" | "mock";
  trusted_for_pdf?: boolean;
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

export interface BillingLineItem {
  service_name: string;
  target: string;
  status_label: string;
  transaction_id: string;
  cost: number;
  charged_at: string;
}

export interface ApiKeyInfo {
  client_id_masked: string;
  has_secret: boolean;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
}

export interface TrialStatusInfo {
  plan: "trial" | "basic" | "pro" | "vip";
  status: "active" | "expired" | "disabled";
  startedAt: string | null;
  endsAt: string | null;
}

export interface RegistryQueryApiCall {
  id: string;
  service_code: string;
  transaction_id: string | null;
  http_status: number;
  moi_code: string | null;
  moi_message: string | null;
  return_rows: number;
  cost_cents: number;
  started_at: string;
  finished_at: string;
}

export interface RegistryQueryRun {
  id: string;
  organization_id: string;
  case_id: string | null;
  input_type: "address" | "land" | "registry_key";
  source_input: string;
  match_status: "candidate" | "confirmed" | "rejected";
  candidate_json: Record<string, unknown> | null;
  cop_response_json: Record<string, unknown> | null;
  raw_response_json: Record<string, unknown> | null;
  total_cost_cents: number;
  cache_hit: boolean;
  source_run_id: string | null;
  error_code: string | null;
  error_message: string | null;
  api_calls: RegistryQueryApiCall[];
  created_at: string;
  updated_at: string;
}

export interface R02BuildingCandidate {
  administrative_district: string | null;
  land_office: string | null;
  section_code: string | null;
  section_name: string | null;
  land_no: string | null;
  building_no: string | null;
  building_area_sqm: string | null;
  total_floor_count: string | null;
  floor_label: string | null;
  completion_date_roc: string | null;
  age_years: string | null;
  main_use: string | null;
}

export interface R02DiscoveryRun {
  adapter: "easymap_r02_desktop";
  parser_version: string;
  input_address: string;
  status: "candidate_unconfirmed";
  total_cost_cents: 0;
  candidates: R02BuildingCandidate[];
  raw_summary: string;
  missing_fields: string[];
  error_code: null;
  next_action: null;
}

export interface R02RecordedDiscoveryRun {
  run_id: string;
  ok: boolean;
  discovery: R02DiscoveryRun | null;
  error: Record<string, unknown> | null;
}

export interface RegistryRunSyncResult {
  synced: boolean;
  remote_run_id: string | null;
}

export async function addressLookup(address: string): Promise<ParcelInfo[]> {
  return invoke<ParcelInfo[]>("land_registry_address_lookup", { address });
}

export async function parseR02ResultText(inputAddress: string, textOrHtml: string): Promise<R02DiscoveryRun> {
  return invoke<R02DiscoveryRun>("land_registry_parse_r02_result_text", {
    inputAddress,
    input_address: inputAddress,
    textOrHtml,
    text_or_html: textOrHtml,
  });
}

export async function recordR02ResultText(input: {
  caseId?: string | null;
  inputAddress: string;
  textOrHtml: string;
}): Promise<R02RecordedDiscoveryRun> {
  return invoke<R02RecordedDiscoveryRun>("land_registry_record_r02_result_text", {
    caseId: input.caseId ?? null,
    case_id: input.caseId ?? null,
    inputAddress: input.inputAddress,
    input_address: input.inputAddress,
    textOrHtml: input.textOrHtml,
    text_or_html: input.textOrHtml,
  });
}

export async function pullData(parcelId: string, apiIds: string[]): Promise<PullResult> {
  return invoke<PullResult>("land_registry_pull_data", { parcelId, apiIds });
}

export async function formalPullData(caseId: string, apiIds: string[]): Promise<{
  run_id: string;
  results: Record<string, unknown>;
  total_cost: number;
  cache_hit: boolean;
  source_run_id: string | null;
}> {
  return invoke("land_registry_formal_pull_data", { caseId, apiIds });
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

export async function listBillingEntries(): Promise<BillingLineItem[]> {
  return invoke<BillingLineItem[]>("land_registry_list_billing_entries");
}

export async function recordConsent(caseId: string): Promise<void> {
  return invoke<void>("land_registry_record_consent", { caseId });
}

export async function listRegistryQueryRuns(keyword?: string): Promise<RegistryQueryRun[]> {
  return invoke("list_registry_query_runs", { keyword });
}

export async function getRegistryQueryRunDetail(runId: string): Promise<RegistryQueryRun> {
  return invoke("get_registry_query_run_detail", { runId });
}

export async function syncRegistryQueryRunToSaas(runId: string): Promise<RegistryRunSyncResult> {
  return invoke("land_registry_sync_query_run_to_saas", {
    runId,
    run_id: runId,
  });
}

export async function confirmCaseRegistryMatch(input: {
  caseId: string;
  sectionName: string;
  landNo: string;
  buildingNo?: string | null;
}): Promise<{ success: true }> {
  return invoke("confirm_case_registry_match", input);
}

export async function getTrialStatus(): Promise<TrialStatusInfo> {
  return invoke("get_trial_status");
}

export function mapErrorToMessage(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes("ApiKeyNotConfigured")) return "請先在設定頁設定地政 API 金鑰";
  if (msg.includes("AuthenticationFailed")) return "API 認證失敗，請確認金鑰設定";
  if (msg.includes("ConsentRequired")) return "請先取得所有權人授權同意";
  if (msg.includes("NlscPermissionDenied")) {
    return "國土測繪 CAD 查詢尚未開通，請申請 CAD_009/CAD_011 或改走補件／人工確認";
  }
  if (msg.includes("InsufficientBalance")) return "餘額不足，請聯繫平台補值";
  return `查詢失敗：${msg}`;
}
