import { describe, expect, it } from "vitest";

import {
  HOUSE_SUPPLEMENT_COMMON_FIELDS,
  createHouseSupplementDraft,
  getHouseSupplementTypeFields,
} from "@/lib/page-contracts/house-supplement";

describe("house-supplement templates", () => {
  it("provides common secretary supplement fields from the customer source files", () => {
    expect(HOUSE_SUPPLEMENT_COMMON_FIELDS.map((field) => field.label)).toEqual([
      "建號",
      "權狀坪數",
      "主建物坪數",
      "附屬建物坪數",
      "共有部分坪數",
      "地號 / 建號核對",
      "他項權利",
      "樓層 / 總樓層核對",
      "法定用途核對",
      "建築完成日期核對",
      "增建 / 頂加 / 外推 / 夾層範圍整理",
      "租客 / 租期 / 押金 / 可否提前交付核對",
      "合約書條件核對",
      "照片命名整理",
      "591 / DM / FB / 說明書一致性檢核",
    ]);
  });

  it("keeps supplement type-specific fields separated", () => {
    expect(getHouseSupplementTypeFields("大樓華廈").map((field) => field.label)).toContain(
      "總戶數 / 公設比 / 管理費核對",
    );
    expect(getHouseSupplementTypeFields("店面").map((field) => field.label)).toContain(
      "角間 / 三角窗 / 招牌條件整理",
    );
    expect(getHouseSupplementTypeFields("廠房").map((field) => field.label)).toContain(
      "排煙 / 排水 / 排污 / 消防資料整理",
    );
  });

  it("creates a blank supplement draft without placeholder text", () => {
    expect(createHouseSupplementDraft()).toEqual({ values: {} });
    expect(JSON.stringify(createHouseSupplementDraft())).not.toContain("待補");
  });
});
