import { beforeEach, describe, expect, it } from "vitest";

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

describe("MockStore", () => {
  beforeEach(() => {
    __resetMockStoreForTests();
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
      mockInvoke("activate_license", { serial_key: "ANY-KEY-WORKS" }),
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
});
