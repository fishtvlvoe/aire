/**
 * Tauri bridge — safeInvoke 三條路由
 *
 * 路由優先順序：
 *   1. Tauri WebView（__TAURI_INTERNALS__ 存在）→ IPC invoke
 *   2. dev 環境（NODE_ENV === "development"）→ mock-backend
 *   3. production 非 Tauri（本機 Node runtime 模式）→ Node 本機 API
 *
 * 第三條路只映射 MVP command，其餘拋 LocalApiNotWiredError（明確錯誤，不靜默）。
 */

const TAURI_DETECTION_TIMEOUT_MS = 3000;

type InvokeFn = <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;

let cachedIsTauri: boolean | null = null;
let detectionPromise: Promise<boolean> | null = null;
let cachedInvoke: InvokeFn | null = null;

export class NotInTauriError extends Error {
  constructor(message = "此功能需在 AIRE 桌面 App 中使用") {
    super(message);
    this.name = "NotInTauriError";
  }
}

/**
 * production 非 Tauri 模式：command 尚未對接 Node 本機 API 時拋此錯誤。
 * 明確告知 command 名稱，方便 Wave 4+ 繼續補齊。
 */
export class LocalApiNotWiredError extends Error {
  constructor(cmd: string) {
    super(`LocalApiNotWiredError: command "${cmd}" 尚未對接 Node 本機 API`);
    this.name = "LocalApiNotWiredError";
  }
}

async function loadInvokeWithTimeout(): Promise<InvokeFn | null> {
  const timer = new Promise<null>((resolve) => {
    setTimeout(() => resolve(null), TAURI_DETECTION_TIMEOUT_MS);
  });

  const modulePromise = import("@tauri-apps/api/core")
    .then((mod) => (typeof mod.invoke === "function" ? (mod.invoke as InvokeFn) : null))
    .catch(() => null);

  return Promise.race([modulePromise, timer]);
}

export async function isTauriEnv(): Promise<boolean> {
  if (cachedIsTauri !== null) {
    return cachedIsTauri;
  }
  if (detectionPromise) {
    return detectionPromise;
  }

  detectionPromise = (async () => {
    const hasTauriInternals =
      typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
    if (!hasTauriInternals) {
      cachedInvoke = null;
      cachedIsTauri = false;
      return false;
    }

    const invoke = await loadInvokeWithTimeout();
    cachedInvoke = invoke;
    cachedIsTauri = invoke !== null;
    return cachedIsTauri;
  })();

  return detectionPromise;
}

// ──────────────────────────────────────────────────────────────────────────────
// 第三條路：production 非 Tauri → Node 本機 API 映射
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Cases command → /api/local/cases
 *
 * MVP command 集合（對齊 cases-api.ts 實際使用的 command 名稱）：
 *   - list_cases         → GET  /api/local/cases
 *   - get_case           → GET  /api/local/cases/:id
 *   - create_case        → POST /api/local/cases
 *   - update_case        → PATCH /api/local/cases/:id
 */
async function invokeLocalCases<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const { localApiFetch } = await import("./local-api/client");

  switch (cmd) {
    case "list_cases": {
      const res = await localApiFetch("/api/local/cases");
      if (!res.ok) throw new Error(`list_cases 失敗：HTTP ${res.status}`);
      const data = await res.json() as { cases: T };
      return data.cases;
    }
    case "get_case": {
      const id = (args?.id as string | undefined) ?? "";
      const res = await localApiFetch(`/api/local/cases/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error(`get_case 失敗：HTTP ${res.status}`);
      return res.json() as Promise<T>;
    }
    case "create_case": {
      const res = await localApiFetch("/api/local/cases", {
        method: "POST",
        body: JSON.stringify(args ?? {}),
      });
      if (!res.ok) throw new Error(`create_case 失敗：HTTP ${res.status}`);
      return res.json() as Promise<T>;
    }
    case "update_case": {
      const { id, ...patch } = args ?? {} as Record<string, unknown>;
      const res = await localApiFetch(`/api/local/cases/${encodeURIComponent(id as string)}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(`update_case 失敗：HTTP ${res.status}`);
      return res.json() as Promise<T>;
    }
    default:
      throw new LocalApiNotWiredError(cmd);
  }
}

