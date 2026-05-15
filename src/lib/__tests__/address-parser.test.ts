import { describe, expect, it } from "vitest";

import { parseAddressForQuery } from "../address-parser";

describe("parseAddressForQuery", () => {
  it("台南市東區裕農路123號 → { district: '東區', keyword: '裕農路' }", () => {
    expect(parseAddressForQuery("台南市東區裕農路123號")).toEqual({
      district: "東區",
      keyword: "裕農路",
    });
  });

  it("台北市大安區仁愛路四段1號 → { district: '大安區', keyword: '仁愛路' }", () => {
    expect(parseAddressForQuery("台北市大安區仁愛路四段1號")).toEqual({
      district: "大安區",
      keyword: "仁愛路",
    });
  });

  it("高雄市三民區九如三路123號 → { district: '三民區', keyword: '九如三路' }", () => {
    expect(parseAddressForQuery("高雄市三民區九如三路123號")).toEqual({
      district: "三民區",
      keyword: "九如三路",
    });
  });

  it("空字串 → { district: '', keyword: '' }", () => {
    expect(parseAddressForQuery("")).toEqual({
      district: "",
      keyword: "",
    });
  });

  it("台南市仁德區中山路一段100號 → { district: '仁德區', keyword: '中山路' }", () => {
    expect(parseAddressForQuery("台南市仁德區中山路一段100號")).toEqual({
      district: "仁德區",
      keyword: "中山路",
    });
  });
});
