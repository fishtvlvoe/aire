import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  discoverAddressLocally: vi.fn(),
}));

vi.mock("@/lib/server/local-address-discovery-proxy", () => ({
  discoverAddressLocally: mocks.discoverAddressLocally,
}));

import { POST } from "../route";

function request(body: unknown): Request {
  return new Request("http://localhost:1420/api/local/address-discovery", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("/api/local/address-discovery", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv("NODE_ENV", "development");
  });

  afterEach(() => {
    vi.stubEnv("NODE_ENV", originalNodeEnv);
  });

  it("uses the same-origin local proxy helper instead of calling COP QueryByAddress", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    mocks.discoverAddressLocally.mockResolvedValueOnce({
      status: "manual_required",
      source: "local_discovery",
      candidates: [],
      errors: [{ source: "local_discovery", code: "address_discovery_unavailable", message: "需要人工確認" }],
      total_cost_cents: 0,
    });

    const response = await POST(
      request({
        address: "台南市永康區勝利街58巷4號",
        clientId: "cid",
        secret: "secret",
        allowMockFallback: false,
      }) as never,
    );

    await expect(response.json()).resolves.toMatchObject({
      status: "manual_required",
      total_cost_cents: 0,
    });
    expect(mocks.discoverAddressLocally).toHaveBeenCalledWith("台南市永康區勝利街58巷4號");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects production browser local discovery without external calls", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const response = await POST(
      request({
        address: "台南市永康區勝利街58巷4號",
      }) as never,
    );

    await expect(response.json()).resolves.toMatchObject({
      status: "manual_required",
      source: "local_discovery",
      candidates: [],
      errors: [{ code: "local_proxy_unavailable" }],
      total_cost_cents: 0,
    });
    expect(mocks.discoverAddressLocally).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
