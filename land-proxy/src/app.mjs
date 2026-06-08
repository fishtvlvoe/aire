import { createHmac, timingSafeEqual } from "node:crypto";

const DEFAULT_TOKEN_ENDPOINT = "https://copapi.moi.gov.tw/cp/getToken";
const DEFAULT_API_BASE_URL = "https://copapi.moi.gov.tw/cp/api";

const ROUTES = {
  "/api/land/token": {
    tokenHealth: true,
    billable: false,
  },
  "/api/land/query": {
    endpoint: "/LandDescription/1.0/QueryByLandNo",
    billable: false,
  },
  "/api/building/query": {
    endpoint: "/BuildingDescription/1.0/QueryByBuildNo",
    billable: true,
  },
  "/api/address-discovery": {
    addressDiscovery: true,
    billable: false,
  },
};

const DEFAULT_LIMITS = {
  perIpPerMinute: 100,
  perLicensePerDay: 1000,
};

export function createLandProxyApp({
  env = process.env,
  limits = DEFAULT_LIMITS,
  fetchImpl = globalThis.fetch,
  discoverAddress = defaultDiscoverAddress,
} = {}) {
  const state = {
    cachedToken: null,
    ipHits: new Map(),
    licenseHits: new Map(),
  };

  return {
    async fetch(request) {
      return handleRequest(request, { env, limits: { ...DEFAULT_LIMITS, ...limits }, fetchImpl, discoverAddress, state });
    },
  };
}

async function handleRequest(request, context) {
  const requestId = readRequestId(request);
  if (request.method === "OPTIONS") return json({ ok: true }, 200, request, context.env, requestId);
  if (request.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405, request, context.env, requestId);

  const url = new URL(request.url);
  const route = ROUTES[url.pathname];
  if (!route) return json({ ok: false, error: "not_found" }, 404, request, context.env, requestId);
  console.log(JSON.stringify({ route: url.pathname, requestId, event: "request:start" }));

  const auth = verifyAuthorization(request, context.env);
  if (!auth.ok) {
    console.warn(JSON.stringify({ route: url.pathname, requestId, event: "request:unauthorized" }));
    return json({ ok: false, error: "unauthorized" }, 401, request, context.env, requestId);
  }

  const rate = checkRateLimit(request, auth.licenseKey, context);
  if (!rate.ok) return json({ ok: false, error: "rate_limited" }, 429, request, context.env, requestId);

  if (route.tokenHealth) {
    try {
      const token = await getCopToken(context);
      console.log(JSON.stringify({ route: url.pathname, requestId, event: "request:success" }));
      return json({ ok: true, expiresInSeconds: token.expiresInSeconds }, 200, request, context.env, requestId);
    } catch (error) {
      console.error(JSON.stringify({ route: url.pathname, requestId, event: "request:error", error: sanitizeCopError(error) }));
      return json({ ok: false, error: sanitizeCopError(error) }, 502, request, context.env, requestId);
    }
  }

  let input;
  try {
    input = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400, request, context.env, requestId);
  }

  if (route.addressDiscovery) {
    const address = String(input?.address ?? "").trim();
    if (!address) return json({ ok: false, error: "address_required" }, 400, request, context.env, requestId);
    try {
      const discovery = await context.discoverAddress(address, {
        allowMockFallback: input?.allowMockFallback === true,
      });
      const payload = normalizeAddressDiscoveryResponse(address, discovery);
      console.log(JSON.stringify({
        route: url.pathname,
        requestId,
        event: "request:success",
        status: payload.status,
        candidates: Array.isArray(payload.candidates) ? payload.candidates.length : 0,
        errorCodes: Array.isArray(payload.errors) ? payload.errors.map((entry) => entry.code) : [],
      }));
      return json(payload, 200, request, context.env, requestId);
    } catch (error) {
      console.error(JSON.stringify({
        route: url.pathname,
        requestId,
        event: "request:error",
        error: error instanceof Error ? error.message : String(error ?? "unknown_error"),
      }));
      return json({
        status: "manual_required",
        source: "local_discovery",
        normalizedAddress: address,
        candidates: [],
        errors: [{
          source: "easymap_proxy",
          code: "address_discovery_unavailable",
          message: "便民系統代理暫時無法取得資料，請人工確認地段、地號、建號",
        }],
        trustedForPdf: false,
        totalCostCents: 0,
        total_cost_cents: 0,
        cacheHit: false,
        sourceRunId: null,
        inputKind: "doorplate",
        intendedObjectType: "unknown",
        requiresCandidateSelection: false,
        candidateSelection: { state: "not_required", selectedRegistryKey: null },
      }, 200, request, context.env, requestId);
    }
  }

  const normalized = normalizeCopInput(input);
  if (!normalized.ok) return json({ ok: false, error: normalized.error }, 400, request, context.env, requestId);

  try {
    const token = await getCopToken(context);
    const data = await postCop(route.endpoint, token.accessToken, [normalized.payload], context);
    const response = {
      ok: true,
      billable: route.billable,
      data,
    };

    if (url.pathname === "/api/land/query" && input.includeSectionLots === true) {
      response.sectionLots = await postCop(
        "/LandQuerySec/1.0/QueryBySec",
        token.accessToken,
        [{ unit: normalized.payload.unit, sec: normalized.payload.sec, CITY: normalized.payload.CITY }],
        context,
      );
    }

    console.log(JSON.stringify({ route: url.pathname, requestId, event: "request:success" }));
    return json(response, 200, request, context.env, requestId);
  } catch (error) {
    console.error(JSON.stringify({ route: url.pathname, requestId, event: "request:error", error: sanitizeCopError(error) }));
    return json({ ok: false, error: sanitizeCopError(error) }, 502, request, context.env, requestId);
  }
}

