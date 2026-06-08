import type { Env } from "./types";
import { handleRateLimitAndSanitize } from "./handlers/middleware";
import { handleActivate } from "./handlers/activate";
import { handleVerify } from "./handlers/verify";
import { handleLegalClauses } from "./handlers/legal-clauses";
import { handleRealtor } from "./handlers/realtor";

const DEFAULT_ALLOWED_ORIGIN = "https://aire-browser.opcos.me";
const ALLOWED_ORIGINS = new Set([
  DEFAULT_ALLOWED_ORIGIN,
  "https://aire.opcos.me",
  "https://feat-aire-mvp.aire-browser.pages.dev",
  "https://aire-staging.aire-browser.pages.dev",
]);
const LAND_PROXY_ROUTES = new Set([
  "/api/land/token",
  "/api/land/query",
  "/api/building/query",
  "/api/address-discovery",
]);
const VISUAL_EVIDENCE_ROUTES = new Set([
  "/api/visual-evidence/location-map",
  "/api/visual-evidence/aerial-photo",
  "/api/visual-evidence/street-view",
]);
const CUSTOMER_COP_PREFIX = "/api/aire/cop/";
const CORS_ALLOWED_HEADERS = [
  "Content-Type",
  "Authorization",
  "x-aire-client-request-id",
  "x-aire-workspace-id",
  "x-aire-user-email",
  "x-aire-user-id",
  "x-aire-license-id",
  "x-aire-device-id",
].join(", ");

function resolveCorsOrigin(request: Request): string {
  const origin = request.headers.get("Origin");
  return origin && ALLOWED_ORIGINS.has(origin) ? origin : DEFAULT_ALLOWED_ORIGIN;
}

function resolveCustomerCopAllowedOrigins(env: Env): Set<string> {
  const configured = env.AIRE_COP_ALLOWED_ORIGINS?.split(",").map((item) => item.trim()).filter(Boolean) ?? [];
  return new Set(configured.length ? configured : Array.from(ALLOWED_ORIGINS));
}

function corsHeaders(request: Request): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": resolveCorsOrigin(request),
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": CORS_ALLOWED_HEADERS,
  };
}

function handleOptions(request: Request): Response {
  return new Response(null, {
    status: 200,
    headers: corsHeaders(request),
  });
}

function wrapCors(request: Request, response: Response): Response {
  const newHeaders = new Headers(response.headers);
  const cors = corsHeaders(request);
  for (const [key, value] of Object.entries(cors)) {
    newHeaders.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

function jsonResponse(status: number, body: { error: string; status?: string; message?: string }): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function deg2rad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const latRad = deg2rad(lat);
  const scale = 2 ** zoom;
  return {
    x: Math.floor(((lng + 180) / 360) * scale),
    y: Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * scale),
  };
}

function parseCoordinates(
  lat: unknown,
  lng: unknown,
): { lat: number; lng: number } | null {
  if (
    typeof lat !== "number" ||
    !Number.isFinite(lat) ||
    typeof lng !== "number" ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null;
  }

  return { lat, lng };
}

async function readJsonBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const value = await request.json();
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

