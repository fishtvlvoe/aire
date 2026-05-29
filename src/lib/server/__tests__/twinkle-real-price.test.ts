import { describe, expect, it } from "vitest";

import { resolveRealPriceDatasetPlan } from "../twinkle-real-price";

describe("twinkle-real-price dataset plan", () => {
  it("uses city-specific datasets for Taipei, Tainan, Taichung, and New Taipei", () => {
    expect(resolveRealPriceDatasetPlan("台北市萬華區漢中街52號6樓")).toEqual({
      cityName: "台北市",
      datasetId: "145630",
      orderBy: "SDATE DESC",
      sourceLabel: "city-specific",
    });

    expect(resolveRealPriceDatasetPlan("台南市東區東和路47號3樓")).toEqual({
      cityName: "台南市",
      datasetId: "128852",
      orderBy: "交易年月日 DESC",
      sourceLabel: "city-specific",
    });

    expect(resolveRealPriceDatasetPlan("台中市西屯區文心路二段201號")).toEqual({
      cityName: "台中市",
      datasetId: "103038",
      orderBy: "民國年月 DESC",
      sourceLabel: "city-specific",
    });

    expect(resolveRealPriceDatasetPlan("新北市板橋區文化路一段188號")).toEqual({
      cityName: "新北市",
      datasetId: "139700",
      orderBy: "rps07_yyymmddroc DESC",
      sourceLabel: "city-specific",
    });
  });

  it("normalizes Taiwan city aliases before resolving dataset plans", () => {
    expect(resolveRealPriceDatasetPlan("臺北市大安區和平東路一段88號")).toEqual({
      cityName: "台北市",
      datasetId: "145630",
      orderBy: "SDATE DESC",
      sourceLabel: "city-specific",
    });
  });

  it("falls back to the national real-price dataset for unmapped cities", () => {
    expect(resolveRealPriceDatasetPlan("花蓮縣花蓮市中山路100號")).toEqual({
      cityName: "花蓮縣",
      datasetId: "lvr-trades",
      orderBy: "iso_trade_date DESC",
      sourceLabel: "national-fallback",
    });
  });
});
