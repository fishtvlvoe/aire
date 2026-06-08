import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { Firestore } from "@google-cloud/firestore";

export type CopFetch = (input: string, init?: RequestInit) => Promise<Response>;

export type CopTestStatus = "not_tested" | "success" | "failed";
export type LedgerStatus = "success" | "blocked" | "failed";

export interface CustomerCopBackendOptions {
  store: CustomerCopStore;
  copFetch: CopFetch;
  allowedOrigins: string[];
  backendSharedToken?: string;
  browserSessionJwtSecret?: string;
  now?: () => Date;
  id?: () => string;
  tokenEndpoint?: string;
  apiBaseUrl?: string;
  priceCatalog?: Record<string, { serviceName: string; unitPrice: number }>;
}

export interface ProductionCustomerCopBackendOptions {
  env: Record<string, string | undefined>;
  copFetch?: CopFetch;
  store?: CustomerCopStore;
}

export interface CustomerCopStore {
  saveCredential(input: {
    workspaceId: string;
    clientId: string;
    clientSecret: string;
    now: string;
  }): Promise<CredentialState>;
  readCredentialState(workspaceId: string): Promise<CredentialState | null>;
  readCredentialSecret(workspaceId: string): Promise<{ clientId: string; clientSecret: string } | null>;
  updateCredentialTestState(
    workspaceId: string,
    state: { status: Exclude<CopTestStatus, "not_tested">; testedAt: string; errorCode?: string },
  ): Promise<void>;
  writeLedger(record: LedgerRecord): Promise<void>;
  listLedger(workspaceId: string, caseLocalId?: string): Promise<LedgerRecord[]>;
}

export interface CredentialState {
  workspaceId: string;
  clientId: string;
  secretMasked: string;
  lastTestedAt: string | null;
  lastTestStatus: CopTestStatus;
  lastTestErrorCode: string | null;
}

export interface LedgerRecord {
  runId: string;
  workspaceId: string;
  caseLocalId: string;
  registryKey: string;
  apiIds: string[];
  status: LedgerStatus;
  totalPrice: number;
  totalQuantity: number;
  transactionIds: string[];
  cacheHit?: boolean;
  sourceRunId?: string | null;
  errorCode?: string;
  retryable?: boolean;
  sanitizedRequestJson: Record<string, unknown>;
  sanitizedResponseJson: Record<string, unknown>;
  createdAt: string;
  completedAt?: string | null;
}

interface StoredCredential {
  workspaceId: string;
  clientId: string;
  secretCiphertext: string;
  lastTestedAt: string | null;
  lastTestStatus: CopTestStatus;
  lastTestErrorCode: string | null;
  createdAt: string;
  updatedAt: string;
}

interface FirestoreLike {
  collection(name: string): {
    doc(id: string): {
      get(): Promise<{ exists: boolean; data(): unknown; get(field: string): unknown }>;
      set(value: Record<string, unknown>, options?: { merge?: boolean }): Promise<unknown>;
    };
    where(field: string, operator: string, value: unknown): {
      limit(value: number): {
        get(): Promise<{ docs: Array<{ data(): unknown }> }>;
      };
    };
  };
}

const DEFAULT_TOKEN_ENDPOINT = "https://copapi.moi.gov.tw/cp/getToken";
const DEFAULT_API_BASE_URL = "https://copapi.moi.gov.tw/cp/api";
const SECRET_MARKERS = ["client_secret", "clientsecret", "access_token", "authorization", "bearer ", "basic "];

