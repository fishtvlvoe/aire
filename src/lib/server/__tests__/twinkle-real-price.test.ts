import { afterEach, describe, expect, it, vi } from "vitest";

import { queryTwinkleRealPrice, resolveRealPriceDatasetPlan } from "../twinkle-real-price";

describe("twinkle-real-price dataset plan", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

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

  it("merges national records when the city-specific dataset is stale", async () => {
    vi.stubEnv("TWINKLE_AI_API_KEY", "test-key");
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as {
        params?: { arguments?: { dataset_id?: string } };
      };
      const datasetId = body.params?.arguments?.dataset_id;
      const payload = datasetId === "128852"
        ? {
          columns: ["土地區段位置或建物區門牌", "建物移轉總面積平方公尺", "單價每平方公尺", "總價元", "交易年月日", "建物型態"],
          rows: [["臺南市東區裕農路378號四樓", "111.77", "44736", "5000000", "1111125", "華夏"]],
        }
        : {
          columns: ["土地位置建物門牌", "土地位置建物門牌_半形", "建物移轉總面積平方公尺", "單價元平方公尺", "總價元", "iso_trade_date", "建物型態"],
          rows: [
            ["臺南市東區裕農路２８８巷７０弄３６號", "臺南市東區裕農路288巷70弄36號", "80.72", "151140", "12200000", "2025-12-30", "透天厝"],
            ["臺南市東區裕農路７２６巷１００號", "臺南市東區裕農路726巷100號", "115.36", "35368", "4080000", "2026-01-30", "透天厝"],
          ],
        };
      const text = JSON.stringify({ result: { content: [{ text: JSON.stringify(payload) }] } });
      return new Response(`data: ${text}\n\n`, { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await queryTwinkleRealPrice("東區", "裕農路", 3, "台南市東區裕農路288巷17號8樓之1");

    expect(result.map((record) => record.transaction_date)).toEqual(["2026-01-30", "2025-12-30", "2022-11-25"]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('"dataset_id":"128852"'),
        signal: expect.any(AbortSignal),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      expect.objectContaining({
        body: expect.stringContaining('"dataset_id":"lvr-trades"'),
        signal: expect.any(AbortSignal),
      }),
    );
  });
});