/**
 * COP credential command → /api/local/cop-credential
 *
 * MVP command 集合（對齊 Rust IPC command 名稱）：
 *   - land_registry_set_api_key  → POST /api/local/cop-credential
 *   - land_registry_get_api_key  → GET  /api/local/cop-credential
 *   - land_registry_test_connection → POST /api/local/cop-credential/test
 */
async function invokeLocalCopCredential<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const { localApiFetch } = await import("./local-api/client");

  switch (cmd) {
    case "land_registry_set_api_key": {
      const res = await localApiFetch("/api/local/cop-credential", {
        method: "POST",
        body: JSON.stringify({
          clientId: args?.client_id ?? args?.clientId ?? "",
          secret:   args?.secret ?? "",
        }),
      });
      if (!res.ok) throw new Error(`land_registry_set_api_key 失敗：HTTP ${res.status}`);
      // 204 No Content → 回傳 null（型別由呼叫端決定）
      return null as unknown as T;
    }
    case "land_registry_get_api_key": {
      const res = await localApiFetch("/api/local/cop-credential");
      if (res.status === 404) return null as unknown as T;
      if (!res.ok) throw new Error(`land_registry_get_api_key 失敗：HTTP ${res.status}`);
      return res.json() as Promise<T>;
    }
    case "land_registry_test_connection": {
      const res = await localApiFetch("/api/local/cop-credential/test", {
        method: "POST",
      });
      if (!res.ok) throw new Error(`land_registry_test_connection 失敗：HTTP ${res.status}`);
      const payload = await res.json() as {
        success: boolean;
        message: string;
        latencyMs?: number;
        latency_ms?: number;
      };
      return {
        ...payload,
        latency_ms: payload.latency_ms ?? payload.latencyMs,
      } as T;
    }
    default:
      throw new LocalApiNotWiredError(cmd);
  }
}

async function invokeLocalRealPrice<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const { localApiFetch } = await import("./local-api/client");

  if (cmd !== "query_real_price") {
    throw new LocalApiNotWiredError(cmd);
  }

  const res = await localApiFetch("/api/local/real-price", {
    method: "POST",
    body: JSON.stringify({
      district: args?.district ?? "",
      keyword: args?.keyword ?? "",
      limit: args?.limit ?? 20,
    }),
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => null) as { message?: string } | null;
    throw new Error(payload?.message || `query_real_price 失敗：HTTP ${res.status}`);
  }

  const payload = await res.json() as { records?: T };
  return payload.records as T;
}

/** MVP command → 路由器：判斷 command 屬於哪個 domain 並分派 */
async function invokeLocalApi<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  // cases domain
  if (["list_cases", "get_case", "create_case", "update_case"].includes(cmd)) {
    return invokeLocalCases<T>(cmd, args);
  }
  // COP credential domain
  if (
    [
      "land_registry_set_api_key",
      "land_registry_get_api_key",
      "land_registry_test_connection",
    ].includes(cmd)
  ) {
    return invokeLocalCopCredential<T>(cmd, args);
  }
  if (cmd === "query_real_price") {
    return invokeLocalRealPrice<T>(cmd, args);
  }
  // 非 MVP command → 明確拋錯，不靜默
  throw new LocalApiNotWiredError(cmd);
}

// ──────────────────────────────────────────────────────────────────────────────
// safeInvoke — 三條路統一入口
// ──────────────────────────────────────────────────────────────────────────────

export async function safeInvoke<T>(
  cmd: string,
  args?: Record<string, unknown>,
): Promise<T> {
  // 路由 1：Tauri IPC
  const inTauri = await isTauriEnv();
  if (inTauri && cachedInvoke) {
    return cachedInvoke<T>(cmd, args);
  }

  // 路由 2：dev 環境 → mock-backend（此分支不動）
  if (process.env.NODE_ENV === "development") {
    if (
      [
        "land_registry_set_api_key",
        "land_registry_get_api_key",
        "land_registry_test_connection",
      ].includes(cmd)
    ) {
      return invokeLocalCopCredential<T>(cmd, args);
    }
    if (cmd === "query_real_price") {
      return invokeLocalRealPrice<T>(cmd, args);
    }
    const { mockInvoke } = await import("./mock-backend");
    return mockInvoke<T>(cmd, args);
  }

  // 路由 3：production 非 Tauri → Node 本機 API
  return invokeLocalApi<T>(cmd, args);
}