export function createProductionCustomerCopBackendApp(options: ProductionCustomerCopBackendOptions) {
  const encryptionKey = options.env.AIRE_COP_CREDENTIAL_ENCRYPTION_KEY?.trim();
  const backendSharedToken = options.env.AIRE_COP_BACKEND_SHARED_TOKEN?.trim();
  const allowedOrigins = parseCsv(options.env.AIRE_COP_ALLOWED_ORIGINS);
  const errors = [
    encryptionKey ? null : "credential_encryption_key_missing",
    backendSharedToken ? null : "backend_shared_token_missing",
    options.env.AIRE_BROWSER_SESSION_JWT_SECRET?.trim() ? null : "browser_session_jwt_secret_missing",
    allowedOrigins.length > 0 ? null : "allowed_origins_missing",
  ].filter((item): item is string => Boolean(item));

  if (errors.length > 0) {
    throw new Error(`customer_cop_backend_deploy_config_invalid:${errors.join(",")}`);
  }
  if (!encryptionKey) {
    throw new Error("customer_cop_backend_deploy_config_invalid:credential_encryption_key_missing");
  }
  if (!backendSharedToken) {
    throw new Error("customer_cop_backend_deploy_config_invalid:backend_shared_token_missing");
  }
  const credentialEncryptionKey = encryptionKey;

  return createCustomerCopBackendApp({
    store: options.store ?? createFirestoreCustomerCopStore({
      encryptionKey: credentialEncryptionKey,
      collectionPrefix: options.env.AIRE_COP_FIRESTORE_COLLECTION_PREFIX,
    }),
    copFetch: options.copFetch ?? fetch,
    allowedOrigins,
    backendSharedToken,
    browserSessionJwtSecret: options.env.AIRE_BROWSER_SESSION_JWT_SECRET,
    tokenEndpoint: options.env.LAND_REGISTRY_TOKEN_ENDPOINT,
  });
}

export function createCustomerCopBackendApp(options: CustomerCopBackendOptions) {
  const now = options.now ?? (() => new Date());
  const createId = options.id ?? (() => `run-${crypto.randomUUID()}`);
  const tokenEndpoint = options.tokenEndpoint ?? DEFAULT_TOKEN_ENDPOINT;
  const apiBaseUrl = (options.apiBaseUrl ?? DEFAULT_API_BASE_URL).replace(/\/$/, "");
  const priceCatalog = options.priceCatalog ?? {
    land_description: { serviceName: "地籍土地標示部資料服務", unitPrice: 1 },
    building_registry: { serviceName: "建物標示部資料服務", unitPrice: 1 },
    building_ownership: { serviceName: "建物所有權部資料服務", unitPrice: 1 },
  };

  return {
    async fetch(request: Request): Promise<Response> {
      const cors = corsHeaders(request, options.allowedOrigins);
      if (!cors.ok) return json({ errorCode: "origin_not_allowed" }, 403);
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors.headers });

      const url = new URL(request.url);
      try {
        if (url.pathname === "/api/aire/cop/health" && request.method === "GET") {
          return json({ ok: true, service: "customer-cop-backend" }, 200, cors.headers);
        }

        if (!verifyBackendGatewayToken(request, options.backendSharedToken)) {
          return json({ errorCode: "backend_gateway_required" }, 403, cors.headers);
        }

        const auth = resolveContext(request, options.browserSessionJwtSecret);
        if (!auth.ok) return json({ errorCode: auth.errorCode }, auth.status, cors.headers);

        if (url.pathname === "/api/aire/cop/credential" && request.method === "GET") {
          const state = await options.store.readCredentialState(auth.workspaceId);
          if (!state) return json({ errorCode: "not_found" }, 404, cors.headers);
          return json(state, 200, cors.headers);
        }

        if (url.pathname === "/api/aire/cop/credential" && request.method === "POST") {
          const body = await readJson(request);
          const clientId = stringField(body.clientId);
          const clientSecret = stringField(body.clientSecret);
          if (!clientId || !clientSecret) return json({ errorCode: "cop_credential_required" }, 400, cors.headers);
          const state = await options.store.saveCredential({
            workspaceId: auth.workspaceId,
            clientId,
            clientSecret,
            now: now().toISOString(),
          });
          return json(state, 200, cors.headers);
        }

        if (url.pathname === "/api/aire/cop/credential/test" && request.method === "POST") {
          const credential = await options.store.readCredentialSecret(auth.workspaceId);
          if (!credential) return json({ ok: false, errorCode: "missing_cop_credential" }, 409, cors.headers);
          const result = await requestCopToken(credential, { copFetch: options.copFetch, tokenEndpoint });
          if (result.ok) {
            await options.store.updateCredentialTestState(auth.workspaceId, {
              status: "success",
              testedAt: now().toISOString(),
            });
            return json({ ok: true, expiresInSeconds: result.expiresInSeconds, testedAt: now().toISOString() }, 200, cors.headers);
          }
          if (result.errorCode === "cop_auth_failed") {
            await options.store.updateCredentialTestState(auth.workspaceId, {
              status: "failed",
              testedAt: now().toISOString(),
              errorCode: result.errorCode,
            });
          }
          return json({ ok: false, errorCode: result.errorCode, retryable: result.retryable }, result.status, cors.headers);
        }

        if (url.pathname === "/api/aire/cop/formal-lookup" && request.method === "POST") {
          return handleFormalLookup(request, {
            workspaceId: auth.workspaceId,
            store: options.store,
            copFetch: options.copFetch,
            tokenEndpoint,
            apiBaseUrl,
            priceCatalog,
            now: now().toISOString(),
            runId: createId(),
            headers: cors.headers,
          });
        }

        if (url.pathname === "/api/aire/cop/query-ledger" && request.method === "GET") {
          const records = await options.store.listLedger(auth.workspaceId, url.searchParams.get("caseLocalId") ?? undefined);
          return json({ records }, 200, cors.headers);
        }

        return json({ errorCode: "not_found" }, 404, cors.headers);
      } catch (error) {
        const errorCode = error instanceof Error ? error.message : "internal_error";
        if (errorCode === "invalid_json") return json({ errorCode }, 400, cors.headers);
        if (errorCode === "ledger_secret_payload_rejected") return json({ errorCode }, 500, cors.headers);
        return json({ errorCode: "internal_error" }, 500, cors.headers);
      }
    },
  };
}

