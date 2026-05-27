import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  safeInvoke: vi.fn(),
  isTauriEnv: vi.fn(),
}));

vi.mock("../tauri-bridge", () => ({
  isTauriEnv: mocks.isTauriEnv,
  safeInvoke: mocks.safeInvoke,
  NotInTauriError: class NotInTauriError extends Error {
    constructor(message = "此功能需在 AIRE 桌面 App 中使用") {
      super(message);
      this.name = "NotInTauriError";
    }
  },
}));

import { addressLookup } from "../land-registry-api";

describe("land-registry-api addressLookup", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.stubEnv("NODE_ENV", originalNodeEnv);
  });

  it("uses the local backend in development browser mode instead of blocking local E2E", async () => {
    mocks.isTauriEnv.mockResolvedValue(false);
    vi.stubEnv("NODE_ENV", "development");
    mocks.safeInvoke.mockResolvedValueOnce({ clientId: "cid", secret: "sec" });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "candidate_found",
          candidates: [
            {
              parcel_id: "mock",
              address: "台南市永康區勝利街58巷4號",
              lot_number: "9999",
              building_number: "0000",
              source: "mock",
              trusted_for_pdf: true,
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ) as Response,
    );

    await expect(addressLookup("台南市永康區勝利街58巷4號")).resolves.toEqual([
      {
        parcel_id: "mock",
        address: "台南市永康區勝利街58巷4號",
        lot_number: "9999",
        building_number: "0000",
        source: "mock",
        trusted_for_pdf: true,
      },
    ]);
    expect(fetchSpy).toHaveBeenCalledWith("/api/local/address-discovery", expect.any(Object));
    expect(mocks.safeInvoke).toHaveBeenCalledWith("get_land_api_settings");
    expect(mocks.safeInvoke).toHaveBeenCalledWith("record_local_address_discovery", {
      address: "台南市永康區勝利街58巷4號",
      result: expect.objectContaining({
        status: "candidate_found",
      }),
    });
    fetchSpy.mockRestore();
  });

  it("records manual local discovery results without falling back to mock address lookup", async () => {
    mocks.isTauriEnv.mockResolvedValue(false);
    vi.stubEnv("NODE_ENV", "development");
    mocks.safeInvoke.mockResolvedValueOnce({ clientId: "cid", secret: "sec" });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "manual_required",
          candidates: [],
          errors: [{ source: "easymap_r02", code: "easymap_r02_no_candidate", message: "需要人工確認" }],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ) as Response,
    );

    await expect(addressLookup("查無地址")).resolves.toEqual([]);
    expect(mocks.safeInvoke).toHaveBeenCalledWith("record_local_address_discovery", {
      address: "查無地址",
      result: expect.objectContaining({
        status: "manual_required",
        errors: [expect.objectContaining({ code: "easymap_r02_no_candidate" })],
      }),
    });
    expect(mocks.safeInvoke).not.toHaveBeenCalledWith("land_registry_address_lookup", expect.anything());
    fetchSpy.mockRestore();
  });

  it("rejects production browser mode instead of falling back to mock address data", async () => {
    vi.stubEnv("NODE_ENV", "production");
    mocks.isTauriEnv.mockResolvedValue(false);

    await expect(addressLookup("台南市永康區勝利街58巷4號")).rejects.toThrow(
      "請使用 AIRE 桌面版完成物件資料補齊",
    );
    expect(mocks.safeInvoke).not.toHaveBeenCalled();
  });

  it("uses the desktop backend command in Tauri mode", async () => {
    const parcels = [
      {
        parcel_id: "DC-1556-00165000",
        address: "台南市東區裕農路288巷17號8樓之1",
        lot_number: "00700000",
        building_number: "00165000",
        source: "cop_moi",
      },
    ];
    mocks.isTauriEnv.mockResolvedValue(true);
    mocks.safeInvoke.mockResolvedValue(parcels);

    await expect(addressLookup("台南市東區裕農路288巷17號8樓之1")).resolves.toEqual(parcels);
    expect(mocks.safeInvoke).toHaveBeenCalledWith("land_registry_address_lookup", {
      address: "台南市東區裕農路288巷17號8樓之1",
    });
  });
});
