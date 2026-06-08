import {
  createAireCustomerCopBackendUrl,
  createAireGatewayHeaders,
  isBrowserLocalFirstEnabled,
} from "./browser-gateway";
import { writeLog } from "./log";
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
  office_code?: string;
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
  zoning?: string;
  announced_land_current_value?: string;
  announced_land_value?: string;
  lat?: number;
  lng?: number;
  selection_reason?: "floor_unit_unique_match";
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
  address?: string | null;
  land_registry_data?: {
    confirmed_registry_match?: {
      office_code?: string | null;
      section_code?: string | null;
      section_name?: string | null;
      land_no?: string | null;
      building_no?: string | null;
      registry_key?: string | null;
    } | null;
  } | null;
}

export interface FormalLookupTargetInput {
  address?: string | null;
  officeCode?: string | null;
  sectionCode?: string | null;
  landNo?: string | null;
  buildingNo?: string | null;
}

const BROWSER_REGISTRY_QUERY_RUNS_KEY = "aire_browser_registry_query_runs";

export class BrowserAddressDiscoveryUnavailableError extends Error {
  readonly code = "browser_address_discovery_provider_unavailable";
  readonly detail: string | null;

  constructor(detail?: string | null) {
    super("瀏覽器版地址前查代理暫時無法取得資料，請先人工填寫地段、地號、建號，或稍後重新查詢。");
    this.name = "BrowserAddressDiscoveryUnavailableError";
    this.detail = detail?.trim() ? detail.trim() : null;
  }
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
    signal: AbortSignal.timeout(65_000),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string; error?: string } | null;
    try {
      return await safeInvoke<ParcelInfo[]>("land_registry_address_lookup", { address });
    } catch (error) {
      const message =
        payload?.message ||
        payload?.error ||
        (error instanceof Error ? error.message : "") ||
        `本機地址查詢失敗（HTTP ${response.status}）`;
      throw new Error(message);
    }
  }

  const result = (await response.json()) as LocalAddressDiscoveryResponse;
  await recordLocalAddressDiscovery(address, result);
  if (result.status === "candidate_found") {
    return result.candidates ?? [];
  }
  return [];
}

async function fetchAddressDiscoveryFromTaiwanProxy(address: string): Promise<ParcelInfo[]> {
  const proxyUrl = (readWindowString("__AIRE_LAND_PROXY_URL__") ?? process.env.NEXT_PUBLIC_AIRE_LAND_PROXY_URL ?? "")
    .replace(/\/$/, "");
  if (!proxyUrl) {
    throw new BrowserAddressDiscoveryUnavailableError("land_proxy_url_missing");
  }

  const endpoint = `${proxyUrl}/api/address-discovery`;
  const requestId = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `addr-${Date.now()}`;
  const headers = {
    ...createAireGatewayHeaders({ includeWorkspaceContext: false }),
    "x-aire-client-request-id": requestId,
  };
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ address, allowMockFallback: false }),
      signal: AbortSignal.timeout(65_000),
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error ?? "");
    const summary = [
      `browser_fetch_failed request_id=${requestId}`,
      `url=${endpoint}`,
      typeof window !== "undefined" ? `origin=${window.location.origin}` : null,
      `online=${typeof navigator !== "undefined" ? navigator.onLine : "unknown"}`,
      `headers=${Object.keys(headers).join(",")}`,
      `error=${detail || "unknown_error"}`,
      `address=${address}`,
    ].filter(Boolean).join(" | ");
    void writeLog("address_discovery_query", "error", { reason: summary });
    throw new BrowserAddressDiscoveryUnavailableError(summary);
  }

  const result = await response.json().catch(() => null) as LocalAddressDiscoveryResponse | null;
  if (!response.ok || !result) {
    const errorSummary = Array.isArray(result?.errors)
      ? result.errors.map((entry) => `${entry.source}:${entry.code}:${entry.message}`).join(" | ")
      : "";
    const summary = [
      `proxy_http_${response.status}`,
      `request_id=${response.headers.get("x-aire-request-id") || requestId}`,
      `route_hit=${response.headers.get("x-aire-route-hit") || "unknown"}`,
      errorSummary || null,
      `address=${address}`,
    ].filter(Boolean).join(" | ");
    void writeLog("address_discovery_query", "error", { reason: summary });
    throw new BrowserAddressDiscoveryUnavailableError(summary);
  }
  await recordLocalAddressDiscovery(address, result);
  void writeLog("address_discovery_query", "ok", {
    reason: `request_id=${response.headers.get("x-aire-request-id") || requestId} status=${result.status} candidates=${result.candidates?.length ?? 0}`,
  });
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
      address: caseRow.address,
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

