import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  discoverAddressLocally,
  formatEasyMapLandNoForDetail,
  parseEasyMapLandByCoordinatePayload,
  parseEasyMapLandDescriptionHtml,
} from "@/lib/server/local-address-discovery-proxy";
import { mockInvoke } from "@/lib/mock-backend";

vi.mock("@/lib/mock-backend", () => ({
  mockInvoke: vi.fn(),
}));

const mockInvokeFn = vi.mocked(mockInvoke);

describe("local-address-discovery-proxy", () => {
  beforeEach(() => {
    mockInvokeFn.mockReset();
    vi.unstubAllGlobals();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network disabled in unit tests")));
  });

  it("returns manual_required when address is empty", async () => {
    const result = await discoverAddressLocally("   ");

    expect(result).toMatchObject({
      status: "manual_required",
      source: "local_discovery",
      candidates: [],
      total_cost_cents: 0,
    });
    expect(result.errors[0]?.code).toBe("local_proxy_manual_required");
    expect(mockInvokeFn).not.toHaveBeenCalled();
  });

  it("parses EasyMap coordinate lookup payload into a land candidate", () => {
    const parsed = parseEasyMapLandByCoordinatePayload(
      JSON.stringify({
        townName: "永康區",
        cityName: "臺南市",
        townCode: "39",
        cityCode: "D",
        landNo: "414",
        office: "DK",
        sectName: "兵南段",
        exec: "true",
        sectNo: "9125",
      }),
    );

    expect(parsed).toMatchObject({
      cityName: "臺南市",
      townName: "永康區",
      office: "DK",
      sectionCode: "9125",
      sectionName: "兵南段",
      landNo: "04140000",
    });
  });

  it("parses EasyMap land description HTML into building numbers", () => {
    const parsed = parseEasyMapLandDescriptionHtml(`
      <td class="align-middle">9125 兵南段</td>
      <td class="align-middle">04140000</td>
      <button onclick="qtCommon.getBuildDetail('DK','9125','00084000','','build_info2_00084000')">
        00084000建號
      </button>
    `);

    expect(parsed.buildingNumbers).toEqual(["00084000"]);
  });

  it("formats normalized land numbers for EasyMap detail lookup", () => {
    expect(formatEasyMapLandNoForDetail("04140000")).toBe("414");
    expect(formatEasyMapLandNoForDetail("12340002")).toBe("1234-2");
  });

  it("returns live EasyMap R02 candidates without using mock lookup", async () => {
    let detailRequestBody = "";
    let fullDoorRequestBody = "";
    let buildingDetailRequestBody = "";
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/R02/Index")) {
        return new Response("<html></html>", {
          status: 200,
          headers: { "set-cookie": "JSESSIONID=session-1; Path=/R02" },
        });
      }
      if (url.endsWith("/R02/pages/setToken.jsp")) {
        return new Response(`
          <input type="hidden" name="struts.token.name" value="token" />
          <input type="hidden" name="token" value="token-1" />
        `, { status: 200 });
      }
      if (url.endsWith("/R02/City_json_getTownList")) {
        return Response.json([{ id: "01", name: "東區" }]);
      }
      if (url.endsWith("/R02/Door_json_getDoorList")) {
        detailRequestBody = String(init?.body ?? "");
        return Response.json({
          msg: "",
          results: [
            {
              Road: "東和路４７號",
              srcRoad: "東和路４７號",
              buildsectno: "1511",
              buildno: "03033000",
              sectno: "1511,1514",
              landno: "77,78,221-32,277-31",
              towncode: "01",
              office: "DC",
              sectName: "光明段",
              City: "D",
              mergeSameDoorCount: 6,
            },
          ],
        });
      }
      if (url.endsWith("/R02/Door_json_getFullDoorListByA")) {
        fullDoorRequestBody = String(init?.body ?? "");
        return Response.json({
          msg: "",
          results: [
            {
              Road: "東和路４７號二樓",
              srcRoad: "東和路４７號二樓",
              buildsectno: "1511",
              buildno: "03044000",
              sectno: "1511",
              landno: "77",
              towncode: "01",
              office: "DC",
              sectName: "光明段",
              City: "D",
              mergeSameDoorCount: 0,
            },
            {
              Road: "東和路４７號三樓",
              srcRoad: "東和路４７號三樓",
              buildsectno: "1511",
              buildno: "03045000",
              sectno: "1511",
              landno: "77",
              towncode: "01",
              office: "DC",
              sectName: "光明段",
              City: "D",
              mergeSameDoorCount: 0,
            },
          ],
        });
      }
      if (url.endsWith("/R02/BuildingDesc_ajax_detail")) {
        buildingDetailRequestBody = String(init?.body ?? "");
        return new Response(`
          <table>
            <tr><th>行政區</th><td>臺南市 東區</td></tr>
            <tr><th>地政事務所</th><td>東南地政事務所</td></tr>
            <tr><th>地段</th><td>1511 光明段</td></tr>
            <tr><th>建號</th><td>03045000</td></tr>
            <tr><th>建物面積</th><td>98.44 平方公尺</td></tr>
            <tr><th>樓層數</th><td>008</td></tr>
            <tr><th>樓層別</th><td>三層</td></tr>
            <tr><th>建物完成日期</th><td>0810914 (屋齡:約 33年)</td></tr>
            <tr><th>主要用途</th><td>住家用</td></tr>
          </table>
        `, { status: 200 });
      }
      if (url.endsWith("/R02/Map_json_getMapCenter")) {
        return Response.json({ X: 120.22908, Y: 22.986314 });
      }
      return new Response("not found", { status: 404 });
    }));

    const result = await discoverAddressLocally("台南市東區東和路47號3樓");

    expect(result.status).toBe("candidate_found");
    expect(result.normalizedAddress).toBe("台南市東區東和路47號3樓");
    expect(result.trustedForPdf).toBe(false);
    expect(result.totalCostCents).toBe(0);
    expect(result.candidates).toEqual([
      expect.objectContaining({
        parcel_id: "DC-1511-03045000",
        lot_number: "00770000",
        building_number: "03045000",
        section_name: "光明段",
        section_code: "1511",
        land_office: "DC",
        source: "easymap_r02",
        trusted_for_pdf: false,
        discovery_confidence: "high",
        object_type: "building",
        confirmation_state: "unconfirmed",
        building_area_sqm: "98.44",
        total_floor_count: "008",
        floor_label: "三層",
        completion_date_roc: "0810914",
        age_years: "33",
        main_use: "住家用",
        lat: 22.986314,
        lng: 120.22908,
      }),
    ]);
    expect(result.requiresCandidateSelection).toBe(false);
    expect(result.candidateSelection).toEqual({
      state: "not_required",
      selectedRegistryKey: null,
    });
    expect(decodeURIComponent(detailRequestBody)).toContain("road=東和路");
    expect(decodeURIComponent(detailRequestBody)).toContain("no=47");
    expect(decodeURIComponent(fullDoorRequestBody)).toContain("doorPlate=東和路４７號");
    expect(decodeURIComponent(buildingDetailRequestBody)).toContain("buildingNo=03045000");
    expect(mockInvokeFn).not.toHaveBeenCalledWith("land_registry_address_lookup", expect.anything());
  });

  it("routes land descriptor input through section and land-number discovery instead of doorplate discovery", async () => {
    const requestedPaths: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      requestedPaths.push(new URL(url).pathname);
      if (url.endsWith("/R02/Index")) {
        return new Response("<html></html>", { status: 200 });
      }
      if (url.endsWith("/R02/pages/setToken.jsp")) {
        return new Response(`<input type="hidden" name="token" value="token-1" />`, { status: 200 });
      }
      if (url.endsWith("/R02/City_json_getTownList")) {
        return Response.json([{ id: "39", name: "永康區" }]);
      }
      if (url.endsWith("/R02/City_json_getSectionList")) {
        return Response.json({
          sections: [
            {
              cityName: "臺南市",
              townName: "永康區",
              cityCode: "D",
              townCode: "39",
              office: "DK",
              sectNo: "1043",
              sectName: "勝利段",
            },
          ],
        });
      }
      if (url.endsWith("/R02/Land_json_locate")) {
        return Response.json({
          exec: "true",
          cityName: "臺南市",
          townName: "永康區",
          cityCode: "D",
          townCode: "39",
          office: "DK",
          sectNo: "1043",
          sectName: "勝利段",
          landNo: "1043-0002",
        });
      }
      if (url.endsWith("/R02/LandDesc_ajax_detail")) {
        return new Response(`<table><tr><td>1043 勝利段</td><td>10430002</td></tr></table>`, { status: 200 });
      }
      return new Response("not found", { status: 404 });
    }));

    const result = await discoverAddressLocally("台南市永康區勝利段1043-0002");

    expect(requestedPaths).toContain("/R02/City_json_getSectionList");
    expect(requestedPaths).toContain("/R02/City_json_getTownList");
    expect(requestedPaths).toContain("/R02/Land_json_locate");
    expect(requestedPaths).toContain("/R02/LandDesc_ajax_detail");
    expect(requestedPaths).not.toContain("/R02/Door_json_getDoorList");
    expect(result).toMatchObject({
      status: "candidate_found",
      inputKind: "land_descriptor",
      intendedObjectType: "land",
      parsedInput: {
        sectionName: "勝利段",
        landNumber: "1043-0002",
      },
      candidates: [
        {
          parcel_id: "DK-1043-10430002",
          lot_number: "10430002",
          building_number: "",
          section_name: "勝利段",
          section_code: "1043",
          source: "easymap_r02",
          trusted_for_pdf: false,
          discovery_confidence: "high",
          object_type: "land",
          confirmation_state: "unconfirmed",
        },
      ],
    });
  });

  it("uses R02 section lookup and keeps parcel number 70 as landNo=70 for 富強段", async () => {
    let sectionRequestBody = "";
    let landDetailRequestBody = "";
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/R02/Index")) {
        return new Response("<html></html>", { status: 200 });
      }
      if (url.endsWith("/R02/pages/setToken.jsp")) {
        return new Response(`<input type="hidden" name="token" value="token-1" />`, { status: 200 });
      }
      if (url.endsWith("/R02/City_json_getTownList")) {
        return Response.json([{ id: "01", name: "東區" }]);
      }
      if (url.endsWith("/R02/City_json_getSectionList")) {
        sectionRequestBody = String(init?.body ?? "");
        return Response.json([{ id: "1556", name: "富強段", officeCode: "DC" }]);
      }
      if (url.endsWith("/R02/Land_json_locate")) {
        return Response.json({
          exec: "true",
          cityName: "臺南市",
          townName: "東區",
          cityCode: "D",
          townCode: "01",
          office: "DC",
          sectNo: "1556",
          sectName: "富強段",
          landNo: "70",
        });
      }
      if (url.endsWith("/R02/LandDesc_ajax_detail")) {
        landDetailRequestBody = String(init?.body ?? "");
        return new Response(`
          <table>
            <tr><th>地段</th><td>1556 富強段</td></tr>
            <tr><th>地號</th><td>00700000</td></tr>
            <tr><th>面積</th><td>1655.78 平方公尺</td></tr>
            <tr><th>公告土地現值</th><td>45500 元/平方公尺</td></tr>
            <tr><th>公告土地地價</th><td>9100 元/平方公尺</td></tr>
          </table>
        `, { status: 200 });
      }
      return new Response("not found", { status: 404 });
    }));

    const result = await discoverAddressLocally("台南市東區富強段70地號");

    expect(decodeURIComponent(sectionRequestBody)).toContain("area=01");
    expect(decodeURIComponent(landDetailRequestBody)).toContain("landNo=70");
    expect(decodeURIComponent(landDetailRequestBody)).not.toContain("landNo=00070000");
    expect(result).toMatchObject({
      status: "candidate_found",
      inputKind: "land_descriptor",
      intendedObjectType: "land",
      candidates: [
        {
          parcel_id: "DC-1556-00700000",
          lot_number: "00700000",
          building_number: "",
          section_name: "富強段",
          section_code: "1556",
          object_type: "land",
          land_area_sqm: "1655.78",
          announced_land_current_value: "45500",
          announced_land_value: "9100",
        },
      ],
    });
  });

  it("keeps land descriptor input as a land candidate even when land detail contains building links", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/R02/Index")) {
        return new Response("<html></html>", { status: 200 });
      }
      if (url.endsWith("/R02/pages/setToken.jsp")) {
        return new Response(`<input type="hidden" name="token" value="token-1" />`, { status: 200 });
      }
      if (url.endsWith("/R02/City_json_getTownList")) {
        return Response.json([{ id: "39", name: "永康區" }]);
      }
      if (url.endsWith("/R02/City_json_getSectionList")) {
        return Response.json({
          sections: [
            {
              cityName: "臺南市",
              townName: "永康區",
              cityCode: "D",
              townCode: "39",
              office: "DK",
              sectNo: "1043",
              sectName: "勝利段",
            },
          ],
        });
      }
      if (url.endsWith("/R02/Land_json_locate")) {
        return Response.json({
          exec: "true",
          cityName: "臺南市",
          townName: "永康區",
          cityCode: "D",
          townCode: "39",
          office: "DK",
          sectNo: "1043",
          sectName: "勝利段",
          landNo: "1043-0002",
        });
      }
      if (url.endsWith("/R02/LandDesc_ajax_detail")) {
        return new Response(`
          <button onclick="qtCommon.getBuildDetail('DK','1043','01218000','','build_info2_01218000')">01218000建號</button>
          <button onclick="qtCommon.getBuildDetail('DK','1043','01219000','','build_info2_01219000')">01219000建號</button>
        `, { status: 200 });
      }
      return new Response("not found", { status: 404 });
    }));

    const result = await discoverAddressLocally("台南市永康區勝利段1043-0002");

    expect(result).toMatchObject({
      status: "candidate_found",
      inputKind: "land_descriptor",
      intendedObjectType: "land",
      requiresCandidateSelection: false,
      candidateSelection: {
        state: "not_required",
        selectedRegistryKey: null,
      },
    });
    expect(result.candidates).toEqual([
      expect.objectContaining({
        parcel_id: "DK-1043-10430002",
        lot_number: "10430002",
        building_number: "",
        object_type: "land",
        confirmation_state: "unconfirmed",
      }),
    ]);
    expect(result).not.toHaveProperty("confirmed_registry_match");
    expect(mockInvokeFn).not.toHaveBeenCalledWith("land_registry_formal_pull_data", expect.anything());
  });

  it("keeps a land candidate and records diagnostics when land detail lookup is denied", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/R02/Index")) {
        return new Response("<html></html>", { status: 200 });
      }
      if (url.endsWith("/R02/pages/setToken.jsp")) {
        return new Response(`<input type="hidden" name="token" value="token-1" />`, { status: 200 });
      }
      if (url.endsWith("/R02/City_json_getTownList")) {
        return Response.json([{ id: "39", name: "永康區" }]);
      }
      if (url.endsWith("/R02/City_json_getSectionList")) {
        return Response.json({
          sections: [
            {
              cityName: "臺南市",
              townName: "永康區",
              cityCode: "D",
              townCode: "39",
              office: "DK",
              sectNo: "1043",
              sectName: "勝利段",
            },
          ],
        });
      }
      if (url.endsWith("/R02/Land_json_locate")) {
        return Response.json({
          exec: "true",
          cityName: "臺南市",
          townName: "永康區",
          cityCode: "D",
          townCode: "39",
          office: "DK",
          sectNo: "1043",
          sectName: "勝利段",
          landNo: "1043-0002",
        });
      }
      if (url.endsWith("/R02/LandDesc_ajax_detail")) {
        return new Response("PERMISSION DENIED", { status: 403 });
      }
      return new Response("not found", { status: 404 });
    }));

    const result = await discoverAddressLocally("台南市永康區勝利段1043-0002");

    expect(result).toMatchObject({
      status: "candidate_found",
      inputKind: "land_descriptor",
      intendedObjectType: "land",
      candidates: [
        {
          parcel_id: "DK-1043-10430002",
          lot_number: "10430002",
          building_number: "",
          object_type: "land",
          confirmation_state: "unconfirmed",
        },
      ],
      errors: [
        {
          source: "easymap_r02",
          code: "easymap_permission_denied",
        },
      ],
    });
    expect(result.totalCostCents).toBe(0);
    expect(result.requiresCandidateSelection).toBe(false);
    expect(mockInvokeFn).not.toHaveBeenCalledWith("land_registry_formal_pull_data", expect.anything());
  });

  it("marks multiple building candidates as requiring one selected target before COP", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/R02/Index")) {
        return new Response("<html></html>", { status: 200 });
      }
      if (url.endsWith("/R02/pages/setToken.jsp")) {
        return new Response(`<input type="hidden" name="token" value="token-1" />`, { status: 200 });
      }
      if (url.endsWith("/R02/City_json_getTownList")) {
        return Response.json([{ id: "01", name: "東區" }]);
      }
      if (url.endsWith("/R02/Door_json_getDoorList")) {
        return Response.json({
          msg: "",
          results: [
            {
              Road: "裕農路２８８巷１７號",
              srcRoad: "裕農路２８８巷１７號",
              buildsectno: "1556",
              buildno: "00201000",
              sectno: "1556",
              landno: "70",
              towncode: "01",
              office: "DC",
              sectName: "富強段",
              City: "D",
              mergeSameDoorCount: 2,
            },
          ],
        });
      }
      if (url.endsWith("/R02/BuildingDesc_ajax_detail")) {
        return new Response(`
          <table>
            <tr><th>地段</th><td>1556 富強段</td></tr>
            <tr><th>建號</th><td>${String(init?.body ?? "").includes("00204001") ? "00204001" : "00204000"}</td></tr>
          </table>
        `, { status: 200 });
      }
      if (url.endsWith("/R02/Door_json_getFullDoorListByA")) {
        return Response.json({
          msg: "",
          results: [
            {
              Road: "裕農路２８８巷１７號八樓",
              srcRoad: "裕農路２８８巷１７號八樓",
              buildsectno: "1556",
              buildno: "00204000",
              sectno: "1556",
              landno: "70",
              towncode: "01",
              office: "DC",
              sectName: "富強段",
              City: "D",
              mergeSameDoorCount: 0,
            },
            {
              Road: "裕農路２８８巷１７號九樓",
              srcRoad: "裕農路２８８巷１７號九樓",
              buildsectno: "1556",
              buildno: "00204001",
              sectno: "1556",
              landno: "70",
              towncode: "01",
              office: "DC",
              sectName: "富強段",
              City: "D",
              mergeSameDoorCount: 0,
            },
          ],
        });
      }
      return new Response("not found", { status: 404 });
    }));

    const result = await discoverAddressLocally("台南市東區裕農路288巷17號");

    expect(result.status).toBe("candidate_found");
    expect(result.requiresCandidateSelection).toBe(true);
    expect(result.candidateSelection).toEqual({
      state: "required",
      selectedRegistryKey: null,
    });
    expect(result).not.toHaveProperty("confirmed_registry_match");
    expect(result.candidates).toEqual([
      expect.objectContaining({
        parcel_id: "DC-1556-00204000",
        discovery_confidence: "needs_selection",
        object_type: "building",
        confirmation_state: "unconfirmed",
      }),
      expect.objectContaining({
        parcel_id: "DC-1556-00204001",
        discovery_confidence: "needs_selection",
        object_type: "building",
        confirmation_state: "unconfirmed",
      }),
    ]);
  });

  it("returns correction suggestions without confirming or starting paid COP for suspected road typos", async () => {
    mockInvokeFn.mockResolvedValueOnce([]);
    const requestedPaths: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      requestedPaths.push(new URL(url).pathname);
      if (url.endsWith("/R02/Index")) {
        return new Response("<html></html>", { status: 200 });
      }
      if (url.endsWith("/R02/pages/setToken.jsp")) {
        return new Response(`<input type="hidden" name="token" value="token-1" />`, { status: 200 });
      }
      if (url.endsWith("/R02/City_json_getTownList")) {
        return Response.json([{ id: "01", name: "苓雅區" }]);
      }
      if (url.endsWith("/R02/Door_json_getDoorList")) {
        return new Response("", { status: 200 });
      }
      return new Response("not found", { status: 404 });
    }));

    const result = await discoverAddressLocally("高雄市苓雅區苓雅路二段18巷8弄2號");

    expect(result).toMatchObject({
      status: "manual_required",
      candidates: [],
      inputKind: "doorplate",
      intendedObjectType: "building",
      requiresCandidateSelection: false,
      suggestedCorrections: [
        {
          from: "苓雅路二段",
          to: "苓雅二路",
          reason: "suspected_kaohsiung_road_order_typo",
        },
      ],
      totalCostCents: 0,
      total_cost_cents: 0,
    });
    expect(requestedPaths).toContain("/R02/Door_json_getDoorList");
    expect(mockInvokeFn).not.toHaveBeenCalledWith("land_registry_formal_pull_data", expect.anything());
  });

  it("does not use the first nearby doorplate result when no exact doorplate matches", async () => {
    mockInvokeFn.mockResolvedValueOnce([]);
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/R02/Index")) {
        return new Response("<html></html>", { status: 200 });
      }
      if (url.endsWith("/R02/pages/setToken.jsp")) {
        return new Response(`<input type="hidden" name="token" value="token-1" />`, { status: 200 });
      }
      if (url.endsWith("/R02/Door_json_getDoorList")) {
        return new Response(`
          <a role="result" data-road="高雄市苓雅區苓雅里１２鄰苓雅二路１８９巷２號">高雄市苓雅區苓雅里１２鄰苓雅二路１８９巷２號</a>
        `, { status: 200 });
      }
      return new Response("not found", { status: 404 });
    }));

    const result = await discoverAddressLocally("高雄市苓雅區苓雅二路18巷8弄2號");

    expect(result.status).toBe("manual_required");
    expect(result.candidates).toEqual([]);
    expect(result.requiresCandidateSelection).toBe(false);
    expect(result.totalCostCents).toBe(0);
    expect(mockInvokeFn).not.toHaveBeenCalledWith("land_registry_formal_pull_data", expect.anything());
  });

  it("does not return mock or dev fixture candidates as trusted local discovery success", async () => {
    mockInvokeFn
      .mockResolvedValueOnce([
        {
          parcel_id: "DC-1556-00165000",
          address: "台南市東區裕農路288巷17號8樓之1",
          lot_number: "00700000",
          building_number: "00165000",
          source: "dev_fixture",
          trusted_for_pdf: true,
        },
        {
          parcel_id: "0001-0001",
          address: "台南市東區裕農路288巷17號8樓之1",
          lot_number: "0001",
          building_number: "0001",
          source: "mock",
          trusted_for_pdf: true,
        },
      ])
      .mockResolvedValueOnce([]);

    const result = await discoverAddressLocally("台南市東區裕農路288巷17號8樓之1");

    expect(result.status).toBe("manual_required");
    expect(result.candidates).toEqual([]);
    expect(result.total_cost_cents).toBe(0);
  });

  it("returns run error when lookup has no trusted candidates", async () => {
    mockInvokeFn.mockResolvedValueOnce([
        {
          source_input: "台南市永康區勝利街58巷4號",
          total_cost_cents: 0,
          candidate_json: {
            errors: [
              {
                source: "local_discovery",
                code: "address_discovery_unavailable",
                message: "需要人工補填資料",
              },
            ],
          },
        },
      ]);

    const result = await discoverAddressLocally("台南市永康區勝利街58巷4號");

    expect(result).toMatchObject({
      status: "manual_required",
      candidates: [],
      total_cost_cents: 0,
      errors: [{ code: "address_discovery_unavailable" }],
    });
    expect(mockInvokeFn).toHaveBeenCalledWith("list_registry_query_runs", {});
  });
});