export function createMemoryCustomerCopStore(input: { encryptionKey: string }): CustomerCopStore & {
  __debugDump(): { credentials: Map<string, StoredCredential>; ledger: LedgerRecord[] };
} {
  const credentials = new Map<string, StoredCredential>();
  const ledger: LedgerRecord[] = [];
  const key = input.encryptionKey;

  return {
    async saveCredential({ workspaceId, clientId, clientSecret, now }) {
      const stored: StoredCredential = {
        workspaceId,
        clientId,
        secretCiphertext: encryptForStore(clientSecret, key),
        lastTestedAt: null,
        lastTestStatus: "not_tested",
        lastTestErrorCode: null,
        createdAt: credentials.get(workspaceId)?.createdAt ?? now,
        updatedAt: now,
      };
      credentials.set(workspaceId, stored);
      return toCredentialState(stored, decryptFromStore(stored.secretCiphertext, key));
    },
    async readCredentialState(workspaceId) {
      const stored = credentials.get(workspaceId);
      return stored ? toCredentialState(stored, decryptFromStore(stored.secretCiphertext, key)) : null;
    },
    async readCredentialSecret(workspaceId) {
      const stored = credentials.get(workspaceId);
      if (!stored) return null;
      return { clientId: stored.clientId, clientSecret: decryptFromStore(stored.secretCiphertext, key) };
    },
    async updateCredentialTestState(workspaceId, state) {
      const stored = credentials.get(workspaceId);
      if (!stored) return;
      credentials.set(workspaceId, {
        ...stored,
        lastTestStatus: state.status,
        lastTestedAt: state.testedAt,
        lastTestErrorCode: state.errorCode ?? null,
        updatedAt: state.testedAt,
      });
    },
    async writeLedger(record) {
      assertSafePayload(record.sanitizedRequestJson);
      assertSafePayload(record.sanitizedResponseJson);
      ledger.unshift({
        ...record,
        apiIds: [...record.apiIds],
        transactionIds: [...record.transactionIds],
        sanitizedRequestJson: sanitizePayload(record.sanitizedRequestJson),
        sanitizedResponseJson: sanitizePayload(record.sanitizedResponseJson),
      });
    },
    async listLedger(workspaceId, caseLocalId) {
      return ledger.filter((record) => record.workspaceId === workspaceId && (!caseLocalId || record.caseLocalId === caseLocalId));
    },
    __debugDump() {
      return { credentials, ledger };
    },
  };
}

