import { isTauriEnv, NotInTauriError, safeInvoke } from "./tauri-bridge";
import { localApiFetch } from "./local-api/client";

async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  return safeInvoke<T>(cmd, args);
}

export interface ParcelInfo {
  parcel_id: string;
  address: string;
  lot_number: string;
  building_number: string;
  section_name?: string;
  section_code?: string;
  land_office?: string;
  source?: "cop_moi" | "easymap_r02" | "easymap_z10web" | "nlsc_cad" | "dev_fixture" | "mock";
  trusted_for_pdf?: boolean;
  discovery_confidence?: "high" | "needs_selection" | "low";
  object_type?: "building" | "land";
  confirmation_state?: "unconfirmed" | "selected_candidate" | "confirmed";
  building_area_sqm?: string;
  total_floor_count?: string;
  floor_label?: string;
  completion_date_roc?: string;
  age_years?: string;
  main_use?: string;
  land_area_sqm?: string;
  announced_land_current_value?: string;
  announced_land_value?: string;
  lat?: number;
  lng?: number;
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
  run_id?: string;
  object_type?: "building" | "land" | "address" | "unknown";
  object_type_label?: string;
  service_name: string;
  target: string;
  status_label: string;
  transaction_id: string;
  cost: number;
  charged_at: string;
}

export interface ApiKeyInfo {
  client_id_masked: string;
  client_secret_masked?: string;
  has_secret: boolean;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  latency_ms?: number;
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

export interface PaidAddressResolverResult {
  run_id: string;
  candidates: ParcelInfo[];
  total_cost: number;
  total_cost_cents: number;
  cache_hit: boolean;
  source_run_id: string | null;
}

interface LocalAddressDiscoveryResponse {
  status: "candidate_found" | "manual_required";
  source?: string;
  normalizedAddress?: string;
  candidates: ParcelInfo[];
  errors?: Array<{ source: string; code: string; message: string }>;
  trustedForPdf?: false;
  totalCostCents?: 0;
  total_cost_cents?: 0;
  cacheHit?: boolean;
  sourceRunId?: string | null;
  inputKind?: "doorplate" | "land_descriptor" | "incomplete";
  intendedObjectType?: "building" | "land" | "unknown";
  requiresCandidateSelection?: boolean;
  candidateSelection?: {
    state: "not_required" | "required" | "selected";
    selectedRegistryKey: string | null;
  };
}

interface LocalLandApiSettings {
  clientId?: string;
  secret?: string;
}

interface LocalCaseWithRegistryData {
  id?: string;
  land_registry_data?: {
    confirmed_registry_match?: {
      section_name?: string | null;
      land_no?: string | null;
      building_no?: string | null;
    } | null;
  } | null;
}

async function readLocalLandApiSettings(): Promise<LocalLandApiSettings> {
  try {
    return await safeInvoke<LocalLandApiSettings>("get_land_api_settings");
  } catch {
    return {};
  }
}

async function fetchAddressDiscoveryFromLocalBackend(address: string): Promise<ParcelInfo[]> {
  if (typeof window === "undefined") {
    return [];
  }
  const settings = await readLocalLandApiSettings();
  const response = await localApiFetch("/api/local/address-discovery", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      address,
      clientId: settings.clientId ?? "",
      secret: settings.secret ?? "",
      allowMockFallback: true,
    }),
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) {
    try {
      await safeInvoke<ParcelInfo[]>("land_registry_address_lookup", { address });
    } catch {
      // no-op
    }
    return [];
  }

  const result = (await response.json()) as LocalAddressDiscoveryResponse;
  await recordLocalAddressDiscovery(address, result);
  if (result.status === "candidate_found") {
    return result.candidates ?? [];
  }
  return [];
}

async function recordLocalAddressDiscovery(address: string, result: LocalAddressDiscoveryResponse): Promise<void> {
  try {
    await safeInvoke("record_local_address_discovery", {
      address,
      result,
    });
  } catch {
    // Local Web uses this as evidence only; discovery result is already returned to the UI.
  }
}

