import { describe, expect, it } from "vitest";
import { formStateToTaxInputs } from "../KeyinSplitPage";

describe("formStateToTaxInputs", () => {
  it("returns TaxInputs for valid formState", () => {
    const result = formStateToTaxInputs({
      transaction_price: 1000000,
      tax_land_value: 800000,
      tax_building_value: 200000,
      usage_type: "residential",
      transfer_date: "2024-01-01",
    });
    expect(result).toEqual({
      contractPrice: 1000000,
      officialLandValue: 800000,
      shareRatio: 1,
      buildingCurrentValue: 200000,
      transactionDate: "2024-01-01",
      usage: "residential",
    });
  });

  it("returns undefined when transaction_price is 0", () => {
    const result = formStateToTaxInputs({
      transaction_price: 0,
      tax_land_value: 800000,
      tax_building_value: 200000,
    });
    expect(result).toBeUndefined();
  });

  it("returns undefined when tax_land_value is 0", () => {
    const result = formStateToTaxInputs({
      transaction_price: 1000000,
      tax_land_value: 0,
      tax_building_value: 200000,
    });
    expect(result).toBeUndefined();
  });

  it("returns undefined when tax_building_value is 0", () => {
    const result = formStateToTaxInputs({
      transaction_price: 1000000,
      tax_land_value: 800000,
      tax_building_value: 0,
    });
    expect(result).toBeUndefined();
  });

  it("maps commercial usage_type correctly", () => {
    const result = formStateToTaxInputs({
      transaction_price: 1000000,
      tax_land_value: 800000,
      tax_building_value: 200000,
      usage_type: "commercial",
    });
    expect(result?.usage).toBe("commercial");
  });

  it("defaults to shareRatio=1 when share_ratio absent", () => {
    const result = formStateToTaxInputs({
      transaction_price: 1000000,
      tax_land_value: 800000,
      tax_building_value: 200000,
    });
    expect(result?.shareRatio).toBe(1);
  });
});