export function createFirestoreCustomerCopStore(input: {
  encryptionKey: string;
  firestore?: FirestoreLike;
  collectionPrefix?: string;
}): CustomerCopStore {
  const firestore = input.firestore ?? new Firestore();
  const prefix = sanitizeCollectionPrefix(input.collectionPrefix ?? "aire_customer_cop");
  const credentials = firestore.collection(`${prefix}_credentials`);
  const ledger = firestore.collection(`${prefix}_ledger`);
  const key = input.encryptionKey;

  return {
    async saveCredential({ workspaceId, clientId, clientSecret, now }) {
      const ref = credentials.doc(documentId(workspaceId));
      const existing = await ref.get();
      const stored: StoredCredential = {
        workspaceId,
        clientId,
        secretCiphertext: encryptForStore(clientSecret, key),
        lastTestedAt: null,
        lastTestStatus: "not_tested",
        lastTestErrorCode: null,
        createdAt: existing.exists ? stringField(existing.get("createdAt")) ?? now : now,
        updatedAt: now,
      };
      await ref.set({ ...stored }, { merge: true });
      return toCredentialState(stored, decryptFromStore(stored.secretCiphertext, key));
    },
    async readCredentialState(workspaceId) {
      const stored = await readStoredCredential(credentials.doc(documentId(workspaceId)));
      return stored ? toCredentialState(stored, decryptFromStore(stored.secretCiphertext, key)) : null;
    },
    async readCredentialSecret(workspaceId) {
      const stored = await readStoredCredential(credentials.doc(documentId(workspaceId)));
      if (!stored) return null;
      return { clientId: stored.clientId, clientSecret: decryptFromStore(stored.secretCiphertext, key) };
    },
    async updateCredentialTestState(workspaceId, state) {
      const ref = credentials.doc(documentId(workspaceId));
      const existing = await ref.get();
      if (!existing.exists) return;
      await ref.set({
        lastTestStatus: state.status,
        lastTestedAt: state.testedAt,
        lastTestErrorCode: state.errorCode ?? null,
        updatedAt: state.testedAt,
      }, { merge: true });
    },
    async writeLedger(record) {
      assertSafePayload(record.sanitizedRequestJson);
      assertSafePayload(record.sanitizedResponseJson);
      await ledger.doc(documentId(`${record.workspaceId}:${record.runId}`)).set({
        ...record,
        apiIds: [...record.apiIds],
        transactionIds: [...record.transactionIds],
        sanitizedRequestJson: sanitizePayload(record.sanitizedRequestJson),
        sanitizedResponseJson: sanitizePayload(record.sanitizedResponseJson),
      }, { merge: false });
    },
    async listLedger(workspaceId, caseLocalId) {
      const snapshot = await ledger
        .where("workspaceId", "==", workspaceId)
        .limit(100)
        .get();
      return snapshot.docs
        .map((doc) => doc.data() as LedgerRecord)
        .filter((record) => !caseLocalId || record.caseLocalId === caseLocalId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 50);
    },
  };
}