async function formalPullDataFromLocalBackend(caseId: string, apiIds: string[]) {
  if (typeof window === "undefined") {
    throw new NotInTauriError("請使用 AIRE 桌面版完成正式資料匯入");
  }
  const settings = await readLocalLandApiSettings();
  const caseRow = await safeInvoke<LocalCaseWithRegistryData>("get_case", { id: caseId });
  const target = caseRow.land_registry_data?.confirmed_registry_match;
  if (!target) {
    throw new Error("registry_match_required");
  }
  const response = await localApiFetch("/api/local/formal-pull-data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      caseId,
      apiIds,
      clientId: settings.clientId ?? "",
      secret: settings.secret ?? "",
      target,
    }),
    signal: AbortSignal.timeout(20000),
  });
  const payload = await response.json().catch(() => null) as
    | {
        run_id: string;
        results: Record<string, unknown>;
        total_cost: number;
        cache_hit: boolean;
        source_run_id: string | null;
        message?: string;
        error?: string;
      }
    | null;
  if (!response.ok || !payload) {
    throw new Error(payload?.message || payload?.error || "local_formal_pull_failed");
  }
  return payload;
}

export async function addressLookup(address: string): Promise<ParcelInfo[]> {
  if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
    const inTauri = await isTauriEnv();
    if (!inTauri) {
      return fetchAddressDiscoveryFromLocalBackend(address);
    }
  }

  if (!(await isTauriEnv())) {
    throw new NotInTauriError("請使用 AIRE 桌面版完成物件資料補齊");
  }
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
  if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
    const inTauri = await isTauriEnv();
    if (!inTauri) {
      return formalPullDataFromLocalBackend(caseId, apiIds);
    }
  }
  if (!(await isTauriEnv())) {
    throw new NotInTauriError("請使用 AIRE 桌面版完成正式資料匯入");
  }
  return invoke("land_registry_formal_pull_data", { caseId, apiIds });
}

/**
 * @deprecated Rust 端 `land_registry_paid_address_resolver` 尚未實作（無 Rust 對應命令）。
 * browser-local-runtime-mvp Wave 3 確認為 dead IPC 呼叫。
 * 呼叫者：cases/new/page.tsx → 應改走 /api/local/address-discovery（EasyMap R02 免費路徑）。
 * 此函式保留以避免編譯錯誤，待 cases/new/page.tsx 改線後移除。
 */
export async function paidAddressResolver(address: string): Promise<PaidAddressResolverResult> {
  return invoke("land_registry_paid_address_resolver", { address });
}

export async function setApiKey(clientId: string, clientSecret: string): Promise<void> {
  return invoke<void>("land_registry_set_api_key", { clientId, clientSecret });
}

export async function getApiKey(): Promise<ApiKeyInfo | null> {
  const info = await invoke<(ApiKeyInfo & { client_secret_masked?: string }) | null>(
    "land_registry_get_api_key",
  );
  if (!info) return null;
  return {
    ...info,
    has_secret: info.has_secret ?? Boolean(info.client_secret_masked),
  };
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
  if (msg.includes("registry_match_required")) return "請先確認地段、地號與建號後再查詢";
  if (msg.includes("cop_credential_required")) return "請先在設定頁完成地政查詢帳號設定";
  if (msg.includes("ApiKeyNotConfigured")) return "請先在設定頁設定地政查詢帳號";
  if (msg.includes("AuthenticationFailed")) return "地政查詢帳號驗證失敗，請確認設定";
  if (msg.includes("ConsentRequired")) return "請先取得所有權人授權同意";
  if (msg.includes("NlscPermissionDenied")) {
    return "圖資查詢尚未開通，請改走補件或人工確認";
  }
  if (msg.includes("InsufficientBalance")) return "餘額不足，請聯繫平台補值";
  return `查詢失敗：${msg}`;
}