async function proxyImage(url: string, contentType: "image/png" | "image/jpeg"): Promise<Response> {
  const upstream = await fetch(url, {
    headers: {
      "User-Agent": "AIRE visual evidence proxy",
    },
  });
  if (!upstream.ok) {
    return jsonResponse(502, {
      error: "provider_fetch_failed",
      status: "unavailable",
      message: `visual evidence provider returned HTTP ${upstream.status}`,
    });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}

async function handleVisualEvidence(request: Request, env: Env, url: URL): Promise<Response> {
  if (request.method !== "POST" || !VISUAL_EVIDENCE_ROUTES.has(url.pathname)) {
    return jsonResponse(404, { error: "not_found" });
  }

  const body = await readJsonBody(request);
  if (!body) {
    return jsonResponse(400, {
      error: "invalid_coordinates",
      status: "unavailable",
      message: "lat/lng must be finite coordinates",
    });
  }

  const coords = parseCoordinates(body.lat, body.lng);
  if (!coords) {
    return jsonResponse(400, {
      error: "invalid_coordinates",
      status: "unavailable",
      message: "lat/lng must be finite coordinates",
    });
  }

  const { lat, lng } = coords;
  const zoom = typeof body.zoom === "number" && Number.isFinite(body.zoom)
    ? Math.max(1, Math.min(19, Math.round(body.zoom)))
    : 17;

  if (url.pathname === "/api/visual-evidence/aerial-photo") {
    const tile = latLngToTile(lat, lng, zoom);
    return proxyImage(
      `https://wmts.nlsc.gov.tw/wmts/PHOTO2/default/GoogleMapsCompatible/${zoom}/${tile.y}/${tile.x}`,
      "image/png",
    );
  }

  if (url.pathname === "/api/visual-evidence/location-map") {
    const tile = latLngToTile(lat, lng, zoom);
    return proxyImage(`https://tile.openstreetmap.org/${zoom}/${tile.x}/${tile.y}.png`, "image/png");
  }

  const key = env.GOOGLE_MAPS_API_KEY?.trim();
  if (!key) {
    return jsonResponse(503, {
      error: "street_view_not_configured",
      status: "requires_configuration",
      message: "Google Maps API key is not configured",
    });
  }

  const heading = typeof body.heading === "number" && Number.isFinite(body.heading)
    ? ((body.heading % 360) + 360) % 360
    : 0;
  const streetViewUrl = new URL("https://maps.googleapis.com/maps/api/streetview");
  streetViewUrl.searchParams.set("size", "600x400");
  streetViewUrl.searchParams.set("location", `${lat},${lng}`);
  streetViewUrl.searchParams.set("heading", String(heading));
  streetViewUrl.searchParams.set("pitch", "0");
  streetViewUrl.searchParams.set("fov", "80");
  streetViewUrl.searchParams.set("key", key);

  return proxyImage(streetViewUrl.toString(), "image/jpeg");
}

async function handleLandProxy(request: Request, env: Env, url: URL): Promise<Response> {
  if (VISUAL_EVIDENCE_ROUTES.has(url.pathname)) {
    return handleVisualEvidence(request, env, url);
  }

  if (request.method !== "POST" || !LAND_PROXY_ROUTES.has(url.pathname)) {
    return jsonResponse(404, { error: "not_found" });
  }

  const sessionToken = request.headers.get("Authorization") ?? "";
  if (!sessionToken.startsWith("Bearer ")) {
    return jsonResponse(401, { error: "unauthorized" });
  }

  const proxyToken = env.AIRE_LAND_PROXY_TOKEN?.trim();
  const origin = (env.LAND_PROXY_ORIGIN ?? "https://aire-land-proxy-u4bq2gtsva-de.a.run.app").replace(/\/$/, "");
  if (!proxyToken) {
    return jsonResponse(503, { error: "land_proxy_not_configured" });
  }

  const upstream = await fetch(`${origin}${url.pathname}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${proxyToken}`,
      "Content-Type": request.headers.get("Content-Type") ?? "application/json",
      "CF-Connecting-IP": request.headers.get("CF-Connecting-IP") ?? "",
    },
    body: request.body,
  });

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
    },
  });
}

async function handleCustomerCopGateway(request: Request, env: Env, url: URL): Promise<Response> {
  const allowedOrigins = resolveCustomerCopAllowedOrigins(env);
  const origin = request.headers.get("Origin");
  if (origin && !allowedOrigins.has(origin)) {
    return jsonResponse(403, { error: "origin_not_allowed" });
  }

  const backendOrigin = env.CUSTOMER_COP_BACKEND_ORIGIN?.trim().replace(/\/$/, "");
  const backendToken = env.CUSTOMER_COP_BACKEND_TOKEN?.trim();
  if (!backendOrigin || !backendToken) {
    return jsonResponse(502, { error: "customer_cop_backend_unavailable" });
  }

  try {
    const verifiedContext = await verifyAireBrowserRequestContext(request, env);
    if (!verifiedContext.ok) {
      return jsonResponse(verifiedContext.status, { error: verifiedContext.error });
    }

    const headers = new Headers();
    for (const name of [
      "Authorization",
      "Content-Type",
    ]) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }
    if (verifiedContext.enforced) {
      headers.set("x-aire-workspace-id", verifiedContext.workspaceId);
      headers.set("x-aire-user-email", verifiedContext.email);
      headers.set("x-aire-user-id", verifiedContext.userId);
      headers.set("x-aire-license-id", verifiedContext.licenseId);
      headers.set("x-aire-device-id", verifiedContext.deviceId);
    } else {
      for (const name of ["x-aire-workspace-id", "x-aire-user-email"]) {
        const value = request.headers.get(name);
        if (value) headers.set(name, value);
      }
    }
    if (origin) headers.set("Origin", origin);
    headers.set("x-aire-backend-token", backendToken);

    const upstream = await fetch(`${backendOrigin}${url.pathname}${url.search}`, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    });
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch {
    return jsonResponse(502, { error: "customer_cop_backend_unavailable" });
  }
}

