import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  MockStore,
  mockInvoke,
  __resetMockStoreForTests,
} from "../mock-backend";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function createMockLocalStorage(seed?: Record<string, string>): Storage {
  const data = new Map<string, string>(Object.entries(seed ?? {}));
  return {
    get length() {
      return data.size;
    },
    clear() {
      data.clear();
    },
    getItem(key: string) {
      return data.has(key) ? data.get(key)! : null;
    },
    key(index: number) {
      return [...data.keys()][index] ?? null;
    },
    removeItem(key: string) {
      data.delete(key);
    },
    setItem(key: string, value: string) {
      data.set(key, value);
    },
  };
}

let originalLocalStorage: PropertyDescriptor | undefined;

describe("MockStore", () => {
  beforeEach(() => {
    originalLocalStorage = Object.getOwnPropertyDescriptor(window, "localStorage");
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: createMockLocalStorage(),
    });
    __resetMockStoreForTests();
  });

  afterEach(() => {
    if (originalLocalStorage) {
      Object.defineProperty(window, "localStorage", originalLocalStorage);
    } else {
      Reflect.deleteProperty(window, "localStorage");
    }
  });

  it("covers all command happy paths", async () => {
    const initialCases = await mockInvoke<Array<{ id: string }>>("list_cases");
    expect(initialCases).toHaveLength(2);

    const created = await mockInvoke<{
      id: string;
      status: string;
      address: string;
      property_type: string;
    }>("create_case", {
      input: {
        address: "台北市大安區",
        property_type: "residential",
        land_lot_no: "A-001",
      },
    });
    expect(created.address).toBe("台北市大安區");
    expect(created.status).toBe("draft");
    expect(isUuid(created.id)).toBe(true);

    const gotCase = await mockInvoke<{ id: string }>("get_case", { id: created.id });
    expect(gotCase.id).toBe(created.id);

    const updated = await mockInvoke<{ owner_name: string; status: string }>(
      "update_case",
      {
        id: created.id,
        input: {
          owner_name: "王小明",
          status: "exported",
          property_type: "residential",
          land_lot_no: "A-001",
          address: "台北市大安區",
        },
      },
    );
    expect(updated.owner_name).toBe("王小明");
    expect(updated.status).toBe("exported");

    const completed = await mockInvoke<{ status: string }>("mark_completed", {
      caseId: created.id,
    });
    expect(completed.status).toBe("completed");

    await expect(mockInvoke<void>("delete_case", { id: created.id })).resolves.toBe(
      undefined,
    );

    const licenseBefore = await mockInvoke<{ status: string }>(
      "get_license_status",
    );
    expect(licenseBefore.status).toBe("none");

    await expect(
      mockInvoke("activate_license", { serial_key: "AIRE-TEST-VALID-001" }),
    ).resolves.toEqual({ success: true });
    const licenseAfter = await mockInvoke<{ status: string }>("check_license");
    expect(licenseAfter.status).toBe("valid");

    await expect(mockInvoke("deactivate_license")).resolves.toEqual({ success: true });
    const licenseReset = await mockInvoke<{ status: string }>("get_license_status");
    expect(licenseReset.status).toBe("none");

    await expect(
      mockInvoke<string>("export_pdf", { args: { caseId: "case-1" } }),
    ).resolves.toContain("case-1");

    await expect(
      mockInvoke("save_draft", {
        caseId: "case-1",
        data: { a: 1 },
      }),
    ).resolves.toEqual({ success: true });
    await expect(
      mockInvoke("load_draft", {
        caseId: "case-1",
      }),
    ).resolves.toEqual({ a: 1 });

    const logs = await mockInvoke<Array<{ id: number }>>("list_recent_logs", {
      limit: 3,
    });
    expect(logs).toHaveLength(3);

    const brand = await mockInvoke<{ company_name: string }>("get_brand_settings");
    expect(brand.company_name).toBe("測試不動產");
    await expect(
      mockInvoke("save_brand_settings", {
        settings: { company_name: "新品牌" },
      }),
    ).resolves.toEqual({ success: true });
    await expect(
      mockInvoke<{ company_name: string }>("get_brand_settings"),
    ).resolves.toMatchObject({ company_name: "新品牌" });

    await expect(
      mockInvoke("upload_logo", {
        bytes: [1, 2, 3],
        mime: "image/png",
      }),
    ).resolves.toEqual({ success: true });
    await expect(mockInvoke("get_logo")).resolves.toEqual({
      bytes: [1, 2, 3],
      mime: "image/png",
    });

    const themes = await mockInvoke<Array<{ id: string }>>("list_themes");
    expect(themes.length).toBeGreaterThan(0);

    const clauses = await mockInvoke<Array<{ law_id: string }>>("list_clauses");
    expect(clauses).toHaveLength(3);

    const clause = await mockInvoke<{ law_id: string }>("get_clause", {
      law_id: clauses[0].law_id,
    });
    expect(clause.law_id).toBe(clauses[0].law_id);

    await expect(mockInvoke("sync_clauses")).resolves.toMatchObject({ success: true });
  });

  it("resets state to initial seed", async () => {
    const store = new MockStore();

    await store.invoke("create_case", {
      input: {
        address: "test-address",
        property_type: "residential",
        land_lot_no: "A-9",
      },
    });

    const afterCreate = await store.invoke<Array<{ id: string }>>("list_cases");
    expect(afterCreate).toHaveLength(3);

    store.reset();

    const afterReset = await store.invoke<
      Array<{ address: string; property_type: string }>
    >("list_cases");
    expect(afterReset).toHaveLength(2);
    expect(afterReset.map((c) => c.address)).toEqual([
      "台北市大安區和平東路一段 100 號",
      "新北市板橋區文化路一段 188 號",
    ]);
  });

  it("throws for unknown command", async () => {
    await expect(mockInvoke("nonexistent_command")).rejects.toThrow(
      "Mock not implemented: nonexistent_command",
    );
  });

  it("supports mock auth commands for valid, invalid, and expired users", async () => {
    await expect(
      mockInvoke("login", {
        email: "admin@test.aire",
        password: "password",
      }),
    ).resolves.toEqual({
      success: true,
      user: { email: "admin@test.aire", role: "admin" },
    });

    await expect(mockInvoke("get_session")).resolves.toEqual({
      authenticated: true,
      user: { email: "admin@test.aire", role: "admin" },
    });

    await expect(mockInvoke("logout")).resolves.toEqual({ success: true });
    await expect(mockInvoke("get_session")).resolves.toEqual({
      authenticated: false,
    });

    await expect(
      mockInvoke("login", {
        email: "wrong@example.com",
        password: "wrong",
      }),
    ).rejects.toThrow("INVALID_CREDENTIALS");

    await expect(
      mockInvoke("login", {
        email: "expired@test.aire",
        password: "password",
      }),
    ).rejects.toThrow("ACCOUNT_EXPIRED");
  });

  it("supports get_app_settings and save_app_settings merging", async () => {
    await expect(mockInvoke("get_app_settings")).resolves.toEqual({
      license: { status: "none", serialKey: null },
      landApi: { clientId: "", secret: "" },
      premiumUnlocked: false,
    });

    await expect(
      mockInvoke("save_app_settings", {
        landApi: { clientId: "c1", secret: "s1" },
      }),
    ).resolves.toEqual({ success: true });

    await expect(mockInvoke("get_app_settings")).resolves.toEqual({
      license: { status: "none", serialKey: null },
      landApi: { clientId: "c1", secret: "s1" },
      premiumUnlocked: false,
    });
  });

  it("returns default land api settings", async () => {
    await expect(mockInvoke("get_land_api_settings")).resolves.toEqual({
      clientId: "",
      secret: "",
    });
  });

  it("saves and gets land api settings", async () => {
    await expect(
      mockInvoke("save_land_api_settings", {
        clientId: "land-client",
        secret: "land-secret",
      }),
    ).resolves.toEqual({ success: true });

    await expect(mockInvoke("get_land_api_settings")).resolves.toEqual({
      clientId: "land-client",
      secret: "land-secret",
    });
  });

  it("tests land api connection", async () => {
    const result = await mockInvoke<{ success: boolean; latency_ms: number }>(
      "test_land_api_connection",
    );
    expect(result.success).toBe(true);
    expect(result.latency_ms).toBeGreaterThan(0);
  });

  it("returns default premium status", async () => {
    await expect(mockInvoke("get_premium_status")).resolves.toEqual({
      subscribed: false,
      plan: null,
      expires_at: null,
    });
  });

  it("returns premium subscribe redirect url", async () => {
    await expect(mockInvoke("subscribe_premium")).resolves.toEqual({
      redirect_url: "https://opcos.tw/checkout/mcp-hub",
    });
  });

  it("returns default feature flags", async () => {
    await expect(mockInvoke("get_feature_flags")).resolves.toEqual([
      { id: "premium-unlock", name: "進階功能解鎖", enabled: false },
      { id: "mcp-hub", name: "MCP Hub", enabled: false },
      { id: "land-registry-api", name: "地政 API", enabled: true },
    ]);
  });

  it("toggles feature flag enabled state", async () => {
    await expect(
      mockInvoke("toggle_feature_flag", {
        id: "mcp-hub",
      }),
    ).resolves.toEqual({ success: true, enabled: true });

    await expect(
      mockInvoke<Array<{ id: string; enabled: boolean }>>("get_feature_flags"),
    ).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "mcp-hub", enabled: true })]),
    );
  });

  it("persists and restores session + app settings via localStorage", async () => {
    await mockInvoke("login", {
      email: "admin@test.aire",
      password: "password",
    });
    await mockInvoke("activate_license", { serial_key: "AIRE-TEST-VALID-001" });
    await mockInvoke("save_app_settings", {
      landApi: { clientId: "persist-client", secret: "persist-secret" },
    });

    const reloaded = new MockStore();
    await expect(reloaded.invoke("get_session")).resolves.toEqual({
      authenticated: true,
      user: { email: "admin@test.aire", role: "admin" },
    });
    await expect(reloaded.invoke("get_app_settings")).resolves.toEqual({
      license: { status: "valid", serialKey: "AIRE-TEST-VALID-001" },
      landApi: { clientId: "persist-client", secret: "persist-secret" },
      premiumUnlocked: false,
    });
  });

  it("persists land api settings via localStorage", async () => {
    await expect(
      mockInvoke("save_land_api_settings", {
        clientId: "persisted-client-id",
        secret: "persisted-secret",
      }),
    ).resolves.toEqual({ success: true });

    const reloaded = new MockStore();
    await expect(reloaded.invoke("get_land_api_settings")).resolves.toEqual({
      clientId: "persisted-client-id",
      secret: "persisted-secret",
    });
  });

  it("persists created cases via localStorage and restores after reload", async () => {
    const created = await mockInvoke<{ id: string; address: string }>("create_case", {
      input: {
        address: "台南市東區裕農路288巷17號8樓之1",
        property_type: "residential",
      },
    });

    const reloaded = new MockStore();
    const restored = await reloaded.invoke<Array<{ id: string; address: string }>>("list_cases");
    expect(restored.some((row) => row.id === created.id && row.address === created.address)).toBe(
      true,
    );
  });

  it("create_case allows empty land_lot_no", async () => {
    const created = await mockInvoke<{ land_lot_no: string; owner_name: string | null }>(
      "create_case",
      {
        input: {
          address: "台南市東區裕農路288巷",
          property_type: "residential",
          case_no: "TEST-004",
        },
      },
    );

    expect(created.land_lot_no).toBe("");
    expect(created.owner_name).toBeNull();
  });

  it("falls back to seed cases with warning when persisted JSON is corrupted", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    window.localStorage.setItem("aire-mock-store", "CORRUPTED");

    const store = new MockStore();
    const list = await store.invoke<Array<{ id: string }>>("list_cases");
    expect(list).toHaveLength(2);
    expect(warnSpy).toHaveBeenCalledWith(
      "[mock-backend] localStorage parse error, cleared and using SEED_CASES",
    );
    warnSpy.mockRestore();
  });

  it("falls back to memory mode when localStorage methods throw", async () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: vi.fn(() => {
          throw new DOMException("blocked");
        }),
        setItem: vi.fn(() => {
          throw new DOMException("blocked");
        }),
        removeItem: vi.fn(),
        clear: vi.fn(),
        key: vi.fn(() => null),
        length: 0,
      } as Storage,
    });

    const store = new MockStore();
    await expect(
      store.invoke("login", {
        email: "admin@test.aire",
        password: "password",
      }),
    ).resolves.toEqual({
      success: true,
      user: { email: "admin@test.aire", role: "admin" },
    });
    await expect(store.invoke("get_session")).resolves.toEqual({
      authenticated: true,
      user: { email: "admin@test.aire", role: "admin" },
    });
  });
});
