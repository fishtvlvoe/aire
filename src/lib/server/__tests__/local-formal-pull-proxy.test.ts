import { afterEach, describe, expect, it, vi } from "vitest";

import { pullFormalRegistryLocally } from "@/lib/server/local-formal-pull-proxy";

describe("pullFormalRegistryLocally", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("uses office_code and section_code for COP payload instead of sending land_no as sec", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "token-001" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            STATUS: 1,
            RESPONSE: [{ BLDGREG: { NO: "07193000" } }],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      );

    await pullFormalRegistryLocally({
      caseId: "case-001",
      apiIds: ["building_registry"],
      clientId: "cid",
      secret: "sec",
      target: {
        office_code: "OA",
        section_code: "0052",
        section_name: "武陵段",
        land_no: "07192000",
        building_no: "07193000",
        registry_key: "OA-0052-07193000",
      },
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy.mock.calls[0][1]?.headers).toMatchObject({
      "Content-Type": "application/json; charset=utf-8",
    });
    expect(fetchSpy.mock.calls[1][1]?.headers).toMatchObject({
      Authorization: "Bearer token-001",
    });
    const [, init] = fetchSpy.mock.calls[1];
    expect(JSON.parse(String(init?.body))).toEqual([
      expect.objectContaining({
        unit: "OA",
        sec: "0052",
        no: "07193000",
      }),
    ]);
  });

  it("normalizes building registry and ownership payloads into PDF-ready fields", async () => {
    vi.stubEnv("LAND_REGISTRY_TOKEN_ENDPOINT", "");
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            STATUS: 1,
            RESPONSE: [{
              BLDGREG: {
                AREA: "84.13",
                MAINAREA: "70.00",
                PURPOSE: "住家用",
                MATERIAL: "鋼筋混凝土造",
                BUILDINGFLOOR: "八層",
                COMPLETEDATE: "0831018",
                FLOORACC: [{ FAREA_ABAREA: "4.50" }],
                SHAREDAREA: [{ SAREA: "9.63" }],
              },
            }],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            STATUS: 1,
            RESPONSE: [{
              BLDGOWNERSHIP: [{
                OWNER: { LNAME: "蔡國卿" },
                NUMERATOR: "1",
                DENOMINATOR: "1",
                RDATE: "0831213",
              }],
            }],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      );

    const result = await pullFormalRegistryLocally({
      caseId: "case-001",
      apiIds: ["building_registry", "building_ownership"],
      clientId: "cid",
      secret: "sec",
      target: {
        office_code: "OA",
        section_code: "0052",
        land_no: "07192000",
        building_no: "07193000",
      },
    });

    expect(result.results.building_registry.data).toMatchObject({
      area: 84.13,
      main_building_area: 70,
      auxiliary_area: 4.5,
      common_area: 9.63,
      building_purpose: "住家用",
      material: "鋼筋混凝土造",
      building_floor: "八層",
      construction_date: "0831018",
    });
    expect(result.results.building_ownership.data).toMatchObject({
      owner_name: "蔡國卿",
      numerator: "1",
      denominator: "1",
      ownership_date: "0831213",
    });
  });

  it("resolves the official building number by address before paid building registry calls", async () => {
    vi.stubEnv("AIRE_ENABLE_COP_ADDRESS_TO_BUILDING", "1");
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "token-001" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            STATUS: 1,
            RESPONSE: [{
              BLDGREG: {
                UNIT: "DK",
                SEC: "9125",
                NO: "00084000",
                ADDRESS: "勝利里勝利街５８巷４號",
              },
            }],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            STATUS: 1,
            RESPONSE: [{ BLDGREG: { NO: "00084000" } }],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      );

    const result = await pullFormalRegistryLocally({
      caseId: "case-victory",
      apiIds: ["building_registry"],
      address: "台南市永康區勝利街58巷4號",
      clientId: "cid",
      secret: "sec",
      target: {
        office_code: "DK",
        section_code: "9125",
        land_no: "04080000",
        building_no: "00296000",
      },
    });

    expect(result.results.address_to_building).toMatchObject({
      success: true,
      data: expect.objectContaining({
        office_code: "DK",
        section_code: "9125",
        building_number: "00084000",
      }),
    });
    expect(result.total_cost).toBe(1);
    const [, buildingInit] = fetchSpy.mock.calls[2];
    expect(JSON.parse(String(buildingInit?.body))).toEqual([
      expect.objectContaining({
        unit: "DK",
        sec: "9125",
        no: "00084000",
      }),
    ]);
  });

  it("does not send paid building registry calls when address-to-building resolution fails", async () => {
    vi.stubEnv("AIRE_ENABLE_COP_ADDRESS_TO_BUILDING", "1");
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "token-001" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            STATUS: 0,
            CODE: "COP317",
            MESSAGE: "未訂閱門牌查建號服務",
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      );

    const result = await pullFormalRegistryLocally({
      caseId: "case-victory",
      apiIds: ["building_registry"],
      address: "台南市永康區勝利街58巷4號",
      clientId: "cid",
      secret: "sec",
      target: {
        office_code: "DK",
        section_code: "9125",
        land_no: "04080000",
        building_no: "00296000",
      },
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(result.total_cost).toBe(0);
    expect(result.results.address_to_building).toMatchObject({
      success: false,
      error: expect.stringContaining("未訂閱門牌查建號服務"),
    });
    expect(result.results.building_registry).toBeUndefined();
  });

  it("surfaces non-json token endpoint responses with HTTP and body type context", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("<html><head><title>伺服器發生錯誤</title></head><body></body></html>", {
        status: 200,
        headers: { "content-type": "text/html" },
      }),
    );

    await expect(
      pullFormalRegistryLocally({
        caseId: "case-001",
        apiIds: ["building_registry"],
        clientId: "cid",
        secret: "sec",
        target: {
          office_code: "OA",
          section_code: "0052",
          land_no: "07192000",
          building_no: "07193000",
        },
      }),
    ).rejects.toThrow("cop_token_invalid_json_http_200_html_伺服器發生錯誤");
  });
});
