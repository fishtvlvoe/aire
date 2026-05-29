import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  queryTwinkleRealPrice: vi.fn(),
}));

vi.mock("@/lib/server/twinkle-real-price", () => ({
  queryTwinkleRealPrice: mocks.queryTwinkleRealPrice,
}));

import { POST } from "../route";

function request(body: unknown): Request {
  return new Request("http://localhost:3001/api/local/real-price", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("/api/local/real-price", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns mapped records from Twinkle helper", async () => {
    mocks.queryTwinkleRealPrice.mockResolvedValue([
      { address: "台北市萬華區漢中街52號", total_price: 6060000, transaction_date: "2012-09-26" },
    ]);

    const response = await POST(request({
      district: "萬華區",
      keyword: "漢中街",
      limit: 3,
      address: "台北市萬華區漢中街52號6樓",
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      records: [{ address: "台北市萬華區漢中街52號", total_price: 6060000, transaction_date: "2012-09-26" }],
    });
    expect(mocks.queryTwinkleRealPrice).toHaveBeenCalledWith("萬華區", "漢中街", 3, "台北市萬華區漢中街52號6樓");
  });

  it("rejects missing district or keyword", async () => {
    const response = await POST(request({ district: "", keyword: "" }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ message: "district 與 keyword 為必填" });
  });
});
