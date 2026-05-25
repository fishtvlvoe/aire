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
    mocks.safeInvoke.mockResolvedValue([]);

    await expect(addressLookup("台南市永康區勝利街58巷4號")).resolves.toEqual([]);
    expect(mocks.safeInvoke).toHaveBeenCalledWith("land_registry_address_lookup", {
      address: "台南市永康區勝利街58巷4號",
    });
  });

  it("rejects production browser mode instead of falling back to mock address data", async () => {
    vi.stubEnv("NODE_ENV", "production");
    mocks.isTauriEnv.mockResolvedValue(false);

    await expect(addressLookup("台南市永康區勝利街58巷4號")).rejects.toThrow(
      "請使用 AIRE 桌面版完成地址資料補齊",
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
