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
    ).resolves.toMatchObject({
      case_id: "case-1",
      payload_json: '{"a":1}',
      schema_version: 1,
    });

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

    window.localStorage.setItem(
      "aire-mock-store",
      JSON.stringify({
        branding: {
          agentName: "王承辦",
          realtorName: "陳經紀",
          agentCertNo: "南市經紀人字第 000001 號",
          companyName: "裕農安居不動產經紀有限公司",
          companyLicenseNo: "南市經紀業字第 000001 號",
          companyAddress: "台南市東區裕農路1號",
          companyPhone: "06-123-4567",
        },
      }),
    );
    await expect(mockInvoke("get_brand_text_settings")).resolves.toMatchObject({
      agent_name: "王承辦",
      realtor_name: "陳經紀",
      agent_cert_no: "南市經紀人字第 000001 號",
      company_name: "裕農安居不動產經紀有限公司",
      company_license_no: "南市經紀業字第 000001 號",
      company_address: "台南市東區裕農路1號",
      company_phone: "06-123-4567",
    });

    await expect(
      mockInvoke("upload_logo", {
        bytes: [1, 2, 3],
        mime: "image/png",
      }),
    ).resolves.toEqual({ success: true });
    await expect(mockInvoke("get_logo")).resolves.toMatchObject({
      bytes: [1, 2, 3],
      mime: "image/png",
      filename: "brand-logo",
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

  it("land_registry_pull_data returns field-accurate mock payloads", async () => {
    const result = await mockInvoke<{
      results: Record<string, { success: boolean; data: unknown; source: string }>;
      total_cost: number;
    }>("land_registry_pull_data", {
      parcelId: "0001-0000",
      apiIds: [
        "land_registry",
        "zoning",
        "land_value",
        "mortgages",
        "building_registry",
        "building_ownership",
        "unknown_api",
      ],
    });

    expect(result.total_cost).toBe(70);
    expect(result.results.land_registry.data).toMatchObject({
      area: 125.8,
      purpose: "田",
      lot_number: "0456-0000",
    });
    expect(result.results.zoning.data).toMatchObject({
      zoning_type: "住宅區",
      usage_category: "甲種建築用地",
    });
    expect(result.results.land_value.data).toMatchObject({
      announced_value: 58000,
      assessed_value: 42000,
    });
    expect(result.results.mortgages.data).toEqual([
      { creditor: "台灣銀行", amount: 3000000 },
    ]);
    expect(result.results.building_registry.data).toMatchObject({
      area: 85.5,
      purpose: "住家用",
      construction_date: "2015-06-15",
    });
    expect(result.results.building_ownership.data).toMatchObject({
      certificate_no: "北松字第012345號",
      ownership_date: "2015-08-20",
    });
    expect(result.results.unknown_api.data).toEqual({ source_api: "unknown_api" });
  });

  it("query_real_price returns 3 Tainan records with numeric unit_price", async () => {
    const records = await mockInvoke<
      Array<{
        unit_price: number;
        total_price: number;
        area: number;
        address: string;
        date: string;
      }>
    >("query_real_price", {
      district: "台南市東區",
      keyword: "裕農路",
      limit: 5,
    });

    expect(records).toHaveLength(3);
    for (const row of records) {
      expect(typeof row.unit_price).toBe("number");
      expect(typeof row.total_price).toBe("number");
      expect(typeof row.area).toBe("number");
      expect(typeof row.address).toBe("string");
      expect(row.address).toContain("台南市");
      expect(typeof row.date).toBe("string");
    }
  });

  it("query_real_price does not return fixed Tainan rows for a Taipei case", async () => {
    const records = await mockInvoke<
      Array<{
        unit_price: number;
        total_price: number;
        area: number;
        address: string;
        date: string;
      }>
    >("query_real_price", {
      district: "臺北市大安區",
      keyword: "和平東路",
      limit: 5,
    });

    expect(records.length).toBeGreaterThan(0);
    for (const row of records) {
      expect(row.address).toContain("臺北市");
      expect(row.address).not.toContain("台南市");
    }
  });

  it("query_real_price returns Yongkang records for a Yongkang Shengli case", async () => {
    const records = await mockInvoke<
      Array<{
        unit_price: number;
        total_price: number;
        area: number;
        address: string;
        date: string;
      }>
    >("query_real_price", {
      district: "台南市永康區",
      keyword: "台南市永康區勝利街58巷4號1樓",
      limit: 5,
    });

    expect(records).toHaveLength(3);
    for (const row of records) {
      expect(row.address).toContain("台南市永康區");
      expect(row.address).not.toContain("育農路");
      expect(row.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
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

  it("supports web trial gate, registry confirmation, formal lookup, and cache-hit query runs", async () => {
    await mockInvoke("land_registry_set_api_key", {
      clientId: "customer-org-client",
      clientSecret: "customer-org-secret",
    });

    const created = await mockInvoke<{ id: string }>("create_case", {
      input: {
        address: "台南市東區裕農路288巷17號8樓之1",
        property_type: "residential",
      },
    });

    await expect(
      mockInvoke("land_registry_formal_pull_data", {
        caseId: created.id,
        apiIds: ["building_registry", "building_ownership"],
      }),
    ).rejects.toThrow("registry_match_required");

    const runsBeforeConfirm = await mockInvoke<Array<{ total_cost_cents: number }>>(
      "list_registry_query_runs",
      {},
    );
    const runsAfterRejectedFormal = await mockInvoke<Array<{ total_cost_cents: number; api_calls: unknown[] }>>(
      "list_registry_query_runs",
      {},
    );
    expect(runsAfterRejectedFormal).toHaveLength(runsBeforeConfirm.length);

    await expect(
      mockInvoke("confirm_case_registry_match", {
        caseId: created.id,
        sectionName: "富強段",
        landNo: "00700000",
        buildingNo: "00165000",
      }),
    ).resolves.toMatchObject({ success: true });

    await expect(
      mockInvoke("land_registry_formal_pull_data", {
        caseId: created.id,
        apiIds: ["building_registry", "building_ownership"],
      }),
    ).resolves.toMatchObject({
      cache_hit: false,
      total_cost: 20,
      source_run_id: null,
    });

    await expect(
      mockInvoke("land_registry_formal_pull_data", {
        caseId: created.id,
        apiIds: ["building_registry", "building_ownership"],
      }),
    ).resolves.toMatchObject({
      cache_hit: true,
      total_cost: 0,
    });

    const runs = await mockInvoke<Array<{ id: string; cache_hit: boolean; source_run_id: string | null }>>(
      "list_registry_query_runs",
      {},
    );
    expect(runs.length).toBe(runsBeforeConfirm.length + 2);
    expect(runs.some((run) => run.cache_hit)).toBe(true);
    const cacheRun = runs.find((run) => run.cache_hit);
    expect(cacheRun?.source_run_id).toBeTruthy();
    const detail = await mockInvoke<{ id: string; api_calls: Array<{ service_code: string }> }>(
      "get_registry_query_run_detail",
      { runId: runs[0].id },
    );
    expect(detail.id).toBe(runs[0].id);
    expect(Array.isArray(detail.api_calls)).toBe(true);

    const saved = await mockInvoke<{ land_registry_data?: Record<string, unknown> }>("get_case", {
      id: created.id,
    });
    expect(saved.land_registry_data).toMatchObject({
      formal_registry_run_id: expect.any(String),
      formal_registry_json: expect.objectContaining({
        building_registry: expect.objectContaining({ success: true }),
      }),
      confirmed_registry_match: expect.objectContaining({
        section_name: "富強段",
        land_no: "00700000",
        building_no: "00165000",
      }),
    });
  });

  it("returns parcel-specific formal mock data for confirmed building keys", async () => {
    await mockInvoke("land_registry_set_api_key", {
      clientId: "customer-org-client",
      clientSecret: "customer-org-secret",
    });
    const created = await mockInvoke<{ id: string }>("create_case", {
      input: {
        address: "台南市東區裕農路288巷17號8樓之1",
        property_type: "residential",
        owner_name: "余啟彰",
      },
    });
    await mockInvoke("confirm_case_registry_match", {
      caseId: created.id,
      sectionName: "富強段",
      landNo: "00700000",
      buildingNo: "00204000",
    });

    const result = await mockInvoke<{
      results: Record<string, { success: boolean; data: Record<string, unknown> }>;
      total_cost: number;
    }>("land_registry_formal_pull_data", {
      caseId: created.id,
      apiIds: ["building_registry", "building_ownership"],
    });

    expect(result.total_cost).toBe(20);
    expect(result.results.building_registry.data).toMatchObject({
      building_number: "00204000",
      building_area: 83.61,
      building_purpose: "住家用",
      construction_date: "0800829",
      building_floor: "八層",
      total_floor_count: "012",
    });
    expect(result.results.building_ownership.data).toMatchObject({
      owner_name: "余啟彰",
    });
  });

  it("blocks building formal APIs when only section and land number are confirmed", async () => {
    await mockInvoke("land_registry_set_api_key", {
      clientId: "customer-org-client",
      clientSecret: "customer-org-secret",
    });

    const created = await mockInvoke<{ id: string }>("create_case", {
      input: {
        address: "台南市永康區勝利段1043-0002",
        property_type: "land",
      },
    });

    await expect(
      mockInvoke("confirm_case_registry_match", {
        caseId: created.id,
        sectionName: "勝利段",
        landNo: "10430002",
      }),
    ).resolves.toMatchObject({
      success: true,
      match: expect.objectContaining({
        building_no: null,
      }),
    });

    await expect(
      mockInvoke("land_registry_formal_pull_data", {
        caseId: created.id,
        apiIds: ["building_registry"],
      }),
    ).rejects.toThrow("registry_match_required");

    await expect(
      mockInvoke("land_registry_formal_pull_data", {
        caseId: created.id,
        apiIds: ["land_registry"],
      }),
    ).resolves.toMatchObject({
      cache_hit: false,
      total_cost: 10,
    });
  });

  it("blocks formal COP for registry_pending and mock discovery candidates without API call rows", async () => {
    await mockInvoke("land_registry_set_api_key", {
      clientId: "customer-org-client",
      clientSecret: "customer-org-secret",
    });

    const pendingCase = await mockInvoke<{ id: string }>("create_case", {
      input: {
        address: "台南市永康區勝利街58巷4號",
        property_type: "residential",
        land_lot_no: "",
        land_lots: [],
        land_registry_data: {
          registry_status: "registry_pending",
          candidate_options: [
            {
              source: "mock",
              trusted_for_pdf: false,
              section_name: "0001",
              land_no: "0001",
              building_no: "0001",
            },
          ],
        },
      },
    });
    const runsBefore = await mockInvoke<Array<{ api_calls: unknown[]; total_cost_cents: number }>>(
      "list_registry_query_runs",
      {},
    );

    await expect(
      mockInvoke("land_registry_formal_pull_data", {
        caseId: pendingCase.id,
        apiIds: ["building_registry", "building_ownership"],
      }),
    ).rejects.toThrow("registry_match_required");

    const runsAfter = await mockInvoke<Array<{ api_calls: unknown[]; total_cost_cents: number }>>(
      "list_registry_query_runs",
      {},
    );
    expect(runsAfter).toHaveLength(runsBefore.length);
    expect(runsAfter.every((run) => run.total_cost_cents === 0 || run.api_calls.length > 0)).toBe(true);
  });

  it("records formal credential errors with zero cost and no API call rows", async () => {
    const created = await mockInvoke<{ id: string }>("create_case", {
      input: {
        address: "台南市東區裕農路288巷17號8樓之1",
        property_type: "residential",
        land_lot_no: "00700000",
      },
    });
    await mockInvoke("confirm_case_registry_match", {
      caseId: created.id,
      sectionName: "富強段",
      landNo: "00700000",
      buildingNo: "00165000",
    });

    await expect(
      mockInvoke("land_registry_formal_pull_data", {
        caseId: created.id,
        apiIds: ["building_registry"],
      }),
    ).rejects.toThrow("cop_credential_required");

    const runs = await mockInvoke<Array<{
      error_code: string | null;
      error_message: string | null;
      total_cost_cents: number;
      api_calls: unknown[];
    }>>("list_registry_query_runs", {});
    expect(runs[0]).toMatchObject({
      error_code: "cop_credential_required",
      total_cost_cents: 0,
      api_calls: [],
    });
    expect(runs[0].error_message).toContain("地政查詢帳號");
  });

  it("rejects unconfirmed formal states in the backend before paid lookup", async () => {
    await mockInvoke("land_registry_set_api_key", {
      clientId: "customer-org-client",
      clientSecret: "customer-org-secret",
    });
    const scenarios = [
      {
        registry_status: "candidate_selection_required",
        candidate_options: [
          { section_name: "富強段", land_no: "00700000", building_no: "00165000" },
          { section_name: "富強段", land_no: "00700000", building_no: "00167000" },
        ],
      },
      {
        registry_status: "manual_required",
        correction_suggestions: ["苓雅二路"],
      },
      {
        registry_status: "registry_pending",
        missing_registry_fields: ["地段", "地號", "建號"],
      },
    ];

    const before = await mockInvoke<Array<{ total_cost_cents: number; api_calls: unknown[] }>>(
      "list_registry_query_runs",
      {},
    );
    for (const landRegistryData of scenarios) {
      const created = await mockInvoke<{ id: string }>("create_case", {
        input: {
          address: "高雄市苓雅區苓雅路二段18巷8弄2號",
          property_type: "residential",
          land_lot_no: "00700000",
          land_lots: ["00700000"],
          land_registry_data: landRegistryData,
        },
      });
      await expect(
        mockInvoke("land_registry_formal_pull_data", {
          caseId: created.id,
          apiIds: ["building_registry"],
        }),
      ).rejects.toThrow("registry_match_required");
    }
    const after = await mockInvoke<Array<{ total_cost_cents: number; api_calls: unknown[] }>>(
      "list_registry_query_runs",
      {},
    );
    expect(after).toHaveLength(before.length);
  });

  it("logs paid address resolver separately as candidate evidence", async () => {
    await mockInvoke("land_registry_set_api_key", {
      clientId: "customer-org-client",
      clientSecret: "customer-org-secret",
    });
    const result = await mockInvoke<{
      run_id: string;
      candidates: Array<{ building_number: string; confirmation_state: string }>;
      total_cost_cents: number;
    }>("land_registry_paid_address_resolver", {
      address: "台南市東區裕農路288巷17號8樓之1",
    });

    expect(result.total_cost_cents).toBe(3000);
    expect(result.candidates).toHaveLength(2);
    expect(result.candidates.every((candidate) => candidate.confirmation_state === "unconfirmed")).toBe(true);

    const detail = await mockInvoke<{
      id: string;
      match_status: string;
      total_cost_cents: number;
      candidate_json: { run_type?: string };
      api_calls: Array<{ service_code: string; cost_cents: number }>;
      cop_response_json: unknown;
    }>("get_registry_query_run_detail", { runId: result.run_id });
    expect(detail.match_status).toBe("candidate");
    expect(detail.candidate_json.run_type).toBe("paid_address_resolver");
    expect(detail.total_cost_cents).toBe(3000);
    expect(detail.api_calls).toEqual([
      expect.objectContaining({ service_code: "MOI_API_037", cost_cents: 3000 }),
    ]);
    expect(detail.cop_response_json).toBeNull();
  });

  it("returns drillable billing rows with registry object type and saved run id", async () => {
    await mockInvoke("land_registry_set_api_key", {
      clientId: "customer-org-client",
      clientSecret: "customer-org-secret",
    });
    const result = await mockInvoke<{ run_id: string }>("land_registry_paid_address_resolver", {
      address: "高雄市苓雅區苓雅路二段18巷8弄2號",
    });

    const rows = await mockInvoke<Array<{
      run_id?: string;
      object_type?: string;
      object_type_label?: string;
      service_name: string;
      target: string;
      transaction_id: string;
      cost: number;
    }>>("land_registry_list_billing_entries", {});

    expect(rows).toEqual([
      expect.objectContaining({
        run_id: result.run_id,
        object_type: "address",
        object_type_label: "門牌",
        service_name: "MOI_API_037",
        target: "高雄市苓雅區苓雅路二段18巷8弄2號",
        transaction_id: expect.stringMatching(/^tx-resolver-/),
        cost: 30,
      }),
    ]);
  });

  it("allows formal pull only after a paid resolver candidate is selected and confirmed", async () => {
    await mockInvoke("land_registry_set_api_key", {
      clientId: "customer-org-client",
      clientSecret: "customer-org-secret",
    });
    const created = await mockInvoke<{ id: string }>("create_case", {
      input: {
        address: "台南市東區裕農路288巷17號8樓之1",
        property_type: "residential",
        land_lot_no: "",
        land_lots: [],
        land_registry_data: {
          registry_status: "registry_pending",
          missing_registry_fields: ["地段", "地號", "建號"],
        },
      },
    });
    const resolver = await mockInvoke<{
      candidates: Array<{ section_name?: string; lot_number: string; building_number: string }>;
    }>("land_registry_paid_address_resolver", {
      address: "台南市東區裕農路288巷17號8樓之1",
    });

    await expect(
      mockInvoke("land_registry_formal_pull_data", {
        caseId: created.id,
        apiIds: ["building_registry", "building_ownership"],
      }),
    ).rejects.toThrow("registry_match_required");

    const selected = resolver.candidates[1];
    await mockInvoke("confirm_case_registry_match", {
      caseId: created.id,
      sectionName: selected.section_name,
      landNo: selected.lot_number,
      buildingNo: selected.building_number,
    });

    await expect(
      mockInvoke("land_registry_formal_pull_data", {
        caseId: created.id,
        apiIds: ["building_registry", "building_ownership"],
      }),
    ).resolves.toMatchObject({
      cache_hit: false,
      total_cost: 20,
    });
  });

  it("records local Web discovery diagnostics without treating 勝利街 as fake success", async () => {
    const result = await mockInvoke<Array<{ source: string }>>("land_registry_address_lookup", {
      address: "台南市永康區勝利街58巷4號",
    });

    expect(result).toEqual([]);
    const runs = await mockInvoke<Array<{
      source_input: string;
      candidate_json: Record<string, unknown>;
      total_cost_cents: number;
      error_code: string | null;
    }>>("list_registry_query_runs", {});
    expect(runs[0]).toMatchObject({
      source_input: "台南市永康區勝利街58巷4號",
      total_cost_cents: 0,
      error_code: "address_discovery_unavailable",
      candidate_json: expect.objectContaining({
        status: "manual_required",
        candidates: [],
      }),
    });
  });

  it("returns explicit dev fixture candidates for local E2E without marking them PDF-trusted", async () => {
    const result = await mockInvoke<Array<{
      parcel_id: string;
      source: string;
      trusted_for_pdf: boolean;
    }>>("land_registry_address_lookup", {
      address: "台南市東區裕農路288巷17號8樓之1",
    });

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          parcel_id: "DC-1556-00165000",
          source: "dev_fixture",
          trusted_for_pdf: false,
        }),
      ]),
    );
  });

  it("parses R02 desktop helper text into zero-cost candidate JSON", async () => {
    const run = await mockInvoke<{
      adapter: string;
      parser_version: string;
      total_cost_cents: number;
      candidates: Array<{
        section_code: string | null;
        section_name: string | null;
        building_no: string | null;
        building_area_sqm: string | null;
        main_use: string | null;
      }>;
    }>("land_registry_parse_r02_result_text", {
      inputAddress: "台南市東區裕農路288巷17號8樓之1",
      textOrHtml: `
        查詢結果
        行政區 臺南市 東區
        地政事務所 東南地政事務所
        地段 1556 富強段
        建號 00204000
        建物面積 83.61 平方公尺
        樓層數 012
        樓層別 八層
        建物完成日期 0800829 (屋齡:約 34年)
        主要用途 住家用
      `,
    });

    expect(run.adapter).toBe("easymap_r02_desktop");
    expect(run.parser_version).toBe("r02-text-v1");
    expect(run.total_cost_cents).toBe(0);
    expect(run.candidates[0]).toMatchObject({
      section_code: "1556",
      section_name: "富強段",
      building_no: "00204000",
      building_area_sqm: "83.61",
      main_use: "住家用",
    });
  });

  it("records R02 desktop helper parse results into query runs", async () => {
    const created = await mockInvoke<{ id: string }>("create_case", {
      input: {
        address: "台南市東區裕農路288巷17號8樓之1",
        property_type: "residential",
      },
    });

    const recorded = await mockInvoke<{ run_id: string; ok: boolean }>(
      "land_registry_record_r02_result_text",
      {
        caseId: created.id,
        inputAddress: "台南市東區裕農路288巷17號8樓之1",
        textOrHtml: `
          行政區 臺南市 東區
          地政事務所 東南地政事務所
          地段 1556 富強段
          建號 00204000
          主要用途 住家用
        `,
      },
    );

    expect(recorded.ok).toBe(true);

    const detail = await mockInvoke<{
      id: string;
      case_id: string | null;
      total_cost_cents: number;
      candidate_json: Record<string, unknown> | null;
    }>("get_registry_query_run_detail", { runId: recorded.run_id });

    expect(detail).toMatchObject({
      id: recorded.run_id,
      case_id: created.id,
      total_cost_cents: 0,
    });
    expect(detail.candidate_json).toMatchObject({
      adapter: "easymap_r02_desktop",
    });
  });

  it("blocks formal lookup when trial is expired", async () => {
    const created = await mockInvoke<{ id: string }>("create_case", {
      input: {
        address: "台南市東區裕農路288巷17號8樓之1",
        property_type: "residential",
        land_lot_no: "00700000",
      },
    });
    await mockInvoke("confirm_case_registry_match", {
      caseId: created.id,
      sectionName: "富強段",
      landNo: "00700000",
      buildingNo: "00165000",
    });
    await expect(
      mockInvoke("set_trial_status", {
        status: "expired",
      }),
    ).resolves.toMatchObject({ success: true });

    await expect(
      mockInvoke("land_registry_formal_pull_data", {
        caseId: created.id,
        apiIds: ["building_registry"],
      }),
    ).rejects.toThrow("trial_expired");
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
      redirect_url: "https://opcos.me/products/aire?intent=request-access",
    });
  });

  it("returns default feature flags", async () => {
    await expect(mockInvoke("get_feature_flags")).resolves.toEqual([
      { id: "google-map", name: "Google 地圖", enabled: false },
      { id: "aerial-photo", name: "空拍圖", enabled: false },
      { id: "street-view-reference", name: "街景參考", enabled: false },
      { id: "ai-floor-plan", name: "AI 格局圖整理", enabled: false },
      { id: "cadastral-map", name: "地籍圖整理", enabled: false },
      { id: "premium_real_price_enabled", name: "實價登錄", enabled: false },
    ]);
  });

  it("toggles feature flag enabled state", async () => {
    await expect(
      mockInvoke("toggle_feature_flag", {
        id: "premium_real_price_enabled",
      }),
    ).resolves.toEqual({ success: true, enabled: true });

    await expect(
      mockInvoke<Array<{ id: string; enabled: boolean }>>("get_feature_flags"),
    ).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "premium_real_price_enabled", enabled: true })]),
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

  it("persists case supplement drafts via localStorage and restores after reload", async () => {
    await expect(
      mockInvoke("save_workbench_supplement", {
        caseId: "case-1",
        fieldVisitAnswers: [
          {
            topic: "建物現況",
            answer: "屋主表示客廳牆角曾有滲水，已修繕。",
            status: "已確認",
          },
        ],
        registrySupplements: [
          {
            fieldName: "門牌查詢建號",
            value: "勝利段 58 建號",
            source: "人工輸入",
            status: "已補",
          },
        ],
        uploads: [{ slot: "地籍圖", fileName: "cadastral-map.pdf" }],
        supplementAdded: true,
      }),
    ).resolves.toEqual({ success: true });

    const reloaded = new MockStore();
    await expect(
      reloaded.invoke("get_workbench_supplement", { caseId: "case-1" }),
    ).resolves.toMatchObject({
      caseId: "case-1",
      fieldVisitAnswers: [
        expect.objectContaining({
          topic: "建物現況",
          answer: "屋主表示客廳牆角曾有滲水，已修繕。",
          status: "已確認",
        }),
      ],
      registrySupplements: [
        expect.objectContaining({
          fieldName: "門牌查詢建號",
          value: "勝利段 58 建號",
          source: "人工輸入",
          status: "已補",
          updatedAt: expect.any(String),
        }),
      ],
      uploads: [expect.objectContaining({ slot: "地籍圖", fileName: "cadastral-map.pdf" })],
      supplementAdded: true,
    });
  });

  it("persists profile settings and records password update state without saving raw password", async () => {
    await expect(
      mockInvoke("save_profile_settings", {
        name: "王小明",
        email: "wang@example.com",
        brandColor: "#008577",
        logoName: "logo.png",
      }),
    ).resolves.toEqual({ success: true });

    await expect(
      mockInvoke("update_profile_password", {
        currentPassword: "old-password",
        newPassword: "new-password",
      }),
    ).resolves.toMatchObject({ success: true, passwordUpdatedAt: expect.any(String) });

    const reloaded = new MockStore();
    await expect(reloaded.invoke("get_profile_settings")).resolves.toMatchObject({
      name: "王小明",
      email: "wang@example.com",
      brandColor: "#008577",
      logoName: "logo.png",
      passwordUpdatedAt: expect.any(String),
    });

    expect(window.localStorage.getItem("aire-mock-store")).not.toContain("new-password");
    expect(window.localStorage.getItem("aire-mock-store")).not.toContain("old-password");
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

  it("records operation logs for case creation", async () => {
    await mockInvoke("create_case", {
      input: {
        address: "台北市信義區信義路五段 7 號",
        property_type: "residential",
      },
    });

    const logs = await mockInvoke<
      Array<{ id: string; timestamp: string; action: string; detail: string; user_email: string }>
    >("list_logs");

    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({
      action: "建立案件",
      detail: expect.stringContaining("台北市信義區信義路五段 7 號"),
      user_email: "system@local",
    });
    expect(isUuid(logs[0].id)).toBe(true);
    expect(logs[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
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