async function handleFormalLookup(
  request: Request,
  context: {
    workspaceId: string;
    store: CustomerCopStore;
    copFetch: CopFetch;
    tokenEndpoint: string;
    apiBaseUrl: string;
    priceCatalog: Record<string, { serviceName: string; unitPrice: number }>;
    now: string;
    runId: string;
    headers: HeadersInit;
  },
) {
  const body = await readJson(request);
  const caseLocalId = stringField(body.caseLocalId) ?? "unknown-case";
  const registryKey = stringField(body.registryKey);
  const apiIds = Array.isArray(body.apiIds) ? body.apiIds.filter((item): item is string => typeof item === "string" && item.trim() !== "") : [];
  const baseLedger = {
    runId: context.runId,
    workspaceId: context.workspaceId,
    caseLocalId,
    registryKey: registryKey ?? "",
    apiIds,
    totalPrice: 0,
    totalQuantity: 0,
    transactionIds: [] as string[],
    cacheHit: false,
    sanitizedRequestJson: sanitizePayload(body),
    createdAt: context.now,
  };

  if (!registryKey) return json({ errorCode: "confirmed_registry_key_required" }, 422, context.headers);

  const credential = await context.store.readCredentialSecret(context.workspaceId);
  if (!credential) {
    await writeBlockedLedger(context.store, baseLedger, "missing_cop_credential");
    return json({ errorCode: "missing_cop_credential" }, 409, context.headers);
  }

  if (!stringField(body.consentId)) {
    await writeBlockedLedger(context.store, baseLedger, "missing_paid_consent");
    return json({ errorCode: "missing_paid_consent" }, 409, context.headers);
  }
  if (!stringField(body.ownerAuthorizationId)) {
    await writeBlockedLedger(context.store, baseLedger, "missing_owner_authorization");
    return json({ errorCode: "missing_owner_authorization" }, 409, context.headers);
  }
  if (apiIds.length === 0) {
    await writeBlockedLedger(context.store, baseLedger, "unsupported_api_set");
    return json({ errorCode: "unsupported_api_set" }, 409, context.headers);
  }
  for (const apiId of apiIds) {
    if (!context.priceCatalog[apiId]) {
      await writeBlockedLedger(context.store, baseLedger, "missing_catalog_price");
      return json({ errorCode: "missing_catalog_price" }, 409, context.headers);
    }
  }

  const parsed = parseRegistryKey(registryKey);
  if (!parsed) return json({ errorCode: "confirmed_registry_key_required" }, 422, context.headers);
  if (apiIds.some(isBuildingApi) && !parsed.buildingNo) {
    return json({ errorCode: "building_no_required" }, 422, context.headers);
  }

  const token = await requestCopToken(credential, { copFetch: context.copFetch, tokenEndpoint: context.tokenEndpoint });
  if (!token.ok) {
    await context.store.writeLedger({
      ...baseLedger,
      status: "failed",
      errorCode: token.errorCode,
      retryable: token.retryable,
      sanitizedResponseJson: { errorCode: token.errorCode, retryable: token.retryable },
    });
    return json({ errorCode: token.errorCode, retryable: token.retryable }, token.status, context.headers);
  }

  const headers = {
    Authorization: `Bearer ${token.accessToken}`,
    "Content-Type": "application/json; charset=utf-8",
  };
  const sanitizedResult: Record<string, unknown> = {};
  const plannedLineItems = [];
  let totalPrice = 0;
  let totalQuantity = 0;
  const transactionIds: string[] = [];

  for (const apiId of apiIds) {
    const descriptor = getApiDescriptor(apiId);
    if (!descriptor) {
      await writeBlockedLedger(context.store, baseLedger, "unsupported_api_set");
      return json({ errorCode: "unsupported_api_set" }, 409, context.headers);
    }
    const price = context.priceCatalog[apiId];
    plannedLineItems.push({
      apiId,
      serviceName: price.serviceName,
      unitPrice: price.unitPrice,
      quantity: 1,
    });
    const upstream = await context.copFetch(`${context.apiBaseUrl}${descriptor.endpoint}`, {
      method: "POST",
      headers,
      body: JSON.stringify([descriptor.buildPayload(parsed)]),
    });
    const upstreamJson = await safeResponseJson(upstream) as Record<string, unknown>;
    if (!upstream.ok) {
      await context.store.writeLedger({
        ...baseLedger,
        status: "failed",
        errorCode: "cop_formal_lookup_failed",
        retryable: upstream.status >= 500,
        sanitizedResponseJson: { errorCode: "cop_formal_lookup_failed", status: upstream.status, apiId },
      });
      return json({ errorCode: "cop_formal_lookup_failed", retryable: upstream.status >= 500 }, 502, context.headers);
    }

    totalPrice += Number(upstreamJson.PRICE ?? 0);
    totalQuantity += Number(upstreamJson.QUANTITY ?? 0);
    const transactionId = stringField(upstreamJson.TRANSACTIONID);
    if (transactionId) transactionIds.push(transactionId);
    sanitizedResult[apiId] = sanitizePayload(upstreamJson);
  }

  const response = {
    runId: context.runId,
    status: "success",
    costSummary: {
      plannedLineItems,
      actualPrice: totalPrice,
      actualQuantity: totalQuantity,
    },
    provenance: { source: "customer_cop", sourceRunId: context.runId, registryKey },
    sanitizedResult,
    cacheHit: false,
  };
  await context.store.writeLedger({
    ...baseLedger,
    status: "success",
    totalPrice,
    totalQuantity,
    transactionIds,
    sanitizedResponseJson: response,
    completedAt: context.now,
  });
  return json(response, 200, context.headers);
}

async function writeBlockedLedger(
  store: CustomerCopStore,
  base: Omit<LedgerRecord, "status" | "sanitizedResponseJson">,
  errorCode: string,
) {
  await store.writeLedger({
    ...base,
    status: "blocked",
    errorCode,
    sanitizedResponseJson: { errorCode },
  });
}

async function requestCopToken(
  credential: { clientId: string; clientSecret: string },
  options: { copFetch: CopFetch; tokenEndpoint: string },
): Promise<
  | { ok: true; accessToken: string; expiresInSeconds: number }
  | { ok: false; errorCode: string; retryable: boolean; status: 401 | 502 }
