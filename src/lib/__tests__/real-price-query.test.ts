import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  localApiFetch: vi.fn(),
  isTauriEnv: vi.fn(),
  safeInvoke: vi.fn(),
  createAireGatewayHeaders: vi.fn(),
  getAireGatewayBaseUrl: vi.fn(),
  writeLog: vi.fn(),
}));

vi.mock("@/lib/local-api/client", () => ({
  localApiFetch: mocks.localApiFetch,
}));

vi.mock("@/lib/browser-gateway", async () => {
  const actual = await vi.importActual<typeof import("../browser-gateway")>("@/lib/browser-gateway");
  return {
    ...actual,
    createAireGatewayHeaders: mocks.createAireGatewayHeaders,
    getAireGatewayBaseUrl: mocks.getAireGatewayBaseUrl,
  };
});

vi.mock("@/lib/safe-invoke", () => ({
  isTauriEnv: mocks.isTauriEnv,
  safeInvoke: mocks.safeInvoke,
}));

vi.mock("@/lib/log", () => ({
  writeLog: mocks.writeLog,
}));

import {
  BrowserRealPriceUnavailableError,
  extractRealPriceDistrict,
  extractRealPriceKeyword,
  queryRealPrice,
} from "../real-price-query";

describe("real-price-query", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as unknown as Record<string, unknown>).__AIRE_BROWSER_LOCAL_FIRST__;
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue("req_test_123");
    mocks.createAireGatewayHeaders.mockReturnValue({
      "Content-Type": "application/json",
      Authorization: "Bearer browser-session-token",
    });
    mocks.getAireGatewayBaseUrl.mockReturnValue("https://aire.opcos.me");
  });

  it("extracts district from full Taiwan address", () => {
    expect(extractRealPriceDistrict("台北市萬華區萬壽里漢中街52號6樓")).toBe("萬華區");
    expect(extractRealPriceDistrict("台南市東區東和路47號3樓")).toBe("東區");
  });

  it("extracts road keyword instead of village prefix or doorplate", () => {
    expect(extractRealPriceKeyword("台北市萬華區萬壽里漢中街52號6樓", "萬華區")).toBe("漢中街");
    expect(extractRealPriceKeyword("台南市東區東和路47號3樓", "東區")).toBe("東和路");
    expect(extractRealPriceKeyword("台南市東區裕農路288巷17號8樓之1", "東區")).toBe("裕農路");
  });

  it("uses local real-price route outside Tauri", async () => {
    mocks.isTauriEnv.mockResolvedValue(false);
    mocks.localApiFetch.mockResolvedValue(
      new Response(JSON.stringify({
        records: [{ address: "台北市萬華區漢中街52號", total_price: 6060000 }],
      }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(queryRealPrice("萬華區", "漢中街", 20, "台北市萬華區漢中街52號6樓")).resolves.toEqual([
      { address: "台北市萬華區漢中街52號", total_price: 6060000 },
    ]);
    expect(mocks.localApiFetch).toHaveBeenCalledWith("/api/local/real-price", expect.objectContaining({
      method: "POST",
      signal: expect.any(AbortSignal),
      body: JSON.stringify({
        district: "萬華區",
        keyword: "漢中街",
        limit: 20,
        address: "台北市萬華區漢中街52號6樓",
      }),
    }));
    expect(mocks.safeInvoke).not.toHaveBeenCalled();
  });

  it("uses Tauri IPC inside Tauri", async () => {
    mocks.isTauriEnv.mockResolvedValue(true);
    mocks.safeInvoke.mockResolvedValue([{ address: "台南市東區東和路57巷16號5樓" }]);

    await expect(queryRealPrice("東區", "東和路", 5, "台南市東區東和路47號3樓")).resolves.toEqual([
      { address: "台南市東區東和路57巷16號5樓" },
    ]);
    expect(mocks.safeInvoke).toHaveBeenCalledWith("query_real_price", {
      district: "東區",
      keyword: "東和路",
      limit: 5,
      address: "台南市東區東和路47號3樓",
    });
  });

  it("browser-local-first uses the AIRE gateway real-price endpoint", async () => {
    (window as unknown as Record<string, unknown>).__AIRE_BROWSER_LOCAL_FIRST__ = true;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({
        records: [{ address: "台南市永康區勝利街58巷4號", total_price: 9600000 }],
      }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(queryRealPrice("永康區", "勝利街", 5, "台南市永康區勝利街58巷4號")).resolves.toEqual([
      { address: "台南市永康區勝利街58巷4號", total_price: 9600000 },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://aire.opcos.me/api/aire/real-price",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer browser-session-token",
          "x-aire-client-request-id": "req_test_123",
        }),
        body: JSON.stringify({
          district: "永康區",
          keyword: "勝利街",
          limit: 5,
          address: "台南市永康區勝利街58巷4號",
        }),
      }),
    );
    expect(mocks.localApiFetch).not.toHaveBeenCalled();
    expect(mocks.safeInvoke).not.toHaveBeenCalled();
  });
});
