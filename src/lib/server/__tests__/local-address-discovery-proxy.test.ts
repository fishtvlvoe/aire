import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
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
        X: 120.232844,
        Y: 23.001624,
      }),
    );

    expect(parsed).toMatchObject({
      cityName: "臺南市",
      townName: "永康區",
      office: "DK",
      sectionCode: "9125",
      sectionName: "兵南段",
      landNo: "04140000",
      lat: 23.001624,
      lng: 120.232844,
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

  it("parses land area and announced values when EasyMap uses verbose row labels", () => {
    const parsed = parseEasyMapLandDescriptionHtml(`
      <table>
        <tr><th>土地面積</th><td>1,655.78 平方公尺</td></tr>
        <tr><th>每平方公尺公告土地現值</th><td>45,500 元</td></tr>
        <tr><th>每平方公尺公告地價</th><td>12,000 元</td></tr>
      </table>
    `);

    expect(parsed.landAreaSqm).toBe("1,655.78");
    expect(parsed.announcedLandCurrentValue).toBe("45,500");
    expect(parsed.announcedLandValue).toBe("12,000");
  });

  it("formats normalized land numbers for EasyMap detail lookup", () => {
    expect(formatEasyMapLandNoForDetail("04140000")).toBe("414");
    expect(formatEasyMapLandNoForDetail("12340002")).toBe("1234-2");
  });

  it("returns live Z10Web candidates for doorplate address without using mock lookup", async () => {
    // 門牌查詢現在走 Z10Web（R02 Door_json_getDoorList 已故障）
    let ajaxListRequestBody = "";
    let jsonDetailRequestBody = "";
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/Z10Web/Normal") || url.endsWith("/Z10Web/")) {
        return new Response("<html></html>", {
          status: 200,
          headers: { "set-cookie": "JSESSIONID=z10session; Path=/Z10Web" },
        });
      }
      if (url.endsWith("/Z10Web/layout/setToken.jsp")) {
        return new Response(`
          <input type="hidden" name="struts.token.name" value="token" />
          <input type="hidden" name="token" value="token-1" />
        `, { status: 200 });
      }
      if (url.endsWith("/Z10Web/HouseholdDoorPlate_ajax_list")) {
        ajaxListRequestBody = String(init?.body ?? "");
        return new Response(`
          <a class="list-group-item" role="result"
             data-city="" data-town="" data-area=""
             data-road="臺南市東區仁里里４鄰東和路４７號"
             href="javascript: void(0);">臺南市東區仁里里４鄰東和路４７號</a>
        `, { status: 200 });
      }
      if (url.endsWith("/Z10Web/HouseholdDoorPlate_json_detail")) {
        jsonDetailRequestBody = String(init?.body ?? "");
        return Response.json({ x: 120.22908, y: 22.986314 });
      }
      if (url.endsWith("/Z10Web/Land_json_getMapImageLayersByCoord")) {
        return Response.json({
          exec: "true",
          cityCode: "D",
          townCode: "01",
          office: "DC",
          sectNo: "1511",
          sectName: "光明段",
          landNo: "77",
          cityName: "臺南市",
          townName: "東區",
          mapImg: JSON.stringify({ EXT: [120.22, 22.98, 120.24, 22.99], IMG: [] }),
        });
      }
      if (url.endsWith("/Z10Web/LandDesc_ajax_detail")) {
        return new Response(`
          <table>
            <tr><th>地段</th><td>1511 光明段</td></tr>
            <tr><th>地號</th><td>00770000</td></tr>
            <tr><th>面積</th><td>256.12 平方公尺</td></tr>
            <tr><th>公告現值</th><td>98000 元/平方公尺</td></tr>
          </table>
        `, { status: 200 });
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
        parcel_id: "DC-1511-00770000",
        lot_number: "00770000",
        section_name: "光明段",
        section_code: "1511",
        land_office: "DC",
        source: "easymap_z10web",
        trusted_for_pdf: false,
        discovery_confidence: "high",
        object_type: "land",
        confirmation_state: "unconfirmed",
        land_area_sqm: "256.12",
        announced_land_current_value: "98000",
      }),
    ]);
    expect(result.requiresCandidateSelection).toBe(false);
    expect(result.candidateSelection).toEqual({
      state: "not_required",
      selectedRegistryKey: null,
    });
    // 確認請求中包含地址解析後的路名和門號
    expect(decodeURIComponent(ajaxListRequestBody)).toContain("roadName=東和路");
    expect(decodeURIComponent(ajaxListRequestBody)).toContain("no=47");
    expect(decodeURIComponent(jsonDetailRequestBody)).toContain("東和路");
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
      errors: expect.arrayContaining([
        {
          source: "easymap_z10web",
          code: "easymap_z10web_fallback_to_r02",
          message: expect.any(String),
        },
        {
          source: "easymap_r02",
          code: "easymap_permission_denied",
          message: expect.any(String),
        },
      ]),
    });
    expect(result.totalCostCents).toBe(0);
    expect(result.requiresCandidateSelection).toBe(false);
    expect(mockInvokeFn).not.toHaveBeenCalledWith("land_registry_formal_pull_data", expect.anything());
  });

  it("returns every Z10Web building number candidate instead of guessing the first one", async () => {
    // Z10Web 門牌查詢若只定位到土地，土地明細可能包含多個建號；不可偷拿第一個建號當答案。
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/Z10Web/Normal") || url.endsWith("/Z10Web/")) {
        return new Response("<html></html>", { status: 200 });
      }
      if (url.endsWith("/Z10Web/layout/setToken.jsp")) {
        return new Response(`<input type="hidden" name="token" value="token-1" />`, { status: 200 });
      }
      if (url.endsWith("/Z10Web/HouseholdDoorPlate_ajax_list")) {
        return new Response(`
          <a class="list-group-item" role="result"
             data-city="" data-town="" data-area=""
             data-road="臺南市東區仁里里２鄰裕農路２８８巷１７號"
             href="javascript: void(0);">臺南市東區仁里里２鄰裕農路２８８巷１７號</a>
        `, { status: 200 });
      }
      if (url.endsWith("/Z10Web/HouseholdDoorPlate_json_detail")) {
        return Response.json({ x: 120.2180, y: 22.9950 });
      }
      if (url.endsWith("/Z10Web/Land_json_getMapImageLayersByCoord")) {
        return Response.json({
          exec: "true",
          cityCode: "D",
          townCode: "01",
          office: "DC",
          sectNo: "1556",
          sectName: "富強段",
          landNo: "70",
          cityName: "臺南市",
          townName: "東區",
          mapImg: JSON.stringify({ EXT: [120.21, 22.99, 120.23, 23.0], IMG: [] }),
        });
      }
      if (url.endsWith("/Z10Web/LandDesc_ajax_detail")) {
        return new Response(`
          <table>
            <tr><th>地段</th><td>1556 富強段</td></tr>
            <tr><th>地號</th><td>00700000</td></tr>
            <tr><th>面積</th><td>384.5 平方公尺</td></tr>
          </table>
          <button onclick="qtCommon.getBuildDetail('DC','1556','00204000','','b')">00204000建號</button>
          <button onclick="qtCommon.getBuildDetail('DC','1556','00204001','','b')">00204001建號</button>
        `, { status: 200 });
      }
      return new Response("not found", { status: 404 });
    }));

    const result = await discoverAddressLocally("台南市東區裕農路288巷17號");

    expect(result.status).toBe("low_confidence_unresolved");
    expect(result.requiresCandidateSelection).toBe(true);
    expect(result.candidateSelection).toEqual({
      state: "required",
      selectedRegistryKey: null,
    });
    expect(result).not.toHaveProperty("confirmed_registry_match");
    expect(result.candidates).toEqual([
      expect.objectContaining({
        parcel_id: "DC-1556-00204000",
        lot_number: "00700000",
        section_name: "富強段",
        section_code: "1556",
        source: "easymap_z10web",
        building_number: "00204000",
        object_type: "building",
        confirmation_state: "unconfirmed",
        land_area_sqm: "384.5",
      }),
      expect.objectContaining({
        parcel_id: "DC-1556-00204001",
        lot_number: "00700000",
        section_name: "富強段",
        section_code: "1556",
        source: "easymap_z10web",
        building_number: "00204001",
        object_type: "building",
        confirmation_state: "unconfirmed",
        land_area_sqm: "384.5",
      }),
    ]);
  });

  it("uses R02 floor-unit lookup to narrow Z10Web building candidates for 樓之號 addresses", async () => {
    let r02DoorRequestBody = "";
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/Z10Web/Normal") || url.endsWith("/Z10Web/")) {
        return new Response("<html></html>", { status: 200 });
      }
      if (url.endsWith("/Z10Web/layout/setToken.jsp") || url.endsWith("/R02/pages/setToken.jsp")) {
        return new Response(`<input type="hidden" name="token" value="token-1" />`, { status: 200 });
      }
      if (url.endsWith("/Z10Web/HouseholdDoorPlate_ajax_list")) {
        return new Response(`
          <a class="list-group-item" role="result"
             data-road="臺南市東區富強里１３鄰裕農路２８８巷１７號">臺南市東區富強里１３鄰裕農路２８８巷１７號</a>
        `, { status: 200 });
      }
      if (url.endsWith("/Z10Web/HouseholdDoorPlate_json_detail")) {
        return Response.json({ x: 120.229084, y: 22.986314 });
      }
      if (url.endsWith("/Z10Web/Land_json_getMapImageLayersByCoord")) {
        return Response.json({
          cityCode: "D",
          townCode: "01",
          office: "DC",
          sectNo: "1556",
          sectName: "富強段",
          landNo: "70",
          cityName: "臺南市",
          townName: "東區",
        });
      }
      if (url.endsWith("/Z10Web/LandDesc_ajax_detail")) {
        return new Response(`
          <button onclick="qtCommon.getBuildDetail('DC','1556','00204000','','b')">00204000建號</button>
          <button onclick="qtCommon.getBuildDetail('DC','1556','00205000','','b')">00205000建號</button>
        `, { status: 200 });
      }
      if (url.endsWith("/Z10Web/BuildDesc_ajax_detail")) {
        const params = new URLSearchParams(String(init?.body ?? ""));
        if (params.get("buildNo") !== "00204000") {
          return new Response("<table></table>", { status: 200 });
        }
        return new Response(`
          <table>
            <tr><th>地段</th><td>1556 富強段</td></tr>
            <tr><th>建號</th><td>00204000</td></tr>
            <tr><th>建物面積</th><td>103.31 平方公尺</td></tr>
            <tr><th>樓層別</th><td>8樓之1</td></tr>
            <tr><th>建物完成日期</th><td>083/10/18 屋齡：約31年</td></tr>
            <tr><th>主要用途</th><td>住家用</td></tr>
          </table>
        `, { status: 200 });
      }
      if (url.endsWith("/R02/Index")) {
        return new Response("<html></html>", { status: 200 });
      }
      if (url.endsWith("/R02/City_json_getTownList")) {
        return Response.json([{ id: "01", name: "東區" }]);
      }
      if (url.endsWith("/R02/City_json_getRoadList")) {
        return Response.json([{ srcName: "裕農路", name: "裕農路" }]);
      }
      if (url.endsWith("/R02/Door_json_getDoorList")) {
        r02DoorRequestBody = String(init?.body ?? "");
        return Response.json({
          results: [{
            City: "D",
            towncode: "01",
            Road: "裕農路２８８巷１７號",
            srcRoad: "裕農路２８８巷１７號",
            buildsectno: "1556",
            buildno: "00204000",
            sectno: "1556",
            sectName: "富強段",
            office: "DC",
            landno: "70",
            mergeSameDoorCount: 0,
          }],
          msg: "",
        });
      }
      return new Response("not found", { status: 404 });
    }));

    const result = await discoverAddressLocally("台南市東區裕農路288巷17號8樓之一");

    const r02Params = new URLSearchParams(r02DoorRequestBody);
    expect(r02Params.get("no")).toBe("17號8樓之1");
    expect(result.status).toBe("candidate_found");
    expect(result.requiresCandidateSelection).toBe(false);
    expect(result.candidates).toEqual([
      expect.objectContaining({
        source: "easymap_r02",
        parcel_id: "DC-1556-00204000",
        lot_number: "00700000",
        building_number: "00204000",
        building_area_sqm: "103.31",
        completion_date_roc: "083/10/18",
        age_years: "31",
        main_use: "住家用",
        floor_label: "8樓之1",
      }),
    ]);
  });

  it("uses unique Z10Web floor labels to auto-confirm a single building when R02 cannot narrow the candidates", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/Z10Web/Normal") || url.endsWith("/Z10Web/")) {
        return new Response("<html></html>", { status: 200 });
      }
      if (url.endsWith("/Z10Web/layout/setToken.jsp") || url.endsWith("/R02/pages/setToken.jsp")) {
        return new Response(`<input type="hidden" name="token" value="token-1" />`, { status: 200 });
      }
      if (url.endsWith("/Z10Web/HouseholdDoorPlate_ajax_list")) {
        return new Response(`
          <a class="list-group-item" role="result"
             data-road="臺南市東區富強里１３鄰裕農路２８８巷１７號">臺南市東區富強里１３鄰裕農路２８８巷１７號</a>
        `, { status: 200 });
      }
      if (url.endsWith("/Z10Web/HouseholdDoorPlate_json_detail")) {
        return Response.json({ x: 120.229084, y: 22.986314 });
      }
      if (url.endsWith("/Z10Web/Land_json_getMapImageLayersByCoord")) {
        return Response.json({
          cityCode: "D",
          townCode: "01",
          office: "DC",
          sectNo: "1556",
          sectName: "富強段",
          landNo: "70",
          cityName: "臺南市",
          townName: "東區",
        });
      }
      if (url.endsWith("/Z10Web/LandDesc_ajax_detail")) {
        return new Response(`
          <button onclick="qtCommon.getBuildDetail('DC','1556','00204000','','b')">00204000建號</button>
          <button onclick="qtCommon.getBuildDetail('DC','1556','00205000','','b')">00205000建號</button>
        `, { status: 200 });
      }
      if (url.endsWith("/Z10Web/BuildDesc_ajax_detail")) {
        const params = new URLSearchParams(String(init?.body ?? ""));
        if (params.get("buildNo") === "00204000") {
          return new Response(`
            <table>
              <tr><th>樓層別</th><td>8樓之1</td></tr>
              <tr><th>建號</th><td>00204000</td></tr>
            </table>
          `, { status: 200 });
        }
        return new Response(`
          <table>
            <tr><th>樓層別</th><td>9樓之1</td></tr>
            <tr><th>建號</th><td>00205000</td></tr>
          </table>
        `, { status: 200 });
      }
      if (url.endsWith("/R02/Index")) {
        return new Response("<html></html>", { status: 200 });
      }
      if (url.endsWith("/R02/City_json_getTownList")) {
        return Response.json([{ id: "01", name: "東區" }]);
      }
      if (url.endsWith("/R02/City_json_getRoadList")) {
        return Response.json([{ srcName: "裕農路", name: "裕農路" }]);
      }
      if (url.endsWith("/R02/Door_json_getDoorList")) {
        return Response.json({ results: [], msg: "" });
      }
      return new Response("not found", { status: 404 });
    }));

    const result = await discoverAddressLocally("台南市東區裕農路288巷17號8樓之一");

    expect(result.status).toBe("candidate_found");
    expect(result.requiresCandidateSelection).toBe(false);
    expect(result.candidates).toEqual([
      expect.objectContaining({
        source: "easymap_z10web",
        building_number: "00204000",
        floor_label: "8樓之1",
        selection_reason: "floor_unit_unique_match",
      }),
    ]);
    expect(result.totalCostCents).toBe(0);
  });

  it("prefers the R02 building candidate when overlap exists but Z10 land section conflicts", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/Z10Web/Normal") || url.endsWith("/Z10Web/")) {
        return new Response("<html></html>", { status: 200 });
      }
      if (url.endsWith("/Z10Web/layout/setToken.jsp") || url.endsWith("/R02/pages/setToken.jsp")) {
        return new Response(`<input type="hidden" name="token" value="token-1" />`, { status: 200 });
      }
      if (url.endsWith("/Z10Web/HouseholdDoorPlate_ajax_list")) {
        return new Response(`
          <a class="list-group-item" role="result"
             data-road="臺南市東區東和路47號">臺南市東區東和路47號</a>
        `, { status: 200 });
      }
      if (url.endsWith("/Z10Web/HouseholdDoorPlate_json_detail")) {
        return Response.json({ x: 120.229449, y: 22.998544 });
      }
      if (url.endsWith("/Z10Web/Land_json_getMapImageLayersByCoord")) {
        return Response.json({
          cityCode: "D",
          townCode: "01",
          office: "DC",
          sectNo: "1514",
          sectName: "東光段",
          landNo: "2210032",
          cityName: "臺南市",
          townName: "東區",
        });
      }
      if (url.endsWith("/Z10Web/LandDesc_ajax_detail")) {
        return new Response(`
          <button onclick="qtCommon.getBuildDetail('DC','1514','03029000','','b')">03029000建號</button>
          <button onclick="qtCommon.getBuildDetail('DC','1514','03045000','','b')">03045000建號</button>
        `, { status: 200 });
      }
      if (url.endsWith("/Z10Web/BuildDesc_ajax_detail")) {
        const params = new URLSearchParams(String(init?.body ?? ""));
        if (params.get("sectNo") === "1511" && params.get("buildNo") === "03045000") {
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
        return new Response("<html>temporary failure</html>", { status: 500 });
      }
      if (url.endsWith("/R02/Index")) {
        return new Response("<html></html>", { status: 200 });
      }
      if (url.endsWith("/R02/City_json_getTownList")) {
        return Response.json([{ id: "01", name: "東區" }]);
      }
      if (url.endsWith("/R02/City_json_getRoadList")) {
        return Response.json([{ srcName: "東和路", name: "東和路" }]);
      }
      if (url.endsWith("/R02/Door_json_getDoorList")) {
        return Response.json({
          results: [{
            City: "D",
            towncode: "01",
            Road: "東和路47號3樓",
            srcRoad: "東和路47號3樓",
            buildsectno: "1511",
            buildno: "03045000",
            sectno: "1511",
            sectName: "光明段",
            office: "DC",
            landno: "77",
            mergeSameDoorCount: 0,
          }],
          msg: "",
        });
      }
      return new Response("not found", { status: 404 });
    }));

    const result = await discoverAddressLocally("台南市東區東和路47號3樓");

    expect(result.status).toBe("low_confidence_unresolved");
    expect(result.candidates).toEqual([
      expect.objectContaining({
        building_number: "03045000",
        section_code: "1511",
        section_name: "光明段",
        lot_number: "00770000",
        building_area_sqm: "98.44",
        floor_label: "三層",
        source: "easymap_r02",
        discovery_confidence: "low",
      }),
    ]);
    expect(result.requiresCandidateSelection).toBe(true);
    expect(result.candidateSelection).toEqual({
      state: "required",
      selectedRegistryKey: null,
    });
    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "easymap_r02_z10web_mismatch" }),
      expect.objectContaining({ code: "easymap_z10web_build_detail_unavailable" }),
    ]));
  });

  it("normalizes Arabic and Chinese address numbers before querying Z10Web and R02", async () => {
    const ajaxRoadNames: string[] = [];
    let r02DoorRequestBody = "";
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/Z10Web/Normal") || url.endsWith("/Z10Web/")) {
        return new Response("<html></html>", { status: 200 });
      }
      if (url.endsWith("/Z10Web/layout/setToken.jsp") || url.endsWith("/R02/pages/setToken.jsp")) {
        return new Response(`<input type="hidden" name="token" value="token-1" />`, { status: 200 });
      }
      if (url.endsWith("/Z10Web/HouseholdDoorPlate_ajax_list")) {
        const params = new URLSearchParams(String(init?.body ?? ""));
        ajaxRoadNames.push(params.get("roadName") ?? "");
        if (params.get("roadName") !== "中華東路三段") {
          return new Response(`<div class="list-group"></div>`, { status: 200 });
        }
        return new Response(`
          <a class="list-group-item" role="result"
             data-road="臺南市東區中華東路三段２４巷８號">臺南市東區中華東路三段２４巷８號</a>
        `, { status: 200 });
      }
      if (url.endsWith("/Z10Web/HouseholdDoorPlate_json_detail")) {
        return Response.json({ x: 120.22222, y: 22.97777 });
      }
      if (url.endsWith("/Z10Web/Land_json_getMapImageLayersByCoord")) {
        return Response.json({
          cityCode: "D",
          townCode: "01",
          office: "DC",
          sectNo: "1501",
          sectName: "竹篙厝段",
          landNo: "1469",
          cityName: "臺南市",
          townName: "東區",
        });
      }
      if (url.endsWith("/Z10Web/LandDesc_ajax_detail")) {
        return new Response(`
          <button onclick="qtCommon.getBuildDetail('DC','1501','06850000','','b')">06850000建號</button>
          <button onclick="qtCommon.getBuildDetail('DC','1501','06860000','','b')">06860000建號</button>
        `, { status: 200 });
      }
      if (url.endsWith("/R02/Index")) {
        return new Response("<html></html>", { status: 200 });
      }
      if (url.endsWith("/R02/City_json_getTownList")) {
        return Response.json([{ id: "01", name: "東區" }]);
      }
      if (url.endsWith("/R02/City_json_getRoadList")) {
        return Response.json([{ srcName: "中華東路三段", name: "中華東路三段" }]);
      }
      if (url.endsWith("/R02/Door_json_getDoorList")) {
        r02DoorRequestBody = String(init?.body ?? "");
        return Response.json({
          results: [{
            City: "D",
            towncode: "01",
            Road: "中華東路三段２４巷８號５樓",
            srcRoad: "中華東路三段２４巷８號５樓",
            buildsectno: "1501",
            buildno: "06850000",
            sectno: "1501",
            sectName: "竹篙厝段",
            office: "DC",
            landno: "1469",
            mergeSameDoorCount: 0,
          }],
          msg: "",
        });
      }
      return new Response("not found", { status: 404 });
    }));

    const result = await discoverAddressLocally("臺南市東區中華東路３段二十四巷八號五樓之一");

    const r02Params = new URLSearchParams(r02DoorRequestBody);
    expect(ajaxRoadNames).toContain("中華東路3段");
    expect(ajaxRoadNames).toContain("中華東路三段");
    expect(r02Params.get("lane")).toBe("24");
    expect(r02Params.get("no")).toBe("8號5樓之1");
    expect(result.status).toBe("candidate_found");
    expect(result.requiresCandidateSelection).toBe(false);
    expect(result.candidates).toEqual([
      expect.objectContaining({
        source: "easymap_r02",
        section_name: "竹篙厝段",
        lot_number: "14690000",
        building_number: "06850000",
      }),
    ]);
  });

  it("retries R02 door lookup with equivalent road section formats when the first format has no candidates", async () => {
    const r02RoadValues: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/Z10Web/Normal") || url.endsWith("/Z10Web/")) {
        return new Response("<html></html>", { status: 200 });
      }
      if (url.endsWith("/Z10Web/layout/setToken.jsp") || url.endsWith("/R02/pages/setToken.jsp")) {
        return new Response(`<input type="hidden" name="token" value="token-1" />`, { status: 200 });
      }
      if (url.endsWith("/Z10Web/HouseholdDoorPlate_ajax_list")) {
        return new Response(`<div class="list-group"></div>`, { status: 200 });
      }
      if (url.endsWith("/R02/Index")) {
        return new Response("<html></html>", { status: 200 });
      }
      if (url.endsWith("/R02/City_json_getTownList")) {
        return Response.json([{ id: "01", name: "東區" }]);
      }
      if (url.endsWith("/R02/City_json_getRoadList")) {
        return Response.json([{ srcName: "中華東路三段", name: "中華東路三段" }]);
      }
      if (url.endsWith("/R02/Door_json_getDoorList")) {
        const params = new URLSearchParams(String(init?.body ?? ""));
        r02RoadValues.push(params.get("road") ?? "");
        if (params.get("road") !== "中華東路3段") {
          return Response.json({ results: [], msg: "" });
        }
        return Response.json({
          results: [{
            City: "D",
            towncode: "01",
            Road: "中華東路三段２４巷８號",
            srcRoad: "中華東路三段２４巷８號",
            buildsectno: "1501",
            buildno: "06850000",
            sectno: "1501",
            sectName: "竹篙厝段",
            office: "DC",
            landno: "1469",
            mergeSameDoorCount: 0,
          }],
          msg: "",
        });
      }
      return new Response("not found", { status: 404 });
    }));

    const result = await discoverAddressLocally("台南市東區中華東路三段24巷8號5樓");

    expect(r02RoadValues).toEqual(["中華東路三段", "中華東路3段"]);
    expect(result.status).toBe("candidate_found");
    expect(result.candidates[0]).toEqual(expect.objectContaining({
      source: "easymap_r02",
      section_name: "竹篙厝段",
      lot_number: "14690000",
      building_number: "06850000",
    }));
  });

  it("returns correction suggestions without confirming or starting paid COP for suspected road typos", async () => {
    mockInvokeFn.mockResolvedValueOnce([]);
    const requestedPaths: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      requestedPaths.push(new URL(url).pathname);
      if (url.endsWith("/Z10Web/Normal") || url.endsWith("/Z10Web/")) {
        return new Response("<html></html>", { status: 200 });
      }
      if (url.endsWith("/Z10Web/layout/setToken.jsp")) {
        return new Response(`<input type="hidden" name="token" value="token-1" />`, { status: 200 });
      }
      // ajax_list 回空（路名找不到）
      if (url.endsWith("/Z10Web/HouseholdDoorPlate_ajax_list")) {
        return new Response(`<div class="row"><div class="col-xs-12"><div class="list-group"></div></div></div>`, { status: 200 });
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
    // 現在走 Z10Web，不再打 R02 Door_json_getDoorList
    expect(requestedPaths).toContain("/Z10Web/HouseholdDoorPlate_ajax_list");
    expect(mockInvokeFn).not.toHaveBeenCalledWith("land_registry_formal_pull_data", expect.anything());
  });

  it("does not use a Z10Web doorplate result whose no/road does not match the input address", async () => {
    // ajax_list 回傳的候選門牌（189巷2號）與查詢地址（18巷8弄2號）不符 → 應回傳 manual_required
    mockInvokeFn.mockResolvedValueOnce([]);
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/Z10Web/Normal") || url.endsWith("/Z10Web/")) {
        return new Response("<html></html>", { status: 200 });
      }
      if (url.endsWith("/Z10Web/layout/setToken.jsp")) {
        return new Response(`<input type="hidden" name="token" value="token-1" />`, { status: 200 });
      }
      // 回傳門號不符的候選（189巷2號 vs 18巷8弄2號）
      if (url.endsWith("/Z10Web/HouseholdDoorPlate_ajax_list")) {
        return new Response(`
          <a class="list-group-item" role="result"
             data-city="" data-town="" data-area=""
             data-road="高雄市苓雅區苓雅里１２鄰苓雅二路１８９巷２號"
             href="javascript: void(0);">高雄市苓雅區苓雅里１２鄰苓雅二路１８９巷２號</a>
        `, { status: 200 });
      }
      return new Response("not found", { status: 404 });
    }));

    const result = await discoverAddressLocally("高雄市苓雅區苓雅二路18巷8弄2號");

    // pickBestZ10WebDoorplate 應該接受最接近的候選（fallback 第一筆）
    // 但 json_detail 之後如果 fetch 失敗（找不到 json_detail mock） → manual_required
    // 這個測試驗證的是：候選存在時仍可能 fallback 到 manual_required（json_detail 未 mock）
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

    const result = await discoverAddressLocally("台南市東區裕農路288巷17號8樓之1", { cache: false });

    expect(result.status).toBe("manual_required");
    expect(result.candidates).toEqual([]);
    expect(result.total_cost_cents).toBe(0);
  });

  it("returns run error when lookup has no trusted candidates", async () => {
    const fs = await import("node:fs");
    const os = await import("node:os");
    const path = await import("node:path");
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "aire-discovery-no-cache-"));
    process.env.AIRE_DATA_DIR = tmpDir;
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

    try {
      const result = await discoverAddressLocally("台南市永康區勝利街58巷4號");

      expect(result).toMatchObject({
        status: "manual_required",
        candidates: [],
        total_cost_cents: 0,
        errors: [{ code: "address_discovery_unavailable" }],
      });
      expect(mockInvokeFn).toHaveBeenCalledWith("list_registry_query_runs", {});
    } finally {
      delete process.env.AIRE_DATA_DIR;
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  // Z10Web 門牌查詢路徑（R02 Door_json_getDoorList 已故障）
  it("selects the exact Z10Web doorplate candidate instead of falling back to the first village-neighborhood result", async () => {
    let selectedDoorplate = "";
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/Z10Web/Normal") || url.endsWith("/Z10Web/")) {
        return new Response("<html></html>", { status: 200 });
      }
      if (url.endsWith("/Z10Web/layout/setToken.jsp")) {
        return new Response(`<input type="hidden" name="token" value="z10-token-1" />`, { status: 200 });
      }
      if (url.endsWith("/Z10Web/HouseholdDoorPlate_ajax_list")) {
        return new Response(`
          <a class="list-group-item" role="result"
             data-road="臺南市永康區勝利里２７鄰勝利街５８巷１４號">臺南市永康區勝利里２７鄰勝利街５８巷１４號</a>
          <a class="list-group-item" role="result"
             data-road="臺南市永康區勝利里２７鄰勝利街５８巷４號">臺南市永康區勝利里２７鄰勝利街５８巷４號</a>
        `, { status: 200 });
      }
      if (url.endsWith("/Z10Web/HouseholdDoorPlate_json_detail")) {
        selectedDoorplate = decodeURIComponent(String(init?.body ?? ""));
        return Response.json({ x: 120.2327698, y: 23.0015714 });
      }
      if (url.endsWith("/Z10Web/Land_json_getMapImageLayersByCoord")) {
        return Response.json({
          cityCode: "D",
          townCode: "11",
          office: "DK",
          sectNo: "9125",
          sectName: "兵南段",
          landNo: "408",
          cityName: "臺南市",
          townName: "永康區",
        });
      }
      if (url.endsWith("/Z10Web/LandDesc_ajax_detail")) {
        return new Response(`
          <table><tr><th>面積</th><td>66.29 平方公尺</td></tr></table>
          <button onclick="qtCommon.getBuildDetail('DK','9125','00084000','','build_info2_00084000')">00084000建號</button>
        `, { status: 200 });
      }
      return new Response("not found", { status: 404 });
    }));

    const result = await discoverAddressLocally("台南市永康區勝利街58巷4號");

    expect(selectedDoorplate).toContain("doorPlate=臺南市永康區勝利里２７鄰勝利街５８巷４號");
    expect(result.candidates[0]).toMatchObject({
      parcel_id: "DK-9125-00084000",
      lot_number: "04080000",
      building_number: "00084000",
    });
  });

  it("cross-checks matching Z10Web and R02 doorplate candidates without conflict diagnostics", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/Z10Web/Normal") || url.endsWith("/Z10Web/")) {
        return new Response("<html></html>", { status: 200 });
      }
      if (url.endsWith("/Z10Web/layout/setToken.jsp") || url.endsWith("/R02/pages/setToken.jsp")) {
        return new Response(`<input type="hidden" name="token" value="token-1" />`, { status: 200 });
      }
      if (url.endsWith("/Z10Web/HouseholdDoorPlate_ajax_list")) {
        return new Response(`<a role="result" data-road="臺南市永康區勝利里２７鄰勝利街５８巷４號">ok</a>`, { status: 200 });
      }
      if (url.endsWith("/Z10Web/HouseholdDoorPlate_json_detail")) {
        return Response.json({ x: 120.232844, y: 23.001624 });
      }
      if (url.endsWith("/Z10Web/Land_json_getMapImageLayersByCoord")) {
        return Response.json({
          cityCode: "D",
          townCode: "39",
          office: "DK",
          sectNo: "9125",
          sectName: "兵南段",
          landNo: "414",
          cityName: "臺南市",
          townName: "永康區",
        });
      }
      if (url.endsWith("/Z10Web/LandDesc_ajax_detail")) {
        return new Response(`<button onclick="qtCommon.getBuildDetail('DK','9125','00084000','','x')">00084000</button>`, { status: 200 });
      }
      if (url.endsWith("/R02/Index")) {
        return new Response("<html></html>", { status: 200 });
      }
      if (url.endsWith("/R02/City_json_getTownList")) {
        return Response.json([{ id: "39", name: "永康區" }]);
      }
      if (url.endsWith("/R02/City_json_getRoadList")) {
        return Response.json([{ srcName: "勝利街", name: "勝利街" }]);
      }
      if (url.endsWith("/R02/Door_json_getDoorList")) {
        return Response.json({
          results: [{
            City: "D",
            towncode: "39",
            Road: "勝利街５８巷４號",
            srcRoad: "勝利街５８巷４號",
            buildsectno: "9125",
            buildno: "00084000",
            sectno: "9125",
            sectName: "兵南段",
            office: "DK",
            landno: "414",
            mergeSameDoorCount: 0,
          }],
          msg: "",
        });
      }
      return new Response("not found", { status: 404 });
    }));

    const result = await discoverAddressLocally("台南市永康區勝利街58巷4號");

    expect(result.status).toBe("candidate_found");
    expect(result.candidates[0]).toMatchObject({
      source: "easymap_z10web",
      lot_number: "04140000",
      building_number: "00084000",
    });
    expect(result.errors.map((error) => error.code)).not.toContain("easymap_r02_z10web_mismatch");
  });

  it("keeps Z10Web candidate but reports diagnostics when R02 returns a conflicting key", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/Z10Web/Normal") || url.endsWith("/Z10Web/")) return new Response("<html></html>", { status: 200 });
      if (url.endsWith("/Z10Web/layout/setToken.jsp") || url.endsWith("/R02/pages/setToken.jsp")) {
        return new Response(`<input type="hidden" name="token" value="token-1" />`, { status: 200 });
      }
      if (url.endsWith("/Z10Web/HouseholdDoorPlate_ajax_list")) {
        return new Response(`<a role="result" data-road="臺南市永康區勝利街５８巷４號">ok</a>`, { status: 200 });
      }
      if (url.endsWith("/Z10Web/HouseholdDoorPlate_json_detail")) return Response.json({ x: 120.232844, y: 23.001624 });
      if (url.endsWith("/Z10Web/Land_json_getMapImageLayersByCoord")) {
        return Response.json({ cityCode: "D", townCode: "39", office: "DK", sectNo: "9125", sectName: "兵南段", landNo: "414", cityName: "臺南市", townName: "永康區" });
      }
      if (url.endsWith("/Z10Web/LandDesc_ajax_detail")) {
        return new Response(`<button onclick="qtCommon.getBuildDetail('DK','9125','00084000','','x')">00084000</button>`, { status: 200 });
      }
      if (url.endsWith("/R02/Index")) return new Response("<html></html>", { status: 200 });
      if (url.endsWith("/R02/City_json_getTownList")) return Response.json([{ id: "39", name: "永康區" }]);
      if (url.endsWith("/R02/City_json_getRoadList")) return Response.json([{ srcName: "勝利街", name: "勝利街" }]);
      if (url.endsWith("/R02/Door_json_getDoorList")) {
        return Response.json({
          results: [{ City: "D", towncode: "39", Road: "勝利街５８巷４號", srcRoad: "勝利街５８巷４號", buildsectno: "9125", buildno: "00296000", sectno: "9125", sectName: "兵南段", office: "DK", landno: "408", mergeSameDoorCount: 0 }],
          msg: "",
        });
      }
      return new Response("not found", { status: 404 });
    }));

    const result = await discoverAddressLocally("台南市永康區勝利街58巷4號");

    expect(result.candidates[0]).toMatchObject({
      lot_number: "04140000",
      building_number: "00084000",
    });
    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({
        source: "easymap_r02",
        code: "easymap_r02_z10web_mismatch",
      }),
    ]));
    const mismatchError = result.errors.find((entry) => entry.code === "easymap_r02_z10web_mismatch");
    expect(mismatchError?.message).toContain("Z10Web=DK/9125/04140000/00084000");
    expect(mismatchError?.message).toContain("R02=DK/9125/04080000/00296000");
  });

  it("uses structured R02 doorplate lookup as fallback when Z10Web returns no candidates", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/Z10Web/Normal") || url.endsWith("/Z10Web/")) return new Response("<html></html>", { status: 200 });
      if (url.endsWith("/Z10Web/layout/setToken.jsp") || url.endsWith("/R02/pages/setToken.jsp")) {
        return new Response(`<input type="hidden" name="token" value="token-1" />`, { status: 200 });
      }
      if (url.endsWith("/Z10Web/HouseholdDoorPlate_ajax_list")) return new Response(`<div class="list-group"></div>`, { status: 200 });
      if (url.endsWith("/R02/Index")) return new Response("<html></html>", { status: 200 });
      if (url.endsWith("/R02/City_json_getTownList")) return Response.json([{ id: "39", name: "永康區" }]);
      if (url.endsWith("/R02/City_json_getRoadList")) return Response.json([{ srcName: "勝利街", name: "勝利街" }]);
      if (url.endsWith("/R02/Door_json_getDoorList")) {
        return Response.json({
          results: [{ City: "D", towncode: "39", Road: "勝利街５８巷４號", srcRoad: "勝利街５８巷４號", buildsectno: "9125", buildno: "00084000", sectno: "9125", sectName: "兵南段", office: "DK", landno: "414", mergeSameDoorCount: 0 }],
          msg: "",
        });
      }
      return new Response("not found", { status: 404 });
    }));

    const result = await discoverAddressLocally("台南市永康區勝利街58巷4號");

    expect(result.status).toBe("candidate_found");
    expect(result.candidates[0]).toMatchObject({
      source: "easymap_r02",
      lot_number: "04140000",
      building_number: "00084000",
    });
    expect(result.errors).toEqual([
      expect.objectContaining({ code: "easymap_z10web_fallback_to_r02" }),
    ]);
  });

  it("discovers doorplate via Z10Web: ajax_list → json_detail → getMapImageLayersByCoord → LandDesc", async () => {
    let detailRequestBody = "";
    let coordRequestBody = "";
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      // session 建立
      if (url.endsWith("/Z10Web/Normal") || url.endsWith("/Z10Web/")) {
        return new Response("<html></html>", {
          status: 200,
          headers: { "set-cookie": "JSESSIONID=z10-session; Path=/Z10Web" },
        });
      }
      // token
      if (url.endsWith("/Z10Web/layout/setToken.jsp")) {
        return new Response(`
          <input type="hidden" name="struts.token.name" value="token" />
          <input type="hidden" name="token" value="z10-token-1" />
        `, { status: 200 });
      }
      // 門牌候選清單 HTML
      if (url.endsWith("/Z10Web/HouseholdDoorPlate_ajax_list")) {
        return new Response(`
          <a class="list-group-item" role="result"
             data-city="" data-town="" data-area=""
             data-road="臺南市東區後甲里３鄰中華東路一段１００號"
             href="javascript: void(0);">臺南市東區後甲里３鄰中華東路一段１００號</a>
        `, { status: 200 });
      }
      // 門牌→坐標
      if (url.endsWith("/Z10Web/HouseholdDoorPlate_json_detail")) {
        detailRequestBody = String(init?.body ?? "");
        return Response.json({ x: 120.234081, y: 22.991496 });
      }
      // 坐標→地籍
      if (url.endsWith("/Z10Web/Land_json_getMapImageLayersByCoord")) {
        coordRequestBody = String(init?.body ?? "");
        return Response.json({
          exec: "true",
          cityCode: "D",
          townCode: "01",
          office: "DC",
          sectNo: "1568",
          sectName: "新後甲段",
          landNo: "1431",
          cityName: "臺南市",
          townName: "東區",
          mapImg: JSON.stringify({ EXT: [120.23, 22.99, 120.24, 23.0], IMG: [] }),
        });
      }
      // 地號詳情
      if (url.endsWith("/Z10Web/LandDesc_ajax_detail")) {
        return new Response(`
          <table>
            <tr><th>行政區</th><td>臺南市 東區</td></tr>
            <tr><th>地政事務所</th><td>東南地政事務所</td></tr>
            <tr><th>地段</th><td>1568 新後甲段</td></tr>
            <tr><th>地號</th><td>14310000</td></tr>
            <tr><th>面積</th><td>295.03 平方公尺</td></tr>
            <tr><th>公告現值</th><td>187000 元/平方公尺</td></tr>
            <tr><th>公告地價</th><td>35500 元/平方公尺</td></tr>
          </table>
          <button onclick="qtCommon.getBuildDetail('DC','1568','00770000','','build_info2_00770000')">00770000建號</button>
        `, { status: 200 });
      }
      return new Response("not found", { status: 404 });
    }));

    const result = await discoverAddressLocally("臺南市東區中華東路一段100號");

    expect(result.status).toBe("candidate_found");
    expect(result.candidates).toEqual([
      expect.objectContaining({
        section_name: "新後甲段",
        section_code: "1568",
        lot_number: "14310000",
        land_office: "DC",
        source: "easymap_z10web",
        trusted_for_pdf: false,
        discovery_confidence: "high",
        // 有建號（00770000）→ object_type 改為 building
        building_number: "00770000",
        object_type: "building",
        land_area_sqm: "295.03",
        announced_land_current_value: "187000",
        announced_land_value: "35500",
      }),
    ]);
    // 確認有把 doorPlate 傳給 json_detail
    expect(decodeURIComponent(detailRequestBody)).toContain("中華東路一段");
    // 確認有把坐標傳給 getMapImageLayersByCoord
    expect(decodeURIComponent(coordRequestBody)).toContain("wgs84x=");
    expect(decodeURIComponent(coordRequestBody)).toContain("wgs84y=");
    expect(mockInvokeFn).not.toHaveBeenCalledWith("land_registry_address_lookup", expect.anything());
  });

  it("uses Z10Web first for land descriptor input before any R02 fallback", async () => {
    const requestedPaths: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      requestedPaths.push(new URL(url).pathname);
      if (url.endsWith("/Z10Web/Normal") || url.endsWith("/Z10Web/")) {
        return new Response("<html></html>", {
          status: 200,
          headers: { "set-cookie": "JSESSIONID=z10-land-session; Path=/Z10Web" },
        });
      }
      if (url.endsWith("/Z10Web/layout/setToken.jsp")) {
        return new Response(`
          <input type="hidden" name="struts.token.name" value="token" />
          <input type="hidden" name="token" value="z10-land-token" />
        `, { status: 200 });
      }
      if (url.endsWith("/Z10Web/City_json_getTownList")) {
        return Response.json([{ id: "28", name: "新市區" }]);
      }
      if (url.endsWith("/Z10Web/City_json_getSectionList")) {
        return Response.json([{ id: "6737", name: "港子墘段", officeCode: "DH", townCode: "28" }]);
      }
      if (url.endsWith("/Z10Web/Land_json_locate")) {
        return Response.json({ X: 120.30759, Y: 23.078698 });
      }
      if (url.endsWith("/Z10Web/LandDesc_ajax_detail")) {
        return new Response(`
          <table>
            <tr><th>地段</th><td>6737 港子墘段</td></tr>
            <tr><th>土地面積</th><td>100.00 平方公尺</td></tr>
            <tr><th>公告現值</th><td>12000 元/平方公尺</td></tr>
          </table>
        `, { status: 200 });
      }
      return new Response("unexpected", { status: 500 });
    }));

    const result = await discoverAddressLocally("台南市新市區港子前段 1090 地號");

    expect(result.status).toBe("candidate_found");
    expect(result.candidates[0]).toMatchObject({
      source: "easymap_z10web",
      land_office: "DH",
      section_code: "6737",
      section_name: "港子墘段",
      lot_number: "10900000",
      lat: 23.078698,
      lng: 120.30759,
    });
    expect(requestedPaths).toContain("/Z10Web/City_json_getTownList");
    expect(requestedPaths).toContain("/Z10Web/City_json_getSectionList");
    expect(requestedPaths).toContain("/Z10Web/Land_json_locate");
    expect(requestedPaths).toContain("/Z10Web/LandDesc_ajax_detail");
    expect(requestedPaths.some((path) => path.startsWith("/R02/"))).toBe(false);
  });

  it("keeps branch land numbers when loading Z10Web land detail fields", async () => {
    let landDetailRequestBody = "";
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/Z10Web/Normal") || url.endsWith("/Z10Web/")) {
        return new Response("<html></html>", { status: 200 });
      }
      if (url.endsWith("/Z10Web/layout/setToken.jsp")) {
        return new Response(`<input type="hidden" name="token" value="z10-land-token" />`, { status: 200 });
      }
      if (url.endsWith("/Z10Web/City_json_getTownList")) {
        return Response.json([{ id: "25", name: "南化區" }]);
      }
      if (url.endsWith("/Z10Web/City_json_getSectionList")) {
        return Response.json([{ id: "8014", name: "南化段", officeCode: "DJ", townCode: "25" }]);
      }
      if (url.endsWith("/Z10Web/Land_json_locate")) {
        return Response.json({ exec: true, cityName: "臺南市", townName: "南化區", cityCode: "D", townCode: "25", office: "DJ", sectNo: "8014", sectName: "南化段", landNo: "850-1" });
      }
      if (url.endsWith("/Z10Web/LandDesc_ajax_detail")) {
        landDetailRequestBody = String(init?.body ?? "");
        return new Response(`
          <table>
            <tr><th>地段</th><td>8014 南化段</td></tr>
            <tr><th>地號</th><td>08500001</td></tr>
            <tr><th>面積</th><td>3404.0 平方公尺</td></tr>
            <tr><th>使用分區</th><td>山坡地保育區</td></tr>
            <tr><th>公告現值</th><td>270 元/平方公尺</td></tr>
            <tr><th>公告地價</th><td>58 元/平方公尺</td></tr>
          </table>
        `, { status: 200 });
      }
      return new Response("unexpected", { status: 500 });
    }));

    const result = await discoverAddressLocally("台南市南化區南化段850-1地號");

    expect(result.status).toBe("candidate_found");
    expect(new URLSearchParams(landDetailRequestBody).get("landNo")).toBe("850-1");
    expect(result.candidates[0]).toMatchObject({
      parcel_id: "DJ-8014-08500001",
      lot_number: "08500001",
      section_name: "南化段",
      land_area_sqm: "3404.0",
      zoning: "山坡地保育區",
      announced_land_current_value: "270",
      announced_land_value: "58",
    });
  });

  // 驗證 getTownList body 包含完整欄位（R02 缺少 cityName/doorPlateType 會回空陣列）
  it("sends cityCode, cityName, townName, roadName and no in Z10Web ajax_list request body", async () => {
    // Z10Web ajax_list 取代 R02 Door_json_getDoorList，驗證請求欄位
    let ajaxListRequestBody = "";
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/Z10Web/Normal") || url.endsWith("/Z10Web/")) {
        return new Response("<html></html>", { status: 200 });
      }
      if (url.endsWith("/Z10Web/layout/setToken.jsp")) {
        return new Response(`
          <input type="hidden" name="struts.token.name" value="token" />
          <input type="hidden" name="token" value="tok-test" />
        `, { status: 200 });
      }
      if (url.endsWith("/Z10Web/HouseholdDoorPlate_ajax_list")) {
        ajaxListRequestBody = String(init?.body ?? "");
        return new Response(`<div class="list-group"></div>`, { status: 200 });
      }
      return new Response("", { status: 200 });
    }));

    await discoverAddressLocally("台北市信義區信義路五段7號");

    // body 必須含 cityCode=A、cityName=臺北市、townName=信義區、roadName=信義路五段、no=7
    const params = new URLSearchParams(ajaxListRequestBody);
    expect(params.get("cityCode")).toBe("A");
    expect(params.get("cityName")).toBe("臺北市");
    expect(params.get("townName")).toBe("信義區");
    expect(params.get("roadName")).toBe("信義路五段");
    expect(params.get("no")).toBe("7");
    expect(params.get("struts.token.name")).toBe("token");
    expect(params.get("token")).toBe("tok-test");
  });

  it("sends cityName and doorPlateType in R02 getTownList for land descriptor input (not doorplate)", async () => {
    // City_json_getTownList 現在只在 discoverLandDescriptor（地段+地號）路徑呼叫
    let townListRequestBody = "";
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith("/R02/Index")) {
        return new Response("<html></html>", { status: 200 });
      }
      if (url.endsWith("/R02/pages/setToken.jsp")) {
        return new Response(`
          <input type="hidden" name="struts.token.name" value="token" />
          <input type="hidden" name="token" value="tok-test" />
        `, { status: 200 });
      }
      if (url.endsWith("/R02/City_json_getTownList")) {
        townListRequestBody = String(init?.body ?? "");
        return Response.json([{ id: "17", name: "信義區" }]);
      }
      if (url.endsWith("/R02/City_json_getSectionList")) {
        return Response.json([{ id: "0001", name: "信義段", officeCode: "AB" }]);
      }
      if (url.endsWith("/R02/Land_json_locate")) {
        return Response.json({ exec: "true", cityCode: "A", townCode: "17", office: "AB", sectNo: "0001", sectName: "信義段", landNo: "100", cityName: "臺北市", townName: "信義區" });
      }
      if (url.endsWith("/R02/LandDesc_ajax_detail")) {
        return new Response("<table></table>", { status: 200 });
      }
      return new Response("", { status: 200 });
    }));

    await discoverAddressLocally("台北市信義區信義段100地號");

    // body 必須含 cityCode=A、cityName=臺北市、doorPlateType=A
    const params = new URLSearchParams(townListRequestBody);
    expect(params.get("cityCode")).toBe("A");
    expect(params.get("cityName")).toBe("臺北市");
    expect(params.get("doorPlateType")).toBe("A");
    expect(params.get("struts.token.name")).toBe("token");
    expect(params.get("token")).toBe("tok-test");
  });

  it("reuses the last successful discovery result when the same address later times out", async () => {
    const fs = await import("node:fs");
    const os = await import("node:os");
    const path = await import("node:path");
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "aire-discovery-cache-"));
    process.env.AIRE_DATA_DIR = tmpDir;

    try {
      let phase: "success" | "timeout" = "success";
      vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (phase === "timeout") {
          throw new Error("EasyMap Z10Web /HouseholdDoorPlate_ajax_list timed out");
        }
        if (url.endsWith("/Z10Web/Normal") || url.endsWith("/Z10Web/")) {
          return new Response("<html></html>", { status: 200 });
        }
        if (url.endsWith("/Z10Web/layout/setToken.jsp") || url.endsWith("/R02/pages/setToken.jsp")) {
          return new Response(`<input type="hidden" name="token" value="token-1" />`, { status: 200 });
        }
        if (url.endsWith("/Z10Web/HouseholdDoorPlate_ajax_list")) {
          return new Response(`<a role="result" data-road="臺南市永康區勝利里２７鄰勝利街５８巷４號">ok</a>`, { status: 200 });
        }
        if (url.endsWith("/Z10Web/HouseholdDoorPlate_json_detail")) {
          return Response.json({ x: 120.232844, y: 23.001624 });
        }
        if (url.endsWith("/Z10Web/Land_json_getMapImageLayersByCoord")) {
          return Response.json({
            cityCode: "D",
            townCode: "39",
            office: "DK",
            sectNo: "9125",
            sectName: "兵南段",
            landNo: "414",
            cityName: "臺南市",
            townName: "永康區",
          });
        }
        if (url.endsWith("/Z10Web/LandDesc_ajax_detail")) {
          return new Response(`<button onclick="qtCommon.getBuildDetail('DK','9125','00084000','','x')">00084000</button>`, { status: 200 });
        }
        if (url.endsWith("/R02/Index")) {
          return new Response("<html></html>", { status: 200 });
        }
        if (url.endsWith("/R02/City_json_getTownList")) {
          return Response.json([{ id: "39", name: "永康區" }]);
        }
        if (url.endsWith("/R02/City_json_getRoadList")) {
          return Response.json([{ srcName: "勝利街", name: "勝利街" }]);
        }
        if (url.endsWith("/R02/Door_json_getDoorList")) {
          return Response.json({
            results: [{
              City: "D",
              towncode: "39",
              Road: "勝利街５８巷４號",
              srcRoad: "勝利街５８巷４號",
              buildsectno: "9125",
              buildno: "00084000",
              sectno: "9125",
              sectName: "兵南段",
              office: "DK",
              landno: "414",
              mergeSameDoorCount: 0,
            }],
            msg: "",
          });
        }
        return new Response("not found", { status: 404 });
      }));

      const firstResult = await discoverAddressLocally("台南市永康區勝利街58巷4號");
      expect(firstResult.status).toBe("candidate_found");
      expect(firstResult.cacheHit).toBe(false);

      phase = "timeout";
      const secondResult = await discoverAddressLocally("台南市永康區勝利街58巷4號");

      expect(secondResult.status).toBe("candidate_found");
      expect(secondResult.cacheHit).toBe(true);
      expect(secondResult.candidates[0]).toMatchObject({
        lot_number: "04140000",
        building_number: "00084000",
      });
      expect(secondResult.errors[0]).toMatchObject({
        source: "local_discovery_cache",
        code: "local_discovery_cache_reused_after_empty_result",
      });
    } finally {
      delete process.env.AIRE_DATA_DIR;
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