function readWindowString(key: string): string | undefined {
  if (typeof window === "undefined") return undefined;
  const value = (window as unknown as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

async function formalPullDataFromTaiwanProxy(caseId: string, apiIds: string[], formalTarget?: FormalLookupTargetInput) {
  const caseRow = formalTarget
    ? buildLocalCaseFromFormalTarget(formalTarget)
    : await safeInvoke<LocalCaseWithRegistryData>("get_case", { id: caseId });
  const target = caseRow.land_registry_data?.confirmed_registry_match;
  if (!target?.office_code || !target.section_code) {
    throw new Error("registry_match_required");
  }

  const backendApiIds = mapFormalApiIdsForCustomerCopBackend(apiIds);
  const requestRegistryKey = [target.office_code, target.section_code, target.land_no, target.building_no].filter(Boolean).join("-");
  const response = await fetch(createAireCustomerCopBackendUrl("/api/aire/cop/formal-lookup"), {
    method: "POST",
    headers: createAireGatewayHeaders(),
    body: JSON.stringify({
      caseId,
      caseLocalId: caseId,
      apiIds: backendApiIds,
      address: caseRow.address,
      registryKey: requestRegistryKey,
      ownerAuthorizationId: `owner-auth-${caseId}-${Date.now()}`,
      consentId: `paid-consent-${caseId}-${Date.now()}`,
    }),
    signal: AbortSignal.timeout(20_000),
  });
  const payload = await response.json().catch(() => null) as
    | {
        runId?: string;
        results?: Record<string, unknown>;
        sanitizedResult?: Record<string, unknown>;
        costSummary?: { actualCost?: number; actualPrice?: number };
        cacheHit?: boolean;
        sourceRunId?: string | null;
        blocker?: string;
        errorCode?: string;
        error?: string;
        message?: string;
      }
    | null;
  const results = payload?.results ?? payload?.sanitizedResult;
  if (!response.ok || !payload?.runId || !results) {
    const detail = payload?.blocker || payload?.errorCode || payload?.error || payload?.message || `aire_cop_formal_lookup_http_${response.status}`;
    void writeLog("formal_lookup_query", "error", {
      case_id: caseId,
      reason: `${detail} | http=${response.status} | registry=${requestRegistryKey}`,
    });
    throw new Error(detail);
  }
  void writeLog("formal_lookup_query", "ok", {
    case_id: caseId,
    reason: `run_id=${payload.runId} | cost=${payload.costSummary?.actualCost ?? payload.costSummary?.actualPrice ?? 0} | registry=${requestRegistryKey}`,
  });
  return {
    run_id: payload.runId,
    results: normalizeCustomerCopFormalResults(results),
    total_cost: payload.costSummary?.actualCost ?? payload.costSummary?.actualPrice ?? 0,
    cache_hit: Boolean(payload.cacheHit),
    source_run_id: payload.sourceRunId ?? null,
  };
}

function buildLocalCaseFromFormalTarget(input: FormalLookupTargetInput): LocalCaseWithRegistryData {
  return {
    address: input.address ?? "",
    land_registry_data: {
      confirmed_registry_match: {
        office_code: input.officeCode ?? null,
        section_code: input.sectionCode ?? null,
        land_no: input.landNo ?? null,
        building_no: input.buildingNo ?? null,
      },
    },
  };
}

function mapFormalApiIdsForCustomerCopBackend(apiIds: string[]): string[] {
  return Array.from(new Set(apiIds.map((apiId) => (apiId === "land_registry" ? "land_description" : apiId))));
}

function normalizeCustomerCopFormalResults(results: Record<string, unknown>): Record<string, unknown> {
  if (isApiResultMap(results)) {
    const normalized = { ...results };
    if (!normalized.land_registry && normalized.land_description) {
      normalized.land_registry = normalized.land_description;
    }
    delete normalized.land_description;
    return normalized;
  }

  return {
    land_registry: {
      success: true,
      data: results,
      source: "api",
    },
  };
}

function isApiResultMap(results: Record<string, unknown>): results is Record<string, ApiResult> {
  return Object.values(results).some((value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const record = value as Record<string, unknown>;
    return typeof record.success === "boolean" && typeof record.source === "string";
  });
}

export async function addressLookup(address: string): Promise<ParcelInfo[]> {
  if (isBrowserLocalFirstEnabled()) {
    return fetchAddressDiscoveryFromTaiwanProxy(address);
  }

  if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
    const inTauri = await isTauriEnv();
    if (!inTauri) {
      return fetchAddressDiscoveryFromLocalBackend(address);
    }
  }

  if (!(await isTauriEnv())) {
    throw new NotInTauriError("目前請先人工填寫地段、地號、建號");
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
  if (isBrowserLocalFirstEnabled()) {
    const run: RegistryQueryRun = {
      id: `browser-r02-${Date.now()}`,
      organization_id: "browser-local",
      case_id: input.caseId ?? null,
      input_type: "address",
      source_input: input.inputAddress,
      match_status: "candidate",
      candidate_json: null,
      cop_response_json: null,
      raw_response_json: { text_or_html: input.textOrHtml },
      total_cost_cents: 0,
      cache_hit: false,
      source_run_id: null,
      error_code: null,
      error_message: null,
      api_calls: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    writeBrowserRegistryQueryRun(run);
    return {
      run_id: run.id,
      ok: true,
      discovery: null,
      error: null,
    };
  }

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

export async function formalPullData(caseId: string, apiIds: string[], formalTarget?: FormalLookupTargetInput): Promise<{
  run_id: string;
  results: Record<string, unknown>;
  total_cost: number;
  cache_hit: boolean;
  source_run_id: string | null;
}> {
  if (isBrowserLocalFirstEnabled()) {
    return formalPullDataFromTaiwanProxy(caseId, apiIds, formalTarget);
  }
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
  if (isBrowserLocalFirstEnabled()) {
    return {
      run_id: `browser-paid-address-disabled-${Date.now()}`,
      candidates: [],
      total_cost: 0,
      total_cost_cents: 0,
      cache_hit: false,
      source_run_id: null,
    };
  }
  return invoke("land_registry_paid_address_resolver", { address });
}

export async function setApiKey(clientId: string, clientSecret: string): Promise<void> {
  if (isBrowserLocalFirstEnabled()) {
    void clientId;
    void clientSecret;
    return;
  }
  return invoke<void>("land_registry_set_api_key", { clientId, clientSecret });
}

export async function getApiKey(): Promise<ApiKeyInfo | null> {
  if (isBrowserLocalFirstEnabled()) return null;
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
  if (isBrowserLocalFirstEnabled()) {
    return {
      success: false,
      message: "純瀏覽器版不在本機保存 COP 帳密；正式地政查詢需透過台灣代理服務。",
    };
  }
  return invoke<ConnectionTestResult>("land_registry_test_connection");
}

export async function getBalance(): Promise<BalanceInfo> {
  if (isBrowserLocalFirstEnabled()) {
    return {
      month_total_cost: 0,
      month_query_count: 0,
      low_balance_warning: false,
    };
  }
  return invoke<BalanceInfo>("land_registry_get_balance");
}

export async function listBillingEntries(): Promise<BillingLineItem[]> {
  if (isBrowserLocalFirstEnabled()) return [];
  return invoke<BillingLineItem[]>("land_registry_list_billing_entries");
}

export async function recordConsent(caseId: string): Promise<void> {
  if (isBrowserLocalFirstEnabled()) {
    void caseId;
    return;
  }
  return invoke<void>("land_registry_record_consent", { caseId });
}

export async function listRegistryQueryRuns(keyword?: string): Promise<RegistryQueryRun[]> {
  if (isBrowserLocalFirstEnabled()) {
    const rows = readBrowserRegistryQueryRuns();
    const normalizedKeyword = keyword?.trim();
    if (!normalizedKeyword) return rows;
    return rows.filter((row) => row.source_input.includes(normalizedKeyword));
  }
  return invoke("list_registry_query_runs", { keyword });
}

export async function getRegistryQueryRunDetail(runId: string): Promise<RegistryQueryRun> {
  if (isBrowserLocalFirstEnabled()) {
    const row = readBrowserRegistryQueryRuns().find((item) => item.id === runId);
    if (!row) throw new Error("registry_query_run_not_found");
    return row;
  }
  return invoke("get_registry_query_run_detail", { runId });
}

export async function syncRegistryQueryRunToSaas(runId: string): Promise<RegistryRunSyncResult> {
  if (isBrowserLocalFirstEnabled()) {
    return {
      synced: false,
      remote_run_id: null,
    };
  }
  return invoke("land_registry_sync_query_run_to_saas", {
    runId,
    run_id: runId,
  });
}

export async function confirmCaseRegistryMatch(input: {
  caseId: string;
  officeCode?: string | null;
  sectionCode?: string | null;
  sectionName: string;
  landNo: string;
  buildingNo?: string | null;
  registryKey?: string | null;
}): Promise<{ success: true }> {
  if (isBrowserLocalFirstEnabled()) {
    void input;
    return { success: true };
  }
  return invoke("confirm_case_registry_match", input);
}

export async function getTrialStatus(): Promise<TrialStatusInfo> {
  if (isBrowserLocalFirstEnabled()) {
    return {
      plan: "trial",
      status: "active",
      startedAt: null,
      endsAt: null,
    };
  }
  return invoke("get_trial_status");
}

function readBrowserRegistryQueryRuns(): RegistryQueryRun[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(BROWSER_REGISTRY_QUERY_RUNS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as RegistryQueryRun[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeBrowserRegistryQueryRun(run: RegistryQueryRun): void {
  if (typeof window === "undefined") return;
  const rows = readBrowserRegistryQueryRuns();
  window.localStorage.setItem(
    BROWSER_REGISTRY_QUERY_RUNS_KEY,
    JSON.stringify([run, ...rows].slice(0, 100)),
  );
}

export function mapErrorToMessage(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes("registry_match_required")) return "請先確認地段、地號與建號後再查詢";
  if (msg.includes("cop_credential_required")) return "請先在設定頁完成地政查詢帳號設定";
  if (msg.includes("missing_cop_credential")) return "此工作區尚未保存 COP 正式查詢帳號，請先到設定完成帳密設定與連線測試";
  if (msg.includes("missing_paid_consent")) return "正式查詢缺少付費同意紀錄，請重新走一次正式查詢確認流程";
  if (msg.includes("missing_owner_authorization")) return "正式查詢缺少所有權人授權同意，請重新確認授權後再送出";
  if (msg.includes("unsupported_api_set")) return "這次正式查詢送出的 API 組合不支援，需至少包含土地標示資料";
  if (msg.includes("missing_catalog_price")) return "正式查詢價目表未設定完成，請聯繫平台檢查 COP 價格設定";
  if (msg.includes("cop_token_invalid_json")) {
    return "地政帳號驗證失敗：COP token endpoint 沒有回 JSON，可能是帳密、權限或 COP 服務異常。請先到設定頁重新測試連線";
  }
  if (msg.includes("cop_token_http_")) return "地政帳號驗證失敗：COP token endpoint 回傳錯誤狀態，請確認帳密與服務權限";
  if (msg.includes("cop_token_missing_access_token")) return "地政帳號驗證失敗：COP token 回應缺少 access_token";
  if (msg.includes("ApiKeyNotConfigured")) return "請先在設定頁設定地政查詢帳號";
  if (msg.includes("AuthenticationFailed")) return "地政查詢帳號驗證失敗，請確認設定";
  if (msg.includes("ConsentRequired")) return "請先取得所有權人授權同意";
  if (msg.includes("NlscPermissionDenied")) {
    return "圖資查詢尚未開通，請改走補件或人工確認";
  }
  if (msg.includes("InsufficientBalance")) return "餘額不足，請聯繫平台補值";
  return `查詢失敗：${msg}`;
}