> {
  try {
    const response = await options.copFetch(options.tokenEndpoint, {
      method: "GET",
      headers: {
        Authorization: `Basic ${btoa(`${credential.clientId}:${credential.clientSecret}`)}`,
      },
    });
    const body = await safeResponseJson(response) as { access_token?: unknown; expires_in?: unknown };
    const accessToken = typeof body.access_token === "string" ? body.access_token.trim() : "";
    if (response.status === 401 || response.status === 403) {
      return { ok: false, errorCode: "cop_auth_failed", retryable: false, status: 401 };
    }
    if (!response.ok || !accessToken) {
      return { ok: false, errorCode: "cop_token_failed", retryable: response.status >= 500, status: 502 };
    }
    return { ok: true, accessToken, expiresInSeconds: Number(body.expires_in ?? 300) };
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    const timeout = message.includes("timeout") || message.includes("abort");
    return { ok: false, errorCode: timeout ? "cop_token_timeout" : "cop_downstream_error", retryable: true, status: 502 };
  }
}

function resolveContext(request: Request, browserSessionJwtSecret?: string):
  | { ok: true; workspaceId: string }
  | { ok: false; status: 401 | 403; errorCode: string } {
  const auth = request.headers.get("authorization") ?? "";
  if (browserSessionJwtSecret) {
    const token = auth.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
    if (!token) return { ok: false, status: 401, errorCode: "unauthorized" };
    try {
      const claims = verifyAireBrowserTokenClaims(token, browserSessionJwtSecret);
      return { ok: true, workspaceId: claims.workspaceId };
    } catch (error) {
      return { ok: false, status: 403, errorCode: error instanceof Error ? error.message : "token_invalid" };
    }
  }
  if (!/^Bearer\s+aire_session_/i.test(auth)) return { ok: false, status: 401, errorCode: "unauthorized" };
  const workspaceId = request.headers.get("x-aire-workspace-id")?.trim();
  if (!workspaceId) return { ok: false, status: 403, errorCode: "aire_workspace_required" };
  return { ok: true, workspaceId };
}

function verifyAireBrowserTokenClaims(token: string, secret: string): { workspaceId: string } {
  const [header, payload, signature] = token.split(".");
  if (!header || !payload || !signature) throw new Error("token_malformed");
  const expected = createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url");
  if (!safeEqual(signature, expected)) throw new Error("token_signature_invalid");
  const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Record<string, unknown>;
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (claims.iss !== "https://aire.opcos.me") throw new Error("token_issuer_invalid");
  if (claims.aud !== "aire-browser-tool") throw new Error("token_audience_invalid");
  if (typeof claims.exp !== "number" || claims.exp <= nowSeconds) throw new Error("token_expired");
  if (claims.productId !== "aire") throw new Error("token_product_invalid");
  if (claims.licenseStatus !== "active") throw new Error("token_license_inactive");
  if (typeof claims.workspaceId !== "string" || !claims.workspaceId) throw new Error("token_workspace_missing");
  return { workspaceId: claims.workspaceId };
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function verifyBackendGatewayToken(request: Request, expectedToken: string | undefined): boolean {
  if (!expectedToken) return true;
  return request.headers.get("x-aire-backend-token") === expectedToken;
}

function corsHeaders(request: Request, allowedOrigins: string[]):
  | { ok: true; headers: HeadersInit }
  | { ok: false } {
  const origin = request.headers.get("origin");
  if (origin && !allowedOrigins.includes(origin)) return { ok: false };
  return {
    ok: true,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": origin ?? allowedOrigins[0] ?? "*",
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "Content-Type, Authorization, x-aire-workspace-id, x-aire-user-email",
      vary: "Origin",
    },
  };
}

async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? body as Record<string, unknown> : {};
  } catch {
    throw new Error("invalid_json");
  }
}

async function safeResponseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function json(body: unknown, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(body), { status, headers });
}

