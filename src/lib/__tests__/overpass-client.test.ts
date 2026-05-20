import { describe, expect, it } from "vitest";

import { summarizeNearbyAmenities, type NearbyAmenity } from "../overpass-client";

describe("summarizeNearbyAmenities", () => {
  it("keeps the MVP one-page life-function categories and caps row counts", () => {
    const items: NearbyAmenity[] = [
      { category: "市場", name: "第一市場", distanceM: 450, address: "" },
      { category: "市場", name: "第二市場", distanceM: 520, address: "" },
      { category: "市場", name: "第三市場", distanceM: 580, address: "" },
      { category: "學校", name: "大安國小", distanceM: 300, address: "" },
      { category: "醫療", name: "仁愛醫院", distanceM: 680, address: "" },
      { category: "公園", name: "大安森林公園", distanceM: 700, address: "" },
      { category: "捷運", name: "捷運大安站", distanceM: 650, address: "" },
      { category: "商圈", name: "永康商圈", distanceM: 200, address: "" },
    ];

    const result = summarizeNearbyAmenities(items);

    expect(result.map((item) => item.category)).toEqual(["學校", "市場", "市場", "捷運", "醫療", "公園"]);
    expect(result.filter((item) => item.category === "市場")).toHaveLength(2);
  });
});
