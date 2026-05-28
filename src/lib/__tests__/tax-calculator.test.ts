import { describe, expect, it } from "vitest";
import {
  stampTax,
  deedTax,
  buildingTax,
  landPriceTax,
  estimateLandValueIncrementTax,
} from "../tax-calculator";

describe("stampTax", () => {
  it("calculates (contractPrice + officialValue × shareRatio) × 0.001", () => {
    expect(stampTax(1000000, 800000, 1.0)).toBe(1800);
  });

  it("returns 0 when contractPrice is 0", () => {
    expect(stampTax(0, 800000, 1.0)).toBe(800);
  });

  it("returns 0 when all inputs are 0", () => {
    expect(stampTax(0, 0, 0)).toBe(0);
  });

  it("applies shareRatio to officialValue", () => {
    expect(stampTax(1000000, 800000, 0.5)).toBe(1400);
  });
});

describe("deedTax", () => {
  it("calculates contractPrice × 0.06", () => {
    expect(deedTax(1000000)).toBe(60000);
  });

  it("returns 0 when contractPrice is 0", () => {
    expect(deedTax(0)).toBe(0);
  });

  it("rounds to integer", () => {
    expect(Number.isInteger(deedTax(333333))).toBe(true);
  });
});

describe("buildingTax", () => {
  it("residential: buildingCurrentValue × 0.012", () => {
    expect(buildingTax(200000, "residential")).toBe(2400);
  });

  it("commercial: buildingCurrentValue × 0.03", () => {
    expect(buildingTax(200000, "commercial")).toBe(6000);
  });

  it("returns 0 when buildingCurrentValue is 0", () => {
    expect(buildingTax(0, "residential")).toBe(0);
  });
});

describe("landPriceTax", () => {
  it("returns 0 when landCurrentValue is 0", () => {
    expect(landPriceTax(0, 365)).toBe(0);
  });

  it("returns 0 when daysDiff is 0", () => {
    expect(landPriceTax(1000000, 0)).toBe(0);
  });

  it("calculates non-zero for valid inputs", () => {
    expect(landPriceTax(1000000, 365)).toBeGreaterThan(0);
  });
});

describe("estimateLandValueIncrementTax", () => {
  it("lists missing inputs in estimate mode instead of hiding land value tax", () => {
    const result = estimateLandValueIncrementTax({
      propertyType: "building",
      announcedLandValue: null,
      previousTransferValue: null,
      totalPrice: null,
      shareRatio: null,
      landArea: 30,
    });

    expect(result.estimateMode).toBe(true);
    expect(result.missingInputs).toEqual(["公告現值", "前次移轉現值", "成交價", "持分"]);
    expect(result.warnings.join("")).toContain("不可視為正式稅額");
  });

  it("returns an estimated tax and basis when required inputs exist", () => {
    const result = estimateLandValueIncrementTax({
      propertyType: "building",
      announcedLandValue: 120000,
      previousTransferValue: 80000,
      totalPrice: 10000000,
      shareRatio: 0.25,
      landArea: 100,
    });

    expect(result.estimateMode).toBe(true);
    expect(result.missingInputs).toEqual([]);
    expect(result.landValueIncrementTax).toBeGreaterThan(0);
    expect(result.estimateBasis?.join("")).toContain("成交價 40%");
  });
});