function stringField(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function parseRegistryKey(registryKey: string): { unit: string; sec: string; landNo: string; buildingNo: string | null } | null {
  const parts = registryKey.split("-");
  if (parts.length < 3) return null;
  const [unit, sec, landNo, ...rest] = parts;
  if (!unit || !sec || !landNo) return null;
  return { unit, sec, landNo, buildingNo: rest.join("-") || null };
}

function isBuildingApi(apiId: string) {
  return apiId === "building_registry" || apiId === "building_ownership";
}

function getApiDescriptor(apiId: string): {
  endpoint: string;
  buildPayload: (parsed: { unit: string; sec: string; landNo: string; buildingNo: string | null }) => Record<string, unknown>;
} | null {
  switch (apiId) {
    case "land_description":
      return {
        endpoint: "/LandDescription/1.0/QueryByLandNo",
        buildPayload: (parsed) => ({ unit: parsed.unit, sec: parsed.sec, no: parsed.landNo }),
      };
    case "building_registry":
      return {
        endpoint: "/BuildingDescription/1.0/QueryByBuildNo",
        buildPayload: (parsed) => ({ unit: parsed.unit, sec: parsed.sec, no: parsed.buildingNo }),
      };
    case "building_ownership":
      return {
        endpoint: "/BuildingOwnership/1.0/QueryByLimit",
        buildPayload: (parsed) => ({ unit: parsed.unit, sec: parsed.sec, no: parsed.buildingNo, offset: 1, limit: 100 }),
      };
    default:
      return null;
  }
}

function toCredentialState(stored: StoredCredential, clientSecret: string): CredentialState {
  return {
    workspaceId: stored.workspaceId,
    clientId: stored.clientId,
    secretMasked: maskSecret(clientSecret),
    lastTestedAt: stored.lastTestedAt,
    lastTestStatus: stored.lastTestStatus,
    lastTestErrorCode: stored.lastTestErrorCode,
  };
}

function maskSecret(secret: string) {
  const suffix = secret.slice(-4);
  return `${"*".repeat(Math.max(4, secret.length - suffix.length))}${suffix}`;
}

function decryptFromStore(value: string, key: string) {
  const decoded = Buffer.from(value, "base64url");
  const iv = decoded.subarray(0, 12);
  const tag = decoded.subarray(12, 28);
  const ciphertext = decoded.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", deriveStoreKey(key), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

function encryptForStore(value: string, key: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveStoreKey(key), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString("base64url");
}

function deriveStoreKey(key: string) {
  return createHash("sha256").update(key).digest();
}

function sanitizePayload<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => sanitizePayload(item)) as T;
  if (!value || typeof value !== "object") return value;
  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    const lower = key.toLowerCase();
    if (SECRET_MARKERS.some((marker) => lower.includes(marker.trim()))) continue;
    if (typeof item === "string" && containsSecretMarker(item)) {
      out[key] = "[redacted]";
      continue;
    }
    out[key] = sanitizePayload(item);
  }
  return out as T;
}

function assertSafePayload(value: unknown) {
  if (containsSecretMarker(value)) throw new Error("ledger_secret_payload_rejected");
}

function containsSecretMarker(value: unknown) {
  const serialized = JSON.stringify(value ?? "").toLowerCase();
  return SECRET_MARKERS.some((marker) => serialized.includes(marker));
}

function parseCsv(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function readStoredCredential(ref: {
  get(): Promise<{ exists: boolean; data(): unknown }>;
}): Promise<StoredCredential | null> {
  const snapshot = await ref.get();
  if (!snapshot.exists) return null;
  const data = snapshot.data();
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  const workspaceId = stringField(record.workspaceId);
  const clientId = stringField(record.clientId);
  const secretCiphertext = stringField(record.secretCiphertext);
  const lastTestStatus = record.lastTestStatus === "success" || record.lastTestStatus === "failed" ? record.lastTestStatus : "not_tested";
  if (!workspaceId || !clientId || !secretCiphertext) return null;
  return {
    workspaceId,
    clientId,
    secretCiphertext,
    lastTestedAt: stringField(record.lastTestedAt),
    lastTestStatus,
    lastTestErrorCode: stringField(record.lastTestErrorCode),
    createdAt: stringField(record.createdAt) ?? "",
    updatedAt: stringField(record.updatedAt) ?? "",
  };
}

function documentId(value: string) {
  return Buffer.from(value).toString("base64url");
}

function sanitizeCollectionPrefix(value: string) {
  return value.replace(/[^a-zA-Z0-9_]/g, "_").replace(/^_+|_+$/g, "") || "aire_customer_cop";
}