function readRequestId(request) {
  return request.headers.get("x-aire-client-request-id")?.trim() || crypto.randomUUID();
}

async function defaultDiscoverAddress(address) {
  if (!address) throw new Error("address_required");
  const { discoverAddressLocally } = await import("./generated/local-address-discovery-proxy.mjs");
  return discoverAddressLocally(address, { cache: false });
}

function normalizeAddressDiscoveryResponse(address, discovery) {
  const payload = discovery && typeof discovery === "object" ? discovery : {};
  const candidates = Array.isArray(payload.candidates) ? payload.candidates : [];
  return {
    status: payload.status === "candidate_found" ? "candidate_found" : "manual_required",
    source: "local_discovery",
    normalizedAddress: typeof payload.normalizedAddress === "string" ? payload.normalizedAddress : address,
    candidates,
    errors: Array.isArray(payload.errors) ? payload.errors : [],
    trustedForPdf: false,
    totalCostCents: 0,
    total_cost_cents: 0,
    cacheHit: Boolean(payload.cacheHit),
    sourceRunId: typeof payload.sourceRunId === "string" ? payload.sourceRunId : null,
    inputKind: payload.inputKind ?? "doorplate",
    intendedObjectType: payload.intendedObjectType ?? "unknown",
    requiresCandidateSelection: Boolean(payload.requiresCandidateSelection),
    candidateSelection: payload.candidateSelection ?? { state: candidates.length > 1 ? "required" : "not_required", selectedRegistryKey: null },
  };
}

function verifyAuthorization(request, env) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() ?? "";
  if (!token) return { ok: false };

  const browserSessionJwtSecret = String(env.AIRE_BROWSER_SESSION_JWT_SECRET ?? "").trim();
  if (browserSessionJwtSecret) {
    try {
      const claims = verifyAireBrowserTokenClaims(token, browserSessionJwtSecret);
      return { ok: true, licenseKey: claims.workspaceId };
    } catch {
      // Fall through to shared-token auth for backwards compatibility.
    }
  }

  const expected = String(env.AIRE_LAND_PROXY_TOKEN ?? "").trim();
  if (!expected || !timingSafeEqualString(token, expected)) return { ok: false };

  return { ok: true, licenseKey: token };
}

function timingSafeEqualString(actual, expected) {
  const actualBytes = new TextEncoder().encode(actual);
  const expectedBytes = new TextEncoder().encode(expected);
  if (actualBytes.length !== expectedBytes.length) return false;

  let diff = 0;
  for (let i = 0; i < actualBytes.length; i += 1) {
    diff |= actualBytes[i] ^ expectedBytes[i];
  }
  return diff === 0;
}

