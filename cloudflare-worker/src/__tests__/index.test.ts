import { describe, it, expect, vi } from "vitest";
import worker from "../index";
import { signAireBrowserToken } from "../../../src/lib/server/aire-browser-session-token";

describe("CF Worker router and CORS", () => {
  const mockEnv: any = {
    LICENSES: {
      get: vi.fn(),
      put: vi.fn(),
    },
    OPCOS_API_TOKEN: "mock-token",
    AIRE_LAND_PROXY_TOKEN: "land-proxy-secret",
    LAND_PROXY_ORIGIN: "https://taiwan-proxy.example.test",
    CUSTOMER_COP_BACKEND_ORIGIN: "https://customer-cop-backend.example.test",
    CUSTOMER_COP_BACKEND_TOKEN: "customer-cop-backend-token",
    AIRE_COP_ALLOWED_ORIGINS: "https://aire-browser.opcos.me",
  };

  it("should handle OPTIONS requests with CORS headers", async () => {
    const request = new Request("https://aire.opcos.me/api/legal-clauses/sync", {
      method: "OPTIONS",
    });

    const response = await worker.fetch(request, mockEnv);
    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://aire-browser.opcos.me");
    expect(response.headers.get("Access-Control-Allow-Methods")).toContain("POST");
    expect(response.headers.get("Access-Control-Allow-Headers")).toContain("Authorization");
  });

  it("should route POST /api/legal-clauses/sync", async () => {
    // Should fail with 401 because header is missing, but route exists
    const request = new Request("https://aire.opcos.me/api/legal-clauses/sync", {
      method: "POST",
    });

    const response = await worker.fetch(request, mockEnv);
    expect(response.status).toBe(401);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://aire-browser.opcos.me");
  });

  it("should route POST /api/realtor/verify", async () => {
    const request = new Request("https://aire.opcos.me/api/realtor/verify", {
      method: "POST",
    });

    const response = await worker.fetch(request, mockEnv);
    expect(response.status).toBe(401);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://aire-browser.opcos.me");
  });

  it("should route customer COP calls to Taiwan-side backend runtime without executing COP in Cloudflare", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ runId: "run-001", status: "success" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const request = new Request("https://aire.opcos.me/api/aire/cop/formal-lookup", {
      method: "POST",
      headers: {
        Authorization: "Bearer aire_session_test",
        "x-aire-workspace-id": "ws-a",
        "Content-Type": "application/json",
        Origin: "https://aire-browser.opcos.me",
      },
      body: JSON.stringify({ caseLocalId: "case-001", registryKey: "BA-0001-00020000" }),
    });

    const response = await worker.fetch(request, mockEnv);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ runId: "run-001", status: "success" });
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://customer-cop-backend.example.test/api/aire/cop/formal-lookup",
      expect.objectContaining({
        method: "POST",
        headers: expect.any(Headers),
      }),
    );
    const forwardedHeaders = fetchSpy.mock.calls[0]?.[1]?.headers as Headers;
    expect(forwardedHeaders.get("Authorization")).toBe("Bearer aire_session_test");
    expect(forwardedHeaders.get("x-aire-workspace-id")).toBe("ws-a");
    expect(forwardedHeaders.get("x-aire-backend-token")).toBe("customer-cop-backend-token");
    fetchSpy.mockRestore();
  });

  it("should return customer_cop_backend_unavailable when customer COP backend is not configured", async () => {
    const request = new Request("https://aire.opcos.me/api/aire/cop/credential", {
      method: "GET",
      headers: {
        Authorization: "Bearer aire_session_test",
        "x-aire-workspace-id": "ws-a",
        Origin: "https://aire-browser.opcos.me",
      },
    });

    const response = await worker.fetch(request, { ...mockEnv, CUSTOMER_COP_BACKEND_ORIGIN: "" });

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "customer_cop_backend_unavailable" });
  });

  it("Customer COP gateway verifies AIRE Browser token before forwarding and ignores forged workspace headers", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const token = signAireBrowserToken({
      secret: "browser-token-secret",
      now: new Date(),
      subject: "user-123",
      email: "customer@example.com",
      workspaceId: "workspace-real",
      organizationId: "org-a",
      licenseId: "license-a",
      planId: "vip",
      deviceId: "device-a",
      features: ["browser", "customer-cop"],
    });
    const request = new Request("https://aire-browser.opcos.me/api/aire/cop/credential", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "x-aire-workspace-id": "workspace-forged",
        Origin: "https://aire-browser.opcos.me",
      },
    });

    const response = await worker.fetch(request, {
      ...mockEnv,
      AIRE_BROWSER_SESSION_JWT_SECRET: "browser-token-secret",
    });

    expect(response.status).toBe(200);
    const forwardedHeaders = fetchSpy.mock.calls[0]?.[1]?.headers as Headers;
    expect(forwardedHeaders.get("x-aire-workspace-id")).toBe("workspace-real");
    expect(forwardedHeaders.get("x-aire-user-email")).toBe("customer@example.com");
    expect(forwardedHeaders.get("x-aire-license-id")).toBe("license-a");
    fetchSpy.mockRestore();
  });

  it("rejects forged customer COP workspace headers when token verification is enabled", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const request = new Request("https://aire-browser.opcos.me/api/aire/cop/credential", {
      method: "GET",
      headers: {
        Authorization: "Bearer aire_session_test",
        "x-aire-workspace-id": "workspace-forged",
        Origin: "https://aire-browser.opcos.me",
      },
    });

    const response = await worker.fetch(request, {
      ...mockEnv,
      AIRE_BROWSER_SESSION_JWT_SECRET: "browser-token-secret",
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "token_malformed" });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("should not route customer COP calls when backend gateway token is missing", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const request = new Request("https://aire-browser.opcos.me/api/aire/cop/credential", {
      method: "GET",
      headers: {
        Authorization: "Bearer aire_session_test",
        "x-aire-workspace-id": "ws-a",
        Origin: "https://aire-browser.opcos.me",
      },
    });

    const response = await worker.fetch(request, { ...mockEnv, CUSTOMER_COP_BACKEND_TOKEN: "" });

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "customer_cop_backend_unavailable" });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("should reject untrusted customer COP browser origins", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const request = new Request("https://aire.opcos.me/api/aire/cop/credential", {
      method: "GET",
      headers: {
        Authorization: "Bearer aire_session_test",
        "x-aire-workspace-id": "ws-a",
        Origin: "https://evil.example",
      },
    });

    const response = await worker.fetch(request, mockEnv);

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "origin_not_allowed" });
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("should proxy land registry requests through Taiwan Cloud Run without exposing the proxy secret", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true, billable: false, data: { STATUS: 1 } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const request = new Request("https://aire-land.opcos.me/api/land/query", {
      method: "POST",
      headers: {
        Authorization: "Bearer browser-session",
        "Content-Type": "application/json",
        Origin: "https://aire-browser.opcos.me",
      },
      body: JSON.stringify({ unit: "BA", sec: "0001", no: "00020000", CITY: "B" }),
    });

    const response = await worker.fetch(request, mockEnv);

    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://aire-browser.opcos.me");
    expect(await response.json()).toEqual({ ok: true, billable: false, data: { STATUS: 1 } });
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://taiwan-proxy.example.test/api/land/query",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer land-proxy-secret" }),
      }),
    );
    fetchSpy.mockRestore();
  });

  it("should proxy browser address discovery through Taiwan Cloud Run", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          status: "candidate_found",
          source: "local_discovery",
          normalizedAddress: "台南市永康區勝利街58巷4號",
          candidates: [],
          totalCostCents: 0,
          total_cost_cents: 0,
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );
    const request = new Request("https://aire-land.opcos.me/api/address-discovery", {
      method: "POST",
      headers: {
        Authorization: "Bearer browser-session",
        "Content-Type": "application/json",
        Origin: "https://aire-browser.opcos.me",
      },
      body: JSON.stringify({ address: "台南市永康區勝利街58巷4號", allowMockFallback: false }),
    });

    const response = await worker.fetch(request, mockEnv);

    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://aire-browser.opcos.me");
    expect(await response.json()).toMatchObject({ status: "candidate_found", totalCostCents: 0 });
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://taiwan-proxy.example.test/api/address-discovery",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer land-proxy-secret" }),
      }),
    );
    fetchSpy.mockRestore();
  });

  it("should allow AIRE browser identity headers in land-proxy CORS preflight", async () => {
    const request = new Request("https://aire-land.opcos.me/api/address-discovery", {
      method: "OPTIONS",
      headers: {
        Origin: "https://aire-browser.opcos.me",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "authorization,content-type,x-aire-client-request-id,x-aire-workspace-id,x-aire-user-email",
      },
    });

    const response = await worker.fetch(request, mockEnv);

    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://aire-browser.opcos.me");
    expect(response.headers.get("Access-Control-Allow-Headers")).toContain("x-aire-client-request-id");
    expect(response.headers.get("Access-Control-Allow-Headers")).toContain("x-aire-workspace-id");
    expect(response.headers.get("Access-Control-Allow-Headers")).toContain("x-aire-user-email");
  });

  it("should return visual evidence aerial image bytes from a stateless deployed proxy route", async () => {
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(pngBytes, {
        status: 200,
        headers: { "content-type": "image/png" },
      }),
    );
    const request = new Request("https://aire-land.opcos.me/api/visual-evidence/aerial-photo", {
      method: "POST",
      headers: {
        Authorization: "Bearer browser-session",
        "Content-Type": "application/json",
        Origin: "https://aire-browser.opcos.me",
      },
      body: JSON.stringify({ lat: 23.001624, lng: 120.232844, zoom: 17 }),
    });

    const response = await worker.fetch(request, mockEnv);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(pngBytes);
    expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining("wmts.nlsc.gov.tw"), expect.any(Object));
    fetchSpy.mockRestore();
  });

  it("should reject invalid visual evidence coordinates with HTTP 400 JSON", async () => {
    const request = new Request("https://aire-land.opcos.me/api/visual-evidence/aerial-photo", {
      method: "POST",
      headers: {
        Authorization: "Bearer browser-session",
        "Content-Type": "application/json",
        Origin: "https://aire-browser.opcos.me",
      },
      body: JSON.stringify({ lat: 999, lng: 120.232844 }),
    });

    const response = await worker.fetch(request, mockEnv);

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: "invalid_coordinates",
      status: "unavailable",
    });
  });

  it("should return HTTP 404 JSON for unknown visual evidence routes", async () => {
    const request = new Request("https://aire-land.opcos.me/api/visual-evidence/unknown", {
      method: "POST",
      headers: {
        Authorization: "Bearer browser-session",
        "Content-Type": "application/json",
        Origin: "https://aire-browser.opcos.me",
      },
      body: JSON.stringify({ lat: 23.001624, lng: 120.232844 }),
    });

    const response = await worker.fetch(request, mockEnv);

    expect(response.status).toBe(404);
    expect(response.headers.get("Content-Type")).toContain("application/json");
    expect(await response.json()).toEqual({ error: "not_found" });
  });

  it("should normalize visual evidence provider failures as HTTP 502 JSON", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("missing tile", {
        status: 404,
        headers: { "content-type": "text/plain" },
      }),
    );
    const request = new Request("https://aire-land.opcos.me/api/visual-evidence/location-map", {
      method: "POST",
      headers: {
        Authorization: "Bearer browser-session",
        "Content-Type": "application/json",
        Origin: "https://aire-browser.opcos.me",
      },
      body: JSON.stringify({ lat: 23.001624, lng: 120.232844, zoom: 17 }),
    });

    const response = await worker.fetch(request, mockEnv);

    expect(response.status).toBe(502);
    expect(response.headers.get("Content-Type")).toContain("application/json");
    expect(await response.json()).toMatchObject({
      error: "provider_fetch_failed",
      status: "unavailable",
    });
    fetchSpy.mockRestore();
  });

  it("should report missing Google configuration for street-view with HTTP 503 JSON", async () => {
    const request = new Request("https://aire-land.opcos.me/api/visual-evidence/street-view", {
      method: "POST",
      headers: {
        Authorization: "Bearer browser-session",
        "Content-Type": "application/json",
        Origin: "https://aire-browser.opcos.me",
      },
      body: JSON.stringify({ lat: 23.001624, lng: 120.232844, heading: 90 }),
    });

    const response = await worker.fetch(request, mockEnv);

    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      error: "street_view_not_configured",
      status: "requires_configuration",
    });
  });

  it("should return street-view image bytes without exposing the provider key", async () => {
    const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(jpegBytes, {
        status: 200,
        headers: { "content-type": "image/jpeg" },
      }),
    );
    const request = new Request("https://aire-land.opcos.me/api/visual-evidence/street-view", {
      method: "POST",
      headers: {
        Authorization: "Bearer browser-session",
        "Content-Type": "application/json",
        Origin: "https://aire-browser.opcos.me",
      },
      body: JSON.stringify({ lat: 23.001624, lng: 120.232844, heading: 90, pitch: 0, fov: 80 }),
    });

    const response = await worker.fetch(request, {
      ...mockEnv,
      GOOGLE_MAPS_API_KEY: "server-side-secret",
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/jpeg");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(jpegBytes);
    expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining("maps.googleapis.com/maps/api/streetview"), expect.any(Object));
    expect(fetchSpy.mock.calls[0]?.[0]).not.toContain("browser-session");
    fetchSpy.mockRestore();
  });
});
