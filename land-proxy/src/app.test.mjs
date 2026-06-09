import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";

import { createLandProxyApp } from "./app.mjs";

const env = {
  AIRE_LAND_PROXY_TOKEN: "session-token",
  LAND_REGISTRY_CLIENT_ID: "client-id",
  LAND_REGISTRY_CLIENT_SECRET: "client-secret",
  LAND_REGISTRY_TOKEN_ENDPOINT: "https://copapi.moi.gov.tw/cp/getToken",
  LAND_REGISTRY_API_BASE_URL: "https://copapi.moi.gov.tw/cp/api",
};

function request(path, init = {}) {
  return new Request(`https://aire-land.opcos.me${path}`, {
    method: "POST",
    headers: {
      authorization: "Bearer session-token",
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
    body: init.body ?? JSON.stringify({
      unit: "BA",
      sec: "0001",
      no: "00020000",
      CITY: "B",
    }),
  });
}

describe("aire land proxy", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-04T08:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("caches COP JWT until fewer than 30 seconds remain", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ access_token: "token-1", expires_in: 300 }))
      .mockResolvedValueOnce(jsonResponse({ STATUS: 1, RESPONSE: [{ LANDDESC: { AREA: "72" } }] }))
      .mockResolvedValueOnce(jsonResponse({ STATUS: 1, RESPONSE: [{ LANDDESC: { AREA: "72" } }] }))
      .mockResolvedValueOnce(jsonResponse({ access_token: "token-2", expires_in: 300 }))
      .mockResolvedValueOnce(jsonResponse({ STATUS: 1, RESPONSE: [{ LANDDESC: { AREA: "72" } }] }));

    const app = createLandProxyApp({ env });

    await app.fetch(request("/api/land/query"));
    vi.setSystemTime(new Date("2026-06-04T08:04:20Z"));
    await app.fetch(request("/api/land/query"));
    vi.setSystemTime(new Date("2026-06-04T08:04:31Z"));
    await app.fetch(request("/api/land/query"));

    const tokenCalls = fetchSpy.mock.calls.filter(([url]) => String(url).endsWith("/cp/getToken"));
    expect(tokenCalls).toHaveLength(2);
    expect(fetchSpy.mock.calls[1][1]).toMatchObject({
      method: "POST",
      headers: expect.objectContaining({ Authorization: "Bearer token-1" }),
    });
    expect(fetchSpy.mock.calls[4][1]).toMatchObject({
      method: "POST",
      headers: expect.objectContaining({ Authorization: "Bearer token-2" }),
    });
  });

  it("routes land and building queries to their COP endpoints and marks building as billable", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ access_token: "token-1", expires_in: 300 }))
      .mockResolvedValueOnce(jsonResponse({ STATUS: 1, RESPONSE: [{ LANDDESC: { AREA: "72" } }] }))
      .mockResolvedValueOnce(jsonResponse({ STATUS: 1, RESPONSE: [{ BLDGREG: { NO: "00020000" } }] }));

    const app = createLandProxyApp({ env });

    const landResponse = await app.fetch(request("/api/land/query"));
    const buildingResponse = await app.fetch(request("/api/building/query"));

    expect(fetchSpy.mock.calls[1][0]).toBe("https://copapi.moi.gov.tw/cp/api/LandDescription/1.0/QueryByLandNo");
    expect(fetchSpy.mock.calls[2][0]).toBe("https://copapi.moi.gov.tw/cp/api/BuildingDescription/1.0/QueryByBuildNo");
    expect(JSON.parse(fetchSpy.mock.calls[1][1].body)).toEqual([{ unit: "BA", sec: "0001", no: "00020000", CITY: "B" }]);
    expect(await landResponse.json()).toMatchObject({ ok: true, billable: false });
    expect(await buildingResponse.json()).toMatchObject({ ok: true, billable: true });
  });

  it("routes browser address discovery through a zero-cost normalized contract", async () => {
    const discoverAddress = vi.fn(async (address) => ({
      status: "candidate_found",
      source: "local_discovery",
      normalizedAddress: address,
      candidates: [
        {
          parcel_id: "BA-0001-00020000-00030000",
          address,
          lot_number: "00020000",
          building_number: "00030000",
          section_name: "勝利段",
          section_code: "0001",
          office_code: "BA",
          source: "easymap_z10web",
          trusted_for_pdf: false,
          land_area_sqm: "72.5",
          building_area_sqm: "88.1",
        },
      ],
      errors: [],
      trustedForPdf: false,
      totalCostCents: 0,
      total_cost_cents: 0,
      cacheHit: false,
      sourceRunId: null,
      inputKind: "doorplate",
      intendedObjectType: "building",
      requiresCandidateSelection: false,
      candidateSelection: { state: "not_required", selectedRegistryKey: null },
    }));
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const app = createLandProxyApp({ env, discoverAddress });

    const response = await app.fetch(request("/api/address-discovery", {
      headers: {
        "x-aire-client-request-id": "req-123",
      },
      body: JSON.stringify({ address: "台南市永康區勝利街58巷4號", allowMockFallback: false }),
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("x-aire-request-id")).toBe("req-123");
    expect(response.headers.get("x-aire-route-hit")).toBe("/api/address-discovery");
    expect(discoverAddress).toHaveBeenCalledWith("台南市永康區勝利街58巷4號", {
      allowMockFallback: false,
    });
    expect(body).toMatchObject({
      status: "candidate_found",
      totalCostCents: 0,
      total_cost_cents: 0,
      candidates: [
        expect.objectContaining({
          section_name: "勝利段",
          lot_number: "00020000",
          land_area_sqm: "72.5",
        }),
      ],
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("preserves low-confidence discovery status from the generated resolver", async () => {
    const discoverAddress = vi.fn(async (address) => ({
      status: "low_confidence_unresolved",
      source: "local_discovery",
      normalizedAddress: address,
      candidates: [
        {
          parcel_id: "DC-1511-03045000",
          address,
          lot_number: "00770000",
          building_number: "03045000",
          section_name: "光明段",
          section_code: "1511",
          office_code: "DC",
          source: "easymap_r02",
          trusted_for_pdf: false,
          discovery_confidence: "low",
          selection_reason: "floor_unit_unique_match",
        },
      ],
      errors: [
        {
          source: "easymap_r02",
          code: "easymap_r02_z10web_mismatch",
          message: "conflict",
        },
      ],
      trustedForPdf: false,
      totalCostCents: 0,
      total_cost_cents: 0,
      cacheHit: false,
      sourceRunId: null,
      inputKind: "doorplate",
      intendedObjectType: "building",
      requiresCandidateSelection: true,
      candidateSelection: { state: "required", selectedRegistryKey: null },
    }));
    const app = createLandProxyApp({ env, discoverAddress });

    const response = await app.fetch(request("/api/address-discovery", {
      body: JSON.stringify({ address: "台南市東區東和路47號3樓", allowMockFallback: false }),
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      status: "low_confidence_unresolved",
      requiresCandidateSelection: true,
      candidateSelection: { state: "required", selectedRegistryKey: null },
      candidates: [
        expect.objectContaining({
          section_name: "光明段",
          lot_number: "00770000",
          building_number: "03045000",
          discovery_confidence: "low",
        }),
      ],
      errors: [
        expect.objectContaining({ code: "easymap_r02_z10web_mismatch" }),
      ],
    });
  });

  it("rejects invalid address discovery payloads without touching downstream services", async () => {
    const discoverAddress = vi.fn();
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const app = createLandProxyApp({ env, discoverAddress });

    const response = await app.fetch(request("/api/address-discovery", {
      body: JSON.stringify({ address: "" }),
    }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, error: "address_required" });
    expect(discoverAddress).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("checks COP token health without exposing the upstream JWT", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(jsonResponse({ access_token: "token-1", expires_in: 300 }));
    const app = createLandProxyApp({ env });

    const response = await app.fetch(request("/api/land/token"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, expiresInSeconds: 300 });
    expect(JSON.stringify(body)).not.toContain("token-1");
  });

  it("rejects unauthenticated requests before touching COP", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const app = createLandProxyApp({ env });

    const response = await app.fetch(request("/api/land/query", { headers: { authorization: "" } }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ ok: false, error: "unauthorized" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("accepts signed AIRE browser JWTs when the shared browser secret is configured", async () => {
    const discoverAddress = vi.fn(async (address) => ({
      status: "candidate_found",
      candidates: [{ address, lot_number: "04140000", building_number: "00084000" }],
    }));
    const app = createLandProxyApp({
      env: {
        ...env,
        AIRE_BROWSER_SESSION_JWT_SECRET: "browser-token-secret",
      },
      discoverAddress,
    });

    const response = await app.fetch(request("/api/address-discovery", {
      headers: {
        authorization: `Bearer ${createBrowserToken("browser-token-secret")}`,
      },
      body: JSON.stringify({ address: "台南市永康區勝利街58巷4號" }),
    }));

    expect(response.status).toBe(200);
    expect(discoverAddress).toHaveBeenCalledTimes(1);
  });

  it("keeps shared-token auth as a fallback when browser JWT verification fails", async () => {
    const discoverAddress = vi.fn(async (address) => ({
      status: "candidate_found",
      candidates: [{ address, lot_number: "04140000", building_number: "00084000" }],
    }));
    const app = createLandProxyApp({
      env: {
        ...env,
        AIRE_BROWSER_SESSION_JWT_SECRET: "browser-token-secret",
      },
      discoverAddress,
    });

    const response = await app.fetch(request("/api/address-discovery", {
      headers: {
        authorization: "Bearer session-token",
      },
      body: JSON.stringify({ address: "台南市永康區勝利街58巷4號" }),
    }));

    expect(response.status).toBe(200);
    expect(discoverAddress).toHaveBeenCalledTimes(1);
  });

  it("sanitizes downstream COP failures and keeps raw response out of the client body", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ access_token: "token-1", expires_in: 300 }))
      .mockResolvedValueOnce(
        new Response("client_secret=leaked upstream stack trace", {
          status: 502,
          headers: { "content-type": "text/plain" },
        }),
      );
    const app = createLandProxyApp({ env });

    const response = await app.fetch(request("/api/building/query"));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toEqual({ ok: false, error: "cop_downstream_error" });
  });

  it("rate limits by IP before forwarding to COP", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ access_token: "token-1", expires_in: 300 }));
    const app = createLandProxyApp({ env, limits: { perIpPerMinute: 1, perLicensePerDay: 1000 } });

    const first = await app.fetch(request("/api/land/query", { headers: { "x-forwarded-for": "1.2.3.4" } }));
    const second = await app.fetch(request("/api/land/query", { headers: { "x-forwarded-for": "1.2.3.4" } }));

    expect(first.status).not.toBe(429);
    expect(second.status).toBe(429);
    expect(await second.json()).toEqual({ ok: false, error: "rate_limited" });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("only returns CORS allow-origin for configured browser origins", async () => {
    const app = createLandProxyApp({
      env: { ...env, AIRE_ALLOWED_ORIGINS: "https://aire-browser.opcos.me,https://aire.opcos.me" },
    });

    const allowed = await app.fetch(
      new Request("https://aire-land.opcos.me/api/land/query", {
        method: "OPTIONS",
        headers: { origin: "https://aire-browser.opcos.me" },
      }),
    );
    const blocked = await app.fetch(
      new Request("https://aire-land.opcos.me/api/land/query", {
        method: "OPTIONS",
        headers: { origin: "https://evil.example" },
      }),
    );

    expect(allowed.headers.get("access-control-allow-origin")).toBe("https://aire-browser.opcos.me");
    expect(blocked.headers.get("access-control-allow-origin")).toBeNull();
  });
});

function jsonResponse(payload, init = {}) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}

function createBrowserToken(secret) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    iss: "https://aire.opcos.me",
    aud: "aire-browser-tool",
    sub: "user_123",
    email: "fish.myfb@gmail.com",
    workspaceId: "cmpfgv8n7000004k2e97z9mll",
    productId: "aire",
    licenseStatus: "active",
    exp: Math.floor(Date.now() / 1000) + 60 * 10,
  })).toString("base64url");
  const signature = createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${signature}`;
}