function verifyAireBrowserTokenClaims(token, secret) {
  const [header, payload, signature] = token.split(".");
  if (!header || !payload || !signature) throw new Error("token_malformed");
  const expected = createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url");
  if (!safeEqual(signature, expected)) throw new Error("token_signature_invalid");

  const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (claims.iss !== "https://aire.opcos.me") throw new Error("token_issuer_invalid");
  if (claims.aud !== "aire-browser-tool") throw new Error("token_audience_invalid");
  if (typeof claims.exp !== "number" || claims.exp <= nowSeconds) throw new Error("token_expired");
  if (claims.productId !== "aire") throw new Error("token_product_invalid");
  if (claims.licenseStatus !== "active") throw new Error("token_license_inactive");
  if (typeof claims.workspaceId !== "string" || !claims.workspaceId) throw new Error("token_workspace_missing");

  return {
    workspaceId: claims.workspaceId,
  };
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function checkRateLimit(request, licenseKey, { limits, state }) {
  const now = Date.now();
  const ip = readClientIp(request);
  const minuteBucket = Math.floor(now / 60_000);
  const dayBucket = Math.floor(now / 86_400_000);

  const ipResult = incrementBucket(state.ipHits, `${ip}:${minuteBucket}`, limits.perIpPerMinute);
  if (!ipResult.ok) return ipResult;

  return incrementBucket(state.licenseHits, `${licenseKey}:${dayBucket}`, limits.perLicensePerDay);
}

function readClientIp(request) {
  return (request.headers.get("x-forwarded-for") ?? request.headers.get("cf-connecting-ip") ?? "unknown")
    .split(",")[0]
    .trim() || "unknown";
}

function incrementBucket(map, key, limit) {
  const count = (map.get(key) ?? 0) + 1;
  map.set(key, count);
  return { ok: count <= limit };
}

function normalizeCopInput(input) {
  const payload = {
    unit: String(input?.unit ?? "").trim(),
    sec: String(input?.sec ?? "").trim(),
    no: String(input?.no ?? "").trim(),
    CITY: String(input?.CITY ?? input?.city ?? "").trim(),
  };

  if (!/^[A-Z0-9]{2}$/.test(payload.unit)) return { ok: false, error: "invalid_unit" };
  if (!/^[0-9A-Z]{4}$/.test(payload.sec)) return { ok: false, error: "invalid_sec" };
  if (!/^[0-9A-Z]{8}$/.test(payload.no)) return { ok: false, error: "invalid_no" };
  if (!/^[A-Z]$/.test(payload.CITY)) return { ok: false, error: "invalid_city" };

  return { ok: true, payload };
}

async function getCopToken(context) {
  const now = Date.now();
  const cached = context.state.cachedToken;
  if (cached && cached.expiresAt - now >= 30_000) {
    return {
      accessToken: cached.accessToken,
      expiresInSeconds: Math.max(0, Math.floor((cached.expiresAt - now) / 1000)),
    };
  }

  const clientId = String(context.env.LAND_REGISTRY_CLIENT_ID ?? "").trim();
  const clientSecret = String(context.env.LAND_REGISTRY_CLIENT_SECRET ?? "").trim();
  if (!clientId || !clientSecret) throw new Error("cop_credentials_missing");

  const endpoint = String(context.env.LAND_REGISTRY_TOKEN_ENDPOINT ?? DEFAULT_TOKEN_ENDPOINT).trim() || DEFAULT_TOKEN_ENDPOINT;
  const response = await context.fetchImpl(endpoint, {
    method: "GET",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error("cop_token_http_error");

  const payload = await parseJsonResponse(response, "cop_token_invalid_json");
  const accessToken = typeof payload.access_token === "string" ? payload.access_token.trim() : "";
  const expiresInSeconds = Number(payload.expires_in ?? 300);
  if (!accessToken) throw new Error("cop_token_missing_access_token");

  context.state.cachedToken = {
    accessToken,
    expiresAt: now + Math.max(1, expiresInSeconds) * 1000,
  };
  return { accessToken, expiresInSeconds };
}

async function postCop(endpoint, accessToken, payload, context) {
  const baseUrl = String(context.env.LAND_REGISTRY_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/$/, "");
  const response = await context.fetchImpl(`${baseUrl}/${endpoint.replace(/^\//, "")}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error("cop_http_error");
  return parseJsonResponse(response, "cop_invalid_json");
}

async function parseJsonResponse(response, errorCode) {
  try {
    return await response.json();
  } catch {
    throw new Error(errorCode);
  }
}

function sanitizeCopError(error) {
  const message = error instanceof Error ? error.message : "";
  if (message === "cop_credentials_missing") return "cop_configuration_error";
  return "cop_downstream_error";
}

function json(payload, status = 200, request = null, env = {}, requestId = crypto.randomUUID()) {
  const headers = {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "authorization, content-type, x-forwarded-for, x-aire-client-request-id",
    vary: "Origin",
    "x-aire-request-id": requestId,
    "x-aire-route-hit": request ? new URL(request.url).pathname : "unknown",
  };
  const allowedOrigin = resolveAllowedOrigin(request, env);
  if (allowedOrigin) headers["access-control-allow-origin"] = allowedOrigin;

  return new Response(JSON.stringify(payload), {
    status,
    headers,
  });
}

function resolveAllowedOrigin(request, env) {
  const origin = request?.headers?.get("origin");
  if (!origin) return null;

  const configured = String(env.AIRE_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const allowed = configured.length > 0
    ? configured
    : ["https://aire.opcos.me", "https://aire-browser.opcos.me", "http://localhost:3000", "http://localhost:3001"];

  return allowed.includes(origin) ? origin : null;
}
