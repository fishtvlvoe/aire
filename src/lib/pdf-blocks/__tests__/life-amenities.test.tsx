import { describe, expect, it } from "vitest";

import {
  compactLifeAmenitiesForPrint,
  type NearbyAmenity,
} from "../life-amenities";

describe("LifeAmenitiesPage print data", () => {
  it("caps facilities so map and amenities fit the fixed one-page print layout", () => {
    const items: NearbyAmenity[] = [
      { category: "市場", name: "第三市場", distanceM: 580, address: "" },
      { category: "市場", name: "第一市場", distanceM: 450, address: "" },
      { category: "市場", name: "第二市場", distanceM: 520, address: "" },
      { category: "學校", name: "第一國小", distanceM: 300, address: "" },
      { category: "學校", name: "第二國中", distanceM: 350, address: "" },
      { category: "醫療", name: "仁愛醫院", distanceM: 680, address: "" },
      { category: "公園", name: "大安森林公園", distanceM: 700, address: "" },
      { category: "公園", name: "信義公園", distanceM: 900, address: "" },
      { category: "捷運", name: "捷運大安站", distanceM: 650, address: "" },
      { category: "商圈", name: "永康商圈", distanceM: 200, address: "" },
    ];

    const result = compactLifeAmenitiesForPrint(items);

    expect(result.map((item) => item.name)).toEqual([
      "第一國小",
      "第二國中",
      "第一市場",
      "第二市場",
      "捷運大安站",
      "仁愛醫院",
      "大安森林公園",
    ]);
    expect(result.filter((item) => item.category === "市場")).toHaveLength(2);
    expect(result.filter((item) => item.category === "公園")).toHaveLength(1);
    expect(result.filter((item) => item.category === "學校")).toHaveLength(2);
    expect(result.some((item) => item.category === "商圈")).toBe(false);
  });
});
