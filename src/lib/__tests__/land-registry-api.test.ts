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

import {
  addressLookup,
  BrowserAddressDiscoveryUnavailableError,
  formalPullData,
  getTrialStatus,
  listRegistryQueryRuns,
  recordR02ResultText,
} from "../land-registry-api";

function installLocalStorageStub() {
  const storage = new Map<string, string>();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => storage.set(key, String(value))),
      removeItem: vi.fn((key: string) => storage.delete(key)),
      clear: vi.fn(() => storage.clear()),
      key: vi.fn((index: number) => Array.from(storage.keys())[index] ?? null),
      get length() {
        return storage.size;
      },
    },
  });
}

describe("land-registry-api addressLookup", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    installLocalStorageStub();
    (window as unknown as Record<string, unknown>).__AIRE_LOCAL_TOKEN__ = "test-local-token";
    delete (window as unknown as Record<string, unknown>).__AIRE_BROWSER_LOCAL_FIRST__;
    delete (window as unknown as Record<string, unknown>).__AIRE_LAND_PROXY_URL__;
    delete (window as unknown as Record<string, unknown>).__AIRE_LAND_PROXY_TOKEN__;
    delete (window as unknown as Record<string, unknown>).__AIRE_BROWSER_SESSION_TOKEN__;
    delete (window as unknown as Record<string, unknown>).__AIRE_CUSTOMER_COP_BACKEND_URL__;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.stubEnv("NODE_ENV", originalNodeEnv);
    delete (window as unknown as Record<string, unknown>).__AIRE_LOCAL_TOKEN__;
    delete (window as unknown as Record<string, unknown>).__AIRE_CUSTOMER_COP_BACKEND_URL__;
  });

  it("uses AIRE workspace COP formal lookup route in browser-local-first mode", async () => {
    (window as unknown as Record<string, unknown>).__AIRE_BROWSER_LOCAL_FIRST__ = true;
    (window as unknown as Record<string, unknown>).__AIRE_BROWSER_SESSION_TOKEN__ = "browser-session";
    (window as unknown as Record<string, unknown>).__AIRE_WORKSPACE_ID__ = "workspace-abc";
    (window as unknown as Record<string, unknown>).__AIRE_CUSTOMER_COP_BACKEND_URL__ =
      "https://customer-cop.aire.opcos.me";
    mocks.safeInvoke.mockResolvedValueOnce({
      id: "case-browser",
      address: "台中市測試地址",
      land_registry_data: {
        confirmed_registry_match: {
          office_code: "BA",
          section_code: "0001",
          land_no: "00020000",
          building_no: "00030000",
        },
      },
    });
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({
          status: "success",
          runId: "aire-cop-001",
          sanitizedResult: {
            land_description: {
              STATUS: 1,
              RESPONSE: [{ LANDREG: { SECNAME: "公園段", NO: "00020000", AREA: "123.45", ALVALUE: "91000", ALPRICE: "7200" } }],
            },
            building_registry: {
              STATUS: 1,
              RESPONSE: [{ BLDGREG: { NO: "00030000", PURPOSE: "住家用", AREA: "98.5", COMPLETEDATE: "0831018" } }],
            },
          },
          costSummary: { actualCost: 2 },
          cacheHit: false,
          sourceRunId: null,
        }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );

    await expect(formalPullData("case-browser", ["land_registry", "building_registry"])).resolves.toMatchObject({
      run_id: "aire-cop-001",
      results: {
        land_registry: expect.objectContaining({
          success: true,
          source: "api",
          data: expect.objectContaining({ section: "公園段", lot_number: "00020000", area: 123.45 }),
        }),
        building_registry: expect.objectContaining({
          success: true,
          source: "api",
          data: expect.objectContaining({ building_number: "00030000", purpose: "住家用", area: 98.5 }),
        }),
      },
      total_cost: 2,
      cache_hit: false,
      source_run_id: null,
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://customer-cop.aire.opcos.me/api/aire/cop/formal-lookup",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer browser-session",
          "x-aire-workspace-id": "workspace-abc",
        }),
      }),
    );
    const body = JSON.parse(String(fetchSpy.mock.calls[0]?.[1]?.body));
    expect(body).toMatchObject({
      caseLocalId: "case-browser",
      apiIds: ["land_description", "building_registry"],
      address: "台中市測試地址",
      registryKey: "BA-0001-00020000-00030000",
    });
    expect(body.ownerAuthorizationId).toMatch(/^owner-auth-/);
    expect(body.consentId).toMatch(/^paid-consent-/);
    fetchSpy.mockRestore();
  });

  it("maps customer COP land_description result back to the UI land_registry key", async () => {
    (window as unknown as Record<string, unknown>).__AIRE_BROWSER_LOCAL_FIRST__ = true;
    (window as unknown as Record<string, unknown>).__AIRE_BROWSER_SESSION_TOKEN__ = "browser-session";
    (window as unknown as Record<string, unknown>).__AIRE_WORKSPACE_ID__ = "workspace-abc";
    (window as unknown as Record<string, unknown>).__AIRE_CUSTOMER_COP_BACKEND_URL__ =
      "https://customer-cop.aire.opcos.me";
    mocks.safeInvoke.mockResolvedValueOnce({
      id: "case-browser",
      address: "台中市測試地址",
      land_registry_data: {
        confirmed_registry_match: {
          office_code: "BA",
          section_code: "0001",
          land_no: "00020000",
          building_no: "",
        },
      },
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({
        status: "success",
        runId: "aire-cop-002",
        results: {
          land_description: {
            STATUS: 1,
            RESPONSE: [{ LANDREG: { SECNAME: "公園段", NO: "00020000", AREA: "88.8" } }],
          },
        },
        costSummary: { actualCost: 1 },
        cacheHit: false,
        sourceRunId: null,
      }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(formalPullData("case-browser", ["land_registry"])).resolves.toMatchObject({
      results: {
        land_registry: expect.objectContaining({
          success: true,
          source: "api",
          data: expect.objectContaining({ section: "公園段" }),
        }),
      },
    });
  });

  it("uses injected browser formal target without loading the case from local API", async () => {
    (window as unknown as Record<string, unknown>).__AIRE_BROWSER_LOCAL_FIRST__ = true;
    (window as unknown as Record<string, unknown>).__AIRE_BROWSER_SESSION_TOKEN__ = "browser-session";
    (window as unknown as Record<string, unknown>).__AIRE_WORKSPACE_ID__ = "workspace-abc";
    (window as unknown as Record<string, unknown>).__AIRE_CUSTOMER_COP_BACKEND_URL__ =
      "https://customer-cop.aire.opcos.me";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({
        status: "success",
        runId: "aire-cop-003",
        sanitizedResult: { STATUS: 1 },
        costSummary: { actualCost: 1 },
        cacheHit: false,
        sourceRunId: null,
      }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(formalPullData("case-browser", ["land_registry"], {
      address: "臺北市中正區測試路1號",
      officeCode: "BA",
      sectionCode: "0001",
      landNo: "00020000",
      buildingNo: "",
    })).resolves.toMatchObject({
      run_id: "aire-cop-003",
    });

    expect(mocks.safeInvoke).not.toHaveBeenCalledWith("get_case", expect.anything());
    const body = JSON.parse(String(fetchSpy.mock.calls[0]?.[1]?.body));
    expect(body).toMatchObject({
      caseLocalId: "case-browser",
      caseId: "case-browser",
      address: "臺北市中正區測試路1號",
      registryKey: "BA-0001-00020000",
      apiIds: ["land_description"],
    });
  });

  it("surfaces backend 409 errorCode instead of only aire_cop_formal_lookup_http_409", async () => {
    (window as unknown as Record<string, unknown>).__AIRE_BROWSER_LOCAL_FIRST__ = true;
    (window as unknown as Record<string, unknown>).__AIRE_BROWSER_SESSION_TOKEN__ = "browser-session";
    (window as unknown as Record<string, unknown>).__AIRE_WORKSPACE_ID__ = "workspace-abc";
    (window as unknown as Record<string, unknown>).__AIRE_CUSTOMER_COP_BACKEND_URL__ =
      "https://customer-cop.aire.opcos.me";
    mocks.safeInvoke.mockResolvedValueOnce({
      id: "case-browser",
      address: "台中市測試地址",
      land_registry_data: {
        confirmed_registry_match: {
          office_code: "BA",
          section_code: "0001",
          land_no: "00020000",
          building_no: "00030000",
        },
      },
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({
        errorCode: "missing_cop_credential",
      }), {
        status: 409,
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(formalPullData("case-browser", ["land_registry"])).rejects.toThrow("missing_cop_credential");
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

  it("browser-local-first reports provider unavailable without calling local API", async () => {
    vi.stubEnv("NODE_ENV", "production");
    mocks.isTauriEnv.mockResolvedValue(false);
    (window as unknown as Record<string, unknown>).__AIRE_BROWSER_LOCAL_FIRST__ = true;
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await expect(addressLookup("台南市永康區勝利街58巷4號")).rejects.toBeInstanceOf(
      BrowserAddressDiscoveryUnavailableError,
    );
    await expect(addressLookup("台南市永康區勝利街58巷4號")).rejects.toThrow("瀏覽器版地址前查代理暫時無法取得資料");
    expect(fetchSpy).not.toHaveBeenCalledWith("/api/local/address-discovery", expect.anything());
    expect(mocks.safeInvoke).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("browser-local-first uses Taiwan proxy address discovery candidates", async () => {
    vi.stubEnv("NODE_ENV", "production");
    mocks.isTauriEnv.mockResolvedValue(false);
    (window as unknown as Record<string, unknown>).__AIRE_BROWSER_LOCAL_FIRST__ = true;
    (window as unknown as Record<string, unknown>).__AIRE_LAND_PROXY_URL__ = "https://land.example.test";
    (window as unknown as Record<string, unknown>).__AIRE_BROWSER_SESSION_TOKEN__ = "browser-session";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "candidate_found",
          candidates: [
            {
              parcel_id: "BA-0001-00020000-00030000",
              address: "台南市永康區勝利街58巷4號",
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
          totalCostCents: 0,
          total_cost_cents: 0,
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ) as Response,
    );

    await expect(addressLookup("台南市永康區勝利街58巷4號")).resolves.toEqual([
      expect.objectContaining({
        section_name: "勝利段",
        lot_number: "00020000",
        land_area_sqm: "72.5",
      }),
    ]);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://land.example.test/api/address-discovery",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer browser-session" }),
        body: JSON.stringify({ address: "台南市永康區勝利街58巷4號", allowMockFallback: false }),
      }),
    );
    fetchSpy.mockRestore();
  });

  it("browser-local-first stores registry query evidence locally", async () => {
    (window as unknown as Record<string, unknown>).__AIRE_BROWSER_LOCAL_FIRST__ = true;

    const recorded = await recordR02ResultText({
      caseId: "case-browser",
      inputAddress: "台南市永康區勝利街58巷4號",
      textOrHtml: "<html>no candidate</html>",
    });
    const rows = await listRegistryQueryRuns("勝利街");

    expect(recorded.run_id).toMatch(/^browser-r02-/);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id: recorded.run_id,
      case_id: "case-browser",
      source_input: "台南市永康區勝利街58巷4號",
      total_cost_cents: 0,
    });
    expect(mocks.safeInvoke).not.toHaveBeenCalled();
  });

  it("browser-local-first trial status is local and does not call desktop backend", async () => {
    (window as unknown as Record<string, unknown>).__AIRE_BROWSER_LOCAL_FIRST__ = true;

    await expect(getTrialStatus()).resolves.toMatchObject({
      plan: "trial",
      status: "active",
    });
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

  it("uses the local formal proxy in browser development instead of falling back to mock registry data", async () => {
    vi.stubEnv("NODE_ENV", "development");
    mocks.isTauriEnv.mockResolvedValue(false);
    mocks.safeInvoke.mockResolvedValueOnce({
      id: "case-hsinchu",
      land_registry_data: {
        confirmed_registry_match: {
          section_name: "兵南段",
          land_no: "04140000",
          building_no: "00084000",
        },
      },
    });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          run_id: "local-web-run",
          results: {
            building_registry: {
              success: true,
              data: { BNO: "00084000" },
              source: "api",
            },
          },
          total_cost: 10,
          cache_hit: false,
          source_run_id: null,
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ) as Response,
    );

    await expect(formalPullData("case-hsinchu", ["building_registry"])).resolves.toMatchObject({
      run_id: "local-web-run",
      results: {
        building_registry: expect.objectContaining({ source: "api" }),
      },
    });
    expect(fetchSpy).toHaveBeenCalledWith("/api/local/formal-pull-data", expect.any(Object));
    expect(mocks.safeInvoke).toHaveBeenCalledWith("get_case", { id: "case-hsinchu" });
    fetchSpy.mockRestore();
  });

  it("rejects formal import when the case has no confirmed registry match", async () => {
    vi.stubEnv("NODE_ENV", "development");
    mocks.isTauriEnv.mockResolvedValue(false);
    mocks.safeInvoke.mockResolvedValueOnce({
      id: "case-no-match",
      land_registry_data: {},
    });

    await expect(formalPullData("case-no-match", ["building_registry"])).rejects.toThrow(
      "registry_match_required",
    );
    expect(mocks.safeInvoke).toHaveBeenCalledWith("get_case", { id: "case-no-match" });
  });

  it("uses the desktop backend command for formal import in Tauri mode", async () => {
    mocks.isTauriEnv.mockResolvedValue(true);
    mocks.safeInvoke.mockResolvedValue({
      run_id: "run-001",
      results: {},
      total_cost: 0,
      cache_hit: false,
      source_run_id: null,
    });

    await expect(formalPullData("case-001", ["building_registry"])).resolves.toMatchObject({
      run_id: "run-001",
    });
    expect(mocks.safeInvoke).toHaveBeenCalledWith("land_registry_formal_pull_data", {
      caseId: "case-001",
      apiIds: ["building_registry"],
    });
  });
});