type VerifiedAireContext =
  | { ok: true; enforced: false }
  | {
      ok: true;
      enforced: true;
      userId: string;
      email: string;
      workspaceId: string;
      licenseId: string;
      deviceId: string;
    }
  | { ok: false; status: 401 | 403; error: string };

async function verifyAireBrowserRequestContext(request: Request, env: Env): Promise<VerifiedAireContext> {
  const secret = env.AIRE_BROWSER_SESSION_JWT_SECRET?.trim();
  if (!secret) return { ok: true, enforced: false };
  const token = (request.headers.get("Authorization") ?? "").match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (!token) return { ok: false, status: 401, error: "unauthorized" };
  try {
    const claims = await verifyAireBrowserJwt(token, secret);
    return {
      ok: true,
      enforced: true,
      userId: stringClaim(claims.sub),
      email: stringClaim(claims.email),
      workspaceId: stringClaim(claims.workspaceId),
      licenseId: stringClaim(claims.licenseId),
      deviceId: stringClaim(claims.deviceId),
    };
  } catch (error) {
    return { ok: false, status: 403, error: error instanceof Error ? error.message : "token_invalid" };
  }
}

async function verifyAireBrowserJwt(token: string, secret: string): Promise<Record<string, unknown>> {
  const [header, payload, signature] = token.split(".");
  if (!header || !payload || !signature) throw new Error("token_malformed");
  const expected = await hmacBase64Url(`${header}.${payload}`, secret);
  if (signature !== expected) throw new Error("token_signature_invalid");
  const claims = JSON.parse(decodeBase64Url(payload)) as Record<string, unknown>;
  const now = Math.floor(Date.now() / 1000);
  if (claims.iss !== "https://aire.opcos.me") throw new Error("token_issuer_invalid");
  if (claims.aud !== "aire-browser-tool") throw new Error("token_audience_invalid");
  if (claims.exp === undefined || Number(claims.exp) <= now) throw new Error("token_expired");
  if (claims.productId !== "aire") throw new Error("token_product_invalid");
  if (claims.licenseStatus !== "active") throw new Error("token_license_inactive");
  if (!claims.workspaceId) throw new Error("token_workspace_missing");
  return claims;
}

async function hmacBase64Url(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return base64UrlEncode(new Uint8Array(signature));
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return atob(normalized);
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function stringClaim(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return handleOptions(request);
    }

    const url = new URL(request.url);
    const isLandProxyHost = url.hostname === "aire-land.opcos.me";

    const executeRoute = async () => {
      if (isLandProxyHost) {
        return handleLandProxy(request, env, url);
      } else if (url.pathname.startsWith(CUSTOMER_COP_PREFIX)) {
        return handleCustomerCopGateway(request, env, url);
      } else if (request.method === "POST" && url.pathname === "/api/license/activate") {
        return handleActivate(request, env);
      } else if (request.method === "POST" && url.pathname === "/api/license/verify") {
        return handleVerify(request, env);
      } else if (request.method === "POST" && url.pathname === "/api/legal-clauses/sync") {
        return handleLegalClauses(request, env);
      } else if (request.method === "POST" && url.pathname === "/api/realtor/verify") {
        return handleRealtor(request, env);
      } else {
        return jsonResponse(404, { error: "not_found" });
      }
    };

    const response = await handleRateLimitAndSanitize(request, env, executeRoute);
    return wrapCors(request, response);
  },
};
