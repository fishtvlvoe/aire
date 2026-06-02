import { afterEach, describe, expect, it, vi } from "vitest";

import {
  isFormalSchoolName,
  queryGoogleNearbyAmenities,
  summarizeNearbyAmenities,
  type NearbyAmenity,
} from "../overpass-client";

describe("isFormalSchoolName", () => {
  it("accepts only formal primary, junior-high, senior-high, college or university names", () => {
    expect(isFormalSchoolName("勝利國小")).toBe(true);
    expect(isFormalSchoolName("復興國中")).toBe(true);
    expect(isFormalSchoolName("臺南高商")).toBe(true);
    expect(isFormalSchoolName("國立成功大學")).toBe(true);

    expect(isFormalSchoolName("荷絃箏樂團—古箏教學、展演")).toBe(false);
    expect(isFormalSchoolName("寶貝熊幼兒園")).toBe(false);
    expect(isFormalSchoolName("東區文理補習班")).toBe(false);
    expect(isFormalSchoolName("裕農音樂教室")).toBe(false);
  });
});

describe("summarizeNearbyAmenities", () => {
  it("keeps the MVP one-page life-function categories and caps row counts", () => {
    const items: NearbyAmenity[] = [
      { category: "市場", name: "第一市場", distanceM: 450, address: "" },
      { category: "市場", name: "第二市場", distanceM: 520, address: "" },
      { category: "市場", name: "第三市場", distanceM: 580, address: "" },
      { category: "學校", name: "大安國小", distanceM: 300, address: "" },
      { category: "學校", name: "後甲國中", distanceM: 2500, address: "" },
      { category: "醫療", name: "仁愛醫院", distanceM: 680, address: "" },
      { category: "公園", name: "大安森林公園", distanceM: 700, address: "" },
      { category: "捷運", name: "捷運大安站", distanceM: 650, address: "" },
      { category: "商圈", name: "永康商圈", distanceM: 200, address: "" },
    ];

    const result = summarizeNearbyAmenities(items);

    expect(result.map((item) => item.category)).toEqual(["學校", "市場", "市場", "捷運", "醫療", "公園", "學校"]);
    expect(result.filter((item) => item.category === "市場")).toHaveLength(2);
    expect(result.filter((item) => item.category === "學校")).toHaveLength(2);
  });

  it("skips non-formal school-like places and keeps the nearest formal school", () => {
    const items: NearbyAmenity[] = [
      { category: "學校", name: "荷絃箏樂團—古箏教學、展演", distanceM: 112, address: "東區裕農里裕農路127號" },
      { category: "學校", name: "臺南市立復興國中", distanceM: 680, address: "" },
      { category: "醫療", name: "臺南市立醫院", distanceM: 720, address: "" },
    ];

    const result = summarizeNearbyAmenities(items);

    expect(result).toEqual([
      expect.objectContaining({ category: "學校", name: "臺南市立復興國中" }),
      expect.objectContaining({ category: "醫療", name: "臺南市立醫院" }),
    ]);
  });

  it("prioritizes major hospitals and common clinics over dental clinics", () => {
    const result = summarizeNearbyAmenities([
      { category: "醫療", name: "樸石牙醫診所", distanceM: 371, address: "" },
      { category: "醫療", name: "成大醫院", distanceM: 2300, address: "" },
      { category: "醫療", name: "小太陽小兒科診所", distanceM: 900, address: "" },
      { category: "醫療", name: "裕農耳鼻喉科診所", distanceM: 1100, address: "" },
      { category: "醫療", name: "醫美診所", distanceM: 500, address: "" },
    ]);

    expect(result.map((item) => item.name)).toEqual(["成大醫院", "小太陽小兒科診所", "裕農耳鼻喉科診所"]);
  });
});

describe("queryGoogleNearbyAmenities", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps Google vicinity/formatted address for PDF life amenities", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("type=supermarket")) {
        return Response.json({
          status: "OK",
          results: [
            {
              place_id: "market-1",
              name: "俗俗的賣生鮮超市",
              vicinity: "臺南市東區東寧路576號",
              geometry: { location: { lat: 22.9901, lng: 120.2301 } },
            },
          ],
        });
      }
      if (url.includes("type=park")) {
        return Response.json({
          status: "OK",
          results: [
            {
              place_id: "park-1",
              name: "富強公園",
              formatted_address: "臺南市東區裕農路",
              geometry: { location: { lat: 22.991, lng: 120.231 } },
            },
          ],
        });
      }
      if (url.includes("type=school")) {
        return Response.json({
          status: "OK",
          results: [
            {
              place_id: "music-1",
              name: "荷絃箏樂團—古箏教學、展演",
              vicinity: "東區裕農里裕農路127號",
              geometry: { location: { lat: 22.987, lng: 120.229 } },
            },
            {
              place_id: "school-1",
              name: "臺南市立復興國中",
              vicinity: "臺南市東區裕文路",
              geometry: { location: { lat: 22.989, lng: 120.234 } },
            },
          ],
        });
      }
      return Response.json({ status: "ZERO_RESULTS", results: [] });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await queryGoogleNearbyAmenities({
      lat: 22.986,
      lng: 120.229,
      radiusM: 1000,
      apiKey: "test-key",
    });

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: "市場",
          name: "俗俗的賣生鮮超市",
          address: "臺南市東區東寧路576號",
        }),
        expect.objectContaining({
          category: "公園",
          name: "富強公園",
          address: "臺南市東區裕農路",
        }),
        expect.objectContaining({
          category: "學校",
          name: "臺南市立復興國中",
          address: "臺南市東區裕文路",
        }),
      ]),
    );
    expect(result).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "荷絃箏樂團—古箏教學、展演" }),
      ]),
    );
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("maps.googleapis.com/maps/api/place/nearbysearch/json"));
  });
});
